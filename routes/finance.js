const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateBody, validateTransactionType } = require('../middleware/validation');
const { formatCurrency } = require('../utils/helpers');
const { PAGINATION } = require('../config/constants');

// Listar transações com filtros e paginação
router.get('/', (req, res) => {
    try {
        const { month, userId, category, type, page = 1, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = `
            SELECT t.*, u.name as user_name, u.color as user_color 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (month) {
            query += ` AND strftime('%Y-%m', t.date) = ?`;
            params.push(month);
        }
        if (userId) {
            query += ` AND t.user_id = ?`;
            params.push(userId);
        }
        if (category) {
            query += ` AND t.category = ?`;
            params.push(category);
        }
        if (type) {
            query += ` AND t.type = ?`;
            params.push(type);
        }

        // Conta total de registros para paginação
        const countQuery = `SELECT COUNT(*) as total FROM transactions WHERE 1=1` + 
            (month ? ` AND strftime('%Y-%m', date) = ?` : '') +
            (userId ? ` AND user_id = ?` : '') +
            (category ? ` AND category = ?` : '') +
            (type ? ` AND type = ?` : '');
        
        const totalResult = db.prepare(countQuery).get(...params);
        const total = totalResult.total;

        query += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        const transactions = db.prepare(query).all(...params);
        
        res.json({
            data: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('[FINANCE GET /] Error:', error.message);
        res.status(500).json({ error: 'Erro ao buscar transações.' });
    }
});

// Obter resumo consolidado (Totais e Saldo)
router.get('/summary', (req, res) => {
    try {
        const { month } = req.query;
        let baseWhere = 'WHERE 1=1';
        const params = [];

        if (month) {
            baseWhere += ` AND strftime('%Y-%m', date) = ?`;
            params.push(month);
        }

        const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'RECEITA' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'DESPESA' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'DESPESA' AND is_paid = 0 THEN amount ELSE 0 END), 0) as pending_expense
      FROM transactions
      ${baseWhere}
    `).get(...params);

        const balance = totals.income - totals.expense;

        // Gastos por Categoria (para gráfico de Rosca)
        const categoryExpenses = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions
      ${baseWhere} AND type = 'DESPESA'
      GROUP BY category
      ORDER BY total DESC
    `).all(...params);

        // Gastos por Usuário
        const userBreakdown = db.prepare(`
      SELECT u.name, u.color, SUM(t.amount) as total
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${baseWhere} AND t.type = 'DESPESA'
      GROUP BY t.user_id
    `).all(...params);

        res.json({
            ...totals,
            balance,
            categoryExpenses,
            userBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar Transação com validação
router.post('/', 
    validateBody(['user_id', 'type', 'amount', 'category', 'date']),
    validateTransactionType,
    (req, res) => {
    try {
        const { user_id, type, amount, category, date, description, is_paid } = req.body;

        // Validações adicionais
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Valor deve ser um número positivo.' });
        }

        const stmt = db.prepare(`
            INSERT INTO transactions (user_id, type, amount, category, date, description, is_paid)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
            parseInt(user_id), 
            type, 
            parseFloat(amount), 
            category, 
            date, 
            (description || '').substring(0, 500), 
            is_paid ? 1 : 0
        );
        res.status(201).json({ 
            id: info.lastInsertRowid,
            message: 'Transação criada com sucesso.'
        });
    } catch (error) {
        console.error('[FINANCE POST /] Error:', error.message);
        res.status(500).json({ error: 'Erro ao criar transação.' });
    }
});

// Atualizar Transação com validação
router.put('/:id', 
    validateBody(['user_id', 'type', 'amount', 'category', 'date']),
    validateTransactionType,
    (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, type, amount, category, date, description, is_paid } = req.body;

        // Validações adicionais
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Valor deve ser um número positivo.' });
        }

        const stmt = db.prepare(`
            UPDATE transactions 
            SET user_id = ?, type = ?, amount = ?, category = ?, date = ?, description = ?, is_paid = ?
            WHERE id = ?
        `);
        stmt.run(
            parseInt(user_id), 
            type, 
            parseFloat(amount), 
            category, 
            date, 
            (description || '').substring(0, 500), 
            is_paid ? 1 : 0, 
            parseInt(id)
        );
        res.json({ 
            success: true,
            message: 'Transação atualizada com sucesso.'
        });
    } catch (error) {
        console.error('[FINANCE PUT /:id] Error:', error.message);
        res.status(500).json({ error: 'Erro ao atualizar transação.' });
    }
});

// Alternar status pago/pendente
router.patch('/:id/toggle-paid', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se a transação existe
        const transaction = db.prepare('SELECT id FROM transactions WHERE id = ?').get(parseInt(id));
        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }
        
        db.prepare('UPDATE transactions SET is_paid = CASE WHEN is_paid = 1 THEN 0 ELSE 1 END WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Status atualizado com sucesso.'
        });
    } catch (error) {
        console.error('[FINANCE PATCH /:id/toggle-paid] Error:', error.message);
        res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
});

// Excluir Transação
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se a transação existe antes de deletar
        const transaction = db.prepare('SELECT id FROM transactions WHERE id = ?').get(parseInt(id));
        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }
        
        db.prepare('DELETE FROM transactions WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Transação excluída com sucesso.'
        });
    } catch (error) {
        console.error('[FINANCE DELETE /:id] Error:', error.message);
        res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
});

module.exports = router;