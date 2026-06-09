/**
 * 앱 전역 상태 — localStorage에 영속 저장
 * (로그인 여부 / 결제 여부 / 기본 자막 언어 / 사용자 정보)
 */

const STORAGE_KEY = 'kaptik.state.v1';

const DEFAULTS = {
  isLoggedIn: false,
  isPaid: false,
  defaultLang: 'en',
  user: { name: 'Guest', email: '', provider: '' },
};

/** localStorage에서 상태를 읽어 기본값과 병합 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

const state = load();
const listeners = new Set();

/** 상태 변경을 구독한다. 변경 시 콜백 호출. 구독 해제 함수 반환 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn(state));
}

/** 현재 상태 객체(읽기용) */
export function getState() {
  return state;
}

/** 부분 업데이트 후 저장 + 구독자 알림 */
export function setState(patch) {
  Object.assign(state, patch);
  persist();
}

/** 로그인 처리 (provider: 'google' | 'email') */
export function login(provider, email) {
  state.isLoggedIn = true;
  state.user = {
    name: provider === 'google' ? 'Google 사용자' : (email ? email.split('@')[0] : '사용자'),
    email: email || (provider === 'google' ? 'user@gmail.com' : 'user@kaptik.app'),
    provider,
  };
  persist();
}

/** 로그아웃 처리 (결제 상태도 초기화) */
export function logout() {
  state.isLoggedIn = false;
  state.isPaid = false;
  state.user = { ...DEFAULTS.user };
  persist();
}
