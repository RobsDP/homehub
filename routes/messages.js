const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateBody, sanitizeString } = require('../middleware/validation');
const { ERROR_MESSAGES, PAGINATION } = require('../config/constants');

// Listar mensagens com filtros e paginação
router.get('/', (req, res) => {
    try {
        const { senderId, recipientId, read, pinned, page, limit } = req.query;
        
        let query = `
            SELECT 
                m.*,
                s.name as sender_name, s.avatar as sender_avatar, s.color as sender_color,
                r.name as recipient_name, r.avatar as recipient_avatar, r.color as recipient_color
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.recipient_id = r.id
            WHERE 1=1
        `;
        const params = [];
        
        if (senderId) {
            query += ` AND m.sender_id = ?`;
            params.push(parseInt(senderId));
        }
        
        if (recipientId) {
            query += ` AND m.recipient_id = ?`;
            params.push(parseInt(recipientId));
        }
        
        if (read !== undefined) {
            query += ` AND m.is_read = ?`;
            params.push(read === 'true' ? 1 : 0);
        }
        
        if (pinned !== undefined) {
            query += ` AND m.is_pinned = ?`;
            params.push(pinned === 'true' ? 1 : 0);
        }
        
        query += ` ORDER BY m.is_pinned DESC, m.created_at DESC`;
        
        // Paginação
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const messages = db.prepare(query).all(...params);
        res.json(messages);
    } catch (error) {
        console.error('[MESSAGES GET /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Criar nova mensagem com validação
router.post('/', 
    validateBody(['sender_id', 'recipient_id', 'content']),
    sanitizeString,
    (req, res) => {
    try {
        const { sender_id, recipient_id, content } = req.body;
        
        // Validações adicionais
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Mensagem deve ter no máximo 1000 caracteres.' });
        }
        
        // Verifica se remetente existe
        const sender = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(sender_id));
        if (!sender) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        // Verifica se destinatário existe
        const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(recipient_id));
        if (!recipient) {
            return res.status(404).json({ error: 'Destinatário não encontrado.' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO messages (sender_id, recipient_id, content)
            VALUES (?, ?, ?)
        `);
        
        const info = stmt.run(
            parseInt(sender_id), 
            parseInt(recipient_id), 
            content.trim()
        );
        
        res.status(201).json({ 
            id: info.lastInsertRowid,
            message: 'Mensagem enviada com sucesso.'
        });
    } catch (error) {
        console.error('[MESSAGES POST /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Obter mensagem por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const message = db.prepare(`
            SELECT 
                m.*,
                s.name as sender_name, s.avatar as sender_avatar, s.color as sender_color,
                r.name as recipient_name, r.avatar as recipient_avatar, r.color as recipient_color
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.recipient_id = r.id
            WHERE m.id = ?
        `).get(parseInt(id));
        
        if (!message) {
            return res.status(404).json({ error: ERROR_MESSAGES.MENSAGEM_NAO_ENCONTRADA });
        }
        
        res.json(message);
    } catch (error) {
        console.error('[MESSAGES GET /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Alternar status de lida
router.patch('/:id/toggle-read', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se mensagem existe
        const message = db.prepare('SELECT id FROM messages WHERE id = ?').get(parseInt(id));
        if (!message) {
            return res.status(404).json({ error: ERROR_MESSAGES.MENSAGEM_NAO_ENCONTRADA });
        }
        
        db.prepare('UPDATE messages SET is_read = CASE WHEN is_read = 1 THEN 0 ELSE 1 END WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Status de leitura atualizado com sucesso.'
        });
    } catch (error) {
        console.error('[MESSAGES PATCH /:id/toggle-read] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Alternar fixar no topo
router.patch('/:id/toggle-pin', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se mensagem existe
        const message = db.prepare('SELECT id FROM messages WHERE id = ?').get(parseInt(id));
        if (!message) {
            return res.status(404).json({ error: ERROR_MESSAGES.MENSAGEM_NAO_ENCONTRADA });
        }
        
        db.prepare('UPDATE messages SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Fixação atualizada com sucesso.'
        });
    } catch (error) {
        console.error('[MESSAGES PATCH /:id/toggle-pin] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Atualizar mensagem
router.put('/:id', 
    validateBody(['content']),
    sanitizeString,
    (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        // Verifica se mensagem existe
        const existingMessage = db.prepare('SELECT id FROM messages WHERE id = ?').get(parseInt(id));
        if (!existingMessage) {
            return res.status(404).json({ error: ERROR_MESSAGES.MENSAGEM_NAO_ENCONTRADA });
        }
        
        // Validações
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Mensagem deve ter no máximo 1000 caracteres.' });
        }
        
        const stmt = db.prepare(`
            UPDATE messages 
            SET content = ?
            WHERE id = ?
        `);
        
        stmt.run(content.trim(), parseInt(id));
        
        res.json({ 
            success: true,
            message: 'Mensagem atualizada com sucesso.'
        });
    } catch (error) {
        console.error('[MESSAGES PUT /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Deletar mensagem
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se mensagem existe
        const message = db.prepare('SELECT id FROM messages WHERE id = ?').get(parseInt(id));
        if (!message) {
            return res.status(404).json({ error: ERROR_MESSAGES.MENSAGEM_NAO_ENCONTRADA });
        }
        
        db.prepare('DELETE FROM messages WHERE id = ?').run(parseInt(id));
        res.json({ 
            success: true,
            message: 'Mensagem excluída com sucesso.'
        });
    } catch (error) {
        console.error('[MESSAGES DELETE /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

module.exports = router;