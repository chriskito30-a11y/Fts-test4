/* ================================================================
   FTS-UTILS.JS — Utilitaires JavaScript partagés
   Chargé en premier dans toutes les pages via <script src>.
   Expose un objet global window.FTS avec tous les helpers.
   ================================================================ */

'use strict';

window.FTS = window.FTS || {};

const FTS = window.FTS;


/* ── STOCKAGE LOCAL ──────────────────────────────────────────── */

FTS.store = {
  get:    (k)    => localStorage.getItem(k),
  set:    (k, v) => localStorage.setItem(k, String(v)),
  remove: (k)    => localStorage.removeItem(k),
  has:    (k)    => localStorage.getItem(k) !== null,
};


/* ── CSV PARSER — avec headers (retourne tableau d'objets) ───── */
/*
  Usage : const rows = FTS.parseCSV(csvText);
  Retourne : [ { col1: 'val', col2: 'val', ... }, ... ]
*/
FTS.parseCSV = function(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  return lines.slice(1).map(line => {
    const vals = [];
    let val = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === ',' && !inQ) { vals.push(val.trim()); val = ''; }
      else { val += line[i]; }
    }
    vals.push(val.trim());

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').replace(/^"|"$/g, '');
    });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
};


/* ── CSV PARSER — sans headers (retourne tableau de tableaux) ── */
/*
  Usage : const rows = FTS.parseCSVRaw(csvText);
  Retourne : [ ['val1', 'val2'], ['val3', 'val4'], ... ]
  (ignore la ligne 0 = headers)
*/
FTS.parseCSVRaw = function(text) {
  const lines = text.trim().split('\n');
  const result = [];
  for (let li = 1; li < lines.length; li++) {
    const row = lines[li];
    const cols = [];
    let s = '', q = false;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { q = !q; }
      else if (row[i] === ',' && !q) { cols.push(s.trim()); s = ''; }
      else { s += row[i]; }
    }
    cols.push(s.trim());
    if (cols.some(x => x)) result.push(cols);
  }
  return result;
};


/* ── SÉCURITÉ HTML ─────────────────────────────────────────────── */

FTS.esc = function(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};


/* ── NORMALISATION (Firebase keys, comparaisons) ─────────────── */
/*
  Usage : FTS.norm('Théâtre') → 'theatre'
*/
FTS.norm = function(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};


/* ── DATES & HEURES ─────────────────────────────────────────── */

FTS.formatDate = function(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

FTS.formatTime = function(ts) {
  return new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });
};

FTS.formatDateTime = function(ts) {
  const d   = new Date(ts);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString())  return `Aujourd'hui · ${FTS.formatTime(ts)}`;
  if (d.toDateString() === yest.toDateString()) return `Hier · ${FTS.formatTime(ts)}`;
  return `${FTS.formatDate(ts)} · ${FTS.formatTime(ts)}`;
};

FTS.dayLabel = function(ts) {
  const d   = new Date(ts);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString())  return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
};


/* ── GÉNÉRATION D'IDENTIFIANT UNIQUE ──────────────────────────── */

FTS.genUID = function() {
  return 'u' + Math.random().toString(36).substr(2, 9);
};


/* ── ICÔNE PAR NOM DE CATÉGORIE ──────────────────────────────── */

FTS.catIcon = function(name) {
  const n = FTS.norm(name);
  if (n.includes('theat'))              return '🎭';
  if (n.includes('dans'))               return '💃';
  if (n.includes('chant'))              return '🎤';
  if (n.includes('musi'))               return '🎸';
  if (n.includes('singer_academy'))     return '⭐';
  if (n.includes('singer_show'))        return '🌟';
  if (n.includes('comedie'))            return '🎬';
  if (n.includes('atelier'))            return '🎨';
  if (n.includes('formation'))          return '🎼';
  return '💬';
};


/* ── FETCH AVEC TIMEOUT ───────────────────────────────────────── */
/*
  Usage : FTS.fetch(url, 8000).then(r => r.text()).catch(...)
*/
FTS.fetch = function(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { signal: ctrl.signal })
    .finally(() => clearTimeout(id));
};


/* ── UPLOAD CLOUDINARY ─────────────────────────────────────────── */
/*
  Usage :
    FTS.uploadCloudinary(file, onProgress)
      .then(url => ...)
      .catch(err => ...)
*/
FTS.uploadCloudinary = function(file, onProgress) {
  const { cloudName, uploadPreset } = FTS.CLOUDINARY;
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    fd.append('resource_type', 'auto');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error('Upload échoué : ' + xhr.status));
      }
    };

    xhr.onerror = () => reject(new Error('Erreur réseau'));
    xhr.send(fd);
  });
};


/* ── SCROLL BAS ───────────────────────────────────────────────── */

FTS.scrollBottom = function(el) {
  if (el) el.scrollTop = el.scrollHeight;
};


/* ── CATALOGUE DISCIPLINES PARTAGÉ ────────────────────────────── */
FTS.CATEGORIES = [
  { icon:"🎭", name:"Theatre",          subcats:["7/9 ans","10/12 ans","13/15 ans","Impro","10/17 ans - Lundi","Adultes - Lundi","Adultes - Vendredi"] },
  { icon:"🎤", name:"Chant",            subcats:[] },
  { icon:"💃", name:"Danse",            subcats:["Les Baby Show","Show Danse Junior","Ados / Adultes"] },
  { icon:"🎸", name:"Musique",          subcats:["Guitare","Basse","Batterie","Piano","Formation Musicale"] },
  { icon:"⭐", name:"Singer Academy",   subcats:["Loisir","Spectacle"] },
  { icon:"🎬", name:"Comedie Musicale", subcats:["Kids","Enfants","Adultes"] },
  { icon:"🌟", name:"Singer Show",      subcats:[] },
  { icon:"🎨", name:"Atelier",          subcats:[] },
];


/* ── CATALOGUE DYNAMIQUE FIREBASE ──────────────────────────────── */
FTS.DEFAULT_CATEGORIES = FTS.CATEGORIES || [];

FTS.mergeCategoryStructures = function(...sources) {
  const map = new Map();
  function addCat(name, icon, subcats, order, active=true) {
    if (!name || active === false) return;
    const key = FTS.norm(name);
    if (!map.has(key)) map.set(key, { name, icon: icon || FTS.catIcon(name), subcats: [], order: order || 999 });
    const cat = map.get(key);
    if (icon) cat.icon = icon;
    if (order !== undefined && order !== null) cat.order = order;
    (subcats || []).forEach(sub => {
      if (sub && typeof sub === 'object' && sub.active === false) return;
      const subName = typeof sub === 'string' ? sub : (sub && (sub.name || sub.label));
      if (subName && !cat.subcats.some(x => FTS.norm(x) === FTS.norm(subName))) cat.subcats.push(subName);
    });
  }
  sources.forEach(src => {
    if (!src) return;
    if (Array.isArray(src)) {
      src.forEach(c => addCat(c.name || c.category || c.cat, c.icon, c.subcats || c.subs, c.order, c.active));
    } else {
      Object.values(src).forEach(c => {
        if (!c) return;
        let subs = c.subcats || c.subs || [];
        if (!Array.isArray(subs) && typeof subs === 'object') subs = Object.values(subs).map(x => typeof x === 'string' ? x : (x && (x.name || x.label)));
        addCat(c.name || c.category || c.cat, c.icon, subs, c.order, c.active);
      });
    }
  });
  return Array.from(map.values()).sort((a,b)=>(a.order||999)-(b.order||999) || a.name.localeCompare(b.name, 'fr'));
};

FTS.getCategoryStructure = function(categories) {
  const source = categories || FTS.DEFAULT_CATEGORIES || FTS.CATEGORIES || [];
  return source.map(c => ({
    category: c.name || c.category || c.cat,
    icon: c.icon || FTS.catIcon(c.name || c.category || c.cat),
    subs: (c.subcats || c.subs || []).map(s => ({ name: typeof s === 'string' ? s : (s && (s.name || s.label)) })).filter(s => s.name)
  }));
};

FTS.getCategoryStructureAsync = async function(db) {
  let dyn = null, fromResources = [];
  try {
    const snap = await db.ref('fts_content/categories').once('value');
    dyn = snap.val();
  } catch(e) {}
  try {
    const snap = await db.ref('fts_ressources').once('value');
    if (snap.exists()) snap.forEach(child => {
      const r = child.val() || {};
      if (r.active === false || r.status === 'inactive') return;
      const name = r.cat || r.category;
      const sub = r.subcat || r.subcategory;
      if (name) fromResources.push({ name, icon: FTS.catIcon(name), subcats: sub ? [sub] : [] });
    });
  } catch(e) {}
  const hasDyn = dyn && Object.keys(dyn).length;
  const merged = hasDyn
    ? FTS.mergeCategoryStructures(dyn, fromResources)
    : FTS.mergeCategoryStructures(FTS.DEFAULT_CATEGORIES, fromResources);
  return FTS.getCategoryStructure(merged);
};

FTS.categoryOptionsFromStructure = function(structure) {
  return (structure || []).map(c => ({
    value: c.category,
    label: (c.icon || FTS.catIcon(c.category)) + ' ' + c.category,
    icon: c.icon || FTS.catIcon(c.category),
    subcats: (c.subs || []).map(s => s.name).filter(Boolean)
  }));
};

FTS.ensureResourceCategory = async function(db, data) {
  const cat = data.cat || data.category;
  const sub = data.subcat || data.subcategory;
  if (!db || !cat) return;
  const catKey = FTS.norm(cat);
  const upd = {};
  upd['fts_content/categories/' + catKey + '/name'] = cat;
  upd['fts_content/categories/' + catKey + '/icon'] = FTS.catIcon(cat);
  upd['fts_content/categories/' + catKey + '/active'] = true;
  upd['fts_content/categories/' + catKey + '/updatedAt'] = Date.now();
  if (sub) {
    const subKey = FTS.norm(sub);
    upd['fts_content/categories/' + catKey + '/subcats/' + subKey] = { name: sub, active: true, updatedAt: Date.now() };
  }
  await db.ref().update(upd);
};
