/**
 * 앱 부트스트랩 — 라우트 등록 + 하단 네비 + 라우터 시작
 */
import { registerRoute, navigate, startRouter, getCurrentRoute } from './router.js';
import { renderHome } from './views/home.js';
import { renderTranslate } from './views/translate.js';
import { renderMy } from './views/my.js';
import { renderPlayer } from './views/player.js';
import { renderLogin } from './views/login.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderSettings } from './views/settings.js';
import { getState } from './state.js';
import { t } from './i18n.js';

/* ── 하단 네비게이션 (Home / Translate / My) — label은 i18n 키 ── */
const NAV = [
  { route: 'home', labelKey: 'nav.home', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
  { route: 'translate', labelKey: 'nav.translate', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7"/><path d="M7 4c0 4.5-2 7-3 8"/><path d="M5 9c0 2 2 4.5 5 5"/><path d="M12 20l4-9 4 9"/><path d="M13.5 17h5"/></svg>' },
  { route: 'my', labelKey: 'nav.my', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>' },
];

function renderNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item" data-route="${n.route}">
      ${n.icon}
      ${t(n.labelKey)}
    </button>`).join('');
  nav.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.route));
  });
  // 현재 라우트 active 상태 복원
  const cur = getCurrentRoute();
  if (cur) nav.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.route === cur));
}

// 언어 변경 시 — 네비 + 현재 화면을 새 언어로 다시 그린다
window.addEventListener('langchange', () => {
  renderNav();
  const cur = getCurrentRoute();
  if (cur) navigate(cur);
});

/* ── 라우트 등록 ── */
registerRoute('home', renderHome);
registerRoute('translate', renderTranslate);
registerRoute('my', renderMy);
registerRoute('player', renderPlayer);
registerRoute('login', renderLogin);
registerRoute('onboarding', renderOnboarding);
registerRoute('settings', renderSettings);

renderNav();

// 부팅 라우팅 — 온보딩 미완료면 온보딩부터, 완료 유저가 온보딩 해시면 홈으로 교정
const onboarded = getState().onboardingDone;
if (!onboarded) location.hash = '#/onboarding';
else if (location.hash === '#/onboarding') location.hash = '#/home';
startRouter(onboarded ? 'home' : 'onboarding');
