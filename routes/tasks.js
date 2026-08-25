const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateBody, validateTaskPriority, sanitizeString } = require('../middleware/validation');
const { ERROR_MESSAGES, TASK_PRIORITIES, PAGINATION } = require('../config/constants');

// Listar tarefas com filtros e paginação
router.get('/', (req, res) => {
    try {
        const { userId, completed, priority, page, limit } = req.query;
        
        let query = `
            SELECT t.*, u.name as user_name, u.color as user_color, u.avatar as user_avatar
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (userId) {
            query += ` AND t.user_id = ?`;
            params.push(parseInt(userId));
        }
        
        if (completed !== undefined) {
            query += ` AND t.is_completed = ?`;
            params.push(completed === 'true' ? 1 : 0);
        }
        
        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }
        
        query += ` ORDER BY t.is_completed ASC, 
            CASE t.priority 
                WHEN 'ALTA' THEN 1 
                WHEN 'MEDIA' THEN 2 
                ELSE 3 
            END ASC,
            t.due_date ASC`;
        
        // Paginação
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const tasks = db.prepare(query).all(...params);
        res.json(tasks);
    } catch (error) {
        console.error('[TASKS GET /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Criar tarefa com validação
router.post('/', 
    validateBody(['user_id', 'title']),
    validateTaskPriority,
    sanitizeString,
    (req, res) => {
    try {
        const { user_id, title, due_date, priority } = req.body;
        
        // Validações adicionais
        if (title.length > 200) {
            return res.status(400).json({ error: 'Título deve ter no máximo 200 caracteres.' });
        }
        
        const validPriorities = Object.values(TASK_PRIORITIES);
        const taskPriority = priority || TASK_PRIORITIES.MEDIA;
        
        if (!validPriorities.includes(taskPriority)) {
            return res.status(400).json({ 
                error: `Prioridade inválida. Use: ${validPriorities.join(', ')}` 
            });
        }
        
        // Verifica se usuário existe
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(user_id));
        if (!user) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        const stmt = db.prepare(`
            INSERT INTO tasks (user_id, title, due_date, priority)
            VALUES (?, ?, ?, ?)
        `);
        
        const info = stmt.run(
            parseInt(user_id), 
            title.trim(), 
            due_date || null, 
            taskPriority
        );
        
        res.status(201).json({ 
            id: info.lastInsertRowid,
            message: 'Tarefa criada com sucesso.'
        });
    } catch (error) {
        console.error('[TASKS POST /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Obter tarefa por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const task = db.prepare(`
            SELECT t.*, u.name as user_name, u.color as user_color, u.avatar as user_avatar
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `).get(parseInt(id));
        
        if (!task) {
            return res.status(404).json({ error: ERROR_MESSAGES.TAREFA_NAO_ENCONTRADA });
        }
        
        res.json(task);
    } catch (error) {
        console.error('[TASKS GET /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Atualizar tarefa
router.put('/:id', 
    validateBody(['user_id', 'title']),
    validateTaskPriority,
    sanitizeString,
    (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, title, due_date, priority, is_completed } = req.body;
        
        // Verifica se tarefa existe
        const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(parseInt(id));
        if (!existingTask) {
            return res.status(404).json({ error: ERROR_MESSAGES.TAREFA_NAO_ENCONTRADA });
        }
        
        // Validações
        if (title.length > 200) {
            return res.status(400).json({ error: 'Título deve ter no máximo 200 caracteres.' });
        }
        
        const validPriorities = Object.values(TASK_PRIORITIES);
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({ 
                error: `Prioridade inválida. Use: ${validPriorities.join(', ')}` 
            });
        }
        
        // Verifica se usuário existe
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(user_id));
        if (!user) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        const stmt = db.prepare(`
            UPDATE tasks 
            SET user_id = ?, title = ?, due_date = ?, priority = ?, is_completed = ?
            WHERE id = ?
        `);
        
        stmt.run(
            parseInt(user_id),
            title.trim(),
            due_date || null,
            priority || TASK_PRIORITIES.MEDIA,
            is_completed ? 1 : 0,
            parseInt(id)
        );
        
        res.json({ 
            success: true,
            message: 'Tarefa atualizada com sucesso.'
        });
    } catch (error) {
        console.error('[TASKS PUT /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Alternar status de conclusão
router.patch('/:id/toggle', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se tarefa existe
        const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(parseInt(id));
        if (!task) {
            return res.status(404).json({ error: ERROR_MESSAGES.TAREFA_NAO_ENCONTRADA });
        }
        
        db.prepare('UPDATE tasks SET is_completed = CASE WHEN is_completed = 1 THEN 0 ELSE 1 END WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Status atualizado com sucesso.'
        });
    } catch (error) {
        console.error('[TASKS PATCH /:id/toggle] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Deletar tarefa
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se tarefa existe
        const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(parseInt(id));
        if (!task) {
            return res.status(404).json({ error: ERROR_MESSAGES.TAREFA_NAO_ENCONTRADA });
        }
        
        db.prepare('DELETE FROM tasks WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Tarefa excluída com sucesso.'
        });
    } catch (error) {
        console.error('[TASKS DELETE /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

module.exports = router;