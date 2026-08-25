const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateBody, sanitizeString } = require('../middleware/validation');
const { ERROR_MESSAGES, USER_ROLES } = require('../config/constants');
const { isValidEmail } = require('../utils/helpers');

// Listar usuários com paginação opcional
router.get('/', (req, res) => {
    try {
        const { page, limit, search } = req.query;
        
        let query = `SELECT * FROM users`;
        const params = [];
        
        if (search) {
            query += ` WHERE name LIKE ? OR email LIKE ?`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ` ORDER BY id ASC`;
        
        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const users = db.prepare(query).all(...params);
        res.json(users);
    } catch (error) {
        console.error('[USERS GET /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Criar usuário com validação
router.post('/', 
    validateBody(['name', 'email']),
    sanitizeString,
    (req, res) => {
    try {
        const { name, email, role, avatar, color } = req.body;
        
        // Validações adicionais
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }
        
        const validRoles = Object.values(USER_ROLES);
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                error: `Role inválida. Use: ${validRoles.join(', ')}` 
            });
        }
        
        // Verifica se email já existe
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email já cadastrado.' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO users (name, email, role, avatar, color)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
            name.trim(),
            email.trim().toLowerCase(),
            role || USER_ROLES.PARCEIRO,
            avatar || null,
            color || null
        );
        
        res.status(201).json({ 
            id: info.lastInsertRowid,
            message: 'Usuário criado com sucesso.'
        });
    } catch (error) {
        console.error('[USERS POST /] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Obter usuário por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(id));
        
        if (!user) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        res.json(user);
    } catch (error) {
        console.error('[USERS GET /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Atualizar usuário
router.put('/:id', 
    validateBody(['name', 'email']),
    sanitizeString,
    (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, avatar, color } = req.body;
        
        // Verifica se usuário existe
        const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        // Validações
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }
        
        const validRoles = Object.values(USER_ROLES);
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                error: `Role inválida. Use: ${validRoles.join(', ')}` 
            });
        }
        
        // Verifica se email já existe para outro usuário
        const emailExists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(
            email.trim().toLowerCase(), 
            parseInt(id)
        );
        if (emailExists) {
            return res.status(409).json({ error: 'Email já cadastrado.' });
        }
        
        const stmt = db.prepare(`
            UPDATE users 
            SET name = ?, email = ?, role = ?, avatar = ?, color = ?
            WHERE id = ?
        `);
        
        stmt.run(
            name.trim(),
            email.trim().toLowerCase(),
            role || USER_ROLES.PARCEIRO,
            avatar || null,
            color || null,
            parseInt(id)
        );
        
        res.json({ 
            success: true,
            message: 'Usuário atualizado com sucesso.'
        });
    } catch (error) {
        console.error('[USERS PUT /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

// Deletar usuário
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se usuário existe
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: ERROR_MESSAGES.USUARIO_NAO_ENCONTRADO });
        }
        
        db.prepare('DELETE FROM users WHERE id = ?').run(parseInt(id));
        
        res.json({ 
            success: true,
            message: 'Usuário excluído com sucesso.'
        });
    } catch (error) {
        console.error('[USERS DELETE /:id] Error:', error.message);
        res.status(500).json({ error: ERROR_MESSAGES.ERRO_INTERNO });
    }
});

module.exports = router;