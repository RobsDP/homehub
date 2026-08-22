const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar tarefas
router.get('/', (req, res) => {
    try {
        const tasks = db.prepare(`
      SELECT t.*, u.name as user_name, u.color as user_color, u.avatar as user_avatar
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.is_completed ASC, 
        CASE t.priority 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          ELSE 3 
        END ASC,
        t.due_date ASC
    `).all();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar tarefa
router.post('/', (req, res) => {
    try {
        const { user_id, title, due_date, priority } = req.body;
        if (!user_id || !title) {
            return res.status(400).json({ error: 'Responsável e título são obrigatórios.' });
        }

        const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, due_date, priority)
      VALUES (?, ?, ?, ?)
    `);
        const info = stmt.run(user_id, title, due_date || null, priority || 'MEDIA');
        res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alternar status de conclusão
router.patch('/:id/toggle', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE tasks SET is_completed = CASE WHEN is_completed = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar tarefa
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;