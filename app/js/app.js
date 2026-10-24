(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_MAPS_API_KEY) || '';
const SHINJUKU = { lat: 35.6896, lng: 139.7006 };
const st = {
  lang: store.get('lang', null) || 'en',
  chosen: !!store.get('lang', null),
  pos: { ...SHINJUKU, real: false },
  usage: store.get('usage', {}),
  cat: 'top', q: '',
  mapType: 'police', mapSeq: 0, markers: [],
  chat: [],
  menu: { img: null, idx: 0, items: null, scanning: false, filter: 'all' },
  wait: { group: 'air', sel: 'ntr1' },
  plan: { city: 'tokyo', days: 2, people: 1, budget: 1, total: '', curIn: 'JPY', interests: ['temple', 'food'], result: null },
  cv: { amt: 1000 },
  fare: { from: 'sensoji', to: 'meiji' },
  overlay: null,
  prefs: store.get('prefs', { allergens: [], diets: [] }),
  theme: store.get('theme', 'auto'),
};
st.prefs.off = st.prefs.off || [];
const on = id => !st.prefs.off.includes(id);
const ICON = {
  pin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>',
  go: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21 3L3 10.5l7 2.5 2.5 7z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
};
const darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme() {
  const dark = st.theme === 'dark' || (st.theme === 'auto' && darkMQ && darkMQ.matches);
  document.documentElement.classList.toggle('dark', dark);
}
if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', applyTheme);
applyTheme();
const L = () => LANGS.findIndex(l => l.id === st.lang);
const tr = k => t(k, st.lang);
const nm = o => (st.lang === 'ja' ? o.ja : st.lang === 'hi' ? o.hi : o.en);
const pick = o => o[st.lang === 'en' ? 'en' : st.lang === 'np' ? 'np' : st.lang === 'ja' ? 'ja' : 'hi'];
const speechLang = () => LANGS[L()].speech;

// ---------- helpers ----------
function hav(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = km => (km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1)} km`);
const walkMin = km => Math.max(1, Math.round(km * 13));
const walkLabel = km => `${fmtDist(km)} · 🚶 ${walkMin(km)} ${tr('min')}`;
const yen = n => '¥' + Math.round(n).toLocaleString('en-US');
const dirUrl = (p, mode = 'walking') => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=${mode}`;
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP'; u.rate = 0.85;
  speechSynthesis.speak(u);
}
function bump(id) { st.usage[id] = (st.usage[id] || 0) + 1; store.set('usage', st.usage); }
function topPhrases(n = 8) {
  const ranked = PHRASES.map((p, i) => ({ p, i, c: st.usage[p.id] || 0, d: DEFAULT_TOP.indexOf(p.id) }))
    .sort((a, b) => b.c - a.c || (a.d < 0 ? 99 : a.d) - (b.d < 0 ? 99 : b.d) || a.i - b.i);
  return ranked.slice(0, n).map(x => x.p);
}
function nearest(type, n = 1) {
  return POI.filter(p => p.type === type).map(p => ({ ...p, km: hav(st.pos, p) })).sort((a, b) => a.km - b.km).slice(0, n);
}

// ---------- routing ----------
const TAB_VIEWS = ['home', 'map', 'phrases', 'chat', 'sos'];
const view = () => (st.chosen ? (location.hash.replace('#/', '') || 'home') : 'lang');
const go = v => { location.hash = '#/' + v; };

// ---------- shell ----------
function render() {
  const v = view();
  document.documentElement.lang = st.lang === 'np' ? 'ne' : st.lang === 'en' ? 'en' : 'ja';
  const heads = { home: '', map: 'map', phrases: 'phrases', chat: 'ai', sos: 'emergency', menu: 'menu', wait: 'wait', plan: 'plan', fare: 'fare', help: 'help_btn', nearby: 'near_you', listen: 'listen', tips: 'tips', profile: 'profile', credits: 'credits', settings: 'settings', book: 'book', spot: 'sights_pop' };
  let html = '';
  if (v !== 'lang') {
    html += `<header class="top">
      <a class="logo" href="#/home"><img class="logoimg" src="logo.png" alt="" width="30" height="30"> ${tr('title')}</a>
      <select class="langsel" data-c="lang" aria-label="language">${LANGS.map(l => `<option value="${l.id}" ${l.id === st.lang ? 'selected' : ''}>${l.label}</option>`).join('')}</select>
      <a class="gearbtn" href="#/settings" aria-label="${tr('settings')}" title="${tr('settings')}">⚙️</a>
      <a class="sosbtn" href="#/sos">🆘 ${tr('sos')}</a></header>`;
    if (!TAB_VIEWS.includes(v)) html += `<div class="sub"><a href="#/home" class="back">← ${tr('back')}</a><b>${tr(heads[v] || 'home')}</b></div>`;
  }
  html += `<main class="view v-${v}">${(VIEWS[v] || VIEWS.home)()}</main>`;
  if (v !== 'lang') {
    const tabs = [['home', '⌂'], ['map', '🗺'], ['phrases', '💬'], ['chat', '🤖'], ['sos', '🆘']].filter(([id]) => id === 'home' || id === 'sos' || on(id));
    html += `<nav class="tabs">${tabs.map(([id, ic]) => `<a href="#/${id}" class="${id === v ? 'on' : ''}"><b>${ic}</b>${tr(id === 'chat' ? 'ai' : id)}</a>`).join('')}</nav>`;
  }
  $('#app').innerHTML = html;
  (AFTER[v] || (() => {}))();
  hydratePhotos();
  renderOverlay();
}

function renderOverlay() {
  const o = st.overlay, el = $('#overlay');
  if (!o) { el.className = ''; el.innerHTML = ''; return; }
  el.className = 'on';
  el.innerHTML = `<div class="ov-in">
    <div class="ov-hint">${esc(tr('show_staff_hint'))}${st.lang === 'ja' || st.lang === 'hi' ? '' : ' / よんでください'}</div>
    <div class="ov-hi" lang="ja">${esc(o.hi)}</div>
    <div class="ov-ja" lang="ja">${esc(o.ja)}</div>
    <div class="ov-src">${esc(o.src || '')}</div>
    ${o.extra || ''}
    <div class="ov-btns"><button class="btn" data-a="ovread">🔊 ${tr('read_aloud')}</button><button class="btn pri" data-a="ovclose">✕ ${tr('close')}</button></div></div>`;
}

// ---------- views ----------
const VIEWS = {
  lang() {
    return `<div class="langpage">
      <img class="heroimg" src="logo.png" alt="Japan Travel logo" width="150" height="150">
      <h1>JAPAN TRAVEL</h1>
      <p class="tag">日本の旅行は、このひとつのアプリで<br><small>Nihon no ryokou wa kono hitotsu no apuri de</small></p>
      <p class="muted">Choose your language · भाषा छान्नुहोस् · ことば</p>
      ${LANGS.map(l => `<button class="btn big ${l.id === st.lang ? 'sel' : ''}" data-a="setlang" data-v="${l.id}">${l.label}${l.id === 'hi' ? ' <small>（ひらがなだけ）</small>' : ''}</button>`).join('')}
      <button class="btn pri big" data-a="start">${tr('start')} ▶</button>
      <p class="muted small">${tr('prototype')}</p></div>`;
  },

  home() {
    const tile = (href, ic, label) => `<a class="tile" href="${href}"><span class="ic">${ic}</span><b>${label}</b></a>`;
    const section = (title, tiles, more) => (tiles.length ? `<h3>${title}${more || ''}</h3><div class="tiles">${tiles.join('')}</div>` : '');
    const around = ['police', 'hospital', 'station', 'hotel', 'toilet', 'shop', 'trash', 'charge', 'rental', 'locker'];
    const talk = [on('phrases') && tile('#/phrases', '💬', tr('phrases')), on('listen') && tile('#/listen', '🎧', tr('listen')), on('menu') && tile('#/menu', '📷', tr('menu')), on('profile') && tile('#/profile', '🥜', tr('profile'))].filter(Boolean);
    const planT = [on('plan') && tile('#/plan', '🧭', tr('plan')), on('fare') && tile('#/fare', '🚃', tr('fare')), on('wait') && tile('#/wait', '⏱️', tr('wait')), on('tips') && tile('#/tips', '💡', tr('tips')), on('book') && tile('#/book', '📅', tr('book'))].filter(Boolean);
    const top = topPhrases(3);
    return `<div class="gsearch"><input class="search" data-c="gsearch" autocomplete="off" placeholder="🔍 ${tr('search_all')}"><div id="gres" class="gres"></div></div>
      <a class="helpbig" href="#/help"><span class="hb">🆘</span><div><b>${tr('help_btn')}</b><small>${tr('help_sub')}</small></div></a>
      ${on('near') ? nearStrip() : ''}
      ${on('weather') ? `<div class="box wx" id="wxhome"><small class="muted">${tr('weather')}…</small></div>` : ''}
      ${on('map') ? section(tr('sec_around'), around.map(t => `<button class="tile" data-a="tomap" data-v="${t}"><span class="ic">${PLACE_TYPES[t].icon}</span><b>${tr('c_' + t)}</b></button>`), ` <a href="#/map" class="more">${tr('more_cats')} ›</a>`) : ''}
      ${section(tr('sec_talk'), talk)}
      ${section(tr('sec_plan'), planT)}
      ${on('photos') ? `<h3>${tr('sights_pop')}</h3>
      <div class="hscroll">${SPOTS.filter(s => s.pop >= 4).slice(0, 8).map(s => `<div class="scard" data-a="opensp" data-v="${s.id}">${phSlot(s.id, 'card')}<b>${esc(nm(s))}</b><small>${esc(nm(CITIES.find(c => c.id === s.city)))}</small></div>`).join('')}</div>` : ''}
      ${on('chat') ? `<div class="hello" data-a="nav" data-v="chat"><div class="avatar">🗾</div><div><b>${tr('greet_home')}</b><div class="badge">${tr('demo_ai')}</div></div></div>` : ''}
      ${on('phrases') ? `<h3>${tr('most_used')} <a href="#/phrases" class="more">${tr('see_all')} ›</a></h3>${top.map(phraseCard).join('')}` : ''}
      <p class="muted small center">${tr('prototype')} · <a href="#/credits"><u>${tr('credits')}</u></a> · <a href="#/settings"><u>⚙ ${tr('settings')}</u></a></p>`;
  },

  phrases() {
    const cats = ['top', 'emergency', 'answer', 'basic', 'food', 'move', 'shop'];
    let list;
    const q = st.q.trim().toLowerCase();
    if (q) list = PHRASES.filter(p => [p.en, p.np, p.ja, p.hi, p.ro].some(x => x.toLowerCase().includes(q)));
    else if (st.cat === 'top') list = topPhrases(8);
    else list = PHRASES.filter(p => p.cat === st.cat);
    return `<input class="search" data-c="q" placeholder="🔍 ${tr('search')}" value="${esc(st.q)}">
      <div class="chips">${cats.map(c => `<button class="chip ${c === st.cat ? 'on' : ''}" data-a="cat" data-v="${c}">${tr('cat_' + c)}</button>`).join('')}</div>
      ${list.map(phraseCard).join('')}`;
  },

  map() {
    const grp = Object.keys(GROUPS).find(g => GROUPS[g].includes(st.mapType)) || 'safety';
    return `<div class="mapnav"><div class="gtabs">${Object.keys(GROUPS).map(g => `<button class="gtab ${g === grp ? 'on' : ''}" data-a="mapgroup" data-v="${g}">${tr('g_' + g)}</button>`).join('')}</div>
      <div class="chips mapchips">${GROUPS[grp].map(c => `<button class="chip ${c === st.mapType ? 'on' : ''}" data-a="maptype" data-v="${c}">${PLACE_TYPES[c].icon} ${tr('c_' + c)}</button>`).join('')}</div></div>
      <div id="mapbox" class="mapbox"><div class="mapfall"></div></div>
      <div id="sheet" class="sheetlist"><p class="muted">${tr('loading')}</p></div>`;
  },

  chat() {
    if (!st.chat.length) st.chat.push({ me: false, k: 'chat_hello' });
    const quick = [['⛩', 'sensoji', 'Senso-ji'], ['🚓', 'police', 'police'], ['🚻', 'toilet', 'toilet'], ['🍜', 'food', 'food'], ['🚃', 'train', 'train'], ['⏱', 'wait', 'wait']];
    return `<div class="chathead"><div class="avatar">🗾</div><div><b>${tr('ai')}</b></div></div>${trust('ai', 'demo')}
      <div id="msgs" class="msgs">${st.chat.map(chatBubble).join('')}</div>
      <div class="chips quick">${quick.map(([ic, k, q]) => `<button class="chip" data-a="quick" data-v="${q}">${ic} ${tr('q_' + k)}</button>`).join('')}</div>
      <form class="chatform" data-f="chat"><input id="chatin" autocomplete="off" placeholder="${tr('ask_ph')}">
        ${('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? `<button type="button" class="btn" data-a="mic">🎤</button>` : ''}
        <button class="btn pri">${tr('send')}</button></form>`;
  },

  sos() {
    const p = nearest('police', 1)[0];
    return `<div class="sos-head">🆘 ${tr('emergency')}</div>
      <div class="two">${EMERGENCY.slice(0, 2).map(e => `<a class="btn sos" href="tel:${e.tel}"><small>${tr(e.k)}</small><b class="num">${e.num}</b></a>`).join('')}</div>
      ${EMERGENCY.slice(2).map(e => `<a class="row box" href="tel:${e.tel}"><span>${tr(e.k)}</span><b>${e.num}</b></a>`).join('')}
      <div class="box fill"><b>📍 ${tr('nearest_police')}</b>
        <div>${esc(nm(p))}</div><div class="small muted">${walkLabel(p.km)}</div>
        <div class="two"><a class="btn" href="${dirUrl(p)}" target="_blank" rel="noopener">${tr('go')} ▶</a><a class="btn" href="#/map">🗺 ${tr('map')}</a></div></div>
      <div class="box fill" id="myaddr"><b>📍 ${tr('my_addr')}</b><small class="muted">${tr('addr_wait')}</small></div>
      <div class="two"><button class="btn pri" data-a="myloc">📱 ${tr('tell_loc')}</button><button class="btn" data-a="staff" data-v="help">🗣 ${tr('say_phrase')}</button></div>
      <p class="muted small">${tr('tel_hint')} ${tr('verify_num')}</p>${noteConfirm()}`;
  }
};

function phraseCard(p) {
  const src = pick(p);
  const showSrc = st.lang !== 'ja' && st.lang !== 'hi';
  return `<div class="box phrase ${p.cat === 'emergency' ? 'em' : ''}">
    ${showSrc ? `<div class="src">${esc(src)}</div>` : ''}
    <div class="ja" lang="ja">${esc(st.lang === 'hi' ? p.hi : p.ja)}</div>
    ${st.lang === 'hi' ? '' : `<div class="hira" lang="ja">${esc(p.hi)}</div>`}
    <div class="ro">${esc(p.ro)}</div>
    <div class="two"><button class="btn" data-a="say" data-v="${p.id}">🔊 ${tr('play')}</button><button class="btn pri" data-a="staff" data-v="${p.id}">📱 ${tr('show_staff')}</button></div></div>`;
}

function chatBubble(m) {
  const text = m.k ? tr(m.k) : m.text;
  const acts = (m.actions || []).map(a => a.href ? `<a class="chip" target="_blank" rel="noopener" href="${esc(a.href)}">${esc(a.label)}</a>` : `<a class="chip" href="#/${a.view}">${esc(a.label)}</a>`).join('');
  return `<div class="bubble ${m.me ? 'me' : ''}">${m.typing ? '<span class="dots"><i></i><i></i><i></i></span>' : esc(text)}${m.spot ? phSlot(m.spot, 'wide') : ''}${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
}

// ---------- post-render hooks ----------
const AFTER = {
  map() { initMapView(); },
  chat() { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; },
};

// ---------- Google Maps ----------
let gmPromise = null;
function loadGoogle() {
  if (gmPromise) return gmPromise;
  gmPromise = new Promise((res, rej) => {
    window.__gmReady = () => res();
    const s = document.createElement('script');
    const lang = st.lang === 'en' ? 'en' : st.lang === 'np' ? 'ne' : 'ja';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&callback=__gmReady&language=${lang}`;
    s.onerror = () => rej(new Error('load'));
    document.head.appendChild(s);
    setTimeout(() => rej(new Error('timeout')), 12000);
  });
  gmPromise.catch(() => { st.gmFail = true; });
  return gmPromise;
}
window.gm_authFailure = () => { st.gmFail = true; if (view() === 'map') initMapView(); };

async function initMapView() {
  const box = $('#mapbox');
  let ok = false;
  if (API_KEY && !st.gmFail) {
    try {
      await loadGoogle();
      if (!st.map) {
        st.mapEl = document.createElement('div');
        st.mapEl.style.cssText = 'width:100%;height:100%';
        st.map = new google.maps.Map(st.mapEl, { center: st.pos, zoom: 16, disableDefaultUI: true, zoomControl: true, clickableIcons: false });
        st.me = new google.maps.Marker({ map: st.map, position: st.pos, title: tr('my_pos'), icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 } });
      }
      if (st.gmFail) throw new Error('auth');
      if (!$('#mapbox')) return;
      box.innerHTML = '';
      box.appendChild(st.mapEl);
      google.maps.event.trigger(st.map, 'resize');
      st.map.setCenter(st.pos);
      ok = true;
      setTimeout(() => { const b = $('#mapbox'); if (b && st.mapEl.parentNode === b && !st.mapEl.querySelector('.gm-style')) b.insertAdjacentHTML('beforeend', `<div class="mapfall over"><div class="pinbig">🗺️</div><p>${tr('map_fail')}</p><a class="btn go" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(PLACE_TYPES[st.mapType].q)}/@${st.pos.lat},${st.pos.lng},16z">${ICON.go}${tr('open_gmaps')}</a></div>`); }, 4000);
    } catch { ok = false; }
  }
  if (!ok && $('#mapbox')) {
    $('#mapbox').innerHTML = `<div class="mapfall"><div class="pinbig">🗺️</div><p>${tr('no_key')}</p>
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(PLACE_TYPES[st.mapType].q)}/@${st.pos.lat},${st.pos.lng},16z">${tr('open_gmaps')}</a></div>`;
  }
  runMapSearch(ok);
}

// ---------- nearby search (Google Places New / OpenStreetMap / sample) ----------
const nearCache = new Map();
function placesNear(type) {
  const key = `${type}:${st.pos.lat.toFixed(3)},${st.pos.lng.toFixed(3)}`;
  if (!nearCache.has(key)) nearCache.set(key, fetchNear(type));
  return nearCache.get(key);
}
async function fetchNear(type) {
  let list = [], src = 'sample';
  try {
    if (type === 'trash') { list = await trashNear(); if (list.length) src = 'osm'; }
    else if (API_KEY && !st.gmFail) {
      await loadGoogle();
      // Places API (New) must be enabled on the key's project
      const { Place } = await google.maps.importLibrary('places');
      const cfg = PLACE_TYPES[type], fields = ['displayName', 'location', 'formattedAddress'];
      const { places } = cfg.text
        ? await Place.searchByText({ textQuery: cfg.text, fields, locationBias: { center: st.pos, radius: 3000 }, maxResultCount: 12 })
        : await Place.searchNearby({ fields, locationRestriction: { center: st.pos, radius: 2000 }, includedPrimaryTypes: cfg.types || [cfg.type], maxResultCount: 12 });
      list = (places || []).map(p => ({ name: p.displayName, sub: p.formattedAddress, lat: p.location.lat(), lng: p.location.lng() }));
      if (list.length) src = 'google';
    }
  } catch (err) { console.warn('Google search failed, trying OpenStreetMap:', err.message || err); }
  if (!list.length && type !== 'trash') {
    try { list = await overpassNear(type); if (list.length) src = 'osm'; } catch (err) { console.warn('OpenStreetMap search failed:', err.message || err); }
  }
  const sample = !list.length;
  if (sample) list = POI.filter(p => p.type === type).map(p => ({ name: nm(p), lat: p.lat, lng: p.lng }));
  list = list.map(p => ({ ...p, km: hav(st.pos, p) })).sort((a, b) => a.km - b.km);
  const close = list.filter(p => p.km < 30);
  return { list: (close.length ? close : list).slice(0, 10), sample, src };
}
// OpenStreetMap (Overpass) lookup: free fallback when Google is unavailable (no key, quota used up, error)
const OSM_TAGS = {
  police: ['amenity=police'], hospital: ['amenity=hospital', 'amenity=clinic'], pharmacy: ['amenity=pharmacy'], shop: ['shop=convenience'], toilet: ['amenity=toilets'],
  atm: ['amenity=atm'], exchange: ['amenity=bureau_de_change'], station: ['railway=station', 'station=subway'], hotel: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house'],
  charge: ['amenity=device_charging_station'], rental: ['amenity=bicycle_rental'], locker: ['amenity=locker'], trash: ['amenity=waste_basket'],
  veg: ['"diet:vegetarian"~"yes|only"'], halal: ['"diet:halal"~"yes|only"'], gf: ['"diet:gluten_free"="yes"'], hindu: ['cuisine=indian'],
};
async function overpassNear(type, radius = 1500) {
  const tags = OSM_TAGS[type]; if (!tags) return [];
  const { lat, lng } = st.pos;
  const body = tags.map(t => `node(around:${radius},${lat},${lng})[${t}];way(around:${radius},${lat},${lng})[${t}];`).join('');
  const q = encodeURIComponent(`[out:json][timeout:15];(${body});out center 25;`);
  // public Overpass servers can be slow or busy: ask two in parallel and take the first good answer
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
  const ask = base => fetch(`${base}?data=${q}`, { signal: ctl.signal }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  try {
    const j = await Promise.any(['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'].map(ask));
    const lang = st.lang === 'ja' || st.lang === 'hi' ? 'ja' : 'en';
    return j.elements.map(e => ({ name: (e.tags && (e.tags['name:' + lang] || (lang === 'en' ? e.tags['name:en'] : '') || e.tags.name)) || null, lat: e.lat ?? (e.center && e.center.lat), lng: e.lon ?? (e.center && e.center.lon) })).filter(p => p.lat != null);
  } finally { clearTimeout(to); ctl.abort(); }
}
// trash bins: OpenStreetMap (free, no key) + pins added by travellers on this device
async function trashNear() {
  const here = st.pos;
  const pins = store.get('bins', []).filter(b => hav(here, b) < 1).map(b => ({ name: null, pin: b.t, lat: b.lat, lng: b.lng }));
  let osm = [];
  try { osm = await overpassNear('trash', 800); } catch (err) { console.warn('Overpass failed:', err.message || err); }
  return [...pins, ...osm];
}
const pname = (p, type) => (p.name || tr('c_' + type)) + (p.pin ? ' 📌' : '');

async function runMapSearch(useGoogle) {
  const seq = ++st.mapSeq, type = st.mapType;
  st.markers.forEach(m => m.setMap(null)); st.markers = [];
  const sheet = $('#sheet'); if (sheet) sheet.innerHTML = `<div class="grab"></div><div class="scan"><div class="spin"></div>${tr('loading')}</div>`;
  const r = await placesNear(type);
  const list = r.list.slice(0, 8), sample = r.sample;
  if (seq !== st.mapSeq || view() !== 'map') return;
  if (useGoogle && st.map) {
    const bounds = new google.maps.LatLngBounds(st.pos);
    list.forEach((p, i) => {
      const mk = new google.maps.Marker({ map: st.map, position: p, title: pname(p, type), label: { text: PLACE_TYPES[type].icon, fontSize: '16px' } });
      mk.addListener('click', () => { const el = document.getElementById('poi-' + i); if (el) el.scrollIntoView({ block: 'nearest' }); });
      st.markers.push(mk); bounds.extend(p);
    });
    if (list.length) { st.map.fitBounds(bounds, 40); google.maps.event.addListenerOnce(st.map, 'idle', () => { if (st.map.getZoom() > 17) st.map.setZoom(17); }); }
  }
  $('#sheet').innerHTML = `<div class="grab"></div><div class="row"><b>${PLACE_TYPES[type].icon} ${type === 'police' ? tr('nearest_police') : tr('c_' + type)}</b>
      <button class="chip" data-a="recenter">📍 ${tr('recenter')}</button></div>
    ${st.pos.real ? '' : `<p class="muted small">${tr('using_sample')} <button class="chip" data-a="allowloc">${tr('allow_loc')}</button></p>`}
    ${list.length ? list.map((p, i) => `<div class="box row poi" id="poi-${i}"><div class="ninfo"><b class="nm2">${esc(pname(p, type))}</b><div class="small muted">${walkLabel(p.km)}</div>${p.sub ? `<div class="small muted nm1">${esc(p.sub)}</div>` : ''}</div>
      <div class="nbtns">${p.pin ? `<button class="btn ico del" data-a="delbin" data-v="${p.pin}" aria-label="${tr('delete')}" title="${tr('delete')}">${ICON.trash}</button>` : ''}<a class="btn go" target="_blank" rel="noopener" href="${dirUrl(p)}">${ICON.go}${tr('go')}</a></div></div>`).join('') : `<p class="muted">${tr('nothing')}</p>`}
    ${GROUPS.food.includes(type) ? `<p class="muted small">${tr('diet_note')}</p>` : ''}
    ${type === 'police' ? `<div class="two"><a class="btn sos" href="tel:110">📞 110</a><button class="btn" data-a="staff" data-v="police">🗣 ${tr('say_phrase')}</button></div>` : ''}
    ${type === 'trash' ? `<button class="btn" data-a="addbin">🗑️ ${tr('add_bin')}</button><p class="muted small">${tr('from_osm')}</p>` : ''}
    ${sample ? `<p class="muted small">${tr('sample_poi_note')}</p>` : ''}${trust(sample ? 'demo' : 'real', 'map')}${r.src === 'osm' ? `<small class="muted">OpenStreetMap</small>` : ''}`;
}

// ---------- live location ----------
let watchId = null;
function startLocation() {
  if (!navigator.geolocation || watchId !== null) return;
  watchId = navigator.geolocation.watchPosition(onFix, () => { watchId = null; }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
}
function onFix(p) {
  const first = !st.pos.real;
  const next = { lat: p.coords.latitude, lng: p.coords.longitude, real: true, acc: p.coords.accuracy };
  const moved = hav(st.pos, next) * 1000;
  st.pos = next;
  if (st.me) st.me.setPosition(next);
  if (!first && moved < 40) return;
  nearCache.clear(); st.addr = null; st.addrInfo = null;
  const v = view();
  if (v === 'map') { if (st.map) st.map.setCenter(next); runMapSearch(!!st.map && !st.gmFail); }
  else if (['home', 'nearby', 'sos', 'help'].includes(v)) render();
  if (st.overlay && st.overlay.isLoc) { st.overlay = locOverlay(); renderOverlay(); }
}
// ---------- address for the police: Japanese address + postal code from the current position ----------
const PREF_JA = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
const DIGIT_JA = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const addrCache = new Map();
async function osmAddress(lang) {
  const { lat, lng } = st.pos;
  const j = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}&addressdetails=1&zoom=18`)).json();
  return j.address || {};
}
function joinAddr(a, ja) {
  const iso = (a['ISO3166-2-lvl4'] || '').match(/^JP-(\d\d)$/);
  const prefName = ja && iso ? PREF_JA[+iso[1] - 1] : '';
  const road = a.road && !/;/.test(a.road) ? a.road : '';
  const raw = [prefName, a.province, a.state, a.city, a.town, a.village, a.city_district, a.administrative, a.suburb, a.neighbourhood, a.quarter, road, a.house_number];
  const parts = [];
  raw.filter(Boolean).forEach(x => { if (!parts.some(y => y.includes(x))) parts.push(x); });
  return ja ? parts.join(' ') : parts.reverse().join(', ');
}
async function googleAddress() {
  if (!API_KEY || st.geoOK === false) return null;
  const get = async lang => (await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${st.pos.lat},${st.pos.lng}&language=${lang}&key=${encodeURIComponent(API_KEY)}`)).json();
  const jj = await get('ja');
  if (jj.status !== 'OK') { st.geoOK = false; return null; }
  const r0 = jj.results[0], postal = (r0.address_components.find(c => c.types.includes('postal_code')) || {}).long_name || '';
  const ja = r0.formatted_address.replace(/^日本、\s*/, '').replace(/〒\d{3}-\d{4}\s*/, '');
  const en = (await get('en')).results[0];
  return { ja, en: en ? en.formatted_address : '', rj: en ? en.formatted_address.replace(/,?\s*Japan$/, '') : '', postal: postal.replace(/^〒/, '') };
}
async function addressInfo() {
  const key = `${st.pos.lat.toFixed(4)},${st.pos.lng.toFixed(4)}`;
  if (addrCache.has(key)) return addrCache.get(key);
  const p = (async () => {
    try {
      const g = await googleAddress();
      if (g) return g;
      const ja = await osmAddress('ja');
      await new Promise(r => setTimeout(r, 1100));   // Nominatim allows 1 request per second
      const en = await osmAddress('en');
      return { ja: joinAddr(ja, true), en: joinAddr(en, false) + (ja.postcode ? ' ' + ja.postcode : ''), rj: joinRomaji(ja, en), postal: ja.postcode || en.postcode || '' };
    } catch (err) { console.warn('Address lookup failed:', err.message || err); addrCache.delete(key); return null; }
  })();
  addrCache.set(key, p);
  return p;
}
const postalSpoken = z => z.split(/[^0-9]+/).filter(Boolean).map(g => g.split('').map(d => DIGIT_JA[+d]).join(' ')).join(' の ');
const sayAddress = i => `助けてください。今、${i.ja.replace(/\s+/g, '')}にいます。${i.postal ? `郵便番号は、${postalSpoken(i.postal)}です。` : ''}`;
async function address() {   // short text for the Nearby page
  const i = await addressInfo();
  return i ? (st.lang === 'ja' || st.lang === 'hi' ? i.ja : (i.en || i.ja)) : '';
}
async function fillMyAddr() {
  if (!$('#myaddr')) return;
  const i = await addressInfo(), h = $('#myaddr'); if (!h) return;
  st.addrInfo = i;
  if (!i || (!i.ja && !i.postal)) { h.innerHTML = `<b>📍 ${tr('my_addr')}</b><small class="muted">${tr('addr_fail')}</small>`; return; }
  h.innerHTML = `<b>📍 ${tr('my_addr')}</b>${st.pos.real ? '' : `<small class="muted">(${tr('sample_loc')})</small>`}
    ${i.postal ? `<div class="postal"><small>${tr('postal')}</small> <b>〒${esc(i.postal)}</b></div>` : ''}
    <div class="addr-ja" lang="ja">${esc(i.ja)}</div>
    ${i.rj ? `<div class="romaji"><small>${tr('say_romaji')}</small><div class="ro-line">${esc(i.rj)}${i.postal ? ', ' + esc(i.postal) : ''}</div><div class="small">${esc(romajiSay(i))}</div></div>` : (i.en ? `<div class="small muted">${esc(i.en)}</div>` : '')}
    <div class="two"><button class="btn pri" data-a="readaddr">🔊 ${tr('read_police')}</button><button class="btn" data-a="myloc">📱 ${tr('show_big')}</button></div>
    <small class="muted">${tr('addr_note')}</small>`;
}
function locOverlay() {
  const url = `https://www.google.com/maps?q=${st.pos.lat},${st.pos.lng}`, i = st.addrInfo || null;
  const spoken = i && i.ja ? sayAddress(i) : '助けてください。今ここにいます。';
  return {
    isLoc: true, hi: 'たすけて ください。いま ここに います。', ja: '助けてください。今ここにいます。', src: tr('loc_text'), speak: spoken,
    extra: `<div class="ov-addr">${i && i.postal ? `<div class="ov-postal">〒${esc(i.postal)}</div>` : ''}${i && i.ja ? `<div class="ov-aja" lang="ja">${esc(i.ja)}</div>` : `<small>${tr('addr_wait')}</small>`}${i && i.rj ? `<div class="ov-ro">${esc(i.rj)}${i.postal ? ', ' + esc(i.postal) : ''}</div>` : (i && i.en ? `<small>${esc(i.en)}</small>` : '')}</div>
      <div class="ov-loc">📍 ${st.pos.lat.toFixed(5)}, ${st.pos.lng.toFixed(5)}${st.pos.real ? '' : ' (' + tr('sample_loc') + ')'}<br><a href="${url}" target="_blank" rel="noopener">${url}</a><br><button class="btn" data-a="copyloc">${tr('copy')}</button></div>`,
  };
}
const locBanner = () => (st.pos.real
  ? `<small class="ok">● ${tr('loc_ok')}${st.pos.acc ? ` (±${Math.round(st.pos.acc)} m)` : ''}</small>`
  : `<div class="notice"><small>${tr('using_sample')}</small><button class="btn" data-a="allowloc">${tr('allow_loc')}</button></div>`);

// ---------- near-you strips ----------
const NEAR_HOME = ['police', 'hospital', 'station', 'shop', 'toilet', 'trash'];
const NEAR_ALL = ['police', 'hospital', 'station', 'hotel', 'pharmacy', 'shop', 'toilet', 'atm', 'trash', 'charge', 'rental', 'locker'];
const nearStrip = () => `<div class="box near"><div class="row"><b>📍 ${tr('near_you')}</b><a class="more" href="#/nearby">${tr('see_all')} ›</a></div>${locBanner()}<div id="nearrows" class="nearrows"><small class="muted">${tr('loading')}</small></div></div>`;
function nearRow(type, p, big) {
  return `<div class="nrow ${big ? 'box' : ''}"><div class="ninfo"><b>${PLACE_TYPES[type].icon} ${tr('c_' + type)}</b><div class="small nm2">${esc(pname(p, type))}</div><div class="small muted">${walkLabel(p.km)}</div></div>
    <div class="nbtns">${p.pin ? `<button class="btn ico del" data-a="delbin" data-v="${p.pin}" aria-label="${tr('delete')}">${ICON.trash}</button>` : ''}<a class="btn go" target="_blank" rel="noopener" href="${dirUrl(p)}">${ICON.go}${tr('go')}</a><button class="btn ico" data-a="tomap" data-v="${type}" aria-label="${tr('map_btn')}" title="${tr('map_btn')}">${ICON.pin}</button></div></div>`;
}
async function fillNear(types, hostSel, big) {
  const host = $(hostSel); if (!host) return;
  // each category fills in as soon as its own search returns (trash via OpenStreetMap can be slow)
  host.innerHTML = types.map(t => `<div class="nslot" data-t="${t}"></div>`).join('');
  types.forEach(t => placesNear(t).then(r => {
    const slot = host.querySelector(`.nslot[data-t="${t}"]`);
    if (slot && host.isConnected && r.list[0]) slot.innerHTML = nearRow(t, r.list[0], big);
  }));
}
function sightsNear() {
  const list = SPOTS.map(s => ({ ...s, km: hav(st.pos, s) })).sort((a, b) => a.km - b.km).slice(0, 4);
  return list.map(s => `<div class="box row sightrow" data-a="opensp" data-v="${s.id}">${phSlot(s.id, 'thumb')}<div class="grow"><b>${esc(nm(s))}</b><div class="small muted">${fmtDist(s.km)}</div></div><a class="btn go" target="_blank" rel="noopener" href="${dirUrl(s, 'transit')}">${ICON.go}${tr('go')}</a></div>`).join('');
}

// ---------- extra views ----------
VIEWS.nearby = () => `${trust('real', 'map')}${locBanner()}<div class="box fill small" id="addr">📍 ${st.pos.lat.toFixed(4)}, ${st.pos.lng.toFixed(4)}</div>
  <div id="nearlist" class="nearlist"><small class="muted">${tr('loading')}</small></div>
  <h3>${tr('sights_near')}</h3>${sightsNear()}
  <button class="btn" data-a="addbin">🗑️ ${tr('add_bin')}</button><p class="muted small">${tr('from_osm')}</p>`;

VIEWS.help = () => {
  if (!st.help) {
    return `<h2 class="q">${tr('help_q')}</h2>${HELP.map(h => `<button class="btn big helpopt" data-a="hopt" data-v="${h.id}"><span>${h.ic}</span> ${tr('h_' + h.id)}</button>`).join('')}
      <div class="two"><a class="btn sos" href="tel:110">🚓 110</a><a class="btn sos" href="tel:119">🚑 119</a></div>`;
  }
  const h = HELP.find(x => x.id === st.help);
  return `<button class="chip" data-a="hback">← ${tr('h_' + h.id)}</button>
    ${h.tels.length ? `<div class="two">${h.tels.map(n => `<a class="btn sos" href="tel:${n}">📞 ${n.length === 3 ? n : EMERGENCY.find(e => e.tel === n).num}</a>`).join('')}</div>` : ''}
    ${h.poi ? `<h3>${tr('step_near')}</h3><div id="helpnear" class="nearlist"><small class="muted">${tr('loading')}</small></div>` : ''}
    ${h.listen ? `<a class="btn pri" href="#/listen">🎧 ${tr('listen')} — ${tr('listen_sub')}</a>` : ''}
    <h3>${tr('step_phr')}</h3>${h.phrases.map(id => phraseCard(PHRASES.find(p => p.id === id))).join('')}`;
};

VIEWS.listen = () => {
  const l = st.listen || { state: 'idle' };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let out = '';
  if (l.state === 'listening') out = `<div class="scan"><div class="spin"></div>${tr('listening')}</div>`;
  else if (l.state === 'err') out = `<p class="muted">${tr('mic_denied')}</p>`;
  else if (l.state === 'done') {
    out = `<div class="box"><small class="muted">${tr('heard')}</small><div class="big" lang="ja">${esc(l.text)}</div></div>` +
      (l.matches.length ? l.matches.map(e => `<div class="box fill"><div class="big" lang="ja">${esc(e.ja)}</div><b>→ ${esc(e.n[L()])}</b></div>`).join('') : `<p class="muted">${tr('no_match')}</p>`);
  }
  return `${trust('voice', 'demo')}
    ${SR ? `<button class="btn pri big micbig" data-a="listenmic">🎤 ${tr('tap_speak')}</button>` : `<p class="muted">${tr('listen_nosup')}</p>`}
    <div id="listenout">${out}</div>
    <h3>${tr('cat_answer')}</h3><div class="chips">${PHRASES.filter(p => p.cat === 'answer').map(p => `<button class="chip" data-a="staff" data-v="${p.id}">${esc(pick(p))}</button>`).join('')}</div>
    <p class="muted small">${tr('listen_note')}</p>${noteConfirm()}`;
};
const normJa = s => s.replace(/[\s、。，,.!?！？]/g, '');
function runListen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  const r = new SR(); r.lang = 'ja-JP'; r.interimResults = false; r.maxAlternatives = 1;
  st.listen = { state: 'listening' }; render();
  let got = false;
  r.onresult = ev => {
    got = true;
    const text = ev.results[0][0].transcript, n = normJa(text);
    const matches = LISTEN_DICT.filter(e => n.includes(normJa(e.ja)) || n.includes(e.hi) || (n.length >= 3 && normJa(e.ja).includes(n)));
    st.listen = { state: 'done', text, matches };
  };
  r.onerror = () => { st.listen = { state: 'err' }; };
  r.onend = () => { if (!got && st.listen.state === 'listening') st.listen = { state: 'err' }; if (view() === 'listen') render(); };
  try { r.start(); } catch { st.listen = { state: 'err' }; render(); }
}

VIEWS.tips = () => `<p class="muted">${tr('tips_sub')}</p>${TIPS.map(([ic, tx]) => `<div class="box row tip"><span class="ic">${ic}</span><div>${esc(tx[L()])}</div></div>`).join('')}`;

AFTER.home = () => { fillNear(NEAR_HOME, '#nearrows', false); fillWeatherHome(); };
AFTER.nearby = () => {
  fillNear(NEAR_ALL, '#nearlist', true);
  address().then(a => { const el = $('#addr'); if (el && a) el.innerHTML = `📍 ${tr('you_near')}: <b>${esc(a)}</b>`; });
};
AFTER.help = () => { if (st.help) { const h = HELP.find(x => x.id === st.help); if (h.poi) fillNear([h.poi], '#helpnear', true); } };
AFTER.sos = () => { startLocation(); fillMyAddr(); };
AFTER.plan = () => { loadRates(); fillPlanWeather(); };
AFTER.fare = () => { fillFare(); };
AFTER.wait = () => { loadWaitData(); };

VIEWS.profile = () => {
  const p = st.prefs;
  return `<p class="muted">${tr('profile_sub')}</p>
    <b>${tr('my_allergies')}</b>
    <div class="chips">${ALLERGENS.map(a => `<button class="chip ${p.allergens.includes(a) ? 'on' : ''}" data-a="ptoggle" data-k="allergens" data-v="${a}">${tr('a_' + a)}</button>`).join('')}</div>
    <button class="btn pri big" data-a="acard">🗣 ${tr('allergy_card')}</button>
    <a class="btn" href="#/menu">📷 ${tr('menu')}</a>
    <b>${tr('my_diet')}</b>
    <div class="chips">${DIETS.map(d => `<button class="chip ${p.diets.includes(d) ? 'on' : ''}" data-a="ptoggle" data-k="diets" data-v="${d}">${PLACE_TYPES[d].icon} ${tr('c_' + d)}</button>`).join('')}</div>
    ${p.diets.map(d => `<button class="btn" data-a="tomap" data-v="${d}">${PLACE_TYPES[d].icon} ${tr('c_' + d)} · ${tr('map')}</button>`).join('')}
    ${p.diets.includes('hindu') ? `<p class="muted small">${tr('hindu_note')}</p>` : ''}
    <p class="muted small">${tr('diet_note')}</p><p class="muted small">${tr('saved_auto')}</p>${noteConfirm()}`;
};
function allergyCard() {
  const keys = st.prefs.allergens;
  if (!keys.length) return null;
  const ja = keys.map(k => ALLERGEN_JA[k][0]).join('、'), hi = keys.map(k => ALLERGEN_JA[k][1]).join('、');
  return {
    hi: `わたしは ${hi}の あれるぎーが あります。${hi}は はいって いますか？`,
    ja: `私は${ja}のアレルギーがあります。${ja}は入っていますか？`,
    src: `${tr('my_allergies')}: ${keys.map(k => tr('a_' + k)).join(', ')}`,
    speak: `私は${ja}のアレルギーがあります。${ja}は入っていますか？`,
  };
}
function searchAll(raw) {
  const q = raw.trim().toLowerCase();
  if (q.length < 2) return [];
  const nrm = t => String(t).toLowerCase().replace(/[\s\-_.'’・]/g, '');
  const nq = nrm(q);
  const has = arr => arr.some(x => nrm(x).includes(nq));
  const out = [];
  if (on('map')) Object.keys(PLACE_TYPES).forEach(t => { if (has([...(S['c_' + t] || []), PLACE_TYPES[t].q])) out.push({ ic: PLACE_TYPES[t].icon, label: tr('c_' + t), sub: tr('map'), act: 'tomap', v: t }); });
  FEATURES.forEach(([v, k]) => { if ((v === 'help' || v === 'sos' || on(v === 'nearby' ? 'near' : v)) && has(S[k])) out.push({ ic: '➡️', label: tr(k), sub: '', act: 'nav', v }); });
  (on('phrases') ? PHRASES : []).filter(p => has([p.en, p.np, p.ja, p.hi, p.ro])).slice(0, 3).forEach(p => out.push({ ic: '💬', label: pick(p), sub: p.ja, act: 'staff', v: p.id }));
  SPOTS.filter(s => has([s.en, s.ja, s.hi, ...s.keys])).slice(0, 2).forEach(s => out.push({ ic: '⛩', label: nm(s), sub: fmtDist(hav(st.pos, s)), act: 'spot', v: s.id }));
  return out.slice(0, 8);
}
document.addEventListener('input', e => {
  if (e.target.dataset.c !== 'gsearch') return;
  const res = searchAll(e.target.value), host = $('#gres');
  if (!host) return;
  host.innerHTML = e.target.value.trim().length < 2 ? '' : res.length
    ? res.map(r => `<button class="gr" data-a="${r.act}" data-v="${esc(r.v)}"><span>${r.ic}</span><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></button>`).join('')
    : `<div class="gr muted">${tr('no_results')}</div>`;
});

// ---------- dummy AI (keyword / intent scoring) ----------
const INTENTS = [
  { re: /police|koban|keisatsu|robber|theft|stolen|けいさつ|警察|交番|こうばん|प्रहरी|चोरी/, a: ['The nearest police station is shown on the map. In an emergency call 110. You can also show the "Call the police" phrase to anyone.', 'नजिकको प्रहरी चौकी नक्सामा देखिन्छ। आपत्कालमा ११० मा फोन गर्नुहोस्।', '近くの交番は地図に表示されます。緊急のときは110番に電話してください。', 'ちかくの こうばんは ちずに でます。きんきゅうの ときは 110ばんに でんわ して ください。'], act: [['c_police', 'map'], ['sos', 'sos']], pre: 'police' },
  { re: /hospital|ambulance|doctor|sick|ill|medicine|119|びょういん|病院|救急|きゅうきゅう|अस्पताल|बिरामी|एम्बुलेन्स/, a: ['For an ambulance or fire call 119. The map can show hospitals nearby.', 'एम्बुलेन्स वा दमकलका लागि ११९ मा फोन गर्नुहोस्। नक्सामा नजिकका अस्पताल हेर्न सकिन्छ।', '救急・消防は119番。地図で近くの病院も探せます。', 'きゅうきゅう・しょうぼうは 119ばん。ちずで ちかくの びょういんも さがせます。'], act: [['sos', 'sos'], ['c_hospital', 'map']], pre: 'hospital' },
  { re: /toilet|restroom|bathroom|wc|toire|トイレ|といれ|शौचालय/, a: ['Public toilets are in stations, parks and convenience stores. Check the map.', 'सार्वजनिक शौचालय स्टेशन, पार्क र कन्भिनियन्स स्टोरमा हुन्छन्। नक्सा हेर्नुहोस्।', 'トイレは駅・公園・コンビニにあります。地図で探せます。', 'といれは えき・こうえん・こんびにに あります。ちずで さがせます。'], act: [['c_toilet', 'map']], pre: 'toilet' },
  { re: /trash|garbage|rubbish|dust ?bin|litter|gomi|ごみ|ゴミ|फोहोर|डस्टबिन/, a: ['Trash bins are rare in Japan. Try convenience stores, stations and vending machines — or carry a small bag.', 'जापानमा फोहोर फाल्ने डस्टबिन कम हुन्छन्। कन्भिनियन्स स्टोर, स्टेशन वा भेन्डिङ मेसिन नजिक खोज्नुहोस्; सानो झोला साथ राख्नुहोस्।', 'ゴミ箱は少ないです。コンビニ・駅・自動販売機の近くを探すか、小さい袋を持ち歩きましょう。', 'ごみばこは すくないです。こんびに・えき・じどうはんばいきの ちかくを さがすか、ちいさい ふくろを もちあるきましょう。'], act: [['c_trash', 'map']], pre: 'trash' },
  { re: /food|eat|hungry|restaurant|dinner|lunch|ramen|sushi|menu|allerg|vegetarian|halal|たべ|食べ|ごはん|ご飯|メニュー|खाना|भोक|मेनु/, a: ['Hungry? Try ramen, sushi, okonomiyaki or a konbini onigiri. Use "Menu photo" to check allergens, and show the "I cannot eat pork" phrase if needed.', 'भोक लाग्यो? रामेन, सुसी, ओकोनोमियाकी वा कन्भिनीको ओनिगिरी खानुहोस्। एलर्जी हेर्न "मेनु फोटो" प्रयोग गर्नुहोस्।', 'おなかがすいたら、ラーメン・寿司・お好み焼き・コンビニのおにぎりがおすすめ。「メニュー写真」でアレルギーも確認できます。', 'おなかが すいたら、らーめん・おすし・おこのみやき・こんびにの おにぎりが おすすめ。「めにゅー しゃしん」で あれるぎーも わかります。'], act: [['menu', 'menu'], ['phrases', 'phrases']] },
  { re: /train|fare|taxi|subway|metro|bus|cost|price|how much|densha|電車|でんしゃ|料金|りょうきん|रेल|भाडा|ट्याक्सी/, a: ['Check a rough train / taxi price in "Fare estimate". For exact times use Google Maps transit.', '"भाडा अनुमान" मा रेल/ट्याक्सीको मोटामोटी भाडा हेर्नुहोस्।', '「料金の目安」で電車・タクシーのだいたいの料金が分かります。', '「りょうきんの めやす」で でんしゃ・たくしーの だいたいの りょうきんが わかります。'], act: [['fare', 'fare']] },
  { re: /wait|crowd|queue|line|busy|immigration|airport|こみ|混|待ち|まち|भीड|पर्ख|एयरपोर्ट/, a: ['See estimated crowds for airports and sights in "Wait times", with the best time to go.', '"पर्खने समय" मा एयरपोर्ट र पर्यटन स्थलको अनुमानित भीड र जाने उत्तम समय हेर्नुहोस्।', '「待ち時間」で空港や観光地の混み具合と、おすすめの時間が見られます。', '「まちじかん」で くうこうや かんこうちの こみぐあいと、おすすめの じかんが みられます。'], act: [['wait', 'wait']] },
  { re: /plan|itinerary|trip|schedule|route|day|プラン|ぷらん|予定|よてい|योजना|यात्रा/, a: ['Tell me your city, days and interests in "Trip plan" and I will build an itinerary.', '"यात्रा योजना" मा सहर, दिन र रुचि छान्नुहोस्; म योजना बनाउँछु।', '「旅行プラン」で都市・日数・興味をえらぶと、プランを作ります。', '「りょこう ぷらん」で とし・にっすう・きょうみを えらぶと、ぷらんを つくります。'], act: [['plan', 'plan']] },
  { re: /phrase|say|speak|japanese|language|translate|ことば|言葉|日本語|にほんご|वाक्य|बोल|भाषा/, a: ['Open "Phrases" for the most useful Japanese sentences. Tap "Show to staff" to show big hiragana text.', '"वाक्यांश" मा धेरै काम लाग्ने जापानी वाक्य छन्। "कर्मचारीलाई देखाउनुहोस्" थिच्नुहोस्।', '「フレーズ」でよく使う日本語が見られます。「スタッフに見せる」で大きく表示できます。', '「ふれーず」で よく つかう にほんごが みられます。「すたっふに みせる」で おおきく みせられます。'], act: [['phrases', 'phrases']] },
  { re: /recommend|suggest|where to go|what to see|best place|おすすめ|オススメ|どこ|सुझाव|कहाँ जाने/, a: null, suggest: true },
  { re: /thank|thanks|arigat|ありがとう|धन्यवाद/, a: ["You're welcome! Enjoy Japan!", 'स्वागत छ! जापान घुमेर रमाइलो गर्नुहोस्!', 'どういたしまして！日本を楽しんでください！', 'どういたしまして！にほんを たのしんで ください！'], act: [] },
  { re: /hello|hi\b|hey|konnichi|namaste|こんにちは|こんにちわ|नमस्ते/, a: ['Hello! How can I help you in Japan?', 'नमस्ते! जापानमा म कसरी मद्दत गरुँ?', 'こんにちは！何かお手伝いできますか？', 'こんにちは！なにか おてつだい できますか？'], act: [] },
];
const FALLBACK = ["Sorry, I don't know that yet (this is a demo). Try: a place name, police, toilet, food, train, wait times or plan.", 'माफ गर्नुहोस्, मलाई यो थाहा छैन (डेमो हो)। प्रयास गर्नुहोस्: ठाउँको नाम, प्रहरी, शौचालय, खाना, रेल, पर्खाइ वा योजना।', 'すみません、まだ分かりません（デモです）。場所の名前・警察・トイレ・食べ物・電車・待ち時間・プランなどを聞いてください。', 'すみません、まだ わかりません（でもです）。ばしょの なまえ・けいさつ・といれ・たべもの・でんしゃ・まちじかん・ぷらん などを きいて ください。'];

function aiReply(text) {
  const q = text.toLowerCase();
  const nq = q.replace(/[\s\-_.'’・]/g, '');
  const spot = SPOTS.find(s => s.keys.some(k => nq.includes(k.toLowerCase().replace(/[\s\-]/g, ''))) || nq.includes(s.en.toLowerCase().replace(/[\s\-]/g, '')));
  const actions = a => a.map(([k, v]) => ({ label: tr(k), view: v }));
  if (spot) {
    return { spot: spot.id, text: `${nm(spot)} — ${spot.d[L()]}`, actions: [{ label: tr('open_gmaps'), href: `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}` }, { label: tr('wait'), view: 'wait' }] };
  }
  const it = INTENTS.find(i => i.re.test(q));
  if (it && it.suggest) {
    const picks = SPOTS.filter(s => s.pop >= 4).sort(() => Math.random() - .5).slice(0, 3);
    return { text: picks.map(s => `• ${nm(s)} (${nm(CITIES.find(c => c.id === s.city))})`).join('\n'), actions: [{ label: tr('plan'), view: 'plan' }] };
  }
  if (it) {
    const out = { text: it.a[L()], actions: actions(it.act) };
    if (it.pre) { const n = nearest(it.pre, 1)[0]; if (n) out.text += `\n📍 ${nm(n)} · ${fmtDist(n.km)}`; }
    return out;
  }
  return { text: FALLBACK[L()], actions: actions([['phrases', 'phrases'], ['map', 'map'], ['plan', 'plan']]) };
}

function sendChat(text) {
  text = text.trim(); if (!text) return;
  st.chat.push({ me: true, text });
  const typing = { me: false, typing: true };
  st.chat.push(typing);
  render();
  setTimeout(() => {
    const r = aiReply(text);
    st.chat[st.chat.indexOf(typing)] = { me: false, text: r.text, actions: r.actions, spot: r.spot };
    if (view() === 'chat') render();
  }, 550);
}

// ---------- trust labels: what is real, what is an estimate, what is demo ----------
const TRUST_ICON = { book: '📅', real: '●', est: '≈', demo: '🧪', ai: '🤖', ocr: '👁', map: '🗺', voice: '🎤' };
const trust = (...ks) => `<div class="trusts">${ks.map(k => `<span class="trust t-${k}">${TRUST_ICON[k]} ${tr('tb_' + k)}</span>`).join('')}</div>`;
const noteConfirm = () => `<p class="muted small note">⚠ ${tr('note_confirm')}</p>`;

// ---------- exchange rates (open.er-api.com, free, no key) ----------
const rates = { data: store.get('rates', null) };
async function loadRates() {
  const d = rates.data;
  if (d && Date.now() - d.t < 12 * 3600e3) return d;
  try {
    const j = await (await fetch('https://open.er-api.com/v6/latest/JPY')).json();
    if (j.result === 'success') { rates.data = { t: Date.now(), r: j.rates, upd: j.time_last_update_utc }; store.set('rates', rates.data); }
  } catch { /* offline: keep the old rates */ }
  return rates.data;
}
const toCur = (yenAmt, cur) => { const d = rates.data; return d && d.r[cur] ? yenAmt * d.r[cur] : null; };
const fromCur = (amt, cur) => { if (cur === 'JPY') return amt; const d = rates.data; return d && d.r[cur] ? amt / d.r[cur] : null; };
const fmtCur = (v, cur) => `${cur} ${v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)}`;
const approxMoney = y => { const v = toCur(y, st.prefs.cur || 'NPR'); return v == null ? '' : ` ≈ ${fmtCur(v, st.prefs.cur || 'NPR')}`; };

// ---------- weather (Open-Meteo, free, no key) ----------
const WX = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '❄️', 77: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
const wxIcon = c => WX[c] || '🌡️';
const wxCache = new Map();
function weatherAt(lat, lng, days = 3) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${days}`, c = wxCache.get(key);
  if (c && Date.now() - c.t < 1800e3) return c.p;
  const p = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=${days}`)
    .then(r => r.json()).then(j => { if (!j.daily) { wxCache.delete(key); return null; } return j; }).catch(() => { wxCache.delete(key); return null; });
  wxCache.set(key, { t: Date.now(), p });
  return p;
}
const dayName = iso => new Date(iso + 'T00:00').toLocaleDateString(st.lang === 'np' ? 'ne-NP' : st.lang === 'en' ? 'en-US' : 'ja-JP', { weekday: 'short' });
async function fillWeatherHome() {
  const host = $('#wxhome'); if (!host) return;
  const j = await weatherAt(st.pos.lat, st.pos.lng, 3);
  const h = $('#wxhome'); if (!h || !j) return;
  h.innerHTML = `<div class="row"><b>${wxIcon(j.current.weather_code)} ${Math.round(j.current.temperature_2m)}°C</b><small class="muted">${tr('weather')} · Open-Meteo</small></div>
    <div class="wxdays">${j.daily.time.map((d, i) => `<div><small>${dayName(d)}</small><span>${wxIcon(j.daily.weather_code[i])}</span><small>${Math.round(j.daily.temperature_2m_max[i])}°/${Math.round(j.daily.temperature_2m_min[i])}°</small><small class="muted">${tr('rain')} ${j.daily.precipitation_probability_max[i]}%</small></div>`).join('')}</div>`;
}

// ---------- real routes: Google Routes API (walking and driving; Japan transit data is not available) ----------
const routeCache = new Map();
function routeInfo(a, b, mode) {
  if (!API_KEY || st.gmFail) return Promise.resolve(null);
  const key = `${mode}:${a.lat},${a.lng}>${b.lat},${b.lng}`;
  if (!routeCache.has(key)) {
    routeCache.set(key, fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters' },
      body: JSON.stringify({ origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } }, destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } }, travelMode: mode }),
    }).then(r => r.json()).then(j => { const r0 = j.routes && j.routes[0]; return r0 ? { km: r0.distanceMeters / 1000, min: Math.round(parseInt(r0.duration, 10) / 60) } : null; }).catch(() => null));
  }
  return routeCache.get(key);
}
const trainFare = km => Math.round((150 + km * 22) / 10) * 10;
const taxiFare = km => Math.round((500 + Math.max(0, km - 1.1) * 390) / 10) * 10;

// ---------- fare view ----------
VIEWS.fare = () => {
  const f = st.fare, a = SPOTS.find(s => s.id === f.from), b = SPOTS.find(s => s.id === f.to);
  const km = hav(a, b) * 1.25;
  const opts = id => SPOTS.map(s => `<option value="${s.id}" ${s.id === id ? 'selected' : ''}>${esc(nm(s))}</option>`).join('');
  const cur = st.prefs.cur || 'NPR';
  return `${trust('est', 'real')}
    <div class="box form">
      <label>${tr('from')}<select data-c="ffrom">${opts(f.from)}</select></label>
      <label>${tr('to')}<select data-c="fto">${opts(f.to)}</select></label></div>
    <div class="box fare" id="farebox">
      <div class="row"><span>🚃 <b>${tr('train_est')}</b></span><span><b>${yen(trainFare(km))}</b><small class="muted">${approxMoney(trainFare(km))}</small><br><small>~${Math.round(10 + km * 2.5)} ${tr('min')}</small></span></div>
      <div class="row"><span>🚕 <b>${tr('taxi_est')}</b></span><span id="taxiout"><b>${yen(taxiFare(km))}</b><small class="muted">${approxMoney(taxiFare(km))}</small><br><small>~${Math.round(5 + km * 3)} ${tr('min')}</small></span></div>
      <div class="row"><span>🚶 <b>${tr('real_walk')}</b></span><span id="walkout"><small>~${Math.round(km * 13)} ${tr('min')} · ${km.toFixed(1)} km</small></span></div></div>
    <a class="btn go" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=transit">${ICON.go}${tr('open_transit')}</a>
    <p class="muted small">${tr('estimate_note')}</p>
    <h3>${tr('money')}</h3>
    <div class="box form">
      <label>${tr('amount')}<input class="num-in" type="number" inputmode="decimal" min="0" data-c="cvamt" value="${st.cv.amt}"></label>
      <label>${tr('currency')}<select data-c="cur">${CURRENCIES.map(c => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <div id="cvout" class="cvout"></div></div>
    ${noteConfirm()}`;
};
Object.assign(S, {
  amount: ['Amount', 'रकम', '金額', 'きんがく'],
  currency: ['Currency', 'मुद्रा', '通貨', 'つうか'],
  food_style: ['Food style', 'खानाको शैली', '食事スタイル', 'しょくじ すたいる'],
  budget_in: ['Budget currency', 'बजेटको मुद्रा', '予算の通貨', 'よさんの つうか'],
});
function renderConverter() {
  const el = $('#cvout'); if (!el) return;
  const d = rates.data, cur = st.prefs.cur || 'NPR', amt = +st.cv.amt || 0;
  if (!d || !d.r[cur]) { el.innerHTML = `<small class="muted">${tr('rate_fail')}</small>`; return; }
  el.innerHTML = `<div>¥${amt.toLocaleString('en-US')} ≈ <b>${fmtCur(amt * d.r[cur], cur)}</b></div><div>${cur} ${amt.toLocaleString('en-US')} ≈ <b>${yen(amt / d.r[cur])}</b></div>
    <small class="muted">${tr('rate_note')} ${esc((d.upd || '').slice(0, 16))}</small>`;
}
async function fillFare() {
  const f = st.fare, a = SPOTS.find(s => s.id === f.from), b = SPOTS.find(s => s.id === f.to);
  loadRates().then(() => { renderConverter(); if (view() === 'fare') { const el = $('#farebox'); if (el) el.querySelectorAll('.muted').length || 0; } });
  renderConverter();
  const [walk, drive] = await Promise.all([routeInfo(a, b, 'WALK'), routeInfo(a, b, 'DRIVE')]);
  if (walk && $('#walkout')) $('#walkout').innerHTML = `<b>${walk.min} ${tr('min')}</b> · ${walk.km.toFixed(1)} km ${trust('real').replace('trusts', 'trusts inl')}`;
  if (drive && $('#taxiout')) $('#taxiout').innerHTML = `<b>${yen(taxiFare(drive.km))}</b><small class="muted">${approxMoney(taxiFare(drive.km))}</small><br><small>~${drive.min} ${tr('min')} · ${drive.km.toFixed(1)} km (${tr('real_drive')})</small>`;
}

// ---------- trip plan with money ----------
const budgetYen = () => { const p = st.plan; if (!p.total) return null; const v = fromCur(+p.total, p.curIn); return v == null ? null : v; };
function buildDays(pool) {
  const p = st.plan, ppl = p.people;
  const score = s => s.tags.filter(t => p.interests.includes(t)).length * 3 + s.pop;
  const left = pool.slice().sort((a, b) => score(b) - score(a));
  const per = Math.max(1, Math.min(4, Math.ceil(Math.min(left.length, p.days * 3) / p.days)));
  const days = [];
  for (let d = 0; d < p.days && left.length; d++) {
    const day = [left.shift()];
    while (day.length < per && left.length) {
      const last = day[day.length - 1];
      let bi = 0; left.forEach((s, i) => { if (hav(last, s) < hav(last, left[bi])) bi = i; });
      day.push(left.splice(bi, 1)[0]);
    }
    let clock = 9 * 60, fare = 0, fees = 0; const rows = [];
    day.forEach((s, i) => {
      if (i === 2 || (i === 1 && day.length === 2)) { rows.push({ time: clock, lunch: true }); clock += 60; }
      const prev = day[i - 1]; let trip = null;
      if (prev) { const km = hav(prev, s) * 1.25; trip = { km, fare: trainFare(km), min: Math.round(10 + km * 2.5) }; clock += trip.min; fare += trip.fare * ppl; }
      fees += s.fee * ppl;
      rows.push({ time: clock, spot: s, trip });
      clock += s.mins;
    });
    days.push({ rows, fare, fees, food: FOOD_PER_DAY[p.budget] * ppl, spots: day });
  }
  return days;
}
function makePlan() {
  const p = st.plan, limit = budgetYen();
  let pool = SPOTS.filter(s => s.city === p.city), days = buildDays(pool), trimmed = false;
  const total = ds => ds.reduce((a, d) => a + d.fees + d.fare + d.food, 0);
  while (limit != null && total(days) > limit) {
    const paid = pool.filter(s => s.fee > 0).sort((a, b) => b.fee - a.fee);
    if (!paid.length) break;
    pool = pool.filter(s => s !== paid[0]); trimmed = true; days = buildDays(pool);
  }
  p.result = { days, trimmed, limit, total: total(days) };
}
const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function planHtml(res) {
  const days = res.days;
  if (!days.length) return `<p class="muted">${tr('nothing')}</p>`;
  const sum = k => days.reduce((a, d) => a + d[k], 0), line = (label, y) => `<div class="row"><span>${label}</span><span><b>${yen(y)}</b><small class="muted">${approxMoney(y)}</small></span></div>`;
  const status = res.limit == null ? '' : res.total <= res.limit
    ? `<div class="okbox">✓ ${tr('within')} (${yen(res.limit)})</div>`
    : `<div class="warnbox">⚠ ${tr('over')} ${yen(res.total - res.limit)}${approxMoney(res.total - res.limit)}</div>`;
  return days.map((d, i) => {
    const s = d.spots, wp = s.slice(1, -1).map(x => `${x.lat},${x.lng}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${s[0].lat},${s[0].lng}&destination=${s[s.length - 1].lat},${s[s.length - 1].lng}${wp ? '&waypoints=' + encodeURIComponent(wp) : ''}&travelmode=transit`;
    return `<div class="box day"><div class="row"><b>${st.lang === 'ja' || st.lang === 'hi' ? `${i + 1}${tr('day')}` : `${tr('day')} ${i + 1}`}</b><span class="wxday" data-i="${i}"></span></div>
      ${d.rows.map(r => r.lunch ? `<div class="stop lunch"><time>${hm(r.time)}</time><div>🍜 ${tr('lunch')} <small>${tr('lunch_hint')}</small></div></div>` :
        `${r.trip ? `<div class="leg">🚃 ${yen(r.trip.fare)} · ~${r.trip.min} ${tr('min')}</div>` : ''}
        <div class="stop"><time>${hm(r.time)}</time><div class="grow">${phSlot(r.spot.id, 'wide')}<b>${esc(nm(r.spot))}</b><small>${r.spot.d[L()]}</small><small>⏱ ${r.spot.mins} ${tr('min')} · ${r.spot.fee ? yen(r.spot.fee) : tr('free')}</small></div></div>`).join('')}
      <small class="muted">${tr('cost_fees')} ${yen(d.fees)} · ${tr('cost_transit')} ${yen(d.fare)} · ${tr('cost_food')} ${yen(d.food)}</small>
      <a class="btn go" target="_blank" rel="noopener" href="${url}">${ICON.go}${tr('show_route')}</a></div>`;
  }).join('') + `<div class="box fill"><b>${tr('cost_total')} · ${st.plan.people} ${tr('people')}</b>
      ${line(tr('cost_fees'), sum('fees'))}${line(tr('cost_transit'), sum('fare'))}${line(tr('cost_food'), sum('food'))}
      <div class="row tot"><b>${tr('cost_total')}</b><span><b>${yen(res.total)}</b><small class="muted">${approxMoney(res.total)}</small></span></div>
      ${status}${res.trimmed ? `<small>${tr('trimmed')}</small>` : ''}
      <small class="muted">${tr('fee_note')} ${tr('estimate_note')}</small>
      ${rates.data ? `<small class="muted">${tr('rate_note')} ${esc((rates.data.upd || '').slice(0, 16))}</small>` : ''}</div>${noteConfirm()}`;
}
VIEWS.plan = () => {
  const p = st.plan, cur = st.prefs.cur || 'NPR';
  return `${trust('est', 'real')}
    <div class="box form">
      <label>${tr('city')}<select data-c="pcity">${CITIES.map(c => `<option value="${c.id}" ${c.id === p.city ? 'selected' : ''}>${nm(c)}</option>`).join('')}</select></label>
      <label>${tr('days')}<select data-c="pdays">${[1, 2, 3].map(n => `<option ${n === p.days ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>${tr('people')}<select data-c="ppeople">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n === p.people ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>${tr('food_style')}<select data-c="pbudget">${[[0, '¥'], [1, '¥¥'], [2, '¥¥¥']].map(([v, s]) => `<option value="${v}" ${v === p.budget ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>${tr('total_budget').replace('（円）', '').replace(' (¥)', '')}<span class="inl"><input class="num-in" type="number" inputmode="numeric" min="0" step="1000" data-c="ptotal" placeholder="${tr('no_limit')}" value="${p.total || ''}">
        <select data-c="pcurin">${['JPY', ...CURRENCIES].map(c => `<option ${c === p.curIn ? 'selected' : ''}>${c}</option>`).join('')}</select></span></label>
      <label>${tr('currency')}<select data-c="cur">${CURRENCIES.map(c => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    </div>
    <b>${tr('interests')}</b>
    <div class="chips">${INTERESTS.map(i => `<button class="chip ${p.interests.includes(i) ? 'on' : ''}" data-a="pint" data-v="${i}">${tr('i_' + i)}</button>`).join('')}</div>
    <button class="btn pri big" data-a="mkplan">🧭 ${tr('create_plan')}</button>
    ${p.result ? planHtml(p.result) : noteConfirm()}`;
};
async function fillPlanWeather() {
  const p = st.plan; if (!p.result) return;
  const c = CITIES.find(x => x.id === p.city), j = await weatherAt(c.lat, c.lng, Math.min(16, p.days));
  if (!j) return;
  document.querySelectorAll('.wxday').forEach(el => {
    const i = +el.dataset.i; if (j.daily.time[i] == null) return;
    el.innerHTML = `${wxIcon(j.daily.weather_code[i])} ${Math.round(j.daily.temperature_2m_max[i])}°/${Math.round(j.daily.temperature_2m_min[i])}° · ${tr('rain')} ${j.daily.precipitation_probability_max[i]}%`;
  });
}

// ---------- menu: real on-device OCR (Tesseract.js) + sample demo ----------
let tessPromise = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!tessPromise) {
    tessPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = res; s.onerror = () => { tessPromise = null; rej(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  return tessPromise;
}
function toCanvas(file, max) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c);
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}
async function runOcr(file) {
  const m = st.menu; m.items = null; m.ocr = null; m.ocrErr = false; m.ocrBusy = true; m.prog = 0; render();
  try {
    await loadTesseract();
    const canvas = await toCanvas(file, 1600);
    const { data } = await Tesseract.recognize(canvas, 'jpn', {
      langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/jpn/4.0.0_best_int',
      logger: ev => { if (ev.status === 'recognizing text') { m.prog = Math.round(ev.progress * 100); const el = $('#ocrprog'); if (el) el.textContent = m.prog + '%'; } },
    });
    m.ocr = analyseMenuText(data.text || '');
  } catch (err) { console.warn('OCR failed', err); m.ocrErr = true; }
  m.ocrBusy = false; if (view() === 'menu') render();
}
function analyseMenuText(text) {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.replace(/\s/g, '').length >= 2);
  const dishes = [];
  lines.forEach(line => {
    const flat = line.replace(/\s+/g, '');
    const hits = KEYWORDS.filter(k => k.k.some(w => flat.includes(w)));
    if (!hits.length) return;
    const main = hits.slice().sort((a, b) => Math.max(...b.k.map(w => flat.includes(w) ? w.length : 0)) - Math.max(...a.k.map(w => flat.includes(w) ? w.length : 0)))[0];
    const price = (flat.match(/[¥￥]?(\d{3,5})円?/) || [])[1];
    dishes.push({ line, main, al: [...new Set(hits.flatMap(h => h.al))], price: price ? +price : null });
  });
  const flatAll = text.replace(/\s+/g, '');
  const words = ALLERGENS.filter(a => ALLERGEN_JA[a].some(w => flatAll.includes(w.replace(/（.*）/, ''))));
  return { lines, dishes, words };
}
const gtUrl = text => `https://translate.google.com/?sl=ja&tl=${st.lang === 'np' ? 'ne' : st.lang === 'en' ? 'en' : 'ja'}&text=${encodeURIComponent(text.slice(0, 1500))}&op=translate`;
function ocrHtml(o) {
  if (!o.lines.length) return `<p class="muted">${tr('ocr_none')}</p>`;
  const mine = al => al.filter(a => st.prefs.allergens.includes(a));
  const nameOf = d => (st.lang === 'ja' || st.lang === 'hi') ? d.main.k[0] : d.main.n[st.lang === 'np' ? 1 : 0];
  return `${o.words.length ? `<div class="box ${mine(o.words).length ? 'danger' : 'fill'}"><b>${tr('allergen_words')}</b><div>${o.words.map(a => `<span class="al ${st.prefs.allergens.includes(a) ? 'warn' : ''}">${tr('a_' + a)}</span>`).join('')}</div>${mine(o.words).length ? `<div class="alert">⚠ ${tr('your_allergen_here')}</div>` : ''}</div>` : ''}
    ${o.dishes.length ? `<h3>${tr('ocr_found')}</h3><p class="muted small">${tr('guess_note')}</p>` + o.dishes.map(d => {
      const bad = mine(d.al);
      return `<div class="box dish ${bad.length ? 'danger' : ''}">${bad.length ? `<div class="alert">⚠ ${tr('you_allergic')}: ${bad.map(a => tr('a_' + a)).join(', ')}</div>` : ''}
        <div class="row"><div><div class="big" lang="ja">${esc(d.line)}</div></div>${d.price ? `<b>${yen(d.price)}</b>` : ''}</div><div>→ <b>${esc(nameOf(d))}</b></div>
        <div>${d.al.length ? `<small>${tr('contains')}:</small> ` + d.al.map(a => `<span class="al ${['pork', 'alcohol'].includes(a) ? 'warn' : ''}">${tr('a_' + a)}</span>`).join('') : ''}</div></div>`;
    }).join('') : ''}
    <div class="box"><b>${tr('ocr_raw')}</b><div class="rawtext" lang="ja">${o.lines.map(esc).join('<br>')}</div>
      <a class="btn go" target="_blank" rel="noopener" href="${gtUrl(o.lines.join('\n'))}">${ICON.go}${tr('translate_g')}</a></div>`;
}
VIEWS.menu = () => {
  const m = st.menu, menu = MENUS[m.idx];
  const paper = m.img ? `<img class="photo" src="${m.img}" alt="menu photo">` :
    `<div class="paper">${menu.items.map(id => `<div><span lang="ja">${DISHES[id].ja}</span><i>${yen(DISHES[id].price)}</i></div>`).join('')}</div>`;
  let items = '';
  if (m.ocrBusy) items = `<div class="scan"><div class="spin"></div><span>${tr('ocr_run')} <b id="ocrprog">${m.prog || 0}%</b></span></div>`;
  else if (m.ocrErr) items = `<p class="muted">${tr('ocr_fail')}</p>`;
  else if (m.ocr) items = ocrHtml(m.ocr);
  else if (m.scanning) items = `<div class="scan"><div class="spin"></div>${tr('scanning')}</div>`;
  else if (m.items) {
    const fl = m.filter;
    const mine = d => d.al.filter(a => st.prefs.allergens.includes(a));
    const ok = d => fl === 'all' || (fl === 'safe' && !mine(d).length) || (fl === 'veg' && !d.al.some(a => ['pork', 'beef', 'chicken', 'fish', 'shrimp'].includes(a))) ||
      (fl === 'halal' && !d.al.some(a => a === 'pork' || a === 'alcohol')) || (fl === 'hindu' && !d.al.includes('beef')) || (fl === 'nopork' && !d.al.includes('pork'));
    const fchips = (st.prefs.allergens.length ? ['safe'] : []).concat(['all', 'veg', 'halal', 'hindu', 'nopork']);
    items = `<span class="badge">${tr('demo')}</span><div class="chips">${fchips.map(f => `<button class="chip ${f === fl ? 'on' : ''}" data-a="mfilter" data-v="${f}">${tr('f_' + f)}</button>`).join('')}</div>` +
      m.items.map(id => DISHES[id]).filter(ok).map(d => {
        const id = m.items.find(k => DISHES[k] === d), bad = mine(d);
        const name = st.lang === 'ja' ? d.ja : st.lang === 'hi' ? d.hi : d.n[st.lang === 'np' ? 1 : 0];
        return `<div class="box dish ${bad.length ? 'danger' : ''}">${bad.length ? `<div class="alert">⚠ ${tr('you_allergic')}: ${bad.map(a => tr('a_' + a)).join(', ')}</div>` : ''}<div class="row"><div><div class="big" lang="ja">${d.ja}</div><small lang="ja">${d.hi}</small></div><b>${yen(d.price)}</b></div>
          <div>→ <b>${esc(name)}</b></div>
          <div>${d.al.length ? `<small>${tr('contains')}:</small> ` + d.al.map(a => `<span class="al ${['pork', 'alcohol'].includes(a) ? 'warn' : ''}">${tr('a_' + a)}</span>`).join('') : '<span class="al ok">✓</span>'}</div>
          <button class="btn" data-a="order" data-v="${id}">🗣 ${tr('order_this')}</button></div>`;
      }).join('');
  }
  return `${trust('ocr')}
    <div class="menuimg">${paper}</div>
    <div class="two">
      <label class="btn pri filebtn">📸 ${tr('take_photo')}<input type="file" accept="image/*" capture="environment" data-c="photo" hidden></label>
      <button class="btn" data-a="msample">${tr('sample_menu')} (${tr('demo')})</button></div>
    <a class="chip" href="#/profile">🥜 ${tr('profile')}${st.prefs.allergens.length ? ' (' + st.prefs.allergens.length + ')' : ''}</a>
    <div id="menuout">${items}</div>
    <p class="muted small">${tr('menu_note')}</p>${noteConfirm()}`;
};

// ---------- wait times: crowd estimate from real calendar, season and weather (not live queue counts) ----------
Object.assign(S, {
  wait_note: ['Estimated from Japan time, weekday, the national holiday list, season and weather. This is NOT a live queue count.', 'जापानको समय, बार, राष्ट्रिय बिदा, मौसम र ऋतुबाट अनुमान। यो लाइभ लाइन गणना होइन।', '日本時間・曜日・祝日・季節・天気からの推定です。実際の行列の人数ではありません。', 'にほん じかん・ようび・しゅくじつ・きせつ・てんきからの すいてい です。じっさいの ぎょうれつの にんずうでは ありません。'],
  wait_why: ['Why this estimate', 'यो अनुमान किन', 'この予想の理由', 'この よそうの りゆう'],
  w_weekend: ['Weekend', 'सप्ताहान्त', '週末', 'しゅうまつ'],
  w_holiday: ['Holiday', 'बिदा', '祝日', 'しゅくじつ'],
  w_rain: ['Rain likely: fewer outdoor visitors', 'वर्षा सम्भव: बाहिर कम आगन्तुक', '雨予報：屋外は少なめ', 'あめ よほう：おくがいは すくなめ'],
  w_newyear: ['New Year: shrines are very busy', 'नयाँ वर्ष: मन्दिरमा धेरै भीड', 'お正月：神社はとても混雑', 'おしょうがつ：じんじゃは とても こんざつ'],
  w_cherry: ['Cherry blossom season', 'चेरी ब्लसम सिजन', '桜の季節', 'さくらの きせつ'],
  w_gw: ['Golden Week', 'गोल्डेन वीक', 'ゴールデンウィーク', 'ごーるでん うぃーく'],
  w_obon: ['Obon holidays', 'ओबोन बिदा', 'お盆', 'おぼん'],
  w_autumn: ['Autumn leaves season', 'शरद ऋतुका पात', '紅葉の季節', 'こうようの きせつ'],
  w_hour: ['Busy time of day', 'दिनको व्यस्त समय', '混む時間帯', 'こむ じかんたい'],
  live_crowd: ['Live crowd: Google Maps (Popular times)', 'लाइभ भीड: गुगल म्याप (Popular times)', 'リアルタイムの混雑：Googleマップ', 'りあるたいむの こんざつ：ぐーぐる まっぷ'],
  official_site: ['Airport official site', 'एयरपोर्टको आधिकारिक साइट', '空港の公式サイト', 'くうこうの こうしき さいと'],
  vjw_tip: ['Tip: register on Visit Japan Web before you land to speed up immigration and customs.', 'सुझाव: अवतरण अघि Visit Japan Web मा दर्ता गर्नुहोस्, इमिग्रेसन र भन्सार छिटो हुन्छ।', 'ヒント：到着前にVisit Japan Webで登録すると入国審査と税関が早くなります。', 'ひんと：とうちゃくまえに Visit Japan Webで とうろく すると にゅうこくしんさと ぜいかんが はやく なります。'],
  japan_time: ['Japan time', 'जापानको समय', '日本時間', 'にほん じかん'],
});
const WAIT_GEO = {
  ntr1: { lat: 35.7647, lng: 140.3864, site: 'https://www.narita-airport.jp/en/' }, hnd: { lat: 35.5494, lng: 139.7798, site: 'https://tokyo-haneda.com/en/' },
  kix: { lat: 34.432, lng: 135.2304, site: 'https://www.kansai-airport.or.jp/en/' }, fuk: { lat: 33.5859, lng: 130.4507, site: 'https://www.fukuoka-airport.jp/en/' },
  cts: { lat: 42.7752, lng: 141.6923, site: 'https://www.new-chitose-airport.jp/en/' },
  w_senso: { lat: 35.7148, lng: 139.7967, shrine: true }, w_fushimi: { lat: 34.9671, lng: 135.7727, shrine: true, kyoto: true }, w_kinkaku: { lat: 35.0394, lng: 135.7292, kyoto: true },
  w_shibuya: { lat: 35.6585, lng: 139.7013 }, w_skytree: { lat: 35.7101, lng: 139.8107 },
};
WAIT_PLACES.forEach(p => Object.assign(p, WAIT_GEO[p.id]));

// Japan time, regardless of the phone's time zone
function tokyoNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), iso: `${parts.year}-${parts.month}-${parts.day}` };
}
// official national holidays (holidays-jp.github.io, free): cached for a day
async function loadHolidays() {
  const c = store.get('holidays', null);
  if (c && Date.now() - c.t < 86400e3) { st.holidays = c.d; return; }
  try {
    const d = await (await fetch('https://holidays-jp.github.io/api/v1/date.json')).json();
    st.holidays = d; store.set('holidays', { t: Date.now(), d });
  } catch { st.holidays = c ? c.d : null; }
}
function seasonOf(p, T) {
  const md = T.m * 100 + T.d, air = p.kind === 'air';
  if (md >= 1229 || md <= 103) return { key: 'newyear', f: air ? 1.25 : p.shrine ? 1.6 : 1.2 };
  if (md >= 325 && md <= 410) return { key: 'cherry', f: air ? 1.1 : 1.3 };
  if (md >= 429 && md <= 506) return { key: 'gw', f: 1.25 };
  if (md >= 811 && md <= 816) return { key: 'obon', f: 1.15 };
  if (md >= 1110 && md <= 1205 && p.kyoto) return { key: 'autumn', f: 1.3 };
  return null;
}
function waitFactors(p, T) {
  const why = []; let f = 1;
  if (T.dow === 0 || T.dow === 6) { f *= p.kind === 'air' ? 1.1 : 1.2; why.push(['weekend', tr('w_weekend')]); }
  const hol = st.holidays && st.holidays[T.iso];
  if (hol) { f *= p.kind === 'air' ? 1.15 : 1.25; why.push(['holiday', `${tr('w_holiday')}: ${hol}`]); }
  const se = seasonOf(p, T);
  if (se) { f *= se.f; why.push([se.key, tr('w_' + se.key)]); }
  const rain = st.wxp && st.wxp[p.id];
  if (p.kind === 'sight' && rain >= 70) { f *= 0.8; why.push(['rain', `${tr('w_rain')} (${rain}%)`]); }
  return { f, why };
}
// airports differ in size, so they should not all show the same level at the same time
const WAIT_SCALE = { ntr1: 0.8, hnd: 0.7, kix: 0.8, fuk: 0.5, cts: 0.45 };
const waitLoad = (p, h, T) => Math.min(1, (PROFILE[p.kind][h] ?? 0) * (WAIT_SCALE[p.id] ?? 1) * waitFactors(p, T).f);

VIEWS.wait = () => {
  const w = st.wait, T = tokyoNow(), hr = T.h;
  const list = WAIT_PLACES.filter(p => p.group === w.group);
  const sel = WAIT_PLACES.find(p => p.id === w.sel) || list[0];
  const lvl = v => (v < .3 ? 0 : v < .6 ? 1 : v < .8 ? 2 : 3);
  const mins = (p, v) => Math.max(0, Math.round(v * p.max / 5) * 5);
  const hrs = []; for (let h = (sel.kind === 'air' ? 6 : 8); h <= (sel.kind === 'air' ? 23 : 19); h++) hrs.push(h);
  const best = hrs.reduce((a, h) => (waitLoad(sel, h, T) < waitLoad(sel, a, T) ? h : a), hrs[0]);
  const fx = waitFactors(sel, T);
  return `${trust('est')}
    <small class="muted">${tr('japan_time')}: ${String(hr).padStart(2, '0')}:00 · ${T.iso}</small>
    <div class="chips">${['air', 'sight'].map(g => `<button class="chip ${g === w.group ? 'on' : ''}" data-a="wgroup" data-v="${g}">${g === 'air' ? '✈️' : '⛩'} ${tr(g === 'air' ? 'airports' : 'sights')}</button>`).join('')}</div>
    ${w.group === 'air' ? `<div class="box fill"><small>💡 ${tr('vjw_tip')}</small><a class="btn" target="_blank" rel="noopener" href="https://vjw-lp.digital.go.jp/en/">Visit Japan Web ▸</a></div>` : ''}
    ${list.map(p => { const v = waitLoad(p, hr, T); return `<div class="box wait ${p.id === sel.id ? 'sel' : ''}" data-a="wsel" data-v="${p.id}">
      <div class="row"><b>${esc(nm(p))}</b><span class="lv l${lvl(v)}">${tr('lvl' + lvl(v))}</span></div>
      <div class="meter"><i class="l${lvl(v)}" style="width:${Math.round(v * 100)}%"></i></div>
      <small>${tr('now')}: ${p.kind === 'air' ? `~${mins(p, v)} ${tr('min')}` : `${tr('lvl' + lvl(v))}`}</small></div>`; }).join('')}
    <div class="box fill"><b>${tr('today_hours')} — ${esc(nm(sel))}</b>
      <div class="bars">${hrs.map(h => { const v = waitLoad(sel, h, T); return `<div class="b ${h === hr ? 'cur' : ''} ${h === best ? 'best' : ''}"><i class="l${lvl(v)}" style="height:${Math.max(6, Math.round(v * 100))}%"></i><small>${h}</small></div>`; }).join('')}</div>
      <p>⭐ ${tr('best_time')}: <b>${String(best).padStart(2, '0')}:00</b>${sel.kind === 'air' ? ` (~${mins(sel, waitLoad(sel, best, T))} ${tr('min')})` : ''}</p>
      <b class="small">${tr('wait_why')}</b>
      <div class="chips">${[['hour', tr('w_hour')], ...fx.why].map(([k, t]) => `<span class="chip why">${esc(t)}</span>`).join('')}</div>
      ${sel.site ? `<a class="btn" target="_blank" rel="noopener" href="${sel.site}">${tr('official_site')} ▸</a>` : ''}
      <a class="btn go" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sel.en)}">${ICON.go}${tr('live_crowd')}</a></div>
    <p class="muted small">${tr('wait_note')}</p>${noteConfirm()}`;
};
async function loadWaitData() {
  const key = st.wait.group;
  if (st.waitLoaded && st.waitLoaded[key]) return;
  (st.waitLoaded = st.waitLoaded || {})[key] = true;
  st.wxp = st.wxp || {};
  await Promise.all([loadHolidays(), ...WAIT_PLACES.filter(p => p.group === key).map(p => weatherAt(p.lat, p.lng, 1).then(j => { if (j) st.wxp[p.id] = j.daily.precipitation_probability_max[0]; }))]);
  if (view() === 'wait') render();
}

// ---------- settings: choose which features to show, text size, theme ----------
Object.assign(S, {
  settings: ['Settings', 'सेटिङ', '設定', 'せってい'],
  show_features: ['Show only what you need', 'आफूलाई चाहिने मात्र देखाउनुहोस्', '必要な機能だけ表示', 'ひつような きのうだけ ひょうじ'],
  always_on: ['SOS and "I need help" are always on.', 'SOS र "मलाई मद्दत चाहियो" सधैं खुला रहन्छन्।', 'SOSと「助けが必要です」は常に表示されます。', 'SOSと「たすけが ひつよう です」は いつも ひょうじ されます。'],
  presets: ['Quick presets', 'छिटो छनोट', 'おまかせ設定', 'おまかせ せってい'],
  preset_min: ['Minimal', 'न्यूनतम', '最小', 'さいしょう'],
  preset_food: ['Food & allergy', 'खाना र एलर्जी', '食事・アレルギー', 'しょくじ・あれるぎー'],
  preset_all: ['Everything', 'सबै', 'ぜんぶ', 'ぜんぶ'],
  text_size: ['Text size', 'अक्षरको साइज', '文字の大きさ', 'もじの おおきさ'],
  ts_s: ['Small', 'सानो', '小', 'ちいさい'],
  ts_m: ['Normal', 'सामान्य', '標準', 'ふつう'],
  ts_l: ['Large', 'ठूलो', '大', 'おおきい'],
  th_auto: ['Auto', 'स्वचालित', '自動', 'じどう'],
  th_light: ['Light', 'उज्यालो', 'ライト', 'らいと'],
  th_dark: ['Dark', 'अँध्यारो', 'ダーク', 'だーく'],
  reset_layout: ['Show everything again', 'सबै फेरि देखाउनुहोस्', 'ぜんぶ表示にもどす', 'ぜんぶ ひょうじに もどす'],
  clear_data: ['Delete my saved data', 'मेरो सुरक्षित डाटा मेट्नुहोस्', '保存したデータを削除', 'ほぞんした でーたを さくじょ'],
  clear_note: ['Removes allergies, pins, history and settings from this device.', 'यो उपकरणबाट एलर्जी, पिन, इतिहास र सेटिङ हटाउँछ।', 'この端末のアレルギー・ピン・履歴・設定を消します。', 'この たんまつの あれるぎー・ぴん・りれき・せっていを けします。'],
  cleared: ['Deleted', 'मेटियो', '削除しました', 'さくじょ しました'],
});
const TOGGLES = [['near', 'near_you', '📍'], ['weather', 'weather', '🌤️'], ['photos', 'sights_pop', '🏯'], ['map', 'map', '🗺️'], ['phrases', 'phrases', '💬'], ['listen', 'listen', '🎧'], ['menu', 'menu', '📷'], ['profile', 'profile', '🥜'], ['plan', 'plan', '🧭'], ['fare', 'fare', '🚃'], ['wait', 'wait', '⏱️'], ['tips', 'tips', '💡'], ['book', 'book', '📅'], ['chat', 'ai', '🤖']];
const PRESETS = { min: TOGGLES.map(t => t[0]).filter(id => !['map', 'phrases'].includes(id)), food: ['near', 'weather', 'photos', 'listen', 'plan', 'fare', 'wait', 'tips', 'chat'], all: [] };
const ZOOMS = [['s', 0.92], ['m', 1], ['l', 1.18]];
function applyZoom() { document.documentElement.style.setProperty('--zoom', st.prefs.zoom || 1); }
VIEWS.settings = () => `<h3>${tr('presets')}</h3>
  <div class="chips">${['min', 'food', 'all'].map(k => `<button class="chip" data-a="preset" data-v="${k}">${tr('preset_' + k)}</button>`).join('')}</div>
  <h3>${tr('show_features')}</h3><p class="muted small">${tr('always_on')}</p>
  <div class="box switches">${TOGGLES.map(([id, k, ic]) => `<label class="switch"><span>${ic} ${tr(k)}</span><input type="checkbox" data-c="feat" data-id="${id}" ${on(id) ? 'checked' : ''}><i></i></label>`).join('')}</div>
  <h3>${tr('text_size')}</h3>
  <div class="chips">${ZOOMS.map(([k, z]) => `<button class="chip ${(st.prefs.zoom || 1) === z ? 'on' : ''}" data-a="zoom" data-v="${z}">${tr('ts_' + k)}</button>`).join('')}</div>
  <h3>${tr('theme')}</h3>
  <div class="chips">${['auto', 'light', 'dark'].map(k => `<button class="chip ${st.theme === k ? 'on' : ''}" data-a="settheme" data-v="${k}">${tr('th_' + k)}</button>`).join('')}</div>
  <h3>${tr('credits')}</h3><a class="btn" href="#/credits">📷 ${tr('credits')}</a>
  <button class="btn del big" data-a="cleardata">🗑 ${tr('clear_data')}</button><p class="muted small">${tr('clear_note')}</p>`;

// ---------- romaji address (so it can be read out over the phone) ----------
function joinRomaji(ja, en) {
  const iso = (ja['ISO3166-2-lvl4'] || '').match(/^JP-(\d\d)$/);
  const out = [];
  const add = x => { if (x && !out.some(y => y.toLowerCase().includes(x.toLowerCase()))) out.push(x); };
  add(iso ? PREF_EN[+iso[1] - 1] : '');
  ['city', 'town', 'village', 'city_district', 'administrative', 'suburb', 'neighbourhood', 'quarter'].forEach(f => {
    const j = ja[f]; let x = en[f];
    if (!x) return;
    if (j && /区$/.test(j) && !/-ku$/i.test(x)) x = x.replace(/\s*(ward|city)$/i, '') + '-ku';
    else if (j && /市$/.test(j) && !/-shi$/i.test(x)) x = x.replace(/\s*city$/i, '') + '-shi';
    else if (j && /丁目$/.test(j)) x = x.replace(/\s(\d+)$/, ' $1-chome');
    add(x);
  });
  if (en.house_number) add(en.house_number);
  return out.join(', ');
}
const roPostal = z => z.split(/[^0-9]+/).filter(Boolean).map(g => g.split('').map(d => RO_NUM[+d]).join('-')).join(' no ');
const romajiSay = i => (i.rj ? `Tasukete kudasai. Ima, ${i.rj} ni imasu.${i.postal ? ` Yuubin bangou wa ${roPostal(i.postal)} desu.` : ''}` : '');
const ALLERGEN_RO = { egg: 'tamago', milk: 'gyuunyuu', wheat: 'komugi', buckwheat: 'soba', peanut: 'piinattsu', shrimp: 'ebi', crab: 'kani', fish: 'sakana', soy: 'daizu', sesame: 'goma', pork: 'butaniku', beef: 'gyuuniku', chicken: 'toriniku', alcohol: 'osake' };

// ---------- reservations: plan, phone script, calendar, show-to-staff (does not book for you) ----------
const bookDefaults = () => ({ place: '', spotId: '', date: '', time: '18:00', people: 2, name: '', note: '' });
st.bf = bookDefaults();
const bookings = () => store.get('bookings', []);
function bookScript(b) {
  const [, m, d] = b.date.split('-').map(Number), [hh, mm] = (b.time || '18:00').split(':').map(Number);
  const al = st.prefs.allergens || [];
  const jaAl = al.length ? `${al.map(k => ALLERGEN_JA[k][0]).join('、')}のアレルギーがあります。` : '';
  const roAl = al.length ? ` ${al.map(k => ALLERGEN_RO[k]).join(', ')} no arerugii ga arimasu.` : '';
  const when = `${m}月${d}日、${hh}時${mm === 30 ? '半' : mm ? mm + '分' : ''}`;
  const ja = `もしもし。予約をお願いします。${when}、${b.people}名です。お名前は${b.name || '〇〇'}です。${jaAl}空いていますか？`;
  const ro = `Moshi moshi. Yoyaku o onegai shimasu. ${RO_MONTH[m]}-gatsu ${roDay(d)}, ${roHour(hh)}${mm === 30 ? ' han' : mm ? ' ' + mm + '-pun' : ''}, ${RO_PEOPLE[b.people] || b.people + '-nin'} desu. Onamae wa ${b.name || '(your name)'} desu.${roAl} Aite imasu ka?`;
  return { ja, ro, when };
}
function icsFor(b) {
  const p = n => String(n).padStart(2, '0');
  const [y, m, d] = b.date.split('-').map(Number), [hh, mm] = (b.time || '18:00').split(':').map(Number);
  const start = `${y}${p(m)}${p(d)}T${p(hh)}${p(mm)}00`, end = `${y}${p(m)}${p(d)}T${p(Math.min(hh + 1, 23))}${p(hh >= 23 ? 59 : mm)}00`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Japan Travel//EN', 'BEGIN:VEVENT', `UID:${b.id}@japan-travel`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART;TZID=Asia/Tokyo:${start}`, `DTEND;TZID=Asia/Tokyo:${end}`, `SUMMARY:${b.place.replace(/[,;\n]/g, ' ')} (${b.people})`,
    `DESCRIPTION:${(b.conf ? 'Confirmation ' + b.conf + '. ' : '') + (b.note || '').replace(/[,;\n]/g, ' ')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function bookingCard(b) {
  const sp = b.spotId && SPOTS.find(s => s.id === b.spotId), site = sp && DETAILS[sp.id] && DETAILS[sp.id].site;
  const sc = bookScript(b), open = st.bkOpen === b.id;
  return `<div class="box booking"><div class="row"><b>${esc(b.place)}</b><span class="stat s-${b.status}">${tr('st_' + b.status)}</span></div>
    <div>📅 ${esc(b.date)} ${esc(b.time)} · ${b.people} ${tr('people')}${b.name ? ' · ' + esc(b.name) : ''}</div>
    ${b.note ? `<small class="muted">${esc(b.note)}</small>` : ''}
    <div class="two"><label class="mini">${tr('bk_status')}<select data-c="bstatus" data-id="${b.id}">${['planned', 'requested', 'confirmed'].map(s => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${tr('st_' + s)}</option>`).join('')}</select></label>
      <label class="mini">${tr('bk_conf')}<input class="num-in" type="text" data-c="bconf" data-id="${b.id}" value="${esc(b.conf || '')}"></label></div>
    <div class="two">${site ? `<a class="btn go" target="_blank" rel="noopener" href="${site}">${ICON.go}${tr('bk_site')}</a>` : ''}
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(b.place + ' reservation')}">🔎 ${tr('bk_search')}</a>
      <button class="btn" data-a="bics" data-v="${b.id}">📅 ${tr('bk_ics')}</button>
      <button class="btn" data-a="bshow" data-v="${b.id}">📱 ${tr('bk_show')}</button>
      <button class="btn" data-a="bphone" data-v="${b.id}">📞 ${tr('bk_phone')}</button>
      <button class="btn del" data-a="bdel" data-v="${b.id}">${ICON.trash} ${tr('delete')}</button></div>
    ${open ? `<div class="box fill"><div class="addr-ja" lang="ja">${esc(sc.ja)}</div><div class="ro-line">${esc(sc.ro)}</div><button class="btn pri" data-a="bspeak" data-v="${b.id}">🔊 ${tr('read_aloud')}</button></div>` : ''}</div>`;
}
VIEWS.book = () => {
  const f = st.bf, today = new Date().toISOString().slice(0, 10), list = bookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return `${trust('book')}<p class="muted small">${tr('bk_note_real')}</p>
    <div class="box form"><b>${tr('bk_new')}</b>
      <label class="col">${tr('bk_place')}<input class="txt" data-c="bf" data-k="place" value="${esc(f.place)}"></label>
      <div class="two"><label class="col">${tr('bk_date')}<input class="txt" type="date" min="${today}" data-c="bf" data-k="date" value="${esc(f.date)}"></label>
      <label class="col">${tr('bk_time')}<input class="txt" type="time" data-c="bf" data-k="time" value="${esc(f.time)}"></label></div>
      <div class="two"><label class="col">${tr('bk_people')}<select data-c="bf" data-k="people">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option ${n === +f.people ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="col">${tr('bk_name')}<input class="txt" data-c="bf" data-k="name" value="${esc(f.name)}"></label></div>
      <label class="col">${tr('bk_note')}<input class="txt" data-c="bf" data-k="note" value="${esc(f.note)}"></label>
      <button class="btn pri big" data-a="bsave">${tr('bk_save')}</button></div>
    <h3>${tr('book')}</h3>${list.length ? list.map(bookingCard).join('') : `<p class="muted">${tr('bk_empty')}</p>`}${noteConfirm()}`;
};

// ---------- sight detail page ----------
VIEWS.spot = () => {
  const s = SPOTS.find(x => x.id === st.spotId) || SPOTS[0], d = DETAILS[s.id] || {};
  const ac = d.ac ? d.ac[st.lang === 'ja' ? 1 : st.lang === 'hi' ? 2 : 0] : '', rsKey = { none: 'rs_none', rec: 'rs_rec', req: 'rs_req' }[d.rs || 'none'];
  const km = hav(st.pos, s);
  return `${phSlot(s.id, 'wide')}
    <h2 class="sp-h">${esc(nm(s))}</h2><div class="muted">${esc(nm(CITIES.find(c => c.id === s.city)))} · ${fmtDist(km)}</div>
    ${trust('est')}<p>${esc(s.d[L()])}</p>
    <div class="box kvs">
      ${d.h ? `<div class="kv"><b>🕒 ${tr('sp_hours')}</b><span>${esc(d.h)}</span></div>` : ''}
      <div class="kv"><b>🎫 ${tr('sp_fee')}</b><span>${s.fee ? yen(s.fee) + approxMoney(s.fee) : tr('free_entry')}</span></div>
      <div class="kv"><b>📅 ${tr('sp_reserve')}</b><span>${tr(rsKey)}</span></div>
      ${ac ? `<div class="kv"><b>🚉 ${tr('sp_access')}</b><span>${esc(ac)}</span></div>` : ''}
      ${d.t ? `<div class="kv"><b>💡 ${tr('sp_tip')}</b><span>${esc(d.t[L()])}</span></div>` : ''}
    </div>
    <div class="two"><a class="btn go" target="_blank" rel="noopener" href="${dirUrl(s, 'transit')}">${ICON.go}${tr('sp_dir')}</a>
      ${d.site ? `<a class="btn" target="_blank" rel="noopener" href="${d.site}">${tr('bk_site')} ▸</a>` : ''}</div>
    ${on('book') ? `<button class="btn pri big" data-a="bookspot" data-v="${s.id}">📅 ${tr('sp_book')}</button>` : ''}
    <p class="muted small">${tr('sp_verify')}</p>${noteConfirm()}`;
};
document.addEventListener('input', e => {
  if (e.target.dataset.c === 'bf') st.bf[e.target.dataset.k] = e.target.value;
});

// ---------- photos (Wikimedia Commons, free licences, cached on the device) ----------
const photoCache = store.get('photos', {}), photoPending = {};
const plain = h => new DOMParser().parseFromString(h || '', 'text/html').body.textContent.trim();
async function fetchPhoto(title) {
  const w = await (await fetch(`https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}&format=json&origin=*`)).json();
  const page = Object.values(w.query.pages)[0];
  if (!page || !page.pageimage) return null;
  const c = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + page.pageimage)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=640&format=json&origin=*`)).json();
  const ii = (Object.values(c.query.pages)[0].imageinfo || [])[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  return { url: ii.thumburl || ii.url, page: ii.descriptionurl, artist: plain(m.Artist && m.Artist.value) || 'Unknown', license: plain(m.LicenseShortName && m.LicenseShortName.value) };
}
function spotPhoto(id) {
  if (id in photoCache) return Promise.resolve(photoCache[id]);
  const s = SPOTS.find(x => x.id === id);
  if (!s || !s.wiki) return Promise.resolve(null);
  if (!photoPending[id]) {
    photoPending[id] = fetchPhoto(s.wiki).then(v => { photoCache[id] = v; store.set('photos', photoCache); return v; }).catch(() => null);
  }
  return photoPending[id];
}
const phSlot = (id, cls) => `<figure class="phslot ${cls}" data-spot="${id}"></figure>`;
function hydratePhotos() {
  document.querySelectorAll('.phslot:empty').forEach(el => {
    spotPhoto(el.dataset.spot).then(p => {
      if (!p || !el.isConnected) return;
      const s = SPOTS.find(x => x.id === el.dataset.spot);
      el.innerHTML = `<img src="${esc(p.url)}" alt="${esc(s.en)}" loading="lazy" referrerpolicy="no-referrer"><figcaption><a href="${esc(p.page)}" target="_blank" rel="noopener" title="${esc(p.artist)} · ${esc(p.license)}">📷 ${esc(p.artist)} · ${esc(p.license)}</a></figcaption>`;
    });
  });
}
VIEWS.credits = () => `<p class="muted">${tr('photos_note')}</p>${SPOTS.filter(s => photoCache[s.id]).map(s => { const p = photoCache[s.id]; return `<div class="box"><b>${esc(nm(s))}</b><small><a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.artist)} · ${esc(p.license)}</a></small></div>`; }).join('') || `<p class="muted">${tr('nothing')}</p>`}`;

// ---------- events ----------
document.addEventListener('click', e => {
  if (e.target.closest('figcaption')) return;
  const lk = e.target.closest('a[href]'); if (lk && !lk.dataset.a) return;
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v;
  const A = {
    setlang() { st.lang = v; store.set('lang', v); render(); },
    start() { st.chosen = true; store.set('lang', st.lang); startLocation(); go('home'); render(); },
    nav() { go(v); },
    cat() { st.cat = v; st.q = ''; render(); },
    say() { const p = PHRASES.find(x => x.id === v); bump(v); speak(p.ja); },
    staff() { const p = PHRASES.find(x => x.id === v); bump(v); st.overlay = { hi: p.hi, ja: p.ja, src: p.en + (st.lang === 'np' ? ' / ' + p.np : ''), speak: p.ja }; renderOverlay(); },
    ovread() { speak(st.overlay.speak); },
    ovclose() { st.overlay = null; renderOverlay(); },
    maptype() { st.mapType = v; render(); },
    myloc() {
      startLocation();
      st.overlay = locOverlay(); renderOverlay();
      addressInfo().then(i => { st.addrInfo = i; if (st.overlay && st.overlay.isLoc) { st.overlay = locOverlay(); renderOverlay(); } });
    },
    tomap() { st.mapType = v; go('map'); },
    settheme() { st.theme = v; store.set('theme', v); applyTheme(); render(); },
    preset() { st.prefs.off = PRESETS[v].slice(); store.set('prefs', st.prefs); render(); },
    zoom() { st.prefs.zoom = +v; store.set('prefs', st.prefs); applyZoom(); render(); },
    cleardata() {
      ['prefs', 'bins', 'usage', 'photos', 'rates', 'holidays', 'theme', 'bookings'].forEach(k => { try { localStorage.removeItem(k); } catch { /* blocked */ } });
      st.prefs = { allergens: [], diets: [], off: [] }; st.usage = {}; st.theme = 'auto'; applyTheme(); applyZoom();
      nearCache.clear(); el.textContent = '✓ ' + tr('cleared');
    },
    opensp() { st.spotId = v; go('spot'); },
    bookspot() { const sp = SPOTS.find(x => x.id === v); st.bf = Object.assign(bookDefaults(), { place: sp.en, spotId: sp.id }); go('book'); },
    bsave() {
      const f = st.bf;
      if (!f.place.trim() || !f.date) { el.textContent = tr('bk_need'); return; }
      const al = (st.prefs.allergens || []).map(k => tr('a_' + k)).join(', ');
      const list = bookings(); list.push({ id: Date.now(), place: f.place.trim(), spotId: f.spotId, date: f.date, time: f.time || '18:00', people: +f.people || 1, name: f.name.trim(), note: [f.note.trim(), al ? tr('my_allergies') + ': ' + al : ''].filter(Boolean).join(' · '), status: 'planned', conf: '' });
      store.set('bookings', list); st.bf = bookDefaults(); render();
    },
    bdel() { store.set('bookings', bookings().filter(b => String(b.id) !== String(v))); render(); },
    bphone() { st.bkOpen = String(st.bkOpen) === String(v) ? null : +v; render(); },
    bspeak() { const b = bookings().find(x => String(x.id) === String(v)); if (b) speak(bookScript(b).ja); },
    bics() {
      const b = bookings().find(x => String(x.id) === String(v)); if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icsFor(b)], { type: 'text/calendar' })); a.download = 'reservation.ics'; document.body.appendChild(a); a.click(); a.remove();
    },
    bshow() {
      const b = bookings().find(x => String(x.id) === String(v)); if (!b) return;
      const [, m, d] = b.date.split('-').map(Number), t = b.time;
      st.overlay = { hi: 'よやくを して います。', ja: `${m}月${d}日 ${t} ${b.people}名 ${b.name || ''}様で予約しています。`, src: b.place, speak: `${m}月${d}日 ${t} ${b.people}名で予約しています。`,
        extra: b.conf ? `<div class="ov-addr"><div class="ov-postal">${esc(b.conf)}</div><small>${tr('bk_conf')}</small></div>` : '' };
      renderOverlay();
    },
    readaddr() { if (st.addrInfo) speak(sayAddress(st.addrInfo)); },
    allowloc() { startLocation(); },
    recenter() { startLocation(); if (st.map) st.map.setCenter(st.pos); },
    addbin() {
      const bins = store.get('bins', []); bins.push({ lat: st.pos.lat, lng: st.pos.lng, t: Date.now() }); store.set('bins', bins.slice(-200));
      [...nearCache.keys()].filter(k => k.startsWith('trash:')).forEach(k => nearCache.delete(k));
      el.textContent = '✓ ' + tr('bin_added');
      setTimeout(() => { if (view() === 'map') runMapSearch(!!st.map && !st.gmFail); else if (view() === 'nearby') render(); }, 900);
    },
    theme() { st.theme = { auto: 'light', light: 'dark', dark: 'auto' }[st.theme]; store.set('theme', st.theme); applyTheme(); render(); },
    mapgroup() { st.mapType = GROUPS[v][0]; render(); },
    delbin() {
      store.set('bins', store.get('bins', []).filter(b => String(b.t) !== String(v)));
      [...nearCache.keys()].filter(k => k.startsWith('trash:')).forEach(k => nearCache.delete(k));
      if (view() === 'map') runMapSearch(!!st.map && !st.gmFail); else render();
    },
    ptoggle() {
      const arr = st.prefs[el.dataset.k], i = arr.indexOf(v);
      if (i < 0) arr.push(v); else arr.splice(i, 1);
      store.set('prefs', st.prefs); render();
    },
    acard() { const c = allergyCard(); if (!c) { el.textContent = tr('allergy_none'); return; } st.overlay = c; renderOverlay(); },
    spot() { const s = SPOTS.find(x => x.id === v); window.open(dirUrl(s, 'transit'), '_blank', 'noopener'); },
    askspot() { go('chat'); sendChat(SPOTS.find(x => x.id === v).en); },
    hopt() { st.help = v; render(); },
    hback() { st.help = null; render(); },
    listenmic() { runListen(); },
    copyloc() { const txt = `${tr('loc_text')} https://www.google.com/maps?q=${st.pos.lat},${st.pos.lng}`; navigator.clipboard?.writeText(txt).then(() => { el.textContent = tr('copied'); }, () => { }); },
    quick() { sendChat(v); },
    mic() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
      const r = new SR(); r.lang = speechLang();
      r.onresult = ev => { $('#chatin').value = ev.results[0][0].transcript; };
      el.textContent = '…'; r.onend = () => { el.textContent = '🎤'; }; r.start();
    },
    msample() { const m = st.menu; const next = m.items ? (m.idx + 1) % MENUS.length : 0; m.img = null; m.ocr = null; m.ocrErr = false; startScan(next); },
    mfilter() { st.menu.filter = v; render(); },
    order() {
      const d = DISHES[v];
      st.overlay = { hi: `${d.hi}を ください。`, ja: `${d.ja}をください。`, src: d.n[0], speak: `${d.ja}をください` }; renderOverlay();
    },
    wgroup() { st.wait.group = v; st.wait.sel = WAIT_PLACES.find(p => p.group === v).id; render(); },
    wsel() { st.wait.sel = v; render(); },
    pint() { const i = st.plan.interests; const k = i.indexOf(v); k < 0 ? i.push(v) : i.splice(k, 1); render(); },
    async mkplan() { await loadRates(); makePlan(); render(); },
  };
  A[a]?.();
});
document.addEventListener('change', e => {
  const c = e.target.dataset.c; if (!c) return;
  const v = e.target.value;
  const C = {
    lang() { st.lang = v; store.set('lang', v); render(); },
    pcity() { st.plan.city = v; st.plan.result = null; render(); },
    pdays() { st.plan.days = +v; render(); },
    pbudget() { st.plan.budget = +v; render(); },
    ppeople() { st.plan.people = +v; render(); },
    ptotal() { st.plan.total = Math.max(0, +v || 0); render(); },
    pcurin() { st.plan.curIn = v; render(); },
    cur() { st.prefs.cur = v; store.set('prefs', st.prefs); render(); },
    bf() { st.bf[e.target.dataset.k] = e.target.value; },
    bstatus() { const l = bookings(); const b = l.find(x => String(x.id) === e.target.dataset.id); if (b) { b.status = v; store.set('bookings', l); render(); } },
    bconf() { const l = bookings(); const b = l.find(x => String(x.id) === e.target.dataset.id); if (b) { b.conf = v; store.set('bookings', l); } },
    feat() { const id = e.target.dataset.id, i = st.prefs.off.indexOf(id); if (e.target.checked && i >= 0) st.prefs.off.splice(i, 1); if (!e.target.checked && i < 0) st.prefs.off.push(id); store.set('prefs', st.prefs); },
    ffrom() { st.fare.from = v; render(); },
    fto() { st.fare.to = v; render(); },
    photo() {
      const f = e.target.files[0]; if (!f) return;
      st.menu.img = URL.createObjectURL(f); runOcr(f);
    },
  };
  C[c]?.();
});
document.addEventListener('input', e => {
  if (e.target.dataset.c === 'cvamt') { st.cv.amt = e.target.value; renderConverter(); return; }
  if (e.target.dataset.c === 'q') {
    st.q = e.target.value; const pos = e.target.selectionStart; render();
    const i = $('.search'); i.focus(); i.setSelectionRange(pos, pos);
  }
});
document.addEventListener('submit', e => {
  if (e.target.dataset.f === 'chat') { e.preventDefault(); const i = $('#chatin'); const v = i.value; i.value = ''; sendChat(v); $('#chatin')?.focus(); }
});
function startScan(idx) {
  const m = st.menu; m.idx = idx; m.items = null; m.scanning = true; m.filter = st.prefs.allergens.length ? 'safe' : 'all'; render();
  setTimeout(() => { m.scanning = false; m.items = MENUS[idx].items; if (view() === 'menu') render(); }, 1300);
}
window.addEventListener('hashchange', () => { if (st.overlay) st.overlay = null; if (view() !== 'help') st.help = null; render(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && st.overlay) { st.overlay = null; renderOverlay(); } });

applyZoom();
if (st.chosen) startLocation();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
render();
})();
