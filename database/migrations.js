// Schema do Banco de Dados - Migrations

const migrations = [
    {
        version: 1,
        name: 'Initial Schema',
        up: `
            -- Tabela de Usuários
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                color TEXT NOT NULL,
                avatar TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabela de Transações Financeiras
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT CHECK(type IN ('RECEITA', 'DESPESA')) NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                is_paid INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Tabela de Mensagens/Recados
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_read INTEGER DEFAULT 0,
                is_pinned INTEGER DEFAULT 0,
                FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Tabela de Tarefas
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                due_date TEXT,
                priority TEXT CHECK(priority IN ('BAIXA', 'MEDIA', 'ALTA')) DEFAULT 'MEDIA',
                is_completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Tabela de controle de migrações
            CREATE TABLE IF NOT EXISTS _migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `,
        down: `
            DROP TABLE IF EXISTS tasks;
            DROP TABLE IF EXISTS messages;
            DROP TABLE IF EXISTS transactions;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS _migrations;
        `
    },
    {
        version: 2,
        name: 'Add indexes for performance',
        up: `
            -- Índices para melhorar performance das queries
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
            CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
            CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
            
            CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
            CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
            CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON messages(is_pinned);
            
            CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
            CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        `,
        down: `
            DROP INDEX IF EXISTS idx_transactions_user_id;
            DROP INDEX IF EXISTS idx_transactions_date;
            DROP INDEX IF EXISTS idx_transactions_type;
            DROP INDEX IF EXISTS idx_transactions_category;
            
            DROP INDEX IF EXISTS idx_messages_recipient_id;
            DROP INDEX IF EXISTS idx_messages_is_read;
            DROP INDEX IF EXISTS idx_messages_is_pinned;
            
            DROP INDEX IF EXISTS idx_tasks_user_id;
            DROP INDEX IF EXISTS idx_tasks_is_completed;
            DROP INDEX IF EXISTS idx_tasks_priority;
        `
    }
];

module.exports = migrations;
