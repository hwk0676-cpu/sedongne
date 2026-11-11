/* 세동네 — single-page mobile web app (hash router, no build step).
   Screens follow the Figma file "제목 없음" (dyxWPQMLjuSyNJOUJlGcdJ), frame width 402. */
(() => {
  'use strict';
  const D = window.SD_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view');
  const tabbar = $('#tabbar');
  const CENTER = [37.5110, 127.0218]; // 논현역

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtDate = (s) => { const d = parseIso(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
  const fmtDateShort = (s) => { const d = parseIso(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const fmtDot = (s) => { const d = parseIso(s); return `${d.getMonth() + 1}. ${d.getDate()} (${WD[d.getDay()]})`; };
  const fmtTime = (t) => { let [h, m] = t.split(':').map(Number); const ap = h < 12 ? '오전' : '오후'; h = h % 12 || 12; return `${ap} ${h}:${pad(m)}`; };
  const won = (n) => n.toLocaleString('ko-KR') + '원';
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const distKm = (r) => {
    const R = 6371, toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(r.lat - CENTER[0]), dLng = toRad(r.lng - CENTER[1]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(CENTER[0])) * Math.cos(toRad(r.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const byId = (id) => D.RESTAURANTS.find((r) => r.id === id);
  const district = (r) => r.address.split(' ').slice(0, 2).join(' ');
  const typeColor = (t) => D.TYPES.find((x) => x.key === t)?.color || '#FF4E4E';

  /* ---------- persistent store ---------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem('sd:' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem('sd:' + k, JSON.stringify(v)); } catch { /* storage full or blocked */ } },
  };

  function seedReservations() {
    const t = today();
    return [
      { id: 'b1', rid: 'r8', date: iso(addDays(t, 7)), time: '19:00', people: 2, status: 'confirmed', code: 'DD-0912-0024' },
      { id: 'b2', rid: 'r11', date: iso(addDays(t, 9)), time: '12:30', people: 3, status: 'pending', code: 'DD-0914-0031' },
      { id: 'b3', rid: 'r9', date: iso(addDays(t, -6)), time: '19:00', people: 2, status: 'visited', code: 'DD-0828-0007' },
      { id: 'b4', rid: 'r10', date: iso(addDays(t, -2)), time: '19:00', people: 2, status: 'cancelled', code: 'DD-0905-0012' },
    ];
  }

  const S = {
    likes: store.get('likes', ['r4', 'r12', 'r1', 'r3', 'r14', 'r5']),
    collections: store.get('collections', D.COLLECTIONS),
    reservations: store.get('reservations', null) || seedReservations(),
    recent: store.get('recent', ['쌀국수', '성수 맛집', '파스타']),
    waitRecent: store.get('waitRecent', D.WAIT_RECENT),
    profile: store.get('profile', { nick: '맛집탐험가', bio: '', region: '', avatar: null, cover: null }),
  };
  const save = (k) => store.set(k, S[k]);
  save('reservations');

  const isLiked = (id) => S.likes.includes(id);
  function toggleLike(id) {
    if (isLiked(id)) { S.likes = S.likes.filter((x) => x !== id); toast('찜 목록에서 뺐어요'); }
    else { S.likes = [id, ...S.likes]; toast('찜 목록에 담았어요'); }
    save('likes');
  }

  function resStatus(b) {
    if (b.status === 'cancelled') return 'cancelled';
    if (parseIso(b.date) < today()) return 'visited';
    return b.status;
  }
  const STATUS_LABEL = { confirmed: '예약 확정', pending: '예약 대기', visited: '방문 완료', cancelled: '취소 완료' };
  const statusBadge = (b, size = '') => { const s = resStatus(b); return `<span class="badge ${size} ${s === 'confirmed' ? '' : 'gray'}">${STATUS_LABEL[s]}</span>`; };
  const upcoming = () => S.reservations.filter((b) => ['confirmed', 'pending'].includes(resStatus(b))).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* ---------- icons ---------- */
  const P = {
    home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V20a1 1 0 0 1-1 1H15v-6.2H9V21H4.5a1 1 0 0 1-1-1z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2" stroke-width="2"/>',
    calPlain: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    arrow: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    sort: '<path d="M4 6h16M4 12h11M4 18h7"/>',
    cloudSun: '<circle cx="9" cy="8" r="3"/><path d="M9 2v1.5M3 8h1.5M4.8 3.8l1 1M13.2 3.8l-1 1"/><path d="M8.5 20h8.5a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 8.5 20z"/>',
    tack: '<path d="M9 3h6l-1 6 4 4H6l4-4zM12 13v8"/>',
    help: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14M12 17v.01"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    shieldInfo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 11v5M12 8v.01"/>',
    shieldHalf: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 3v18" /><path d="M12 3 4 6v6c0 5 3.5 8 8 9z" fill="currentColor"/>',
    bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    starBox: '<rect x="3.5" y="4" width="17" height="14" rx="2.5"/><path d="M8 21h8"/><path d="m12 7.5 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 13.5l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z"/>',
  };
  const ic = (n, s = 20, extra = '') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n]}</svg>`;
  const icFill = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const heartIc = (on, s = 22) => (on ? icFill('heart', s) : ic('heart', s));
  const shieldCheck = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4 5.5v6c0 5 3.5 8.6 8 10 4.5-1.4 8-5 8-10v-6z" fill="#FF4E4E"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Brand assets supplied from the Figma file (images/ui)
  const UI = (n) => `images/ui/${n}.png`;
  const img = (n, w, h, cls = '') => `<img class="ico ${cls}" src="${UI(n)}" width="${w}" height="${h}" alt="">`;
  function logo(h = 15, inverse = false) {
    const w = Math.round((h * (inverse ? 198 : 196)) / (inverse ? 54 : 51));
    return `<img class="logo" src="${UI(inverse ? 'logo-white' : 'logo-sdn')}" width="${w}" height="${h}" alt="세동네">`;
  }
  const shapesIcon = (c = 'currentColor') => `<svg width="34" height="13" viewBox="0 0 34 13" aria-hidden="true"><path d="M6 0 12 12H0z" fill="${c}"/><circle cx="17.5" cy="6.5" r="5.5" fill="${c}"/><rect x="23.5" y="1" width="10.5" height="11" fill="${c}"/></svg>`;
  const dots4 = () => `<span class="dots4"><i style="background:#FF4E4E"></i><i style="background:#4E5BF0"></i><i style="background:#C2427A"></i><i style="background:#B9852F"></i></span>`;

  // Photo if the restaurant has one (idx picks among several), otherwise an emoji placeholder.
  const thumb = (r, extra = '', cls = '', idx = 0) => {
    const n = r.imgs?.length || 0;
    const src = n ? r.imgs[idx % n] : '';
    // With fewer photos than slots, show different crops of the same photo instead of exact repeats.
    const crop = n && idx >= n ? ` style="transform:scale(1.6);object-position:${['20% 30%', '80% 30%', '50% 80%', '30% 70%'][idx % 4]}"` : '';
    // Photos fade in over a shimmer placeholder once decoded.
    return src
      ? `<div class="thumb has-img ${cls}" ${extra}><img src="${src}" alt="${esc(r.name)}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" onerror="this.parentNode.classList.remove('has-img');this.remove()"${crop}>${r.emoji}</div>`
      : `<div class="thumb ${cls}" style="--h:${(r.hue + idx * 25) % 360}" ${extra}>${r.emoji}</div>`;
  };
  const imgThumb = (src, cls = '') => `<div class="thumb has-img ${cls}"><img src="${src}" alt="" loading="lazy" decoding="async" onload="this.classList.add('loaded')"></div>`;
  const catMark = (r) => `<span class="cat"><i class="shape ${r.cat}"></i>${D.CATS[r.cat].label}</span>`;
  const typeDot = (r) => `<span class="type-dot" style="color:${typeColor(r.type)}">${r.type}</span>`;

  /* ---------- UI: toast, sheet ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }
  const layer = $('#sheetLayer'), sheet = $('#sheet');
  // Bottom sheets slide up, can be dragged down by the grab bar to dismiss, and slide away when closed.
  function openSheet(html) {
    clearTimeout(closeTimer);
    const wasOpen = !layer.hidden && !layer.classList.contains('closing');
    sheet.innerHTML = '<div class="grab" aria-hidden="true"></div>' + html;
    sheet.style.transform = '';
    layer.classList.remove('closing');
    if (!wasOpen) { layer.hidden = false; layer.classList.remove('open'); void layer.offsetWidth; layer.classList.add('open'); }
  }
  let closeTimer;
  function closeSheet(animate = true) {
    if (layer.hidden) return;
    clearTimeout(closeTimer);
    if (!animate) { layer.hidden = true; sheet.innerHTML = ''; layer.classList.remove('closing', 'open'); return; }
    layer.classList.add('closing');
    closeTimer = setTimeout(() => { layer.hidden = true; sheet.innerHTML = ''; layer.classList.remove('closing', 'open'); sheet.style.transform = ''; }, 220);
  }

  /* ---------- router ---------- */
  let ui = {};          // per-page state, reset on navigation
  let navDepth = 0;     // in-app navigations, so "back" never leaves the app
  let current = null;
  let pendingUi = null; // page state to hand to the next route

  // Transition direction for the next route: 'forward' (push), 'back' (pop), 'fade' (tab switch / replace).
  // A hashchange we did not start ourselves is the browser/OS back gesture, so it defaults to 'back'.
  let navDir = null;
  const TAB_ROOTS = ['home', 'reservations', 'map', 'likes', 'my'];
  function go(path, replace = false) {
    const target = '#/' + path;
    navDir = replace || (TAB_ROOTS.includes(path) && current?.tab) ? 'fade' : 'forward';
    if (replace) { location.replace(target); return; }
    navDepth++;
    location.hash = target;
  }
  function back(fallback = 'home') {
    navDir = 'back';
    if (navDepth > 0) { navDepth--; history.back(); } else location.replace('#/' + fallback);
  }
  // Each visited screen keeps its state and scroll position, restored when you come back to it.
  const memory = new Map();

  // [pattern, render, tab (bottom nav highlight; omit to hide the nav), page background]
  const routes = [
    ['home', renderHome, 'home'],
    ['search', renderSearch, 'home'],
    ['map', renderMap, 'map'],
    ['r/:id', renderRestaurant],
    ['reserve/:id', renderReserve, null, 'pink'],
    ['reserved/:bid', renderReserved],
    ['reservations', renderResHome, 'res'],
    ['reservations/list', renderReservations],
    ['reservation/:bid', renderReservationDetail],
    ['cancelled/:bid', renderCancelled],
    ['waiting', renderWaiting],
    ['likes', renderLikes, 'likes', 'pink'],
    ['likes/all', renderLikesAll, 'likes'],
    ['likes/edit', renderLikesEdit],
    ['collection/:id', renderCollection, 'likes', 'pink'],
    ['my', renderMy, 'my'],
    ['my/edit', renderProfileEdit],
    ['notice', renderNotice],
    ['faq', renderFaq],
    ['support', renderSupport],
    ['inquiry', renderInquiry],
    ['privacy', () => renderDoc('privacy')],
    ['terms', () => renderDoc('terms')],
  ];

  function match(path) {
    const parts = path.split('/').filter(Boolean);
    for (const [pattern, fn, tab, bg] of routes) {
      const pp = pattern.split('/');
      if (pp.length !== parts.length) continue;
      const params = {};
      if (pp.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]))) return { fn, tab, bg, params, pattern };
    }
    return null;
  }

  function route() {
    const path = location.hash.replace(/^#\/?/, '') || 'home';
    const m = match(path) || match('home');
    const dir = navDir || (current ? 'back' : 'none');
    navDir = null;
    closeSheet(false);
    destroyMap();
    if (current && current.path !== path) memory.set(current.path, { ui, y: window.scrollY });
    const saved = dir === 'back' ? memory.get(path) : null;
    if (!current || current.path !== path) ui = saved ? saved.ui : {};
    if (pendingUi) { Object.assign(ui, pendingUi); pendingUi = null; }
    const prevTab = current?.tab;
    current = { ...m, path };
    renderCurrent(prevTab !== m.tab);
    window.scrollTo(0, saved ? saved.y : 0);
    animateView(dir);
  }

  function animateView(dir) {
    if (dir === 'none' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    view.classList.remove('enter-forward', 'enter-back', 'enter-fade');
    void view.offsetWidth; // restart the animation
    view.classList.add('enter-' + dir);
    // The map measures its container, so re-measure once the slide finishes.
    if (current.pattern === 'map') setTimeout(() => map?.invalidateSize(), 300);
  }

  function renderCurrent(tabChanged = false) {
    const { fn, tab, bg, params } = current;
    view.className = 'view' + (tab ? ' with-tab' : '') + (bg ? ' ' + bg : '');
    view.innerHTML = fn(params) || '';
    renderTabbar(tab, tabChanged);
    current.mount?.();
    updateHeaderShadow();
  }
  const rerender = () => { const y = window.scrollY; renderCurrent(); window.scrollTo(0, y); };

  function renderTabbar(tab, tabChanged = false) {
    tabbar.hidden = !tab;
    if (!tab) return;
    if (!tabChanged && tabbar.dataset.tab === tab) return; // unchanged: keep the DOM (no flicker)
    tabbar.dataset.tab = tab;
    // Active icons are the supplied coral assets; inactive ones are matching black outlines.
    const icons = {
      home: (on) => (on ? img('tab-home-on', 21, 21) : ic('home', 22, 'stroke-width="1.9"')),
      res: (on) => (on ? img('tab-res-on', 21, 21) : ic('cal', 21, 'stroke-width="1.9"')),
      likes: (on) => (on ? img('tab-likes-on', 22, 22) : ic('heart', 23, 'stroke-width="1.9"')),
      // No filled 마이 asset was supplied, so this is a filled coral person matching the 홈/예약 style.
      my: (on) => (on ? `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="5.2" fill="#FF514F"/><path d="M3 22.2c0-5.3 4-8.7 9-8.7s9 3.4 9 8.7c0 .5-.4.8-.9.8H3.9c-.5 0-.9-.3-.9-.8z" fill="#FF514F"/></svg>` : img('tab-my', 24, 24)),
    };
    const bump = (key) => (tabChanged && tab === key ? 'bump' : '');
    const item = (key, label, path) => `<button class="tab ${tab === key ? 'active' : ''} ${bump(key)}" data-go="${path}"><span class="ico-wrap">${icons[key](tab === key)}</span><span>${label}</span></button>`;
    tabbar.innerHTML = `${item('home', '홈', 'home')}${item('res', '예약', 'reservations')}
      <button class="tab tab-center ${tab === 'map' ? 'active' : ''} ${bump('map')}" data-go="map" aria-label="지도"><span class="ring">${shapesIcon(tab === 'map' ? '#FF4E4E' : '#1E1E1E')}</span></button>
      ${item('likes', '찜', 'likes')}${item('my', '마이', 'my')}`;
  }

  // Sticky headers get a hairline shadow once the page scrolls under them.
  function updateHeaderShadow() {
    const bar = view.querySelector('.topbar, .search-top');
    if (bar) bar.classList.toggle('scrolled', window.scrollY > 4);
  }
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  const haptic = () => { try { navigator.vibrate?.(8); } catch { /* not supported */ } };

  // Header: centered title with chevron back (default) or left-aligned title with arrow (style: 'left').
  // style 'center': chevron + centered title · 'arrow': ← + centered title · 'left': ← + left title (x68)
  const topbar = (title, { right = '', cls = '', backTo = 'home', style = 'center', noBack = false } = {}) => {
    const backIc = style === 'center' ? ic('back', 22, 'stroke-width="2.2"') : ic('arrow', 24, 'stroke-width="2"');
    return `<header class="topbar ${style === 'left' ? 'left-title' : ''} ${cls}">
        ${noBack ? '' : `<div class="left"><button class="icon-btn" data-act="back" data-fallback="${backTo}" aria-label="뒤로">${backIc}</button></div>`}
        <h1>${title}</h1><div class="right">${right}</div></header>`;
  };

  /* ---------- shared components ---------- */
  function rCard(r, { heartPos = 'top', compact = false } = {}) {
    const on = isLiked(r.id);
    return `<div class="r-card ${compact ? 'compact' : ''}" data-go="r/${r.id}" role="link" tabindex="0">
      ${thumb(r)}
      <div class="info">
        <p class="name">${esc(r.name)}</p>
        <div class="meta">${catMark(r)}${typeDot(r)}</div>
        <div class="open"><b>영업 중</b> · ${r.open} 라스트오더</div>
        <div class="desc">${esc(r.desc)}</div>
      </div>
      <button class="heart-btn ${heartPos === 'bottom' ? 'bottom' : ''} ${on ? 'on' : ''}" data-act="like" data-id="${r.id}" aria-label="찜하기">${heartIc(on, 17)}</button>
    </div>`;
  }

  /* ================= HOME (frame 162) ================= */
  function renderHome() {
    const popular = D.RESTAURANTS.filter((r) => r.popular);
    const near = ['r1', 'r2', 'r3'].map(byId);
    return `
      <section class="home-hero">
        ${logo(15)}
        <h1>서울의 맛집을 보는<br><em>새로운 기준</em></h1>
        <p>직접 다녀온 서울 맛집만 소개합니다</p>
        <button class="search-box" data-go="search">${ic('search', 20, 'stroke-width="2"')}서울에서 어떤 맛을 찾으세요?</button>
      </section>
      <div class="hr3"></div>
      <section class="home-sec">
        <h2 class="section-title">지금 인기있는 맛집</h2>
        <div class="pop-row">
          ${popular.map((r) => `<button class="pop-card" data-go="r/${r.id}">
            ${thumb(r)}
            <div class="body"><div class="area">${r.area2}</div><div class="name">${esc(r.name)}</div>
            <span class="star">★ ${r.rating}</span><div class="menu">${esc(r.menuLabel || r.type)}</div></div>
          </button>`).join('')}
        </div>
      </section>
      <div class="hr3"></div>
      <section class="near-list">
        <h2 class="section-title">내 주변 맛집</h2>
        ${near.map((r) => rCard(r, { heartPos: 'bottom', compact: true })).join('')}
      </section>`;
  }

  /* ================= SEARCH (frame dudi-search) ================= */
  const KEYWORD_MAP = { 파스타: ['양식류'], 리조또: ['양식류'], 스테이크: ['양식류', '고기류'], 브런치: ['디저트류', '커피류'], 피자: ['양식류'], 와인: ['양식류'], 쌀국수: ['면류'], 국수: ['면류'], 냉면: ['면류'], 고기: ['고기류'], 커피: ['커피류'], 빵: ['디저트류'] };
  function searchRestaurants(q, sort = '관련도순') {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const date = S.collections.find((c) => c.name.includes('데이트'));
    const res = D.RESTAURANTS.map((r) => {
      const hay = [r.name, r.type, r.desc, r.area, D.CATS[r.cat].label, r.menuLabel || '', r.cuisine || '', ...r.menu.map((m) => m[0])].join(' ').toLowerCase();
      let score = 0;
      if (r.name.toLowerCase().includes(s)) score += 10;
      if (hay.includes(s)) score += 4;
      for (const [k, types] of Object.entries(KEYWORD_MAP)) if (s.includes(k.toLowerCase()) && types.includes(r.type)) score += 3;
      if (s.includes('데이트') && date?.ids.includes(r.id)) score += 5;
      s.split(/\s+/).forEach((w) => { if (w.length > 1 && hay.includes(w)) score += 1; });
      return { r, score };
    }).filter((x) => x.score > 0);
    if (sort === '거리순') res.sort((a, b) => distKm(a.r) - distKm(b.r));
    else if (sort === '평점순') res.sort((a, b) => b.r.rating - a.r.rating);
    else res.sort((a, b) => b.score - a.score || b.r.rating - a.r.rating);
    return res.map((x) => x.r);
  }

  function renderSearch() {
    ui.q ??= '';
    ui.sort ??= '관련도순';
    current.mount = () => {
      const input = $('#q');
      if (!ui.q) input.focus();
      input.addEventListener('input', () => { ui.q = input.value; $('#searchClear').hidden = !ui.q; $('#searchBody').innerHTML = searchBody(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { addRecent(input.value); input.blur(); } });
    };
    return `
      <div class="search-top">
        <button class="icon-btn" data-act="back" aria-label="뒤로">${ic('back', 24, 'stroke-width="2.2"')}</button>
        <label class="search-input">${ic('search', 18, 'stroke-width="2"')}
          <input id="q" type="search" enterkeyhint="search" placeholder="맛집, 지역, 메뉴 검색" value="${esc(ui.q)}" autocomplete="off">
          <button class="clear-btn" id="searchClear" data-act="clear-search" ${ui.q ? '' : 'hidden'} aria-label="지우기">${ic('close', 18, 'stroke-width="2.2"')}</button>
        </label>
      </div>
      <div id="searchBody">${searchBody()}</div>`;
  }
  function addRecent(q) {
    q = q.trim();
    if (!q) return;
    S.recent = [q, ...S.recent.filter((x) => x !== q)].slice(0, 8);
    save('recent');
  }
  function searchBody() {
    const kw = `
      <section class="kw">
        <div class="kw-head"><h3>최근 검색어</h3>${S.recent.length ? '<button data-act="clear-recent">전체 삭제</button>' : ''}</div>
        ${S.recent.length ? `<div class="chips">${S.recent.map((k) => `<button class="chip" data-act="kw" data-q="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : '<p style="font-size:13px;color:#9A9A9A">최근 검색어가 없어요</p>'}
      </section>
      <section class="kw" style="padding-top:16px;padding-bottom:15px">
        <div class="kw-head"><h3>추천 검색어</h3></div>
        <div class="chips">${D.RECOMMENDED.map((k) => `<button class="chip rect" data-act="kw" data-q="${esc(k)}">${esc(k)}</button>`).join('')}</div>
      </section>`;
    if (!ui.q.trim()) return kw;
    const list = searchRestaurants(ui.q, ui.sort);
    return `${kw}<div class="hr8"></div>
      <section class="result">
        <div class="kw-head"><h3>${esc(ui.q)} 검색 결과</h3></div>
        <div class="sort-row">${['관련도순', '거리순', '평점순'].map((s) => `<button class="sort-chip ${ui.sort === s ? 'active' : ''}" data-act="sort" data-sort="${s}">${s}</button>`).join('')}</div>
        ${list.length ? list.map((r) => rCard(r)).join('') : `<div class="empty"><div class="circle">${ic('search', 32)}</div><strong>검색 결과가 없어요</strong>다른 키워드로 검색해 보세요</div>`}
      </section>`;
  }

  /* ================= MAP (frames 지도페이지, 카테고리 선택, 찜목록, 날씨) ================= */
  let map = null, markerLayer = null, meMarker = null;
  function destroyMap() { if (map) { map.remove(); map = null; markerLayer = null; meMarker = null; } }

  function mapFiltered() {
    const m = ui.map;
    return D.RESTAURANTS.filter((r) => (m.cat === 'all' || r.cat === m.cat) && (!m.types.length || m.types.includes(r.type)) && (!m.likedOnly || isLiked(r.id)));
  }

  function renderMap() {
    ui.map ??= { mode: 'list', cat: 'all', types: [], likedOnly: false, sort: '관련도순', selected: null, size: '' };
    current.mount = mountMap;
    return `
      <div class="map-wrap">
        <div id="map"></div>
        <button class="map-search" data-go="search">${img('ic-search-red', 18, 18)}오늘 뭐 먹지?</button>
        <span class="verified">${shieldCheck}<span style="margin-left:4px">서울의 검증된 맛집</span> <b>${D.VERIFIED_COUNT.toLocaleString()}곳</b></span>
        <div class="map-fabs">
          <button class="fab" data-act="map-weather" aria-label="날씨">${ic('cloudSun', 23)}</button>
          <button class="fab" data-act="map-liked" aria-label="찜한 곳만 보기">${ic('heart', 20)}</button>
        </div>
        <button class="fab loc-fab" id="locFab" data-act="map-locate" aria-label="내 위치">${ic('target', 22)}</button>
        <div class="map-sheet ${ui.map.size}" id="mapSheet"></div>
      </div>`;
  }

  function mountMap() {
    renderMapSheet();
    if (!window.L) {
      $('#map').innerHTML = '<div class="map-fallback">지도를 불러오지 못했어요.<br>인터넷 연결을 확인해 주세요.</div>';
      return;
    }
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView(CENTER, 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    map.on('click', () => { if (ui.map.mode === 'detail' || ui.map.mode === 'weather') { ui.map.mode = 'list'; ui.map.selected = null; renderMapSheet(); drawMarkers(); } });
    drawMarkers();
    if (ui.map.selected) { const r = byId(ui.map.selected); map.setView([r.lat, r.lng], 16); }
    setTimeout(() => map && map.invalidateSize(), 50);
  }

  function drawMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    mapFiltered().forEach((r) => {
      const sel = ui.map.selected === r.id;
      const icon = L.divIcon({ className: '', html: `<div class="pin ${r.cat} ${sel ? 'selected' : ''}" style="--c:${D.CATS[r.cat].color}"><i></i><span>${esc(r.name.split(' ')[0])}</span></div>`, iconSize: [24, 28], iconAnchor: [12, 28] });
      L.marker([r.lat, r.lng], { icon, title: r.name, zIndexOffset: sel ? 1000 : 0 }).on('click', (e) => { L.DomEvent.stopPropagation(e); selectOnMap(r.id); }).addTo(markerLayer);
    });
  }

  function selectOnMap(id) {
    ui.map.selected = id; ui.map.mode = 'detail'; ui.map.size = '';
    renderMapSheet(); drawMarkers();
    const r = byId(id);
    if (map) map.panTo([r.lat - 0.0018, r.lng]);
  }

  function renderMapSheet() {
    const el = $('#mapSheet');
    if (!el) return;
    const m = ui.map;
    // Sheet heights from the design: list/detail 303px, food-type & weather 388px
    const tall = !m.size && (m.mode === 'types' || m.mode === 'weather');
    el.className = `map-sheet ${m.size} ${tall ? 'tall' : ''}`;
    const loc = $('#locFab');
    const h = m.size === 'expanded' ? null : m.size === 'peek' ? 110 : tall ? 388 : 303;
    if (loc) loc.style.bottom = h ? `${h + 16}px` : '-60px';
    const fabs = document.querySelectorAll('.map-fabs .fab');
    fabs[0]?.classList.toggle('on', m.mode === 'weather');
    if (fabs[1]) { fabs[1].classList.toggle('on', m.likedOnly); fabs[1].innerHTML = heartIc(m.likedOnly, 20); }
    const handle = '<button class="sheet-handle" data-act="map-handle" aria-label="목록 펼치기/접기"></button>';
    let body;
    if (m.mode === 'detail') body = mapDetail(byId(m.selected));
    else if (m.mode === 'types') body = mapTypes();
    else if (m.mode === 'weather') body = mapWeather();
    else body = mapList();
    el.innerHTML = handle + `<div class="scroll">${body}</div>`;
    if (m.mode === 'weather') loadWeather();
  }

  const catChips = () => `<div class="cat-row">
    ${[['all', '전체'], ['korean', '한식'], ['world', '세계요리'], ['cafe', '디저트·카페']].map(([k, l]) => `<button class="cat-chip ${ui.map.cat === k ? 'active' : ''}" data-act="map-cat" data-cat="${k}">${k !== 'all' ? `<i class="shape ${k}"></i>` : ''}${l}</button>`).join('')}
  </div>`;

  function mapList() {
    const list = mapFiltered();
    if (ui.map.sort === '평점순') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => distKm(a) - distKm(b));
    const n = ui.map.types.length || D.TYPES.length;
    return `${catChips()}
      <button class="select type-select" data-act="map-types"><span class="l">${dots4()}음식유형<b>전체 ${n}개</b></span>${ic('down', 18, 'stroke-width="2.2"')}</button>
      <div class="filter-row">
        <button class="select" data-act="map-recenter"><span class="l">${ic('pin', 20)}현재 지도 중심</span>${ic('down', 18, 'stroke-width="2.2"')}</button>
        <button class="select" data-act="map-sort"><span class="l">${ic('sort', 20)}${ui.map.sort}</span>${ic('down', 18, 'stroke-width="2.2"')}</button>
      </div>
      ${list.length ? list.map((r) => rCard(r)).join('') : `<div class="empty" style="padding:30px 0"><strong>조건에 맞는 맛집이 없어요</strong>필터를 바꿔 보세요</div>`}`;
  }

  function mapDetail(r) {
    const kakao = (dir) => `https://map.kakao.com/link/${dir}/${encodeURIComponent(r.name)},${r.lat},${r.lng}`;
    const on = isLiked(r.id);
    return `
      <div class="detail-head">
        <div>
          <h2 data-go="r/${r.id}" style="cursor:pointer">${esc(r.name)}</h2>
          <div class="meta">${catMark(r)}${typeDot(r)}</div>
          <div class="open"><b>영업 중</b> · ${r.open} 라스트오더</div>
          <div class="desc">${esc(r.desc)}</div>
        </div>
        <div class="detail-tools">
          <button style="color:${on ? '#FF4E4E' : '#1E1E1E'}" data-act="like" data-id="${r.id}" aria-label="찜하기">${heartIc(on, 17)}</button>
          <button class="x-circle" data-act="map-close-detail" aria-label="닫기">${ic('close', 10, 'stroke-width="3"')}</button>
        </div>
      </div>
      <div class="action-row">
        <a href="${kakao('from')}" target="_blank" rel="noopener"><button>출발</button></a>
        <a href="${kakao('to')}" target="_blank" rel="noopener"><button class="red">도착</button></a>
        <button data-go="reserve/${r.id}">${ic('cal', 17)}예약</button>
        <button data-act="share" data-id="${r.id}">${ic('share', 15)}공유</button>
        <a href="tel:${r.phone}"><button>${icFill('phone', 14)}전화</button></a>
      </div>
      ${thumb(r, `data-go="r/${r.id}"`, 'photo')}`;
  }

  function mapTypes() {
    ui.draftTypes ??= [...ui.map.types];
    return `${catChips()}<div class="sheet-line"></div>
      <div class="type-head"><h3>음식유형 선택</h3><span>복수 선택 가능</span></div>
      <div class="type-grid">${D.TYPES.map((t) => `<button class="type-btn ${ui.draftTypes.includes(t.key) ? 'on' : ''}" style="--dot:${t.color}" data-act="toggle-type" data-type="${t.key}">${t.key}</button>`).join('')}</div>
      <div class="btn-pair"><button class="btn gray" data-act="types-reset">초기화</button><button class="btn" data-act="types-apply">적용하기</button></div>`;
  }

  /* weather (Open-Meteo, no key needed; falls back to sample data) */
  let weatherCache = null;
  const WMO = (c) => (c === 0 ? ['clear', '맑음'] : c <= 2 ? ['partly', '구름 조금'] : c === 3 ? ['partly', '흐림'] : c <= 48 ? ['🌫️', '안개'] : c <= 67 ? ['🌧️', '비'] : c <= 77 ? ['🌨️', '눈'] : c <= 82 ? ['🌦️', '소나기'] : ['⛈️', '뇌우']);
  const wIcon = (code, cls = '') => { const k = WMO(code)[0]; return k.length > 2 ? `<img class="${cls}" src="${UI('weather-icon')}" alt="">` : `<span style="font-size:${cls ? 26 : 60}px;line-height:${cls ? 39 : 94}px">${k}</span>`; };
  function sampleWeather() {
    const h = new Date().getHours();
    return { temp: 24, feels: 24, code: 0, hours: Array.from({ length: 6 }, (_, i) => ({ h: (h + i + 1) % 24, t: [24, 25, 25, 24, 24, 23][i], code: 1 })) };
  }
  function loadWeather() {
    if (weatherCache) return;
    weatherCache = sampleWeather();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CENTER[0]}&longitude=${CENTER[1]}&current=temperature_2m,apparent_temperature,weather_code&hourly=temperature_2m,weather_code&forecast_days=2&timezone=Asia%2FSeoul`;
    fetch(url).then((r) => r.json()).then((j) => {
      const nowStr = `${iso(today())}T${pad(new Date().getHours())}:00`;
      const start = j.hourly.time.findIndex((t) => t > nowStr);
      const hours = Array.from({ length: 6 }, (_, i) => { const k = Math.max(0, start) + i; return { h: Number(j.hourly.time[k].slice(11, 13)), t: Math.round(j.hourly.temperature_2m[k]), code: j.hourly.weather_code[k] }; });
      weatherCache = { temp: Math.round(j.current.temperature_2m), feels: Math.round(j.current.apparent_temperature), code: j.current.weather_code, hours };
      if (ui.map?.mode === 'weather') renderMapSheet();
    }).catch(() => { /* keep sample data */ });
  }
  function mapWeather() {
    const w = weatherCache || sampleWeather();
    const d = new Date();
    const good = w.code <= 3 && w.temp >= 10 && w.temp <= 28;
    return `
      <div class="weather-top"><b>서울 강남구</b><small>${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일</small></div>
      <div class="weather-now">
        <div class="temp">${wIcon(w.code)}${w.temp}°</div>
        <div class="desc">${WMO(w.code)[1]}</div>
        <div class="sub"><span>체감온도 ${w.feels}°</span><span>미세먼지 좋음</span></div>
        <div class="tip">${good ? '오늘은 야외 맛집도 좋아요!' : w.code >= 51 ? '오늘은 실내 맛집을 추천해요!' : '따뜻한 국물 요리 어떠세요?'}</div>
      </div>
      <div class="hourly">
        <div class="hourly-head">시간대별<span>날씨 더보기</span></div>
        <div class="hourly-row">${w.hours.map((x) => `<div><span>${x.h}시</span>${wIcon(x.code, 'sm')}<b>${x.t}°</b></div>`).join('')}</div>
      </div>`;
  }

  /* ================= RESTAURANT DETAIL (not in the design) ================= */
  function renderRestaurant({ id }) {
    const r = byId(id);
    if (!r) return '<div class="empty">맛집을 찾을 수 없어요</div>';
    const kakao = `https://map.kakao.com/link/to/${encodeURIComponent(r.name)},${r.lat},${r.lng}`;
    return `
      <div class="r-hero">
        ${thumb(r)}
        <header class="topbar">
          <div class="left"><button class="icon-btn" data-act="back" aria-label="뒤로">${ic('back', 22)}</button></div>
          <div class="right"><button class="icon-btn" data-act="share" data-id="${r.id}" aria-label="공유">${ic('share', 20)}</button></div>
        </header>
      </div>
      <div class="r-body">
        <h1>${esc(r.name)}</h1>
        <div class="meta">${catMark(r)}${typeDot(r)}<span style="font-size:13px;font-weight:700;color:var(--star)">★ ${r.rating}</span><span style="font-size:12px;color:#9A9A9A">리뷰 ${r.reviews}</span></div>
        <p style="font-size:13px;color:#707070;margin-top:10px">${esc(r.desc)}</p>
        <div class="r-quick">
          <button class="${isLiked(r.id) ? 'on' : ''}" data-act="like" data-id="${r.id}">${heartIc(isLiked(r.id), 22)}찜</button>
          <a href="tel:${r.phone}"><button>${ic('phone', 22)}전화</button></a>
          <a href="${kakao}" target="_blank" rel="noopener"><button>${ic('nav', 22)}길찾기</button></a>
          <button data-act="share" data-id="${r.id}">${ic('share', 22)}공유</button>
        </div>
        <div class="info-row"><span class="k">${ic('pin', 16)}주소</span><span class="v" style="font-size:13px">${esc(r.address)}</span></div>
        <div class="info-row"><span class="k">${ic('clock', 16)}영업시간</span><span class="v" style="font-size:13px"><b style="color:#FF4E4E">영업 중</b> · ${r.open} 라스트오더</span></div>
        <div class="info-row"><span class="k">${ic('phone', 16)}전화</span><span class="v" style="font-size:13px">${r.phone}</span></div>
        <div class="info-row"><span class="k">${ic('user', 16)}웨이팅</span><span class="v" style="font-size:13px">${r.waitTeams ? `현재 ${r.waitTeams}팀 · 약 ${r.waitMin}분` : '바로 입장 가능'}</span></div>
        <h3 style="font-size:16px;margin:22px 0 4px">대표 메뉴</h3>
        ${r.menu.map(([n, p]) => `<div class="menu-line"><span>${esc(n)}</span><span>${won(p)}</span></div>`).join('')}
      </div>
      <div class="bottom-cta"><div class="cta-pair">
        <button class="btn outline" data-act="wait-for" data-id="${r.id}">웨이팅 확인</button>
        <button class="btn" data-go="reserve/${r.id}">예약하기</button>
      </div></div>`;
  }

  /* ================= RESERVATION TAB MAIN (frame 165) ================= */
  function renderResHome() {
    const list = upcoming().slice(0, 2);
    return `<section class="res-hero">
        <h1 class="page-title" style="padding:12px 0 0">예약</h1>
        <h2>미리 예약하고,<br>웨이팅 없이 편하게 즐겨요!</h2>
        <img src="${UI('illust-reserve')}" width="357" height="166" alt="">
        <button class="btn" style="height:51px" data-go="map">예약할 맛집 찾기</button>
      </section>
      <section class="res-sec">
        <div class="section-head"><h2 class="section-title">내 예약 현황</h2><button class="more-link" data-go="reservations/list">전체보기 ${ic('right', 14, 'stroke-width="2"')}</button></div>
        ${list.length ? list.map((b) => { const r = byId(b.rid); return `<div class="mini-res" data-go="reservation/${b.id}" role="link">
          ${thumb(r)}<div class="t"><div class="row"><b>${esc(r.name)}</b>${statusBadge(b, 'sm')}</div><small>${fmtDot(b.date)} · ${fmtTime(b.time)} · ${b.people}명</small></div></div>`; }).join('')
          : `<div class="empty" style="padding:30px 0"><strong>예정된 예약이 없어요</strong>마음에 드는 맛집을 예약해 보세요</div>`}
        <button class="wait-banner" data-go="waiting"><b>웨이팅이 걱정된다면?</b><small>실시간 웨이팅 현황을 확인하고 지금 바로 입장해보세요!</small><span class="pill">웨이팅 확인하기</span>
          <img src="${UI('illust-waiting')}" alt=""></button>
      </section>`;
  }

  /* ================= RESERVE FORM (frames 145, 142) ================= */
  const SLOTS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
  function slotAvailable(rid, date, slot) {
    if (date === iso(today())) {
      const now = new Date();
      const [h, m] = slot.split(':').map(Number);
      if (h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 60) return false;
    }
    return hash(rid + date + slot) % 4 !== 0;
  }
  function recommendedSlot(rid, date) {
    const pref = ['19:00', '18:30', '19:30', '18:00', '20:00', '17:30', '20:30', '17:00', '21:00', '21:30'];
    return pref.find((s) => slotAvailable(rid, date, s)) || null;
  }

  function renderReserve({ id }) {
    const r = byId(id);
    if (!r) return '<div class="empty">맛집을 찾을 수 없어요</div>';
    if (!ui.res) {
      const d = addDays(today(), 1);
      ui.res = { date: iso(d), month: new Date(d.getFullYear(), d.getMonth(), 1), people: 2, time: null };
      ui.res.time = recommendedSlot(id, ui.res.date);
    }
    const st = ui.res;
    const rec = recommendedSlot(id, st.date);
    let shown = ['17:30', '19:00', '20:30'];
    if (st.time && !shown.includes(st.time)) shown = ['17:30', st.time, '20:30'].sort();
    return `
      ${topbar('예약하기', { cls: 'pink' })}
      <div class="res-head">
        <h2>${esc(r.name)}</h2>
        <div class="meta-line">${D.CATS[r.cat].label} · ${r.type}<span class="star">★<b>${r.rating}</b></span></div>
        <p>${esc(r.desc)}</p>
      </div>
      <div class="cal-card">${calendar(st)}</div>
      <i class="cal-dot"></i>
      <div class="label-row"><h3>시간 선택</h3><button data-act="time-sheet" data-id="${id}">다른 시간 보기 ›</button></div>
      <div class="time-row">${shown.map((s) => {
        const ok = slotAvailable(id, st.date, s);
        return `<button class="time-chip ${st.time === s ? 'sel' : ''}" data-act="pick-time" data-time="${s}" ${ok ? '' : 'disabled'}>${s === rec ? '<span class="rec">추천</span>' : ''}${fmtTime(s)}</button>`;
      }).join('')}</div>
      <button class="guest" data-act="people-sheet">
        <span class="l"><span class="ico-circle">${ic('user', 20)}</span><span><small>인원</small><strong>${st.people}명</strong></span></span>${ic('down', 20, 'stroke-width="2.2"')}
      </button>
      ${rec ? `<div class="tip-box"><b>${fmtTime(rec)}이 가장 여유로워요!</b><span>이 시간대에는 조용하고 편안한 식사가 가능해요.</span></div>` : '<div class="tip-box"><b>이 날은 예약이 모두 찼어요</b><span>다른 날짜를 선택해 주세요.</span></div>'}
      <div class="res-bottom">
        <div class="summary">
          <div>${ic('calPlain', 15, 'stroke-width="2"')}${fmtDateShort(st.date)}</div>
          <div>${ic('clock', 15, 'stroke-width="2"')}${st.time ? fmtTime(st.time) : '시간 선택'}</div>
          <div>${ic('user', 15, 'stroke-width="2"')}${st.people}명</div>
        </div>
        <button class="btn" data-act="confirm-res" data-id="${id}" ${st.time ? '' : 'disabled'}>예약 확정하기</button>
      </div>`;
  }

  function calendar(st) {
    const m = st.month, y = m.getFullYear(), mo = m.getMonth();
    const first = new Date(y, mo, 1).getDay();
    const days = new Date(y, mo + 1, 0).getDate();
    const prevDays = new Date(y, mo, 0).getDate();
    const t = today(), max = addDays(t, 60);
    const canPrev = new Date(y, mo, 1) > t;
    const canNext = new Date(y, mo + 1, 1) <= max;
    let cells = '';
    for (let i = 0; i < first; i++) cells += `<span class="day other">${prevDays - first + 1 + i}</span>`;
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, mo, d), s = iso(date), wd = date.getDay();
      const dis = date < t || date > max;
      cells += `<button class="day ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''} ${s === st.date ? 'sel' : ''}" data-act="pick-date" data-date="${s}" ${dis ? 'disabled' : ''}>${d}</button>`;
    }
    const tail = (7 - ((first + days) % 7)) % 7;
    for (let i = 1; i <= tail; i++) cells += `<span class="day other">${i}</span>`;
    return `<div class="cal-head">
        <button data-act="cal-month" data-dir="-1" ${canPrev ? '' : 'disabled'} aria-label="이전 달">${ic('back', 20, 'stroke-width="2.2"')}</button>
        <strong>${y !== t.getFullYear() ? y + '년 ' : ''}${mo + 1}월</strong>
        <button data-act="cal-month" data-dir="1" ${canNext ? '' : 'disabled'} aria-label="다음 달">${ic('right', 20, 'stroke-width="2.2"')}</button>
      </div>
      <div class="cal-grid">${WD.map((w) => `<span class="wd">${w}</span>`).join('')}${cells}</div>`;
  }

  function timeSheet(id) {
    const st = ui.res, rec = recommendedSlot(id, st.date);
    openSheet(`
      <button class="icon-btn close" data-act="close-sheet" aria-label="닫기">${ic('close', 20, 'stroke-width="1.6"')}</button>
      <h3>예약 가능 시간</h3>
      <p class="sheet-sub">${fmtDate(st.date)} · ${st.people}명</p>
      <div class="time-grid">${SLOTS.map((s) => {
        const ok = slotAvailable(id, st.date, s);
        return `<button class="time-chip ${st.time === s ? 'sel' : ''}" data-act="pick-time" data-time="${s}" data-sheet="1" ${ok ? '' : 'disabled'}>${s === rec ? '<span class="rec">추천</span>' : ''}${fmtTime(s)}</button>`;
      }).join('')}</div>
      <div class="summary"><div>${ic('calPlain', 15, 'stroke-width="2"')}${fmtDateShort(st.date)}</div><div>${ic('clock', 15, 'stroke-width="2"')}${st.time ? fmtTime(st.time) : '-'}</div><div>${ic('user', 15, 'stroke-width="2"')}${st.people}명</div></div>
      <button class="btn big" data-act="confirm-res" data-id="${id}" ${st.time ? '' : 'disabled'}>예약 확정하기</button>`);
  }

  function peopleSheet() {
    const n = ui.res.people;
    openSheet(`
      <button class="icon-btn close" data-act="close-sheet" aria-label="닫기">${ic('close', 22)}</button>
      <h3>인원 선택</h3><p class="sheet-sub">최대 8명까지 예약할 수 있어요</p>
      <div class="stepper">
        <button data-act="people" data-d="-1" ${n <= 1 ? 'disabled' : ''} aria-label="줄이기">−</button>
        <strong>${n}명</strong>
        <button data-act="people" data-d="1" ${n >= 8 ? 'disabled' : ''} aria-label="늘리기">+</button>
      </div>
      <button class="btn" data-act="close-sheet">확인</button>`);
  }

  function confirmReservation(id) {
    const st = ui.res;
    if (!st?.time) return;
    const d = parseIso(st.date);
    const b = { id: 'b' + Date.now(), rid: id, date: st.date, time: st.time, people: st.people, status: 'confirmed', code: `DD-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(hash(id + Date.now()) % 10000).padStart(4, '0')}` };
    S.reservations.push(b);
    save('reservations');
    closeSheet();
    go('reserved/' + b.id, true);
  }

  // Info card used by the done / cancelled screens (frames 149, 143)
  function resInfoCard(b, { cancelled = false } = {}) {
    const r = byId(b.rid);
    return `<div class="info-card">
      ${statusBadge(b)}
      <h3>${esc(r.name)}</h3>
      <div class="area">${district(r)} · ${D.CATS[r.cat].label}</div>
      ${resRows(b, cancelled)}
    </div>`;
  }
  const resRows = (b, cancelled = false) => `<div class="rows-top">
      <div class="info-row"><span class="k">${ic('calPlain', 16, 'stroke-width="1.8"')}${cancelled ? '방문 예정일' : '방문 날짜'}</span><span class="v">${fmtDate(b.date)}</span></div>
      <div class="info-row"><span class="k">${ic('clock', 16, 'stroke-width="1.8"')}${cancelled ? '방문 예정 시간' : '방문 시간'}</span><span class="v">${fmtTime(b.time)}</span></div>
      <div class="info-row"><span class="k">${ic('user', 16, 'stroke-width="1.8"')}예약 인원</span><span class="v">${b.people}명</span></div></div>
      <div class="code-line"></div>
      <div class="info-row code"><span class="k">예약번호</span><span class="v">${b.code}</span></div>`;
  const closeX = (to) => `<button class="icon-btn" data-go-replace="${to}" aria-label="닫기">${ic('close', 16, 'stroke-width="2"')}</button>`;

  function renderReserved({ bid }) {
    const b = S.reservations.find((x) => x.id === bid);
    if (!b) return '<div class="empty">예약을 찾을 수 없어요</div>';
    return `${topbar('예약 완료', { backTo: 'reservations', right: closeX('reservations') })}
      <div class="done-hero">${img('done-check', 72, 72)}<h2>예약이 완료됐어요!</h2><p>두디와 함께 맛있는 시간을 보내세요.</p></div>
      ${resInfoCard(b)}
      <div class="notice-box"><b>방문 전에 한 번 더 확인해요</b>변경·취소 안내는 예약 상세에서 확인할 수 있어요.</div>
      <div class="done-actions">
        <button class="btn" data-go-replace="reservation/${b.id}">내 예약 확인하기</button>
        <button class="link-btn" data-go-replace="reservations">예약 메인으로</button>
      </div>`;
  }

  /* ================= MY RESERVATIONS (frames 146-148) ================= */
  function renderReservations() {
    ui.tab ??= 'up';
    const tabs = [['up', '예정'], ['past', '지난 예약'], ['cancel', '취소']];
    let list, title, empty;
    if (ui.tab === 'up') { list = upcoming(); title = '다가오는 맛있는 약속'; empty = '예정된 예약이 없어요'; }
    else if (ui.tab === 'past') { list = S.reservations.filter((b) => resStatus(b) === 'visited').sort((a, b) => b.date.localeCompare(a.date)); title = '지난 맛있는 약속'; empty = '지난 예약이 없어요'; }
    else { list = S.reservations.filter((b) => resStatus(b) === 'cancelled'); title = '아쉽게 취소된 약속'; empty = '취소된 예약이 없어요'; }
    const hasPending = ui.tab === 'up' && list.some((b) => resStatus(b) === 'pending');
    return `<div style="min-height:100dvh;display:flex;flex-direction:column">
      ${topbar('내 예약 현황', { backTo: 'reservations' })}
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="res-tab" data-tab="${k}">${l}</button>`).join('')}</div>
      <section class="list-sec" style="flex:1">
        <h2>${title}</h2>
        ${list.length ? list.map((b) => {
          const r = byId(b.rid);
          return `<div class="res-card">
            <div class="top"><h4>${esc(r.name)}</h4>${statusBadge(b)}</div>
            <div class="area">${r.area2} · ${D.CATS[r.cat].label}</div>
            <div class="when">${img('ic-calendar', 14, 14)}${fmtDate(b.date)} · ${fmtTime(b.time)} · ${b.people}명</div>
            <button class="go" data-go="reservation/${b.id}">예약 상세 보기${ic('right', 14, 'stroke-width="2"')}</button>
          </div>`;
        }).join('') : `<div class="empty"><div class="circle">${img('ic-calendar', 30, 30)}</div><strong>${empty}</strong>마음에 드는 맛집을 예약해 보세요</div>`}
        ${hasPending ? '<div class="notice-box"><b>예약 대기 중인 일정이 있어요</b>매장에서 확정하면 예약 상태가 변경돼요.</div>' : ''}
      </section>
      <div class="bottom-cta"><button class="btn" data-go="map">예약할 맛집 찾기</button></div>
    </div>`;
  }

  function renderReservationDetail({ bid }) {
    const b = S.reservations.find((x) => x.id === bid);
    if (!b) return '<div class="empty">예약을 찾을 수 없어요</div>';
    const r = byId(b.rid), stt = resStatus(b), canCancel = ['confirmed', 'pending'].includes(stt);
    return `${topbar('예약 상세', { backTo: 'reservations/list' })}
      <div style="padding:16px 30px 0 28px">
        ${statusBadge(b)}
        <button data-go="r/${r.id}" style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-top:14px"><b style="font-size:18px;line-height:21px">${esc(r.name)}</b>${ic('right', 14, 'stroke-width="2"')}</button>
        <div style="font-size:12px;line-height:14px;color:var(--sub);margin-top:9px">${district(r)} · ${D.CATS[r.cat].label}</div>
      </div>
      <div class="info-card" style="margin-top:22px;padding-top:18px"><div class="title">예약 정보</div>${resRows(b)}</div>
      <div class="guide"><b>방문 안내</b>예약 시간에 맞춰 매장에 방문해주세요.<br>방문이 어려워졌다면 미리 예약을 취소해주세요.</div>
      ${canCancel ? `<div class="notice-box gray"><b>${ic('info', 14, 'stroke-width="2"')}예약 취소 안내</b>취소한 예약은 되돌릴 수 없어요.<br>다시 방문하려면 새로운 예약을 진행해주세요.</div>` : ''}
      <div class="btn-stack">
        <button class="btn" data-go="r/${r.id}">매장 상세 보기</button>
        ${canCancel ? `<button class="btn outline" data-act="cancel-ask" data-id="${b.id}">예약 취소</button>` : ''}
      </div>`;
  }

  function renderCancelled({ bid }) {
    const b = S.reservations.find((x) => x.id === bid);
    if (!b) return '<div class="empty">예약을 찾을 수 없어요</div>';
    return `${topbar('예약 취소 완료', { noBack: true, right: closeX('reservations/list') })}
      <div class="done-hero">${img('cancel-check', 72, 72)}<h2>예약이 취소됐어요</h2><p>다음에 더 맛있는 만남으로 함께해요.</p></div>
      ${resInfoCard(b, { cancelled: true })}
      <div class="notice-box"><b>취소 내역도 확인할 수 있어요</b>내 예약 현황의 ‘취소’ 탭에 보관돼요.</div>
      <div class="done-actions">
        <button class="btn" data-go-replace="map">다른 맛집 찾아보기</button>
        <button class="link-btn" data-go-replace="reservations/list">내 예약 현황으로</button>
      </div>`;
  }

  /* ================= WAITING (frames 150, 152) ================= */
  function renderWaiting() {
    ui.wq ??= '';
    current.mount = () => {
      const input = $('#wq');
      input.addEventListener('input', () => { ui.wq = input.value; $('#wClear').hidden = !ui.wq; $('#wBox').classList.toggle('filled', !!ui.wq); $('#waitBody').innerHTML = waitBody(); });
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const q = input.value.trim();
        if (q) { S.waitRecent = [q, ...S.waitRecent.filter((x) => x !== q)].slice(0, 6); save('waitRecent'); }
        input.blur();
      });
    };
    return `<div style="min-height:100dvh;display:flex;flex-direction:column">
      ${topbar('웨이팅 확인', { backTo: 'reservations' })}
      <h2 class="wait-title">확인하고 싶은 맛집을<br>검색해주세요</h2>
      <label class="wait-input ${ui.wq ? 'filled' : ''}" id="wBox">${img('ic-search-red', 17, 17)}
        <input id="wq" type="search" enterkeyhint="search" placeholder="맛집 이름을 입력해주세요" value="${esc(ui.wq)}" autocomplete="off">
        <button class="clear-btn" id="wClear" data-act="wait-clear" ${ui.wq ? '' : 'hidden'} aria-label="지우기">${ic('close', 12, 'stroke-width="2.4"')}</button>
      </label>
      <div id="waitBody" style="flex:1;display:flex;flex-direction:column">${waitBody()}</div>
    </div>`;
  }
  function waitBody() {
    if (!ui.wq.trim()) {
      return `<section class="wait-recent">
        <div class="kw-head"><h3>최근 검색</h3>${S.waitRecent.length ? '<button data-act="wait-recent-clear">전체 삭제</button>' : ''}</div>
        <div class="chips">${S.waitRecent.map((k) => `<button class="chip white" data-act="wait-kw" data-q="${esc(k)}">${esc(k)}<span class="x" data-act="wait-del" data-q="${esc(k)}">${ic('close', 9, 'stroke-width="2.6"')}</span></button>`).join('')}</div>
      </section>
      <div class="empty" style="flex:1;padding-top:71px"><div class="circle">${img('ic-search-red', 30, 30)}</div><strong>줄 서기 전에, 먼저 확인해요</strong>맛집의 대기 팀 수와 예상 대기 시간을<br>한눈에 확인할 수 있어요.</div>
      <div class="notice-box" style="margin-bottom:28px"><b>두디가 알려드려요</b>웨이팅 정보를 제공하는 매장만 확인할 수 있어요.</div>`;
    }
    const list = searchRestaurants(ui.wq);
    if (!list.length) return `<div class="empty"><strong>검색 결과가 없어요</strong>맛집 이름을 다시 확인해 주세요</div>`;
    ui.waitAt ??= new Date();
    const at = ui.waitAt;
    return `<section class="list-sec" style="padding-top:22px;flex:1">
      <div class="kw-head" style="margin-bottom:0"><h3 style="font-size:14px">검색 결과 ${list.length}</h3><span style="font-size:12px">매장을 확인해주세요</span></div>
      ${list.map((r) => {
        const jitter = (hash(r.id + at.getMinutes()) % 3) - 1;
        const teams = Math.max(0, r.waitTeams + (r.waitTeams ? jitter : 0));
        const mins = teams ? Math.max(5, Math.round((r.waitMin * teams) / Math.max(1, r.waitTeams))) : 0;
        return `<div class="wait-card">
          <div class="top"><h4>${esc(r.name)}</h4><span class="badge">영업 중</span></div>
          <div class="area">${district(r)} · ${D.CATS[r.cat].label}</div>
          <div class="wait-stats"><div><small>현재 대기</small><strong>${teams}팀</strong></div><div><small>예상 대기 시간</small><strong>약 ${mins}분</strong></div></div>
          <div class="wait-foot"><span>${fmtTime(`${pad(at.getHours())}:${pad(at.getMinutes())}`)} 기준</span><button data-act="wait-refresh">${ic('refresh', 12, 'stroke-width="2.2"')}새로고침</button></div>
          <div class="wait-warn">${ic('info', 12, 'stroke-width="2.2"')}대기 시간은 매장 상황에 따라 달라질 수 있어요.</div>
        </div>`;
      }).join('')}
      <div class="notice-box" style="margin:24px 0 0"><b>찾던 맛집이 맞나요?</b>매장 상세에서 위치와 운영 정보를 확인해보세요.</div>
    </section>
    <div class="bottom-cta"><button class="btn" data-go="r/${list[0].id}">매장 상세 보기</button></div>`;
  }

  /* ================= LIKES (frames 153, 134, 137, 135) ================= */
  const colThumbR = (c) => byId(c.ids[0]) || D.RESTAURANTS[0];
  // Design-provided cover/collage images (also for lists saved before they existed).
  const seedCol = (c) => D.COLLECTIONS.find((x) => x.id === c.id) || {};
  const colCover = (c) => { const src = c.cover || seedCol(c).cover; return src ? imgThumb(src) : thumb(colThumbR(c)); };
  function colItems(cols, { chevron = true } = {}) {
    return cols.map((c) => `<button class="col-item ${chevron ? '' : 'plain'}" data-go="collection/${c.id}">${colCover(c)}<span class="txt"><b>${esc(c.name)}</b><small>${c.ids.length}곳</small></span>${chevron ? `<span class="chev">${ic('right', 14, 'stroke-width="2.2"')}</span>` : ''}</button>`).join('');
  }

  function renderLikes() {
    const cols = [...S.collections].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return `<div class="likes-top">
        <div class="t">찜</div>
        <h2>내가 찜한 맛집,<br>내 <em>입맛의 보물창고!</em></h2>
        <button class="likes-count" data-go="collection/liked"><small>찜한 맛집</small><strong>${S.likes.length}</strong></button>
      </div>
      <img class="likes-illust" src="${UI('illust-likes')}" width="357" height="201" alt="">
      <section class="likes-list">
        <div class="section-head"><h2 class="section-title">내 찜 리스트</h2><button class="more-link" data-go="likes/all">전체보기 ${ic('right', 14, 'stroke-width="2"')}</button></div>
        ${cols.length ? colItems(cols.slice(0, 3)) : '<p style="font-size:13px;color:#9A9A9A">아직 만든 리스트가 없어요</p>'}
        <button class="btn outline-red likes-new" data-act="new-col">+ 새 찜 리스트 만들기</button>
      </section>`;
  }

  function renderLikesAll() {
    ui.tab ??= 'all';
    let body;
    if (ui.tab === 'all') {
      const liked = { id: 'liked', name: '내가 찜한 맛집', ids: S.likes };
      body = `<button class="sort-btn">최근 찜한 순 ${ic('down', 14, 'stroke-width="1.8"')}</button>${colItems([...S.collections, liked], { chevron: false })}`;
    } else {
      const ids = [...new Set(S.reservations.filter((b) => resStatus(b) === 'visited').map((b) => b.rid))];
      body = ids.length ? `<div style="height:16px"></div>${ids.map((id) => rCard(byId(id))).join('')}` : '<div class="empty"><strong>아직 방문한 곳이 없어요</strong>예약 후 방문하면 여기에 모여요</div>';
    }
    return `<div class="likes-head">${topbar('찜한 맛집', { style: 'arrow', backTo: 'likes', right: '<button class="text-btn" data-go="likes/edit">편집</button>' })}
      <div class="tabs bold" style="--n:2">${[['all', '전체'], ['visited', '방문한 곳']].map(([k, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="res-tab" data-tab="${k}">${l}</button>`).join('')}</div></div>
      <div style="padding:0 24px 30px">${body}</div>`;
  }

  function renderLikesEdit() {
    ui.sel ??= [];
    return `<div style="min-height:100dvh;display:flex;flex-direction:column">
      ${topbar('편집', { noBack: true, right: '<button class="text-btn" data-act="back" data-fallback="likes">완료</button>' })}
      <div style="flex:1;padding:0 24px">
        <button style="font-size:12px;color:var(--text2);margin:15px 0 27px -4px" data-act="sel-all">전체선택</button>
        ${S.collections.map((c) => `<div class="col-item plain" style="gap:16px;margin-top:5px">
          <button class="check ${ui.sel.includes(c.id) ? 'on' : ''}" data-act="sel-col" data-id="${c.id}" aria-label="선택">${ic('check', 12, 'stroke-width="3.4"')}</button>
          ${colCover(c)}<span class="txt"><b>${esc(c.name)}</b><small>${c.ids.length}곳</small></span>
          <button class="icon-btn pin-ico ${c.pinned ? 'on' : ''}" style="width:33px;height:33px" data-act="pin-col" data-id="${c.id}" aria-label="상단 고정">${c.pinned ? icFill('tack', 20) : ic('tack', 20)}</button>
        </div>`).join('') || '<div class="empty">리스트가 없어요</div>'}
      </div>
      <button class="delete-bar" data-act="del-cols" ${ui.sel.length ? '' : 'disabled'}>${ui.sel.length ? `<span class="n">${ui.sel.length}</span>` : ''}삭제</button>
    </div>`;
  }

  function renderCollection({ id }) {
    const c = id === 'liked' ? { id: 'liked', name: '내가 찜한 맛집', ids: S.likes, virtual: true } : S.collections.find((x) => x.id === id);
    if (!c) return `${topbar('찜 리스트', { backTo: 'likes' })}<div class="empty">리스트를 찾을 수 없어요</div>`;
    let rs = c.ids.map(byId).filter(Boolean);
    if (ui.near) rs = [...rs].sort((a, b) => distKm(a) - distKm(b));
    const collage = c.collage || seedCol(c).collage;
    return `${topbar(esc(c.name), { style: 'arrow', backTo: 'likes', cls: 'pink', right: c.virtual ? '' : `<button class="text-btn" data-act="rename-col" data-id="${c.id}">편집</button>` })}
      ${collage ? `<div class="collage-card">${collage.map((src) => imgThumb(src)).join('')}</div>`
        : rs.length ? `<div class="collage-card">${rs.slice(0, 4).map((r) => thumb(r)).join('')}</div>` : ''}
      <div class="col-tools">
        <button class="toggle ${ui.near ? 'on' : ''}" data-act="toggle-near"><span>거리순</span><i></i></button>
        <div class="r">${c.virtual ? '' : `<button data-act="rename-col" data-id="${c.id}">${ic('pen', 10, 'stroke-width="2"')}편집</button>`}<button data-act="share-col" data-id="${c.id}">${ic('share', 10, 'stroke-width="2"')}공유</button></div>
      </div>
      ${rs.length ? rs.map((r) => `<div class="col-r" data-go="r/${r.id}" role="link">
        <div class="head"><div><h4>${esc(r.name)}</h4><div class="area">${esc(r.cuisine || r.type)}</div></div>
        ${c.virtual ? `<button style="color:#FF4E4E" data-act="like" data-id="${r.id}" aria-label="찜 해제">${icFill('heart', 18)}</button>` : `<button style="color:#BBB" data-act="remove-from-col" data-col="${c.id}" data-id="${r.id}" aria-label="리스트에서 빼기">${ic('close', 16)}</button>`}</div>
        <div class="rate">${icFill('star', 18)}${r.rating} (${r.reviews}건)</div>
        <div class="pics">${[0, 1, 2, 3].map((i) => thumb(r, '', '', i)).join('')}</div>
      </div>`).join('') : '<div class="empty"><strong>담긴 맛집이 없어요</strong>지도나 검색에서 하트를 눌러 담아보세요</div>'}
      ${c.virtual ? '' : `<div style="padding:4px 20px 24px"><button class="btn outline-red" style="height:48px;font-size:14px" data-act="add-to-col" data-id="${c.id}">+ 찜한 맛집에서 추가하기</button></div>`}`;
  }

  function colNameSheet(title, value, act, id = '') {
    openSheet(`<button class="icon-btn close" data-act="close-sheet" aria-label="닫기">${ic('close', 22)}</button>
      <h3>${title}</h3><p class="sheet-sub">리스트 이름은 20자까지 쓸 수 있어요</p>
      <div class="field" style="padding:0 0 16px"><input id="colName" maxlength="20" value="${esc(value)}" placeholder="예: 주말 브런치 맛집"></div>
      <button class="btn" data-act="${act}" data-id="${id}">저장</button>`);
    setTimeout(() => $('#colName')?.focus(), 250);
  }

  /* ================= MY (frame 164) ================= */
  function renderMy() {
    const p = S.profile, up = upcoming()[0];
    const avatar = p.avatar ? `<div class="avatar" style="background-image:url(${p.avatar})"></div>` : `<div class="avatar">${icFill('user', 34)}</div>`;
    const menu = [['ic-notice', '공지사항', 'notice'], ['ic-faq', '자주 묻는 질문', 'faq'], ['ic-support', '고객센터', 'support'], ['ic-privacy', '개인정보 처리방침', 'privacy'], ['ic-terms', '약관 및 정책', 'terms']];
    const when = up ? `${up.date === iso(today()) ? '오늘' : fmtDateShort(up.date)}, ${fmtTime(up.time)}` : '';
    return `<div class="my-hero">
        <div class="t">마이페이지</div>
        <div class="profile">${avatar}<div><b>${esc(p.nick)} <span>님</span></b><small>${esc(p.bio || '프로필을 완성해보세요')}</small><button class="edit" data-go="my/edit">프로필 수정</button></div></div>
      </div>
      <div class="my-gray">
        <div class="stats">
          <button data-go="reservations/list">${ic('cal', 20)}<span>예약</span><strong>${upcoming().length}</strong></button>
          <button data-go="waiting">${ic('clock', 20)}<span>웨이팅</span><strong>${S.waitRecent.length}</strong></button>
          <button data-go="collection/liked">${ic('heart', 20)}<span>찜</span><strong>${S.likes.length}</strong></button>
          <button data-act="soon">${ic('starBox', 20)}<span>리뷰</span><strong>7</strong></button>
        </div>
        <h3>다가오는 예약</h3>
        ${up ? (() => { const r = byId(up.rid); return `<button class="upcoming" data-go="reservation/${up.id}">${thumb(r)}<span class="txt"><span class="when">${when}</span><b>${esc(r.name)}</b><small>${up.people}명</small></span>${statusBadge(up, 'sm')}${ic('right', 14, 'stroke-width="2" style="color:#555;margin-left:-14px"')}</button>`; })() : '<div class="upcoming" style="color:#9A9A9A;font-size:13px;justify-content:center">다가오는 예약이 없어요</div>'}
      </div>
      <div class="menu-list">
        ${menu.map(([i, l, path]) => `<button class="menu-item" data-go="${path}">${img(i, 24, 24)}<span class="grow">${l}</span>${ic('right', 14, 'stroke-width="2"')}</button>`).join('')}
        <button class="menu-item" data-act="soon">${img('ic-version', 24, 24)}<span class="grow">현재 버전 1. 0. 0</span>${ic('right', 14, 'stroke-width="2"')}</button>
      </div>`;
  }

  function renderProfileEdit() {
    ui.draft ??= { ...S.profile };
    const p = ui.draft;
    current.mount = () => {
      ['nick', 'bio', 'region'].forEach((k) => $('#f-' + k).addEventListener('input', (e) => { p[k] = e.target.value; if (k === 'bio') $('#bioCount').textContent = `${p.bio.length}/40자`; }));
    };
    return `<div style="min-height:100dvh;display:flex;flex-direction:column">
      <div class="edit-cover" style="${p.cover ? `background-image:url(${p.cover})` : ''}">
        ${topbar('프로필 수정', { style: 'left', cls: 'clear', backTo: 'my' })}
        <button class="pen" data-act="img-sheet" data-kind="cover" aria-label="배경 이미지 변경">${ic('pen', 10, 'stroke-width="2"')}</button>
      </div>
      <div class="edit-avatar">
        ${p.avatar ? `<div class="avatar" style="background-image:url(${p.avatar})"></div>` : `<div class="avatar" style="background:#EDEDED">${icFill('user', 50)}</div>`}
        <button class="pen" data-act="img-sheet" data-kind="avatar" aria-label="프로필 이미지 변경">${ic('pen', 13, 'stroke-width="2"')}</button>
      </div>
      <div style="flex:1;padding-top:3px">
        <div class="field"><label for="f-nick">닉네임</label><input id="f-nick" maxlength="12" value="${esc(p.nick)}"></div>
        <div class="field" style="margin-top:23px"><label for="f-bio">자기소개</label><textarea id="f-bio" rows="4" maxlength="40" placeholder="자신을 알릴 수 있는 소개글을 작성해 주세요.">${esc(p.bio)}</textarea><div class="count" id="bioCount">${p.bio.length}/40자</div></div>
        <div class="field" style="margin-top:4px"><label for="f-region">활동지역</label><div style="position:relative"><span style="position:absolute;left:9px;top:10px;color:#A3A3A3">${ic('pin', 24, 'stroke-width="1.6"')}</span><input id="f-region" style="padding-left:35px;height:44px" value="${esc(p.region)}" placeholder="활동 지역을 자유롭게 입력해주세요."></div></div>
        <div style="height:2px;background:#F4F4F4;margin-top:25px"></div>
      </div>
      <div class="bottom-cta"><button class="btn" data-act="save-profile">저장</button></div>
    </div>`;
  }

  function imgSheet(kind) {
    openSheet(`<h3>${kind === 'avatar' ? '프로필' : '배경'} 이미지 변경</h3>
      <label class="pick-row" style="margin-top:16px;cursor:pointer">${ic('image', 20)}앨범에서 이미지 선택<input type="file" accept="image/*" id="imgFile" data-kind="${kind}" hidden></label>
      ${ui.draft?.[kind] ? `<button class="pick-row" data-act="img-remove" data-kind="${kind}">${ic('close', 20)}기본 이미지로 변경</button>` : ''}
      <button class="btn" data-act="close-sheet">닫기</button>`);
  }
  function readImage(file, maxSide) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, maxSide / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = fr.result;
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  /* ================= INFO PAGES (frames 118-122) ================= */
  function renderNotice() {
    ui.open ??= -1;
    return `${topbar('공지사항', { style: 'left', backTo: 'my', cls: 'divided' })}<div class="list-plain">
      ${D.NOTICES.map((n, i) => `<button class="notice-item" data-act="toggle-open" data-i="${i}"><span class="tag">${n.tag}</span><span class="date">${n.date}</span><span class="title">${esc(n.title)}</span></button>${ui.open === i ? `<div class="notice-body">${esc(n.body)}</div>` : ''}`).join('')}
    </div>`;
  }
  function renderFaq() {
    ui.open ??= '';
    return `${topbar('자주 묻는 질문', { style: 'left', backTo: 'my', cls: 'divided' })}
      ${D.FAQ.map((g, gi) => `<div class="faq-group">${g.group}</div>${g.items.map(([q, a], qi) => {
        const k = gi + '-' + qi, on = ui.open === k;
        return `<button class="faq-q ${on ? 'open' : ''}" data-act="toggle-open" data-i="${k}"><span>Q. ${esc(q)}</span>${ic('down', 22, 'stroke-width="1.8"')}</button>${on ? `<div class="faq-a">${esc(a)}</div>` : ''}`;
      }).join('')}`).join('')}<div style="height:30px"></div>`;
  }
  function renderSupport() {
    return `${topbar('고객센터', { style: 'left', backTo: 'my', cls: 'divided' })}
      <section style="padding:24px 20px 0;border-bottom:1px solid #EDEDED;height:213px">
        ${D.SUPPORT.map((q) => `<button class="gray-item" data-go="faq">${esc(q)}</button>`).join('')}
        <button style="font-size:12px;color:var(--text2);margin:14px 0 0 3px" data-go="faq">더보기</button>
      </section>
      <div style="padding:17px 20px;text-align:center"><button class="btn outline-red" style="width:222px;height:40px;font-size:13px;font-weight:600;margin:0 auto;border-radius:8px" data-go="inquiry">도움이 필요하신가요?</button></div>`;
  }
  function renderInquiry() {
    const opts = [['1 : 1 채팅 (실시간)', 'chat'], ['이메일', 'mail'], ['전화 (통화료 부과)', 'phone']];
    return `${topbar('기타 문의', { style: 'left', backTo: 'support', cls: 'divided' })}
      <section style="padding:30px 19px 0 21px"><h2 style="font-size:16px;line-height:19px;margin:0 0 18px 9px">문의 방법을 선택해주세요.</h2>
      ${opts.map(([l, k]) => `<button class="gray-item" data-act="inquiry" data-k="${k}">${l}</button>`).join('')}</section>`;
  }
  function renderDoc(kind) {
    const privacy = kind === 'privacy';
    const toc = privacy ? ['회원가입 및 회원 관리', '맛집 정보 서비스 제공', '지도 및 위치 서비스', '서비스 이용 관련 서비스 개선', '마케팅 활용'] : ['목적', '용어의 정의', '서비스의 제공', '회원의 의무', '책임의 한계'];
    return `${topbar(privacy ? '세동네 - 개인정보 처리 방침' : '약관 및 정책', { style: 'left', backTo: 'my', cls: 'divided' })}
      <div class="doc">
        <h2>세동네 ${privacy ? '개인정보 처리 방침' : '서비스 이용약관'}</h2>
        <div style="display:flex;justify-content:center">${logo(36)}</div>
        <ol class="toc">${toc.map((t, i) => `<li><b>${i + 1}.</b>${t}</li>`).join('')}</ol>
        <p>시행일자: 2026년 9월 1일</p>
        ${toc.map((t, i) => `<h3>${i + 1}. ${t}</h3><p>${privacy
          ? `세동네는 ${t} 목적으로 필요한 최소한의 개인정보만 처리하며, 목적이 달성되면 지체 없이 파기합니다. 이용자는 언제든지 개인정보 열람·정정·삭제를 요청할 수 있습니다.`
          : `본 조항은 세동네 서비스의 ${t}에 관한 사항을 규정합니다. 회사와 회원은 관계 법령과 본 약관을 준수해야 합니다.`}</p>`).join('')}
        <p style="margin-top:24px;font-size:11px;color:#999">※ 실제 서비스 출시 전 법률 검토를 거친 문서로 교체해야 하는 예시 문구입니다.</p>
      </div>`;
  }

  /* ================= EVENTS ================= */
  async function share(title, text) {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else { await navigator.clipboard.writeText(url); toast('링크를 복사했어요'); }
    } catch { /* user cancelled */ }
  }

  const actions = {
    'back': (el) => back(el.dataset.fallback || 'home'),
    'close-sheet': () => { closeSheet(); if (current.pattern === 'reserve/:id') rerender(); },
    'like': (el) => {
      const id = el.dataset.id;
      toggleLike(id);
      haptic();
      if (current.pattern === 'map') { renderMapSheet(); drawMarkers(); }
      else if (current.pattern === 'search') $('#searchBody').innerHTML = searchBody();
      else rerender();
      if (isLiked(id)) document.querySelectorAll(`[data-act="like"][data-id="${id}"]`).forEach((b) => b.classList.add('pop'));
    },
    'share': (el) => { const r = byId(el.dataset.id); share(r.name, `${r.name} — ${r.desc}`); },
    // search
    'clear-search': (el, e) => { e.preventDefault(); ui.q = ''; rerender(); $('#q').focus(); },
    'kw': (el) => { ui.q = el.dataset.q; addRecent(ui.q); rerender(); },
    'clear-recent': () => { S.recent = []; save('recent'); $('#searchBody').innerHTML = searchBody(); },
    'sort': (el) => { ui.sort = el.dataset.sort; $('#searchBody').innerHTML = searchBody(); },
    // map
    'map-handle': () => { const m = ui.map; m.size = m.size === 'expanded' ? 'peek' : m.size === 'peek' ? '' : 'expanded'; renderMapSheet(); setTimeout(() => map?.invalidateSize(), 320); },
    'map-cat': (el) => { ui.map.cat = el.dataset.cat; if (ui.map.mode !== 'types') ui.map.mode = 'list'; renderMapSheet(); drawMarkers(); },
    'map-types': () => { ui.map.mode = 'types'; ui.draftTypes = [...ui.map.types]; ui.map.size = ''; renderMapSheet(); },
    'toggle-type': (el) => { const t = el.dataset.type; ui.draftTypes = ui.draftTypes.includes(t) ? ui.draftTypes.filter((x) => x !== t) : [...ui.draftTypes, t]; renderMapSheet(); },
    'types-reset': () => { ui.draftTypes = []; renderMapSheet(); },
    'types-apply': () => { ui.map.types = [...ui.draftTypes]; ui.map.mode = 'list'; renderMapSheet(); drawMarkers(); },
    'map-sort': () => { ui.map.sort = ui.map.sort === '관련도순' ? '평점순' : ui.map.sort === '평점순' ? '거리순' : '관련도순'; renderMapSheet(); },
    'map-recenter': () => { map?.setView(CENTER, 16); toast('논현역 중심으로 이동했어요'); },
    'map-liked': () => { ui.map.likedOnly = !ui.map.likedOnly; ui.map.mode = 'list'; renderMapSheet(); drawMarkers(); },
    'map-weather': () => { ui.map.mode = ui.map.mode === 'weather' ? 'list' : 'weather'; ui.map.size = ''; renderMapSheet(); },
    'map-close-detail': () => { ui.map.mode = 'list'; ui.map.selected = null; renderMapSheet(); drawMarkers(); },
    'map-locate': () => {
      if (!navigator.geolocation) { toast('위치 기능을 쓸 수 없어요'); return; }
      toast('현재 위치를 찾는 중…');
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!map) return;
        const ll = [pos.coords.latitude, pos.coords.longitude];
        meMarker?.remove();
        meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
        map.setView(ll, 16);
      }, () => { toast('위치 권한이 없어 논현역 기준으로 보여드려요'); map?.setView(CENTER, 16); }, { timeout: 8000 });
    },
    // reserve
    'pick-date': (el) => { ui.res.date = el.dataset.date; if (!slotAvailable(current.params.id, ui.res.date, ui.res.time || '')) ui.res.time = recommendedSlot(current.params.id, ui.res.date); rerender(); },
    'cal-month': (el) => { const m = ui.res.month; ui.res.month = new Date(m.getFullYear(), m.getMonth() + Number(el.dataset.dir), 1); rerender(); },
    'pick-time': (el) => { ui.res.time = el.dataset.time; if (el.dataset.sheet) timeSheet(current.params.id); else rerender(); },
    'time-sheet': (el) => timeSheet(el.dataset.id),
    'people-sheet': () => peopleSheet(),
    'people': (el) => { ui.res.people = Math.min(8, Math.max(1, ui.res.people + Number(el.dataset.d))); peopleSheet(); },
    'confirm-res': (el) => confirmReservation(el.dataset.id),
    'res-tab': (el) => { ui.tab = el.dataset.tab; rerender(); },
    'cancel-ask': (el) => openSheet(`<h3>예약을 취소할까요?</h3><p class="sheet-sub">취소한 예약은 되돌릴 수 없어요.</p>
      <div class="btn-pair" style="grid-template-columns:1fr 1fr;gap:10px"><button class="btn gray" data-act="close-sheet">돌아가기</button><button class="btn" data-act="cancel-do" data-id="${el.dataset.id}">취소하기</button></div>`),
    'cancel-do': (el) => { const b = S.reservations.find((x) => x.id === el.dataset.id); b.status = 'cancelled'; save('reservations'); closeSheet(); go('cancelled/' + b.id, true); },
    // waiting
    'wait-for': (el) => { pendingUi = { wq: byId(el.dataset.id).name }; go('waiting'); },
    'wait-clear': (el, e) => { e.preventDefault(); ui.wq = ''; rerender(); $('#wq').focus(); },
    'wait-kw': (el) => { ui.wq = el.dataset.q; rerender(); },
    'wait-del': (el, e) => { e.stopPropagation(); S.waitRecent = S.waitRecent.filter((x) => x !== el.dataset.q); save('waitRecent'); $('#waitBody').innerHTML = waitBody(); },
    'wait-recent-clear': () => { S.waitRecent = []; save('waitRecent'); $('#waitBody').innerHTML = waitBody(); },
    'wait-refresh': () => { ui.waitAt = new Date(); $('#waitBody').innerHTML = waitBody(); toast('최신 웨이팅 정보로 바꿨어요'); },
    // likes
    'new-col': () => colNameSheet('새 찜 리스트', '', 'col-create'),
    'col-create': () => {
      const name = $('#colName').value.trim();
      if (!name) { toast('리스트 이름을 입력해 주세요'); return; }
      S.collections.push({ id: 'c' + Date.now(), name, ids: [], pinned: false, public: false });
      save('collections'); closeSheet(); toast('새 리스트를 만들었어요'); rerender();
    },
    'rename-col': (el) => { const c = S.collections.find((x) => x.id === el.dataset.id); colNameSheet('리스트 이름 수정', c.name, 'col-rename', c.id); },
    'col-rename': (el) => {
      const name = $('#colName').value.trim();
      if (!name) { toast('리스트 이름을 입력해 주세요'); return; }
      S.collections.find((x) => x.id === el.dataset.id).name = name;
      save('collections'); closeSheet(); rerender();
    },
    'toggle-near': () => { ui.near = !ui.near; rerender(); },
    'share-col': (el) => { const c = S.collections.find((x) => x.id === el.dataset.id) || { name: '내가 찜한 맛집' }; share(c.name, `세동네 찜 리스트 — ${c.name}`); },
    'remove-from-col': (el) => { const c = S.collections.find((x) => x.id === el.dataset.col); c.ids = c.ids.filter((x) => x !== el.dataset.id); save('collections'); toast('리스트에서 뺐어요'); rerender(); },
    'add-to-col': (el) => {
      const c = S.collections.find((x) => x.id === el.dataset.id);
      const cand = S.likes.filter((id) => !c.ids.includes(id));
      if (!cand.length) { toast('추가할 찜한 맛집이 없어요'); return; }
      openSheet(`<button class="icon-btn close" data-act="close-sheet" aria-label="닫기">${ic('close', 22)}</button><h3>찜한 맛집에서 추가</h3><p class="sheet-sub">탭하면 바로 담겨요</p>
        ${cand.map((id) => { const r = byId(id); return `<button class="col-item plain" data-act="add-one" data-col="${c.id}" data-id="${id}">${thumb(r)}<span class="txt"><b>${esc(r.name)}</b><small>${r.area} · ${r.type}</small></span>${ic('plus', 18)}</button>`; }).join('')}`);
    },
    'add-one': (el) => { const c = S.collections.find((x) => x.id === el.dataset.col); c.ids.push(el.dataset.id); save('collections'); el.remove(); toast('리스트에 담았어요'); rerender(); },
    'sel-col': (el) => { const id = el.dataset.id; ui.sel = ui.sel.includes(id) ? ui.sel.filter((x) => x !== id) : [...ui.sel, id]; rerender(); },
    'sel-all': () => { ui.sel = ui.sel.length === S.collections.length ? [] : S.collections.map((c) => c.id); rerender(); },
    'pin-col': (el) => { const c = S.collections.find((x) => x.id === el.dataset.id); c.pinned = !c.pinned; save('collections'); rerender(); },
    'del-cols': () => { const n = ui.sel.length; S.collections = S.collections.filter((c) => !ui.sel.includes(c.id)); ui.sel = []; save('collections'); toast(`리스트 ${n}개를 삭제했어요`); rerender(); },
    // my
    'img-sheet': (el) => imgSheet(el.dataset.kind),
    'img-remove': (el) => { ui.draft[el.dataset.kind] = null; closeSheet(); rerender(); },
    'save-profile': () => {
      const d = ui.draft;
      if (!d.nick.trim()) { toast('닉네임을 입력해 주세요'); return; }
      S.profile = { ...d, nick: d.nick.trim() };
      try { localStorage.setItem('sd:profile', JSON.stringify(S.profile)); toast('프로필을 저장했어요'); }
      catch { S.profile.cover = null; save('profile'); toast('이미지가 커서 배경은 저장하지 못했어요'); }
      back('my');
    },
    'toggle-open': (el) => { const i = isNaN(el.dataset.i) ? el.dataset.i : Number(el.dataset.i); ui.open = ui.open === i ? -1 : i; rerender(); },
    'inquiry': (el) => { const k = el.dataset.k; if (k === 'phone') location.href = 'tel:15880000'; else if (k === 'mail') location.href = 'mailto:help@sedongne.kr'; else toast('상담 채팅은 준비 중이에요'); },
    'soon': () => toast('준비 중인 기능이에요'),
  };

  let suppressClickUntil = 0;
  document.addEventListener('click', (e) => {
    if (Date.now() < suppressClickUntil) return;
    const act = e.target.closest('[data-act]');
    if (act) { const fn = actions[act.dataset.act]; if (fn) { fn(act, e); return; } }
    const rep = e.target.closest('[data-go-replace]');
    if (rep) { go(rep.dataset.goReplace, true); return; }
    const goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); if (!layer.hidden) closeSheet(); go(goEl.dataset.go); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[role="link"][data-go]')) go(e.target.dataset.go);
    if (e.key === 'Escape' && !layer.hidden) closeSheet();
  });
  document.addEventListener('change', async (e) => {
    if (e.target.id !== 'imgFile' || !e.target.files[0]) return;
    const kind = e.target.dataset.kind;
    try {
      ui.draft[kind] = await readImage(e.target.files[0], kind === 'avatar' ? 300 : 900);
      closeSheet(); rerender();
    } catch { toast('이미지를 불러오지 못했어요'); }
  });

  /* ---------- gestures ---------- */
  // Map sheet follows the finger and snaps to peek / normal / expanded.
  // Modal sheets can be dragged down by their grab area and dismissed past 90px (or a fast flick).
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.map-sheet .sheet-handle');
    if (handle) {
      const el = $('#mapSheet');
      drag = { kind: 'map', el, y: e.clientY, t: Date.now(), h0: el.getBoundingClientRect().height, moved: false };
      el.style.transition = 'none';
      return;
    }
    const grab = !layer.hidden && e.target.closest('.sheet') && (e.target.closest('.grab') || e.clientY - sheet.getBoundingClientRect().top < 56);
    if (grab && !e.target.closest('input, textarea, .close')) {
      drag = { kind: 'sheet', y: e.clientY, t: Date.now(), moved: false };
      sheet.style.transition = 'none';
    }
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 4) drag.moved = true;
    if (drag.kind === 'map') {
      const max = drag.el.parentElement.getBoundingClientRect().height - 60;
      drag.el.style.height = Math.max(90, Math.min(max, drag.h0 - dy)) + 'px';
    } else {
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    }
  });
  document.addEventListener('pointercancel', () => {
    if (!drag) return;
    if (drag.kind === 'map') { drag.el.style.transition = ''; drag.el.style.height = ''; } else { sheet.style.transition = ''; sheet.style.transform = ''; }
    drag = null;
  });
  document.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    const dy = e.clientY - d.y;
    const flick = Math.abs(dy) / Math.max(1, Date.now() - d.t) > 0.6; // px per ms
    if (d.kind === 'map') {
      d.el.style.transition = '';
      d.el.style.height = '';
      if (!d.moved || !ui.map) return;
      const h = d.h0 - dy, wrapH = d.el.parentElement.getBoundingClientRect().height;
      const base = ui.map.mode === 'types' || ui.map.mode === 'weather' ? 388 : 303;
      const snaps = [['peek', 110], ['', base], ['expanded', wrapH - 60]];
      let pick = snaps.reduce((a, b) => (Math.abs(b[1] - h) < Math.abs(a[1] - h) ? b : a));
      if (flick) { const i = snaps.findIndex((s) => s[0] === ui.map.size); pick = snaps[Math.max(0, Math.min(2, i + (dy < 0 ? 1 : -1)))]; }
      ui.map.size = pick[0];
      renderMapSheet();
      setTimeout(() => map?.invalidateSize(), 320);
    } else {
      sheet.style.transition = '';
      if (dy > 90 || (flick && dy > 20)) { closeSheet(); if (current.pattern === 'reserve/:id') setTimeout(rerender, 230); }
      else sheet.style.transform = '';
    }
    if (d.moved) suppressClickUntil = Date.now() + 120; // ignore the click that follows a drag
  });

  /* ---------- boot ---------- */
  $('#splashLogo').innerHTML = logo(54, true);
  window.addEventListener('hashchange', route);
  route();
  let seen = null;
  try { seen = sessionStorage.getItem('sd:splash'); sessionStorage.setItem('sd:splash', '1'); } catch { /* ignore */ }
  const splash = $('#splash');
  setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 500); }, seen ? 0 : 1200);
})();
