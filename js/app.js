/* ============================================================
   PORTFÓLIO — Victor Hugo Doracio
   app.js — LocalStorage, CRUD, Automação e Painel Oculto
   Executado após Bootstrap e config.js.
   ============================================================ */
'use strict';

// ------------------------------------------------------------
// 1. CONFIGURAÇÕES E CONSTANTES
// ------------------------------------------------------------
const APP_CONFIG = {
  STORAGE_KEY: 'canes_portfolio_messages',
  THEME_KEY: 'canes_portfolio_theme',
  SEED_VERSION: 1,
};

const STATUS_LABELS = {
  'novo': 'Novo',
  'em análise': 'Em análise',
  'respondido': 'Respondido',
  'arquivado': 'Arquivado',
};

let pendingDeleteId = null;
let editModalInstance = null;
let deleteModalInstance = null;
let adminPasswordModalInstance = null;

// ------------------------------------------------------------
// 2. UTILITÁRIOS
// ------------------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function showAlert(containerId, message, type = 'success') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cls = type === 'success' ? 'alert-success'
            : type === 'warning' ? 'alert-warning'
            : 'alert-danger';
  el.innerHTML = `<div class="alert ${cls} alert-dismissible fade show" role="alert">
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
  </div>`;
}

// ------------------------------------------------------------
// 3. SEED E CAMADA DE DADOS
// ------------------------------------------------------------
function buildSeedData() {
  const baseDate = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const seeds = [
    { nome: 'Ana Beatriz Souza',    email: 'ana.souza@exemplo.com',      assunto: 'Dúvida sobre o projeto de portfólio', mensagem: 'Olá Victor, gostei muito do seu portfólio. Poderia me explicar como você implementou o painel administrativo com LocalStorage?' },
    { nome: 'Bruno Carvalho',       email: 'bruno.carvalho@exemplo.com', assunto: 'Oportunidade Frontend Júnior',       mensagem: 'Olá! Vi seu portfólio e gostaria de conversar sobre uma vaga de Frontend Júnior na nossa equipe. Podemos agendar uma call?' },
    { nome: 'Carla Menezes',        email: 'carla.menezes@exemplo.com',  assunto: 'Feedback sobre o design responsivo', mensagem: 'Parabéns pelo layout mobile-first! Testei no meu celular e ficou excelente. Só sugiro revisar o contraste do rodapé no tema claro.' },
    { nome: 'Diego Ramos',          email: 'diego.ramos@exemplo.com',    assunto: 'Colaboração em projeto open source', mensagem: 'Estou desenvolvendo um projeto similar e gostaria de saber se você teria interesse em colaborar. Meu repositório é público.' },
    { nome: 'Eduarda Lima',         email: 'eduarda.lima@exemplo.com',   assunto: 'Palestra sobre Bootstrap 5',         mensagem: 'Olá Victor! Organizamos um meetup de frontend e gostaríamos de convidar você para falar sobre Bootstrap 5 e responsividade.' },
    { nome: 'Felipe Andrade',       email: 'felipe.andrade@exemplo.com', assunto: 'Sugestão de projeto',                mensagem: 'Que tal adicionar uma seção de artigos no seu portfólio? Achei seu conteúdo muito bom e seria interessante ter um blog.' },
    { nome: 'Gabriela Nunes',       email: 'gabriela.nunes@exemplo.com', assunto: 'Dúvida sobre o formulário',          mensagem: 'Como funciona a integração do formulário com o webhook? Vi que usa fetch e gostaria de entender o fluxo.' },
    { nome: 'Henrique Pires',       email: 'henrique.pires@exemplo.com', assunto: 'Parceria em projeto',                mensagem: 'Trabalho com design UX e adoraria fazer uma parceria para melhorar a experiência do seu portfólio. Podemos conversar?' },
    { nome: 'Isabela Rocha',        email: 'isabela.rocha@exemplo.com',  assunto: 'Agradecimento',                      mensagem: 'Seu portfólio me inspirou a começar meus estudos em frontend. Obrigada por compartilhar seu trabalho!' },
    { nome: 'João Pedro Martins',   email: 'joao.martins@exemplo.com',   assunto: 'Freelance',                          mensagem: 'Olá Victor, tenho um projeto de landing page para entregar em 2 semanas. Você teria disponibilidade para freelas?' },
    { nome: 'Karina Alves',         email: 'karina.alves@exemplo.com',   assunto: 'Dúvida sobre acessibilidade',        mensagem: 'Notei que você usou aria-live no formulário. Poderia explicar como testar isso com leitores de tela?' },
    { nome: 'Lucas Ferreira',       email: 'lucas.ferreira@exemplo.com', assunto: 'Feedback do código',                 mensagem: 'Analisei o código do app.js e gostei da organização. Sugiro extrair o escapeHtml para um módulo separado no futuro.' },
    { nome: 'Mariana Costa',        email: 'mariana.costa@exemplo.com',  assunto: 'Convite para entrevista',            mensagem: 'Olá Victor! Gostaríamos de convidá-lo para uma entrevista técnica. Podemos alinhar um horário esta semana?' },
    { nome: 'Nicolas Barbosa',      email: 'nicolas.barbosa@exemplo.com',assunto: 'Dúvida sobre o tema escuro',         mensagem: 'Como você fez o toggle de tema persistir no localStorage? Gostei bastante da abordagem com variáveis CSS.' },
    { nome: 'Olívia Teixeira',      email: 'olivia.teixeira@exemplo.com',assunto: 'Sugestão de melhoria',               mensagem: 'Achei o seed de 20 mensagens uma ótima ideia para demonstrar o CRUD. Funcionou perfeitamente no meu navegador.' },
    { nome: 'Paulo Ricardo',        email: 'paulo.ricardo@exemplo.com',  assunto: 'Colaboração em conteúdo',            mensagem: 'Escrevo artigos sobre frontend e gostaria de citar seu projeto em um post. Você autoriza?' },
    { nome: 'Queren Souza',         email: 'queren.souza@exemplo.com',   assunto: 'Dúvida sobre deploy',                mensagem: 'Você pretende publicar o projeto no GitHub Pages? Se sim, tem alguma dica para o primeiro deploy?' },
    { nome: 'Rafael Gomes',         email: 'rafael.gomes@exemplo.com',   assunto: 'Parabéns pelo projeto',              mensagem: 'Excelente trabalho, Victor. O site está muito bonito e funcional. Continue assim!' },
    { nome: 'Sofia Almeida',        email: 'sofia.almeida@exemplo.com',  assunto: 'Dúvida sobre Bootstrap',             mensagem: 'Como você fez o collapse da navbar no mobile? Quero implementar algo parecido no meu projeto.' },
    { nome: 'Thiago Monteiro',      email: 'thiago.monteiro@exemplo.com',assunto: 'Feedback geral',                     mensagem: 'Analisei o repositório e o código está bem organizado. Sugiro adicionar testes manuais documentados no README.' },
  ];

  return seeds.map((item, i) => ({
    id: generateId(),
    nome: item.nome,
    email: item.email,
    assunto: item.assunto,
    mensagem: item.mensagem,
    dataISO: new Date(baseDate - (i * oneDay) - Math.floor(Math.random() * 3600000)).toISOString(),
    status: ['novo', 'novo', 'em análise', 'respondido', 'arquivado'][i % 5],
    observacoes: i % 3 === 0 ? 'Recebida via formulário do portfólio.' : '',
  }));
}

function seedIfEmpty() {
  const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
  let isEmpty = !raw || raw.trim() === '';
  if (!isEmpty) {
    try {
      const parsed = JSON.parse(raw);
      isEmpty = !Array.isArray(parsed) || parsed.length === 0;
    } catch {
      isEmpty = true;
    }
  }
  if (isEmpty) {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(buildSeedData()));
    console.info('[Portfólio] Seed de 20 mensagens aplicado (LocalStorage estava vazio).');
  } else {
    console.info('[Portfólio] LocalStorage já possui dados. Seed ignorado.');
  }
}

function getMessages() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[Portfólio] Erro ao ler mensagens:', err);
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(messages));
}

function updateMessage(id, updates) {
  const messages = getMessages();
  const idx = messages.findIndex(m => m.id === id);
  if (idx === -1) return false;
  messages[idx] = { ...messages[idx], ...updates };
  saveMessages(messages);
  return true;
}

function deleteMessage(id) {
  saveMessages(getMessages().filter(m => m.id !== id));
}

function deleteAllMessages() {
  saveMessages([]);
}

// ------------------------------------------------------------
// 4. RENDERIZAÇÃO DO PAINEL ADMIN
// ------------------------------------------------------------
function renderAdminTable() {
  const tbody = document.getElementById('admin-messages');
  const emptyEl = document.getElementById('admin-empty');
  const countEl = document.getElementById('admin-count');
  if (!tbody) return;

  const messages = getMessages();
  if (countEl) countEl.textContent = messages.length;

  if (messages.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  const sorted = [...messages].sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));

  tbody.innerHTML = sorted.map(msg => {
    const statusClass = {
      'novo': 'text-bg-primary',
      'em análise': 'text-bg-warning',
      'respondido': 'text-bg-success',
      'arquivado': 'text-bg-secondary',
    }[msg.status] || 'text-bg-secondary';

    return `
      <tr data-id="${escapeHtml(msg.id)}">
        <td>${escapeHtml(msg.nome)}</td>
        <td class="text-truncate" style="max-width: 180px;">${escapeHtml(msg.email)}</td>
        <td>${escapeHtml(msg.assunto)}</td>
        <td class="text-nowrap small">${escapeHtml(formatDate(msg.dataISO))}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(STATUS_LABELS[msg.status] || msg.status)}</span></td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-primary btn-edit" data-id="${escapeHtml(msg.id)}" aria-label="Editar mensagem de ${escapeHtml(msg.nome)}">
            <i class="bi bi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete" data-id="${escapeHtml(msg.id)}" aria-label="Excluir mensagem de ${escapeHtml(msg.nome)}">
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ------------------------------------------------------------
// 5. AÇÕES DO PAINEL ADMIN
// ------------------------------------------------------------
function openEditModal(id) {
  const msg = getMessages().find(m => m.id === id);
  if (!msg) return;

  document.getElementById('edit-message-id').value = msg.id;
  document.getElementById('edit-message-from').textContent = `${msg.nome} <${msg.email}>`;
  document.getElementById('edit-message-subject').textContent = msg.assunto;
  document.getElementById('edit-message-date').textContent = formatDate(msg.dataISO);

  const bodyEl = document.getElementById('edit-message-body');
  bodyEl.innerHTML = escapeHtml(msg.mensagem).replace(/\n/g, '<br>');

  document.getElementById('edit-message-status').value = msg.status;
  document.getElementById('edit-message-notes').value = msg.observacoes || '';
  editModalInstance.show();
}

function handleEditSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('edit-message-id').value;
  const status = document.getElementById('edit-message-status').value;
  const observacoes = document.getElementById('edit-message-notes').value.trim();

  if (updateMessage(id, { status, observacoes })) {
    renderAdminTable();
    showAlert('admin-feedback', 'Mensagem atualizada com sucesso.', 'success');
    editModalInstance.hide();
  } else {
    showAlert('admin-feedback', 'Não foi possível atualizar a mensagem.', 'danger');
  }
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  const msg = getMessages().find(m => m.id === id);
  const text = msg
    ? `Deseja realmente excluir a mensagem de "${msg.nome}" (assunto: "${msg.assunto}")?`
    : 'Deseja realmente excluir esta mensagem?';
  document.getElementById('confirm-delete-text').textContent = text;
  deleteModalInstance.show();
}

function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  deleteMessage(pendingDeleteId);
  pendingDeleteId = null;
  renderAdminTable();
  showAlert('admin-feedback', 'Mensagem excluída com sucesso.', 'success');
  deleteModalInstance.hide();
}

function handleDeleteAll() {
  const total = getMessages().length;
  if (total === 0) {
    showAlert('admin-feedback', 'Não há mensagens para excluir.', 'warning');
    return;
  }
  if (!window.confirm(`Tem certeza que deseja excluir TODAS as ${total} mensagens? Esta ação não pode ser desfeita.`)) {
    return;
  }
  deleteAllMessages();
  renderAdminTable();
  showAlert('admin-feedback', `Todas as ${total} mensagens foram excluídas.`, 'success');
}

function handleExport() {
  const messages = getMessages();
  if (messages.length === 0) {
    showAlert('admin-feedback', 'Não há mensagens para exportar.', 'warning');
    return;
  }
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canes_portfolio_messages_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAlert('admin-feedback', `Exportação concluída (${messages.length} mensagens).`, 'success');
}

// ------------------------------------------------------------
// 6. FORMULÁRIO DE CONTATO E AUTOMAÇÃO
// ------------------------------------------------------------
async function sendToWebhook(payload) {
  const url = window.CONFIG?.WEBHOOK_URL;
  
  if (!url || url.includes('[PREENCHER')) {
    console.warn('[Portfólio] Webhook não configurado. Edite js/config.js.');
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    console.info('[Portfólio] Webhook disparado com sucesso.');
    return true;
  } catch (error) {
    console.error('[Portfólio] Falha no envio do webhook:', error);
    return false;
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const formData = new FormData(form);
  const newMessage = {
    id: generateId(),
    nome: formData.get('nome').trim(),
    email: formData.get('email').trim(),
    assunto: formData.get('assunto').trim(),
    mensagem: formData.get('mensagem').trim(),
    dataISO: new Date().toISOString(),
    status: 'novo',
    observacoes: ''
  };

  const messages = getMessages();
  messages.push(newMessage);
  saveMessages(messages);
  
  renderAdminTable();

  const submitBtn = document.getElementById('contact-submit');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

  form.reset();
  form.classList.remove('was-validated');
  showAlert('contact-feedback', 'Mensagem salva localmente! Disparando notificação...', 'success');

  const success = await sendToWebhook(newMessage);

  if (success) {
    showAlert('contact-feedback', 'Mensagem enviada com sucesso! Entrarei em contato em breve.', 'success');
  } else {
    showAlert('contact-feedback', 'Mensagem salva! (A notificação externa está temporariamente indisponível, mas sua mensagem foi registrada).', 'warning');
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnText;
}

// ------------------------------------------------------------
// 7. PAINEL OCULTO E ACESSO ADMIN
// ------------------------------------------------------------
function openAdminPasswordModal() {
  if (!adminPasswordModalInstance) return;
  
  const input = document.getElementById('admin-password-input');
  const error = document.getElementById('admin-password-error');
  
  input.value = '';
  input.classList.remove('is-invalid');
  error.style.display = 'none';
  
  adminPasswordModalInstance.show();
}

function handleAdminPassword(event) {
  event.preventDefault();
  const input = document.getElementById('admin-password-input');
  const error = document.getElementById('admin-password-error');
  
  const expected = window.CONFIG?.ADMIN_DEMO_PASSWORD || 'canes2024';

  if (input.value === expected) {
    adminPasswordModalInstance.hide();
    document.getElementById('admin').removeAttribute('hidden');
    document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
    if (window.location.hash === '#admin') {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  } else {
    input.classList.add('is-invalid');
    error.style.display = 'block';
    input.focus();
  }
}

function initAdminAccess() {
  if (window.location.hash === '#admin') {
    openAdminPasswordModal();
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      openAdminPasswordModal();
    }
  });

  const trigger = document.getElementById('footer-admin-trigger');
  if (trigger) {
    let clickCount = 0;
    let clickTimeout = null;

    trigger.addEventListener('click', (e) => {
      e.preventDefault(); 
      clickCount++;
      
      if (clickCount === 5) {
        clickCount = 0;
        openAdminPasswordModal();
      }
      
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        clickCount = 0;
      }, 2000);
    });
  }

  const passwordForm = document.getElementById('admin-password-form');
  if (passwordForm) passwordForm.addEventListener('submit', handleAdminPassword);

  const exitBtn = document.getElementById('admin-exit');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      document.getElementById('admin').setAttribute('hidden', '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ------------------------------------------------------------
// 8. TEMA (CLARO/ESCURO)
// ------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  const icon = document.querySelector('#theme-toggle i');
  const btn = document.getElementById('theme-toggle');
  if (icon) icon.className = theme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun';
  if (btn) btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
}

function initTheme() {
  const saved = localStorage.getItem(APP_CONFIG.THEME_KEY) || 'dark';
  applyTheme(saved);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(APP_CONFIG.THEME_KEY, next);
    applyTheme(next);
  });
}

// ------------------------------------------------------------
// 9. BOOTSTRAP DA APLICAÇÃO
// ------------------------------------------------------------
function init() {
  seedIfEmpty();
  initTheme();
  
  const editModalEl = document.getElementById('editMessageModal');
  const deleteModalEl = document.getElementById('confirmDeleteModal');
  const adminPassModalEl = document.getElementById('adminPasswordModal');
  
  if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);
  if (deleteModalEl) deleteModalInstance = new bootstrap.Modal(deleteModalEl);
  if (adminPassModalEl) adminPasswordModalInstance = new bootstrap.Modal(adminPassModalEl);

  const editForm = document.getElementById('edit-message-form');
  if (editForm) editForm.addEventListener('submit', handleEditSubmit);

  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  const exportBtn = document.getElementById('admin-export');
  if (exportBtn) exportBtn.addEventListener('click', handleExport);

  const deleteAllBtn = document.getElementById('admin-delete-all');
  if (deleteAllBtn) deleteAllBtn.addEventListener('click', handleDeleteAll);

  const tbody = document.getElementById('admin-messages');
  if (tbody) {
    tbody.addEventListener('click', (event) => {
      const editBtn = event.target.closest('.btn-edit');
      if (editBtn) { openEditModal(editBtn.dataset.id); return; }
      
      const delBtn = event.target.closest('.btn-delete');
      if (delBtn) { openDeleteModal(delBtn.dataset.id); }
    });
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

  initAdminAccess();
  renderAdminTable();

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', init);