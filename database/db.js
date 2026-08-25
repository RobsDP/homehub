const Database = require('better-sqlite3');
const path = require('path');
const migrations = require('./migrations');

const dbPath = path.join(__dirname, 'homehub.db');
const db = new Database(dbPath);

// Habilita chaves estrangeiras e performance WAL
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('auto_checkpoint = 1000'); // Checkpoint automático a cada 1000 páginas

/**
 * Executa migrações pendentes
 */
function runMigrations() {
    // Cria tabela de controle de migrações se não existir
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Obtém versão atual do banco
    const currentVersionRow = db.prepare('SELECT MAX(version) as version FROM _migrations').get();
    const currentVersion = currentVersionRow?.version || 0;

    // Executa migrações pendentes
    for (const migration of migrations) {
        if (migration.version > currentVersion) {
            console.log(`[MIGRATION] Executando versão ${migration.version}: ${migration.name}`);
            
            try {
                db.exec(migration.up);
                
                // Registra migração executada
                db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)')
                    .run(migration.version, migration.name);
                
                console.log(`[MIGRATION] Versão ${migration.version} executada com sucesso!`);
            } catch (error) {
                console.error(`[MIGRATION] Erro na versão ${migration.version}:`, error.message);
                throw error;
            }
        }
    }
}

// Executa migrações
runMigrations();

// Cria índices para performance (se ainda não existirem)
db.exec(`
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
`);

// Seed inicial se a base estiver vazia
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
    console.log('[SEED] Populando banco de dados com dados iniciais...');
    
    const insertUser = db.prepare('INSERT INTO users (name, role, color, avatar) VALUES (?, ?, ?, ?)');
    insertUser.run('Ele', 'Parceiro 1', '#3b82f6', '🧔');
    insertUser.run('Ela', 'Parceira 2', '#ec4899', '👩');
    insertUser.run('Ambos / Casa', 'Conjunto', '#10b981', '🏡');

    const today = new Date().toISOString().split('T')[0];

    // Seed de transações exemplo
    const insertTx = db.prepare(`
        INSERT INTO transactions (user_id, type, amount, category, date, description, is_paid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertTx.run(1, 'RECEITA', 4500.00, 'Salário / Vendas', today, 'Entrada Mensal Ele', 1);
    insertTx.run(2, 'RECEITA', 4200.00, 'Serviços / Estética', today, 'Entrada Mensal Ela', 1);
    insertTx.run(3, 'DESPESA', 1400.00, 'Moradia', today, 'Aluguel / Condomínio', 1);
    insertTx.run(3, 'DESPESA', 950.00, 'Alimentação', today, 'Supermercado Mensal', 1);
    insertTx.run(1, 'DESPESA', 250.00, 'Transporte', today, 'Combustível', 0);
    insertTx.run(2, 'DESPESA', 180.00, 'Lazer', today, 'Jantar Fim de Semana', 1);

    // Seed de recado
    const insertMsg = db.prepare(`
        INSERT INTO messages (sender_id, recipient_id, content, is_pinned)
        VALUES (?, ?, ?, ?)
    `);
    insertMsg.run(1, 2, 'Lembrei de abastecer o carro hoje! Te amo ❤️', 1);

    // Seed de tarefas
    const insertTask = db.prepare(`
        INSERT INTO tasks (user_id, title, due_date, priority, is_completed)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertTask.run(3, 'Fazer compras de hortifruti', today, 'ALTA', 0);
    insertTask.run(1, 'Revisar planilha de custos do e-commerce', today, 'MEDIA', 0);
    
    console.log('[SEED] Dados iniciais inseridos com sucesso!');
}

module.exports = db;