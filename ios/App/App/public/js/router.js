/**
 * 해시 기반 SPA 라우터
 * 라우트: #/home, #/translate, #/my, #/player, #/login
 * - 각 뷰 모듈이 render(params) 함수를 등록한다.
 * - player/login은 풀스크린(하단 네비 숨김).
 */

const routes = new Map();        // name -> { render, fullscreen }
const FULLSCREEN = new Set(['player', 'login', 'onboarding', 'settings']);

let currentRoute = null;
let pendingParams = null;        // navigate 시 전달한 파라미터(메모리)
let cleanupFn = null;            // 직전 뷰의 정리 함수

const viewRoot = () => document.getElementById('view-root');
const bottomNav = () => document.getElementById('bottom-nav');

/** 뷰 등록: render(params)는 정리 함수(또는 undefined)를 반환할 수 있다 */
export function registerRoute(name, render) {
  routes.set(name, { render });
}

/** 라우트 이동. params는 메모리로 전달되고 해시만 갱신된다 */
export function navigate(name, params = null) {
  pendingParams = params;
  if (location.hash === `#/${name}`) {
    render(name); // 같은 해시면 hashchange가 안 뜨므로 직접 렌더
  } else {
    location.hash = `#/${name}`;
  }
}

/** 현재 활성 라우트 이름 */
export function getCurrentRoute() {
  return currentRoute;
}

function render(name) {
  const route = routes.get(name);
  if (!route) { navigate('home'); return; }

  // 직전 뷰 정리
  if (typeof cleanupFn === 'function') { try { cleanupFn(); } catch {} }
  cleanupFn = null;

  const params = pendingParams;
  pendingParams = null;
  currentRoute = name;

  // 네비 표시/숨김 + active 갱신
  const nav = bottomNav();
  nav.classList.toggle('hidden', FULLSCREEN.has(name));
  updateNavActive(name);

  // 렌더
  const root = viewRoot();
  root.innerHTML = '';
  const ret = route.render(params, root);
  if (typeof ret === 'function') cleanupFn = ret;

  // 스크롤 상단 복귀
  window.scrollTo(0, 0);
}

function updateNavActive(name) {
  document.querySelectorAll('#bottom-nav .nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === name);
  });
}

function onHashChange() {
  const name = (location.hash || '#/home').replace(/^#\//, '') || 'home';
  render(name);
}

/** 라우터 시작 */
export function startRouter(defaultRoute = 'home') {
  window.addEventListener('hashchange', onHashChange);
  if (!location.hash) location.hash = `#/${defaultRoute}`;
  else onHashChange();
}
