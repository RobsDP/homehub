const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'homehub.db');
const db = new Database(dbPath);

// Habilita chaves estrangeiras e performance WAL
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criação do Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    color TEXT NOT NULL,
    avatar TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('RECEITA', 'DESPESA')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    is_paid INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(recipient_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT,
    priority TEXT CHECK(priority IN ('BAIXA', 'MEDIA', 'ALTA')) DEFAULT 'MEDIA',
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed inicial se a base estiver vazia
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
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
}

module.exports = db;