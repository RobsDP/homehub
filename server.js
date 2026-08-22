const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/users', require('./routes/users'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/weather', require('./routes/weather'));

// Rota raiz
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização
const localIP = getLocalIP();
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  🏠 HomeHub Servidor Residencial Iniciado!            `);
    console.log(`  💻 No Computador: http://localhost:${PORT}          `);
    console.log(`  📱 No Celular:    http://${localIP}:${PORT}         `);
    console.log(`=======================================================`);
});