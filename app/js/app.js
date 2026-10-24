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
  plan: { city: 'tokyo', days: 2, budget: 2, interests: ['temple', 'food'], result: null },
  fare: { from: 'sensoji', to: 'meiji' },
  overlay: null,
};
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
  const heads = { home: '', map: 'map', phrases: 'phrases', chat: 'ai', sos: 'emergency', menu: 'menu', wait: 'wait', plan: 'plan', fare: 'fare' };
  let html = '';
  if (v !== 'lang') {
    html += `<header class="top">
      <a class="logo" href="#/home">⛩ ${tr('title')}</a>
      <select class="langsel" data-c="lang" aria-label="language">${LANGS.map(l => `<option value="${l.id}" ${l.id === st.lang ? 'selected' : ''}>${l.label}</option>`).join('')}</select>
      <a class="sosbtn" href="#/sos">🆘 ${tr('sos')}</a></header>`;
    if (!TAB_VIEWS.includes(v)) html += `<div class="sub"><a href="#/home" class="back">← ${tr('back')}</a><b>${tr(heads[v] || 'home')}</b></div>`;
  }
  html += `<main class="view v-${v}">${(VIEWS[v] || VIEWS.home)()}</main>`;
  if (v !== 'lang') {
    const tabs = [['home', '⌂'], ['map', '🗺'], ['phrases', '💬'], ['chat', '🤖'], ['sos', '🆘']];
    html += `<nav class="tabs">${tabs.map(([id, ic]) => `<a href="#/${id}" class="${id === v ? 'on' : ''}"><b>${ic}</b>${tr(id === 'chat' ? 'ai' : id)}</a>`).join('')}</nav>`;
  }
  $('#app').innerHTML = html;
  (AFTER[v] || (() => {}))();
  renderOverlay();
}

function renderOverlay() {
  const o = st.overlay, el = $('#overlay');
  if (!o) { el.className = ''; el.innerHTML = ''; return; }
  el.className = 'on';
  el.innerHTML = `<div class="ov-in">
    <div class="ov-hint">${esc(tr('show_staff_hint'))} / よんでください</div>
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
      <div class="hero">⛩</div>
      <h1>JAPAN TRAVEL</h1>
      <p class="tag">日本の旅行は、このひとつのアプリで<br><small>Nihon no ryokou wa kono hitotsu no apuri de</small></p>
      <p class="muted">Choose your language · भाषा छान्नुहोस् · ことば</p>
      ${LANGS.map(l => `<button class="btn big ${l.id === st.lang ? 'sel' : ''}" data-a="setlang" data-v="${l.id}">${l.label}${l.id === 'hi' ? ' <small>（ひらがなだけ）</small>' : ''}</button>`).join('')}
      <button class="btn pri big" data-a="start">${tr('start')} ▶</button>
      <p class="muted small">${tr('prototype')}</p></div>`;
  },

  home() {
    const cards = [['map', '🗺️', 'map', 'map_sub'], ['phrases', '💬', 'phrases', 'phr_sub'], ['menu', '📷', 'menu', 'menu_sub'], ['wait', '⏱️', 'wait', 'wait_sub'], ['plan', '🧭', 'plan', 'plan_sub'], ['fare', '🚃', 'fare', 'fare_sub']];
    const top = topPhrases(4);
    return `<div class="hello" data-a="nav" data-v="chat"><div class="avatar">🗾</div><div><b>${tr('greet_home')}</b><div class="badge">${tr('demo_ai')}</div></div></div>
      <div class="cards">${cards.map(([v, ic, a, b]) => `<a class="card" href="#/${v}"><span class="ic">${ic}</span><b>${tr(a)}</b><small>${tr(b)}</small></a>`).join('')}</div>
      <h3>${tr('most_used')} <a href="#/phrases" class="more">${tr('see_all')} ›</a></h3>
      ${top.map(phraseCard).join('')}
      <p class="muted small center">${tr('prototype')}</p>`;
  },

  phrases() {
    const cats = ['top', 'emergency', 'basic', 'food', 'move', 'shop'];
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
    const types = ['police', 'hospital', 'trash', 'shop', 'toilet', 'atm'];
    return `<div class="chips mapchips">${types.map(c => `<button class="chip ${c === st.mapType ? 'on' : ''}" data-a="maptype" data-v="${c}">${PLACE_TYPES[c].icon} ${tr('c_' + c)}</button>`).join('')}</div>
      <div id="mapbox" class="mapbox"><div class="mapfall"></div></div>
      <div id="sheet" class="sheetlist"><p class="muted">${tr('loading')}</p></div>`;
  },

  chat() {
    if (!st.chat.length) st.chat.push({ me: false, k: 'chat_hello' });
    const quick = ['⛩ Senso-ji', '🚓 Police?', '🚻 Toilet?', '🍜 Food?', '🚃 Train?', '⏱ Wait?'];
    return `<div class="chathead"><div class="avatar">🗾</div><div><b>${tr('ai')}</b><div class="badge">${tr('demo_ai')}</div></div></div>
      <div id="msgs" class="msgs">${st.chat.map(chatBubble).join('')}</div>
      <div class="chips quick">${quick.map(q => `<button class="chip" data-a="quick" data-v="${esc(q.split(' ').slice(1).join(' '))}">${q}</button>`).join('')}</div>
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
        <div>${esc(nm(p))} · ${fmtDist(p.km)} · ${walkMin(p.km)} ${tr('walk_min')}</div>
        <div class="two"><a class="btn" href="${dirUrl(p)}" target="_blank" rel="noopener">${tr('go')} ▶</a><a class="btn" href="#/map">🗺 ${tr('map')}</a></div></div>
      <div class="two"><button class="btn pri" data-a="myloc">📱 ${tr('tell_loc')}</button><button class="btn" data-a="staff" data-v="help">🗣 ${tr('say_phrase')}</button></div>
      <p class="muted small">${tr('tel_hint')} ${tr('verify_num')}</p>`;
  },

  menu() {
    const m = st.menu, menu = MENUS[m.idx];
    const paper = m.img ? `<img class="photo" src="${m.img}" alt="menu photo">` :
      `<div class="paper">${menu.items.map(id => `<div><span lang="ja">${DISHES[id].ja}</span><i>${yen(DISHES[id].price)}</i></div>`).join('')}</div>`;
    let items = '';
    if (m.scanning) items = `<div class="scan"><div class="spin"></div>${tr('scanning')}</div>`;
    else if (m.items) {
      const fl = m.filter;
      const ok = d => fl === 'all' || (fl === 'veg' && !d.al.some(a => ['pork', 'beef', 'chicken', 'fish', 'shrimp'].includes(a))) ||
        (fl === 'halal' && !d.al.some(a => a === 'pork' || a === 'alcohol')) || (fl === 'nopork' && !d.al.includes('pork'));
      items = `<div class="chips">${['all', 'veg', 'halal', 'nopork'].map(f => `<button class="chip ${f === fl ? 'on' : ''}" data-a="mfilter" data-v="${f}">${tr('f_' + f)}</button>`).join('')}</div>` +
        m.items.map(id => DISHES[id]).filter(ok).map((d, i) => {
          const id = m.items.find(k => DISHES[k] === d);
          const name = st.lang === 'ja' ? d.ja : st.lang === 'hi' ? d.hi : d.n[st.lang === 'np' ? 1 : 0];
          return `<div class="box dish"><div class="row"><div><div class="big" lang="ja">${d.ja}</div><small lang="ja">${d.hi}</small></div><b>${yen(d.price)}</b></div>
            <div>→ <b>${esc(name)}</b></div>
            <div>${d.al.length ? `<small>${tr('contains')}:</small> ` + d.al.map(a => `<span class="al ${['pork', 'alcohol'].includes(a) ? 'warn' : ''}">${tr('a_' + a)}</span>`).join('') : '<span class="al ok">✓</span>'}</div>
            <button class="btn" data-a="order" data-v="${id}">🗣 ${tr('order_this')}</button></div>`;
        }).join('');
    }
    return `<div class="badge">${tr('demo')}</div>
      <div class="menuimg">${paper}</div>
      <div class="two">
        <label class="btn pri filebtn">📸 ${tr('take_photo')}<input type="file" accept="image/*" capture="environment" data-c="photo" hidden></label>
        <button class="btn" data-a="msample">${tr('sample_menu')}</button></div>
      <div id="menuout">${items}</div>
      <p class="muted small">${tr('menu_note')}</p>`;
  },

  wait() {
    const w = st.wait, groups = ['air', 'sight'];
    const list = WAIT_PLACES.filter(p => p.group === w.group);
    const now = new Date(), hr = now.getHours();
    const sel = WAIT_PLACES.find(p => p.id === w.sel) || list[0];
    const lvl = v => (v < .3 ? 0 : v < .6 ? 1 : v < .8 ? 2 : 3);
    const mins = (p, v) => Math.max(0, Math.round(v * p.max / 5) * 5);
    const hrs = []; for (let h = (sel.kind === 'air' ? 6 : 8); h <= (sel.kind === 'air' ? 23 : 19); h++) hrs.push(h);
    const best = hrs.reduce((a, h) => (waitLoad(sel, h, now) < waitLoad(sel, a, now) ? h : a), hrs[0]);
    return `<div class="badge">${tr('simulated')}</div>
      <div class="chips">${groups.map(g => `<button class="chip ${g === w.group ? 'on' : ''}" data-a="wgroup" data-v="${g}">${g === 'air' ? '✈️' : '⛩'} ${tr(g === 'air' ? 'airports' : 'sights')}</button>`).join('')}</div>
      ${list.map(p => { const v = waitLoad(p, hr, now); return `<div class="box wait ${p.id === sel.id ? 'sel' : ''}" data-a="wsel" data-v="${p.id}">
        <div class="row"><b>${esc(nm(p))}</b><span class="lv l${lvl(v)}">${tr('lvl' + lvl(v))}</span></div>
        <div class="meter"><i class="l${lvl(v)}" style="width:${Math.round(v * 100)}%"></i></div>
        <small>${tr('now')}: ~${mins(p, v)} ${tr('min')}</small></div>`; }).join('')}
      <div class="box fill"><b>${tr('today_hours')} — ${esc(nm(sel))}</b>
        <div class="bars">${hrs.map(h => { const v = waitLoad(sel, h, now); return `<div class="b ${h === hr ? 'cur' : ''} ${h === best ? 'best' : ''}"><i class="l${lvl(v)}" style="height:${Math.max(6, Math.round(v * 100))}%"></i><small>${h}</small></div>`; }).join('')}</div>
        <p>⭐ ${tr('best_time')}: <b>${String(best).padStart(2, '0')}:00</b> (~${mins(sel, waitLoad(sel, best, now))} ${tr('min')})</p></div>
      <p class="muted small">${tr('wait_note')}</p>`;
  },

  plan() {
    const p = st.plan;
    const r = p.result;
    return `<div class="badge">${tr('rule_based')}</div>
      <div class="box form">
        <label>${tr('city')}<select data-c="pcity">${CITIES.map(c => `<option value="${c.id}" ${c.id === p.city ? 'selected' : ''}>${nm(c)}</option>`).join('')}</select></label>
        <label>${tr('days')}<select data-c="pdays">${[1, 2, 3].map(n => `<option ${n === p.days ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>${tr('budget')}<select data-c="pbudget">${[[0, '¥'], [1, '¥¥'], [2, '¥¥¥']].map(([v, s]) => `<option value="${v}" ${v === p.budget ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      </div>
      <b>${tr('interests')}</b>
      <div class="chips">${INTERESTS.map(i => `<button class="chip ${p.interests.includes(i) ? 'on' : ''}" data-a="pint" data-v="${i}">${tr('i_' + i)}</button>`).join('')}</div>
      <button class="btn pri big" data-a="mkplan">🧭 ${tr('create_plan')}</button>
      ${r ? planHtml(r) : ''}`;
  },

  fare() {
    const f = st.fare, a = SPOTS.find(s => s.id === f.from), b = SPOTS.find(s => s.id === f.to);
    const km = hav(a, b) * 1.25;
    const train = Math.round((150 + km * 22) / 10) * 10;
    const taxi = Math.round((500 + Math.max(0, km - 1.1) * 390) / 10) * 10;
    const opts = id => SPOTS.map(s => `<option value="${s.id}" ${s.id === id ? 'selected' : ''}>${esc(nm(s))}</option>`).join('');
    return `<div class="box form">
      <label>${tr('from')}<select data-c="ffrom">${opts(f.from)}</select></label>
      <label>${tr('to')}<select data-c="fto">${opts(f.to)}</select></label></div>
      <div class="cards three">
        <div class="card"><span class="ic">🚃</span><b>${yen(train)}</b><small>${tr('train')} · ~${Math.round(10 + km * 2.5)} ${tr('min')}</small></div>
        <div class="card"><span class="ic">🚕</span><b>${yen(taxi)}</b><small>${tr('taxi')} · ~${Math.round(5 + km * 3)} ${tr('min')}</small></div>
        <div class="card"><span class="ic">🚶</span><b>${km.toFixed(1)} km</b><small>${tr('walk')} · ~${Math.round(km * 13)} ${tr('min')}</small></div></div>
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=transit">🗺 ${tr('open_gmaps')}</a>
      <p class="muted small">${tr('estimate_note')}</p>`;
  },
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
  return `<div class="bubble ${m.me ? 'me' : ''}">${m.typing ? '<span class="dots"><i></i><i></i><i></i></span>' : esc(text)}${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
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
    } catch { ok = false; }
  }
  if (!ok && $('#mapbox')) {
    $('#mapbox').innerHTML = `<div class="mapfall"><div class="pinbig">🗺️</div><p>${tr('no_key')}</p>
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(MAP_QUERY[st.mapType])}/@${st.pos.lat},${st.pos.lng},16z">${tr('open_gmaps')}</a></div>`;
  }
  runMapSearch(ok);
}
const MAP_QUERY = { police: 'police station', hospital: 'hospital', trash: 'trash can', shop: 'convenience store', toilet: 'public toilet', atm: 'ATM' };

async function runMapSearch(useGoogle) {
  const seq = ++st.mapSeq, type = st.mapType;
  st.markers.forEach(m => m.setMap(null)); st.markers = [];
  let list = [], sample = true;
  if (useGoogle && type !== 'trash') {
    try {
      // Places API (New); needs "Places API (New)" enabled on the key's project
      const { Place } = await google.maps.importLibrary('places');
      const { places } = await Place.searchNearby({
        fields: ['displayName', 'location', 'formattedAddress'],
        locationRestriction: { center: st.pos, radius: 2000 },
        includedPrimaryTypes: [PLACE_TYPES[type].type],
        maxResultCount: 12,
      });
      if (places && places.length) {
        sample = false;
        list = places.map(p => ({ name: p.displayName, sub: p.formattedAddress, lat: p.location.lat(), lng: p.location.lng() }));
      }
    } catch (err) { console.warn('Places search failed, using sample data:', err.message || err); }
  }
  if (!list.length) list = POI.filter(p => p.type === type).map(p => ({ name: nm(p), lat: p.lat, lng: p.lng }));
  list = list.map(p => ({ ...p, km: hav(st.pos, p) })).sort((a, b) => a.km - b.km);
  const close = list.filter(p => p.km < 30);
  list = (close.length ? close : list).slice(0, 8);
  if (seq !== st.mapSeq || view() !== 'map') return;
  if (useGoogle && st.map) {
    const bounds = new google.maps.LatLngBounds(st.pos);
    list.forEach(p => {
      const mk = new google.maps.Marker({ map: st.map, position: p, title: p.name, label: { text: PLACE_TYPES[type].icon, fontSize: '16px' } });
      mk.addListener('click', () => { const el = document.getElementById('poi-' + list.indexOf(p)); if (el) el.scrollIntoView({ block: 'nearest' }); });
      st.markers.push(mk); bounds.extend(p);
    });
    if (list.length) { st.map.fitBounds(bounds, 40); google.maps.event.addListenerOnce(st.map, 'idle', () => { if (st.map.getZoom() > 17) st.map.setZoom(17); }); }
  }
  const far = list.length && list[0].km > 30;
  $('#sheet').innerHTML = `<div class="grab"></div><b>${PLACE_TYPES[type].icon} ${type === 'police' ? tr('nearest_police') : tr('c_' + type)}</b>
    ${far ? `<p class="muted small">${tr('sample_poi_note')}</p>` : ''}
    ${list.length ? list.map((p, i) => `<div class="box row poi" id="poi-${i}"><div><b>${esc(p.name)}</b><div class="small muted">${fmtDist(p.km)} · ${walkMin(p.km)} ${tr('walk_min')}${p.sub ? ' · ' + esc(p.sub) : ''}</div></div>
      <a class="btn" target="_blank" rel="noopener" href="${dirUrl(p)}">${tr('go')} ▶</a></div>`).join('') : `<p class="muted">${tr('nothing')}</p>`}
    ${type === 'police' ? `<div class="two"><a class="btn sos" href="tel:110">📞 110</a><button class="btn" data-a="staff" data-v="police">🗣 ${tr('say_phrase')}</button></div>` : ''}
    ${sample ? `<p class="muted small">${tr('sample_poi_note')}</p>` : ''}`;
}

function locate(after) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(p => {
    st.pos = { lat: p.coords.latitude, lng: p.coords.longitude, real: true };
    if (st.me) st.me.setPosition(st.pos);
    if (after) after();
  }, () => { }, { enableHighAccuracy: true, timeout: 8000 });
}

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
  const spot = SPOTS.find(s => s.keys.some(k => q.includes(k.toLowerCase())) || q.includes(s.en.toLowerCase()));
  const actions = a => a.map(([k, v]) => ({ label: tr(k), view: v }));
  if (spot) {
    return { text: `${nm(spot)} — ${spot.d[L()]}`, actions: [{ label: tr('open_gmaps'), href: `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}` }, { label: tr('wait'), view: 'wait' }] };
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
    st.chat[st.chat.indexOf(typing)] = { me: false, text: r.text, actions: r.actions };
    if (view() === 'chat') render();
  }, 550);
}

// ---------- wait times ----------
const JP_HOLIDAYS = ['1-1', '2-11', '2-23', '4-29', '5-3', '5-4', '5-5', '8-11', '11-3', '11-23'];
function waitLoad(p, h, d) {
  const base = PROFILE[p.kind][h] ?? 0;
  const we = [0, 6].includes(d.getDay()) ? 1.2 : 1;
  const hol = JP_HOLIDAYS.includes(`${d.getMonth() + 1}-${d.getDate()}`) ? 1.25 : 1;
  const noise = 0.9 + 0.2 * hash01(p.id + d.toDateString() + h);
  return Math.min(1, base * we * hol * noise);
}

// ---------- trip planner (rule-based) ----------
function makePlan() {
  const p = st.plan;
  let pool = SPOTS.filter(s => s.city === p.city);
  const affordable = pool.filter(s => s.cost <= p.budget);
  if (affordable.length >= 3) pool = affordable;
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
    let clock = 9 * 60, fare = 0; const rows = [];
    day.forEach((s, i) => {
      if (i === 2 || (i === 1 && day.length === 2)) { rows.push({ time: clock, lunch: true }); clock += 60; }
      const prev = day[i - 1];
      let trip = null;
      if (prev) { const km = hav(prev, s) * 1.25; trip = { km, fare: Math.round((150 + km * 22) / 10) * 10, min: Math.round(10 + km * 2.5) }; clock += trip.min; fare += trip.fare; }
      rows.push({ time: clock, spot: s, trip });
      clock += s.mins;
    });
    days.push({ rows, fare, spots: day });
  }
  p.result = days;
}
const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function planHtml(days) {
  if (!days.length) return `<p class="muted">${tr('nothing')}</p>`;
  const total = days.reduce((a, d) => a + d.fare, 0);
  return days.map((d, i) => {
    const s = d.spots, wp = s.slice(1, -1).map(x => `${x.lat},${x.lng}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${s[0].lat},${s[0].lng}&destination=${s[s.length - 1].lat},${s[s.length - 1].lng}${wp ? '&waypoints=' + encodeURIComponent(wp) : ''}&travelmode=transit`;
    return `<div class="box day"><b>${st.lang === 'ja' || st.lang === 'hi' ? `${i + 1}${tr('day')}` : `${tr('day')} ${i + 1}`}</b>
      ${d.rows.map(r => r.lunch ? `<div class="stop lunch"><time>${hm(r.time)}</time><div>🍜 ${tr('lunch')} <small>${tr('lunch_hint')}</small></div></div>` :
        `${r.trip ? `<div class="leg">🚃 ${yen(r.trip.fare)} · ~${r.trip.min} ${tr('min')}</div>` : ''}
        <div class="stop"><time>${hm(r.time)}</time><div><b>${esc(nm(r.spot))}</b><small>${r.spot.d[L()]}</small><small>⏱ ${r.spot.mins} ${tr('min')} · ${r.spot.cost === 0 ? 'Free' : '¥'.repeat(r.spot.cost)}</small></div></div>`).join('')}
      <a class="btn" target="_blank" rel="noopener" href="${url}">🗺 ${tr('show_route')}</a></div>`;
  }).join('') + `<p class="center"><b>${tr('total_fare')}: ${yen(total)}</b></p><p class="muted small">${tr('estimate_note')}</p>`;
}

// ---------- events ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v;
  const A = {
    setlang() { st.lang = v; store.set('lang', v); render(); },
    start() { st.chosen = true; store.set('lang', st.lang); go('home'); render(); },
    nav() { go(v); },
    cat() { st.cat = v; st.q = ''; render(); },
    say() { const p = PHRASES.find(x => x.id === v); bump(v); speak(p.ja); },
    staff() { const p = PHRASES.find(x => x.id === v); bump(v); st.overlay = { hi: p.hi, ja: p.ja, src: p.en + (st.lang === 'np' ? ' / ' + p.np : ''), speak: p.ja }; renderOverlay(); },
    ovread() { speak(st.overlay.speak); },
    ovclose() { st.overlay = null; renderOverlay(); },
    maptype() { st.mapType = v; render(); },
    myloc() {
      const url = `https://www.google.com/maps?q=${st.pos.lat},${st.pos.lng}`;
      st.overlay = { hi: 'たすけて ください。いま ここに います。', ja: '助けてください。今ここにいます。', src: `${tr('loc_text')}`, speak: '助けてください。今ここにいます。',
        extra: `<div class="ov-loc">📍 ${st.pos.lat.toFixed(5)}, ${st.pos.lng.toFixed(5)}${st.pos.real ? '' : ' (sample)'}<br><a href="${url}" target="_blank" rel="noopener">${url}</a><br><button class="btn" data-a="copyloc">${tr('copy')}</button></div>` };
      renderOverlay();
      if (!st.pos.real) locate(() => A.myloc());
    },
    copyloc() { const txt = `${tr('loc_text')} https://www.google.com/maps?q=${st.pos.lat},${st.pos.lng}`; navigator.clipboard?.writeText(txt).then(() => { el.textContent = tr('copied'); }, () => { }); },
    quick() { sendChat(v); },
    mic() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
      const r = new SR(); r.lang = speechLang();
      r.onresult = ev => { $('#chatin').value = ev.results[0][0].transcript; };
      el.textContent = '…'; r.onend = () => { el.textContent = '🎤'; }; r.start();
    },
    msample() { const m = st.menu; const next = m.items ? (m.idx + 1) % MENUS.length : 0; m.img = null; startScan(next); },
    mfilter() { st.menu.filter = v; render(); },
    order() {
      const d = DISHES[v];
      st.overlay = { hi: `${d.hi}を ください。`, ja: `${d.ja}をください。`, src: d.n[0], speak: `${d.ja}をください` }; renderOverlay();
    },
    wgroup() { st.wait.group = v; st.wait.sel = WAIT_PLACES.find(p => p.group === v).id; render(); },
    wsel() { st.wait.sel = v; render(); },
    pint() { const i = st.plan.interests; const k = i.indexOf(v); k < 0 ? i.push(v) : i.splice(k, 1); render(); },
    mkplan() { makePlan(); render(); },
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
    ffrom() { st.fare.from = v; render(); },
    fto() { st.fare.to = v; render(); },
    photo() {
      const f = e.target.files[0]; if (!f) return;
      st.menu.img = URL.createObjectURL(f); startScan(f.size % MENUS.length);
    },
  };
  C[c]?.();
});
document.addEventListener('input', e => {
  if (e.target.dataset.c === 'q') {
    st.q = e.target.value; const pos = e.target.selectionStart; render();
    const i = $('.search'); i.focus(); i.setSelectionRange(pos, pos);
  }
});
document.addEventListener('submit', e => {
  if (e.target.dataset.f === 'chat') { e.preventDefault(); const i = $('#chatin'); const v = i.value; i.value = ''; sendChat(v); $('#chatin')?.focus(); }
});
function startScan(idx) {
  const m = st.menu; m.idx = idx; m.items = null; m.scanning = true; m.filter = 'all'; render();
  setTimeout(() => { m.scanning = false; m.items = MENUS[idx].items; if (view() === 'menu') render(); }, 1300);
}
window.addEventListener('hashchange', () => { if (st.overlay) st.overlay = null; render(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && st.overlay) { st.overlay = null; renderOverlay(); } });

locate(() => { if (view() === 'map') initMapView(); });
render();
})();
