let currentUsers = [];

// Alternar entre abas
function switchTab(tabId) {
    const tabs = ['dashboard', 'finance', 'messages', 'tasks'];
    tabs.forEach(tab => {
        const view = document.getElementById(`view-${tab}`);
        const btn = document.getElementById(`tab-${tab}`);
        if (tab === tabId) {
            view.classList.remove('hidden');
            btn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
            btn.classList.remove('text-slate-600');
        } else {
            view.classList.add('hidden');
            btn.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
            btn.classList.add('text-slate-600');
        }
    });

    if (tabId === 'dashboard') {
        loadDashboardData();
    } else if (tabId === 'finance') {
        loadFinanceData();
    } else if (tabId === 'messages') {
        loadMessages();
    } else if (tabId === 'tasks') {
        loadTasks();
    }
}

// Controle de Modais
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Carregar Usuários para Selects
async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        currentUsers = await res.json();

        const selects = ['filter-user', 'tx-user', 'msg-sender', 'msg-recipient', 'task-user'];
        selects.forEach(selId => {
            const el = document.getElementById(selId);
            if (!el) return;

            const isFilter = selId.startsWith('filter');
            el.innerHTML = isFilter ? '<option value="">Todos</option>' : '';

            currentUsers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.avatar} ${u.name}`;
                el.appendChild(opt);
            });
        });

        if (currentUsers.length >= 2) {
            const sender = document.getElementById('msg-sender');
            const recipient = document.getElementById('msg-recipient');
            if (sender && recipient) {
                sender.value = currentUsers[0].id;
                recipient.value = currentUsers[1].id;
            }
        }
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
    }
}

// Formatador de Moeda
function formatCurrency(val) {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    fetchWeather();
    initFinanceModule();
    loadDashboardData();
    lucide.createIcons();
});

async function loadDashboardData() {
    loadFinanceSummary();
    loadDashboardPinnedMessages();
    loadDashboardTasks();
}