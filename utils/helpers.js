// Utilitários do Sistema

/**
 * Formata valor numérico para moeda brasileira (BRL)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado como R$
 */
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @param {boolean} includeTime - Se deve incluir hora na formatação
 * @returns {string} Data formatada
 */
function formatDate(date, includeTime = false) {
    if (!date) return '--/--/----';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (includeTime) {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(dateObj);
}

/**
 * Normaliza string para busca (remove acentos e deixa minúsculo)
 * @param {string} str - String a ser normalizada
 * @returns {string} String normalizada
 */
function normalizeString(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Gera um ID único simples para uso em cache ou sessões
 * @returns {string} ID único
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida se uma string é um email válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se email válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Limita número de casas decimais
 * @param {number} value - Valor numérico
 * @param {number} decimals - Número de casas decimais
 * @returns {number} Valor com casas decimais limitadas
 */
function roundToDecimals(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Calcula diferença entre duas datas em dias
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
    formatCurrency,
    formatDate,
    normalizeString,
    generateId,
    isValidEmail,
    roundToDecimals,
    daysBetween
};
