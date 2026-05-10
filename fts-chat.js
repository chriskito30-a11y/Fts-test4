/* =========================================================
FTS-CHAT.JS
Helpers communs Forum + Messages
========================================================= */

'use strict';

window.FTSChat = window.FTSChat || {};

const FTSChat = window.FTSChat;

/* =========================================================
AUTO RESIZE TEXTAREA
========================================================= */

FTSChat.autoResize = function(el) {
if (!el) return;

el.style.height = 'auto';
el.style.height = Math.min(el.scrollHeight, 140) + 'px';
};

/* =========================================================
FORMAT TIME
========================================================= */

FTSChat.formatTime = function(ts) {
if (!ts) return '';

return new Date(ts).toLocaleTimeString('fr-FR', {
hour: '2-digit',
minute: '2-digit'
});
};

/* =========================================================
FORMAT DAY LABEL
========================================================= */

FTSChat.dayLabel = function(ts) {

const d = new Date(ts);

const now = new Date();

const yest = new Date();
yest.setDate(now.getDate() - 1);

if (d.toDateString() === now.toDateString()) {
return "Aujourd'hui";
}

if (d.toDateString() === yest.toDateString()) {
return "Hier";
}

return d.toLocaleDateString('fr-FR', {
weekday: 'long',
day: 'numeric',
month: 'long'
});
};

/* =========================================================
SCROLL BAS MESSAGES
========================================================= */

FTSChat.scrollBottom = function(container) {

if (!container) return;

requestAnimationFrame(() => {
container.scrollTop = container.scrollHeight;
});
};

/* =========================================================
GET INITIALS
========================================================= */

FTSChat.initials = function(name = '') {

return name
.split(' ')
.map(w => w[0] || '')
.join('')
.substring(0, 2)
.toUpperCase();
};

/* =========================================================
COLOR FROM STRING
========================================================= */

FTSChat.colorFrom = function(str = '') {

const colors = [
'#d4201a',
'#c9a84c',
'#8b5cf6',
'#06b6d4',
'#22c55e',
'#f97316'
 ];

let hash = 0;

for (let i = 0; i < str.length; i++) {
hash = str.charCodeAt(i) + ((hash << 5) - hash);
}

return colors[Math.abs(hash) % colors.length];
};

/* =========================================================
CREATE AVATAR
========================================================= */

FTSChat.avatarHTML = function(name) {

const initials = FTSChat.initials(name);

const color = FTSChat.colorFrom(name);

return &lt;div class="fts-avatar" style="background:${color}">
${initials} &lt;/div&gt;;
};

/* =========================================================
MOBILE CHAT OPEN
========================================================= */

FTSChat.openMobileChat = function() {

document.body.classList.add('chat-open');
};

/* =========================================================
MOBILE CHAT CLOSE
========================================================= */

FTSChat.closeMobileChat = function() {

document.body.classList.remove('chat-open');
};

/* =========================================================
ESCAPE HTML
========================================================= */

FTSChat.escape = function(str = '') {

return String(str)
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"');
};