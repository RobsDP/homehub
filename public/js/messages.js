async function loadMessages() {
    try {
        const res = await fetch('/api/messages');
        const messages = await res.json();

        const grid = document.getElementById('messages-grid');
        grid.innerHTML = '';

        const unreadCount = messages.filter(m => !m.is_read).length;
        const badge = document.getElementById('unread-badge');
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (messages.length === 0) {
            grid.innerHTML = `<div class="col-span-3 text-center py-12 text-slate-400">Nenhum recado no mural ainda.</div>`;
            return;
        }

        messages.forEach(m => {
            const card = document.createElement('div');
            card.className = `p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${m.is_pinned ? 'bg-amber-50/70 border-amber-300 shadow-md ring-1 ring-amber-200' : 'bg-white border-slate-200 shadow-sm'
                } ${!m.is_read ? 'border-l-4 border-l-indigo-600' : ''}`;

            const dateStr = new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">${m.sender_avatar}</span>
              <div>
                <p class="text-xs font-bold text-slate-800">${m.sender_name} → <span class="text-indigo-600">${m.recipient_name}</span></p>
                <p class="text-[10px] text-slate-400">${dateStr}</p>
              </div>
            </div>
            <button onclick="togglePinMessage(${m.id})" class="p-1 rounded-lg hover:bg-slate-100 ${m.is_pinned ? 'text-amber-500' : 'text-slate-300'}">
              <i data-lucide="pin" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">${m.content}</p>
        </div>

        <div class="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
          <button onclick="toggleReadMessage(${m.id})" class="text-xs font-bold flex items-center gap-1.5 ${m.is_read ? 'text-slate-400' : 'text-indigo-600'}">
            <i data-lucide="${m.is_read ? 'check-check' : 'circle'}" class="w-4 h-4"></i>
            ${m.is_read ? 'Lida' : 'Marcar como lida'}
          </button>
          <button onclick="deleteMessage(${m.id})" class="text-slate-300 hover:text-rose-600 p-1 transition" title="Excluir">
            <i data-lucide="trash" class="w-4 h-4"></i>
          </button>
        </div>
      `;
            grid.appendChild(card);
        });

        lucide.createIcons();
    } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
    }
}

async function loadDashboardPinnedMessages() {
    const res = await fetch('/api/messages');
    const messages = await res.json();
    const container = document.getElementById('dash-pinned-messages');
    container.innerHTML = '';

    const relevant = messages.slice(0, 3);
    if (relevant.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Nenhum recado recente.</p>`;
        return;
    }

    relevant.forEach(m => {
        const item = document.createElement('div');
        item.className = 'p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center';
        item.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${m.sender_avatar}</span>
        <span class="font-medium text-slate-700 truncate max-w-[200px]">${m.content}</span>
      </div>
      <span class="text-[10px] text-slate-400">${m.sender_name}</span>
    `;
        container.appendChild(item);
    });
}

function openMessageModal() {
    document.getElementById('form-message').reset();
    openModal('modal-message');
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    const payload = {
        sender_id: document.getElementById('msg-sender').value,
        recipient_id: document.getElementById('msg-recipient').value,
        content: document.getElementById('msg-content').value
    };

    await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    closeModal('modal-message');
    loadMessages();
    loadDashboardPinnedMessages();
}

async function toggleReadMessage(id) {
    await fetch(`/api/messages/${id}/toggle-read`, { method: 'PATCH' });
    loadMessages();
}

async function togglePinMessage(id) {
    await fetch(`/api/messages/${id}/toggle-pin`, { method: 'PATCH' });
    loadMessages();
    loadDashboardPinnedMessages();
}

async function deleteMessage(id) {
    if (confirm('Deseja excluir este recado?')) {
        await fetch(`/api/messages/${id}`, { method: 'DELETE' });
        loadMessages();
        loadDashboardPinnedMessages();
    }
}