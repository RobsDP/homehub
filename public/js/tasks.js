async function loadTasks() {
    try {
        const res = await fetch('/api/tasks');
        const tasks = await res.json();

        const list = document.getElementById('tasks-list');
        list.innerHTML = '';

        if (tasks.length === 0) {
            list.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">Todas as tarefas em dia! Nenhuma pendência.</p>`;
            return;
        }

        tasks.forEach(t => {
            const item = document.createElement('div');
            item.className = `p-4 rounded-xl border flex items-center justify-between gap-3 transition ${t.is_completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm'
                }`;

            const priorityBadge = {
                ALTA: 'bg-rose-100 text-rose-700',
                MEDIA: 'bg-amber-100 text-amber-700',
                BAIXA: 'bg-slate-100 text-slate-600'
            }[t.priority];

            item.innerHTML = `
        <div class="flex items-center gap-3">
          <input type="checkbox" onchange="toggleTask(${t.id})" ${t.is_completed ? 'checked' : ''} class="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
          <div>
            <p class="text-sm font-semibold ${t.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}">${t.title}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[11px] font-bold text-slate-500">${t.user_avatar} ${t.user_name}</span>
              ${t.due_date ? `<span class="text-[10px] text-slate-400">📅 Prazo: ${t.due_date.split('-').reverse().join('/')}</span>` : ''}
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge}">${t.priority}</span>
            </div>
          </div>
        </div>
        <button onclick="deleteTask(${t.id})" class="text-slate-300 hover:text-rose-600 p-1 transition"><i data-lucide="trash" class="w-4 h-4"></i></button>
      `;
            list.appendChild(item);
        });

        lucide.createIcons();
    } catch (err) {
        console.error('Erro ao carregar tarefas:', err);
    }
}

async function loadDashboardTasks() {
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    const container = document.getElementById('dash-urgent-tasks');
    container.innerHTML = '';

    const pending = tasks.filter(t => !t.is_completed).slice(0, 3);
    if (pending.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Nenhuma tarefa pendente!</p>`;
        return;
    }

    pending.forEach(t => {
        const item = document.createElement('div');
        item.className = 'p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center';
        item.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-700 truncate max-w-[220px]">${t.title}</span>
      </div>
      <span class="text-[10px] font-bold text-slate-500">${t.user_avatar} ${t.user_name}</span>
    `;
        container.appendChild(item);
    });
}

function openTaskModal() {
    document.getElementById('form-task').reset();
    openModal('modal-task');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('task-title').value,
        user_id: document.getElementById('task-user').value,
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-date').value || null
    };

    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    closeModal('modal-task');
    loadTasks();
    loadDashboardTasks();
}

async function toggleTask(id) {
    await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    loadTasks();
    loadDashboardTasks();
}

async function deleteTask(id) {
    if (confirm('Deseja excluir esta tarefa?')) {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        loadTasks();
        loadDashboardTasks();
    }
}