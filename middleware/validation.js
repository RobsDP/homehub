// Middleware de Validação de Dados

const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Middleware para validar campos obrigatórios no body da requisição
 * @param {string[]} requiredFields - Lista de campos obrigatórios
 */
function validateBody(requiredFields) {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => {
            return req.body[field] === undefined || 
                   req.body[field] === null || 
                   req.body[field] === '';
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: ERROR_MESSAGES.CAMPOS_OBRIGATORIOS,
                fields: missingFields
            });
        }

        next();
    };
}

/**
 * Middleware para validar campos obrigatórios nos params da requisição
 * @param {string[]} requiredFields - Lista de campos obrigatórios
 */
function validateParams(requiredFields) {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => {
            return !req.params[field];
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: ERROR_MESSAGES.CAMPOS_OBRIGATORIOS,
                fields: missingFields
            });
        }

        next();
    };
}

/**
 * Middleware para validar tipos de transação
 */
function validateTransactionType(req, res, next) {
    const { type } = req.body;
    const validTypes = ['RECEITA', 'DESPESA'];

    if (type && !validTypes.includes(type)) {
        return res.status(400).json({
            error: 'Tipo de transação inválido. Use RECEITA ou DESPESA.'
        });
    }

    next();
}

/**
 * Middleware para validar prioridades de tarefa
 */
function validateTaskPriority(req, res, next) {
    const { priority } = req.body;
    const validPriorities = ['BAIXA', 'MEDIA', 'ALTA'];

    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
            error: 'Prioridade inválida. Use BAIXA, MEDIA ou ALTA.'
        });
    }

    next();
}

/**
 * Middleware para sanitizar strings (remove tags HTML e trim)
 */
function sanitizeString(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Remove tags HTML e espaços extras
                req.body[key] = req.body[key]
                    .replace(/<[^>]*>?/gm, '')
                    .trim()
                    .substring(0, 1000); // Limite de 1000 caracteres
            }
        }
    }

    next();
}

module.exports = {
    validateBody,
    validateParams,
    validateTransactionType,
    validateTaskPriority,
    sanitizeString
};
