// Middleware de CORS Seguro

const { ALLOWED_ORIGINS } = require('../config/constants');

/**
 * Middleware de CORS com origens específicas
 * Substitui o cors() genérico por uma implementação mais segura
 */
function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;

    // Verifica se a origem está na lista de permitidas
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

    // Responde imediatamente para requisições OPTIONS (pre-flight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
}

module.exports = corsMiddleware;
