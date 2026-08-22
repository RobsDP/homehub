let categoryChartInstance = null;
let userChartInstance = null;

function initFinanceModule() {
    const monthInput = document.getElementById('filter-month');
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthInput.value = currentMonthStr;
    document.getElementById('tx-date').value = now.toISOString().split('T')[0];

    monthInput.addEventListener('change', () => {
        loadFinanceData();
        loadFinanceSummary();
    });
    document.getElementById('filter-user').addEventListener('change', loadFinanceData);
    document.getElementById('filter-type').addEventListener('change', loadFinanceData);
}

async function loadFinanceSummary() {
    const month = document.getElementById('filter-month').value;
    try {
        const res = await fetch(`/api/finance/summary?month=${month}`);
        const summary = await res.json();

        document.getElementById('dash-income').textContent = formatCurrency(summary.income);
        document.getElementById('dash-expense').textContent = formatCurrency(summary.expense);
        document.getElementById('dash-balance').textContent = formatCurrency(summary.balance);

        renderFinanceCharts(summary);
    } catch (err) {
        console.error('Erro ao carregar resumo financeiro:', err);
    }
}

async function loadFinanceData() {
    const month = document.getElementById('filter-month').value;
    const userId = document.getElementById('filter-user').value;
    const type = document.getElementById('filter-type').value;

    try {
        const res = await fetch(`/api/finance?month=${month}&userId=${userId}&type=${type}`);
        const txs = await res.json();

        const tbody = document.getElementById('transactions-tbody');
        tbody.innerHTML = '';
        document.getElementById('tx-count').textContent = `${txs.length} transações`;

        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Nenhuma transação encontrada no período.</td></tr>`;
            return;
        }

        txs.forEach(tx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-slate-600">${tx.date.split('-').reverse().join('/')}</td>
        <td class="px-6 py-4 font-bold text-slate-800">${tx.description}</td>
        <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">${tx.category}</span></td>
        <td class="px-6 py-4"><span class="font-semibold text-xs" style="color: ${tx.user_color}">${tx.user_name}</span></td>
        <td class="px-6 py-4 font-bold ${tx.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}">
          ${tx.type === 'RECEITA' ? '+' : '-'} ${formatCurrency(tx.amount)}
        </td>
        <td class="px-6 py-4">
          <button onclick="toggleTxPaid(${tx.id})" class="px-2.5 py-1 rounded-full text-xs font-bold transition ${tx.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
            ${tx.is_paid ? '✓ Pago' : '⏳ Pendente'}
          </button>
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button onclick="deleteTx(${tx.id})" class="text-slate-400 hover:text-rose-600 p-1 transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        lucide.createIcons();
    } catch (err) {
        console.error('Erro ao carregar transações:', err);
    }
}

function renderFinanceCharts(summary) {
    // Gráfico de Categorias
    const catCanvas = document.getElementById('chart-categories');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const catLabels = summary.categoryExpenses.map(c => c.category);
    const catData = summary.categoryExpenses.map(c => c.total);

    categoryChartInstance = new Chart(catCanvas, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['Sem despesas'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#94a3b8']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Gráfico por Usuário
    const userCanvas = document.getElementById('chart-users');
    if (userChartInstance) userChartInstance.destroy();

    userChartInstance = new Chart(userCanvas, {
        type: 'bar',
        data: {
            labels: summary.userBreakdown.map(u => u.name),
            datasets: [{
                label: 'Gastos por Pessoa (R$)',
                data: summary.userBreakdown.map(u => u.total),
                backgroundColor: summary.userBreakdown.map(u => u.color)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function openTransactionModal() {
    document.getElementById('form-transaction').reset();
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-tx-title').textContent = 'Adicionar Transação';
    openModal('modal-transaction');
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const payload = {
        user_id: document.getElementById('tx-user').value,
        type: document.querySelector('input[name="tx-type"]:checked').value,
        amount: document.getElementById('tx-amount').value,
        date: document.getElementById('tx-date').value,
        description: document.getElementById('tx-description').value,
        category: document.getElementById('tx-category').value,
        is_paid: document.getElementById('tx-paid').checked ? 1 : 0
    };

    const url = id ? `/api/finance/${id}` : '/api/finance';
    const method = id ? 'PUT' : 'POST';

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    closeModal('modal-transaction');
    loadFinanceData();
    loadFinanceSummary();
}

async function toggleTxPaid(id) {
    await fetch(`/api/finance/${id}/toggle-paid`, { method: 'PATCH' });
    loadFinanceData();
    loadFinanceSummary();
}

async function deleteTx(id) {
    if (confirm('Deseja realmente excluir esta transação?')) {
        await fetch(`/api/finance/${id}`, { method: 'DELETE' });
        loadFinanceData();
        loadFinanceSummary();
    }
}