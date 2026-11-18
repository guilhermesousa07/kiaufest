
import { api, money, esc } from './api.js';

const $ = s => document.querySelector(s);
let events = [];

async function guard() {
  const { user } = await api('/api/auth/me');

  if (!user || user.role !== 'admin') {
    location.href = '/';
    throw new Error('Acesso administrativo necessário.');
  }
}

async function deleteSector(id, name) {
  const confirmed = confirm(
    `Deseja realmente excluir o setor "${name}"?\n\nEssa ação pode ser bloqueada caso existam ingressos vinculados.`
  );

  if (!confirmed) return;

  try {
    await api('/api/sectors/' + id, {
      method: 'DELETE'
    });

    alert('Setor excluído com sucesso.');
    await load();

  } catch (error) {
    console.error('Erro ao excluir setor:', error);
    alert('Não foi possível excluir o setor: ' + error.message);
  }
}

async function load() {
  events = await api('/api/events/admin/list');

  $('#statEvents').textContent = events.length;

  $('#adminEvents').innerHTML = events.map(e => `
    <div class="admin-row">
      <div>
        <b>${esc(e.title)}</b>
        <small>
          ${new Date(e.event_date).toLocaleString('pt-BR')}
          · ${esc(e.status)}
        </small>
      </div>

      <div>
        <button data-edit="${e.id}">Editar</button>
        <button data-delete="${e.id}">Cancelar</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum evento cadastrado.</p>';

  const opts = events.map(e => `
    <option value="${e.id}">${esc(e.title)}</option>
  `).join('');

  $('#sectorEvent').innerHTML = opts;
  $('#modelEvent').innerHTML =
    '<option value="">Modelo geral</option>' + opts;

  $('#adminEvents').querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => editEvent(Number(b.dataset.edit));
  });

  $('#adminEvents').querySelectorAll('[data-delete]').forEach(b => {
    b.onclick = () => cancelEvent(Number(b.dataset.delete));
  });

  // Carregar setores
  const sectors = [];

  for (const e of events) {
    try {
      const full = await api('/api/events/' + e.id);

      for (const s of full.sectors || []) {
        sectors.push({
          ...s,
          event_title: e.title
        });
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  }

  // Exibir setores com botão de exclusão
  $('#adminSectors').innerHTML = sectors.map(s => `
    <div class="admin-row">
      <div>
        <b>${esc(s.name)}</b>
        <small>
          ${esc(s.event_title)}
          · ${money(s.price)}
          · ${s.capacity} lugares
        </small>
      </div>

      <div>
        <button
          type="button"
          class="danger-btn"
          data-delete-sector="${s.id}"
          data-sector-name="${esc(s.name)}"
        >
          Excluir
        </button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum setor cadastrado.</p>';

  $('#adminSectors')
    .querySelectorAll('[data-delete-sector]')
    .forEach(button => {
      button.onclick = () => {
        deleteSector(
          Number(button.dataset.deleteSector),
          button.dataset.sectorName
        );
      };
    });

  // Pedidos e vendas
  const orders = await api('/api/orders/admin/all');

  $('#statOrders').textContent = orders.length;

  $('#statSales').textContent = money(
    orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + Number(o.total), 0)
  );

  $('#adminOrders').innerHTML = orders.map(o => `
    <div class="admin-row">
      <div>
        <b>${esc(o.customer)} · ${esc(o.event_title)}</b>
        <small>${esc(o.code)} · ${esc(o.status)}</small>
      </div>

      <b>${money(o.total)}</b>
    </div>
  `).join('') || '<p class="muted">Ainda não existem pedidos.</p>';
}

function editEvent(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;

  const f = $('#eventForm');

  for (const k of [
    'id', 'title', 'venue', 'city',
    'image_url', 'description', 'price', 'status'
  ]) {
    f.elements[k].value = e[k] ?? '';
  }

  const d = new Date(e.event_date);

  f.elements.event_date.value = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);

  location.hash = 'events';
}

async function cancelEvent(id) {
  if (!confirm('Cancelar este evento?')) return;

  await api('/api/events/' + id, {
    method: 'DELETE'
  });

  await load();
}

$('#eventForm').onsubmit = async e => {
  e.preventDefault();

  const f = e.currentTarget;
  const b = Object.fromEntries(new FormData(f).entries());

  const id = b.id;
  delete b.id;

  b.event_date = b.event_date.replace('T', ' ') + ':00';

  await api(
    id ? '/api/events/' + id : '/api/events',
    {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(b)
    }
  );

  f.reset();
  f.elements.city.value = 'Araçuaí - MG';

  await load();
  alert('Evento salvo.');
};

$('#clearEvent').onclick = () => {
  $('#eventForm').elements.id.value = '';
};

$('#sectorForm').onsubmit = async e => {
  e.preventDefault();

  const b = Object.fromEntries(
    new FormData(e.currentTarget).entries()
  );

  await api('/api/sectors', {
    method: 'POST',
    body: JSON.stringify(b)
  });

  e.currentTarget.reset();

  await load();
  alert('Setor criado.');
};

$('#modelForm').onsubmit = async e => {
  e.preventDefault();

  const msg = $('#modelMsg');
  msg.textContent = 'Enviando modelo...';

  try {
    const fd = new FormData(e.currentTarget);

    const result = await api('/api/venue/upload', {
      method: 'POST',
      body: fd
    });

    msg.textContent = `Modelo enviado: ${result.model_url}`;
    e.currentTarget.reset();

  } catch (err) {
    msg.textContent = err.message;
  }
};

$('#logoutBtn').onclick = async () => {
  await api('/api/auth/logout', {
    method: 'POST'
  });

  location.href = '/';
};

try {
  await guard();
  await load();
} catch (e) {
  console.error(e);
}
