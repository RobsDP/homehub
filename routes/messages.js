const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar mensagens
router.get('/', (req, res) => {
    try {
        const messages = db.prepare(`
      SELECT 
        m.*,
        s.name as sender_name, s.avatar as sender_avatar, s.color as sender_color,
        r.name as recipient_name, r.avatar as recipient_avatar, r.color as recipient_color
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.recipient_id = r.id
      ORDER BY m.is_pinned DESC, m.created_at DESC
    `).all();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar nova mensagem
router.post('/', (req, res) => {
    try {
        const { sender_id, recipient_id, content } = req.body;
        if (!sender_id || !recipient_id || !content) {
            return res.status(400).json({ error: 'Remetente, destinatário e mensagem são obrigatórios.' });
        }

        const stmt = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES (?, ?, ?)
    `);
        const info = stmt.run(sender_id, recipient_id, content);
        res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alternar status de lida
router.patch('/:id/toggle-read', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE messages SET is_read = CASE WHEN is_read = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alternar fixar no topo
router.patch('/:id/toggle-pin', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE messages SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar mensagem
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM messages WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;