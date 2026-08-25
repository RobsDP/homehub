// Configurações e Constantes do Sistema

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Categorias válidas para transações
const TRANSACTION_CATEGORIES = [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Salário / Vendas',
    'Serviços / Estética',
    'Outros'
];

// Tipos de transação
const TRANSACTION_TYPES = {
    RECEITA: 'RECEITA',
    DESPESA: 'DESPESA'
};

// Prioridades de tarefas
const TASK_PRIORITIES = {
    BAIXA: 'BAIXA',
    MEDIA: 'MEDIA',
    ALTA: 'ALTA'
};

// Roles de usuários
const USER_ROLES = {
    PARCEIRO: 'Parceiro',
    PARCEIRA: 'Parceira',
    CONJUNTO: 'Conjunto'
};

// Mensagens de erro padronizadas
const ERROR_MESSAGES = {
    CAMPOS_OBRIGATORIOS: 'Campos obrigatórios ausentes.',
    USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado.',
    TRANSACAO_NAO_ENCONTRADA: 'Transação não encontrada.',
    TAREFA_NAO_ENCONTRADA: 'Tarefa não encontrada.',
    MENSAGEM_NAO_ENCONTRADA: 'Mensagem não encontrada.',
    ERRO_INTERNO: 'Erro interno do servidor.'
};

// Configurações de paginação
const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// Configurações de CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

module.exports = {
    PORT,
    NODE_ENV,
    TRANSACTION_CATEGORIES,
    TRANSACTION_TYPES,
    TASK_PRIORITIES,
    USER_ROLES,
    ERROR_MESSAGES,
    PAGINATION,
    ALLOWED_ORIGINS
};
