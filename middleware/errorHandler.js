// Middleware de Tratamento de Erros Global

const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Handler global de erros para Express
 * Captura erros não tratados e retorna respostas padronizadas
 */
function errorHandler(err, req, res, next) {
    // Log do erro para debugging (em produção, usar sistema de logs adequado)
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.error(err);

    // Erro de validação do better-sqlite3
    if (err.message && err.message.includes('SQLITE')) {
        return res.status(400).json({
            error: 'Erro de validação de dados',
            details: err.message
        });
    }

    // Erro de chave estrangeira
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({
            error: 'Referência inválida. Verifique se o usuário existe.'
        });
    }

    // Erro de unique constraint
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
        (err.message && err.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({
            error: 'Registro duplicado. Este valor já existe no sistema.'
        });
    }

    // Erro 404 para rotas não encontradas
    if (err.status === 404) {
        return res.status(404).json({
            error: 'Recurso não encontrado.'
        });
    }

    // Erros genéricos - não expor detalhes em produção
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(err.status || 500).json({
        error: isProduction ? ERROR_MESSAGES.ERRO_INTERNO : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
}

/**
 * Middleware para capturar rotas 404
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({
        error: `Rota ${req.method} ${req.path} não encontrada.`
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
