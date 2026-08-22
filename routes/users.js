const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;