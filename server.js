const express = require('express');
const path = require('path');
const os = require('os');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { PORT, NODE_ENV } = require('./config/constants');

const app = express();

// Função para identificar o IP local do computador na rede Wi-Fi
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Middlewares
app.use(corsMiddleware); // CORS seguro com origens específicas
app.use(express.json({ limit: '10mb' })); // Limite de payload JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Dados de formulário
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '1d' : '0', // Cache em produção
    etag: true,
    lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// Rotas da API
app.use('/api/users', require('./routes/users'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/weather', require('./routes/weather'));

// Rota raiz - serve index.html para todas as rotas não-API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handler 404 para rotas não encontradas
app.use(notFoundHandler);

// Handler global de erros (deve ser o último middleware)
app.use(errorHandler);

// Inicialização
const localIP = getLocalIP();
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  🏠 HomeHub Servidor Residencial Iniciado!            `);
    console.log(`  💻 No Computador: http://localhost:${PORT}          `);
    console.log(`  📱 No Celular:    http://${localIP}:${PORT}         `);
    console.log(`  🔧 Ambiente:      ${NODE_ENV}                       `);
    console.log(`=======================================================`);
});

module.exports = app; // Exporta para testes