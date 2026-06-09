/**
 * 앱 부트스트랩 — 라우트 등록 + 하단 네비 + 라우터 시작
 */
import { registerRoute, navigate, startRouter } from './router.js';
import { renderHome } from './views/home.js';
import { renderTranslate } from './views/translate.js';
import { renderMy } from './views/my.js';
import { renderPlayer } from './views/player.js';
import { renderLogin } from './views/login.js';

/* ── 하단 네비게이션 (Home / Translate / My) ── */
const NAV = [
  { route: 'home', label: 'Home', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
  { route: 'translate', label: 'Translate', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7"/><path d="M7 4c0 4.5-2 7-3 8"/><path d="M5 9c0 2 2 4.5 5 5"/><path d="M12 20l4-9 4 9"/><path d="M13.5 17h5"/></svg>' },
  { route: 'my', label: 'My', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>' },
];

function renderNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item" data-route="${n.route}">
      ${n.icon}
      ${n.label}
    </button>`).join('');
  nav.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.route));
  });
}

/* ── 라우트 등록 ── */
registerRoute('home', renderHome);
registerRoute('translate', renderTranslate);
registerRoute('my', renderMy);
registerRoute('player', renderPlayer);
registerRoute('login', renderLogin);

renderNav();
startRouter('home');
