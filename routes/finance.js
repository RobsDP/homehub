const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar transações com filtros
router.get('/', (req, res) => {
    try {
        const { month, userId, category, type } = req.query;
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

        query += ` ORDER BY t.date DESC, t.id DESC`;
        const transactions = db.prepare(query).all(...params);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Criar Transação
router.post('/', (req, res) => {
    try {
        const { user_id, type, amount, category, date, description, is_paid } = req.body;
        if (!user_id || !type || !amount || !category || !date) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        }

        const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, category, date, description, is_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const info = stmt.run(user_id, type, Number(amount), category, date, description || '', is_paid ? 1 : 0);
        res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar Transação
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, type, amount, category, date, description, is_paid } = req.body;

        const stmt = db.prepare(`
      UPDATE transactions 
      SET user_id = ?, type = ?, amount = ?, category = ?, date = ?, description = ?, is_paid = ?
      WHERE id = ?
    `);
        stmt.run(user_id, type, Number(amount), category, date, description || '', is_paid ? 1 : 0, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alternar status pago/pendente
router.patch('/:id/toggle-paid', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE transactions SET is_paid = CASE WHEN is_paid = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Excluir Transação
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;