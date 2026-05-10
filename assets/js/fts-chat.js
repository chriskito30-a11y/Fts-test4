'use strict';

window.FTSChat = window.FTSChat || {};
const FTSChat = window.FTSChat;

FTSChat.escape = function(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

FTSChat.autoResize = function(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
};

FTSChat.formatTime = function(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

FTSChat.dayLabel = function(ts) {
  const d = new Date(ts);
  const now = new Date();
  const yest = new Date();
  yest.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return "Hier";

  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

FTSChat.scrollBottom = function(container) {
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
};

FTSChat.initials = function(name = '') {
  const clean = String(name).trim();
  if (!clean) return '?';

  return clean
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

FTSChat.avColor = function(str = '') {
  const colors = [
    '#d4201a',
    '#c9a84c',
    '#8b5cf6',
    '#06b6d4',
    '#22c55e',
    '#f97316'
  ];

  let hash = 0;
  const s = String(str || '');

  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

FTSChat.colorFrom = FTSChat.avColor;

FTSChat.setAvatar = function(el, name = '', options = {}) {
  if (!el) return;

  const type = options.type || 'person';
  const icon = options.icon || '👥';

  if (type === 'group') {
    el.textContent = icon;
    el.style.background = 'rgba(201,168,76,.22)';
    el.style.color = '#c9a84c';
    return;
  }

  el.textContent = FTSChat.initials(name);
  el.style.background = FTSChat.avColor(name);
  el.style.color = '#fff';
};

FTSChat.avatarHTML = function(name = '', options = {}) {
  const type = options.type || 'person';

  if (type === 'group') {
    return `<div class="fts-avatar" style="background:rgba(201,168,76,.22);color:#c9a84c">👥</div>`;
  }

  return `
    <div class="fts-avatar" style="background:${FTSChat.avColor(name)}">
      ${FTSChat.initials(name)}
    </div>
  `;
};

FTSChat.openMobileChat = function() {
  const app = document.getElementById('app');
  if (app) app.classList.add('chat-open');
  document.body.classList.add('chat-open');
};

FTSChat.closeMobileChat = function() {
  const app = document.getElementById('app');
  if (app) app.classList.remove('chat-open');
  document.body.classList.remove('chat-open');
};
