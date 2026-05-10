/* ================================================================
   FTS-CHAT.JS — helpers communs Forum + Messages
   ================================================================ */
'use strict';
window.FTSChat = window.FTSChat || {};
(function(Chat){
  const AV_COLORS = ["#b71815","#c0392b","#d35400","#d4ac0d","#1e8449","#148f77","#1a5276","#6c3483","#a04000","#1f618d"];

  Chat.avColor = function(s){
    s = String(s || '?');
    let h = 0;
    for(let i=0;i<s.length;i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return AV_COLORS[Math.abs(h) % AV_COLORS.length];
  };

  Chat.setAvatar = function(el, label, opts = {}){
    if(!el) return;
    const type = opts.type || 'person';
    const icon = opts.icon || '';
    if(type === 'category' || type === 'group'){
      el.textContent = icon || (type === 'category' ? '🎭' : '👥');
      el.style.background = opts.background || 'rgba(201,168,76,.18)';
      el.style.fontSize = '1.1rem';
      return;
    }
    el.textContent = String(label || '?').charAt(0).toUpperCase();
    el.style.background = Chat.avColor(label || '?');
    el.style.removeProperty('font-size');
  };

  Chat.fmtTs = function(ts){
    const d = new Date(ts), now = new Date();
    if(d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    const diff = (now - d) / 86400000;
    if(diff < 2) return 'Hier';
    if(diff < 7) return d.toLocaleDateString('fr-FR',{weekday:'short'});
    return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
  };

  Chat.fmtFull = function(ts){
    return new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  };

  Chat.fmtDay = function(ts){
    const d = new Date(ts), now = new Date();
    if(d.toDateString() === now.toDateString()) return "Aujourd'hui";
    if((now - d) / 86400000 < 2) return 'Hier';
    return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  };

  Chat.openChat = function(){ document.getElementById('app')?.classList.add('chat-open'); };
  Chat.closeChat = function(){ document.getElementById('app')?.classList.remove('chat-open'); };
  Chat.autoResize = function(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight, 140)+'px'; };
  Chat.handleEnter = function(e, cb){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); cb(); } };
  Chat.scrollBottom = function(id='messages'){
    const el = document.getElementById(id);
    if(el) el.scrollTop = el.scrollHeight;
  };
})(window.FTSChat);
