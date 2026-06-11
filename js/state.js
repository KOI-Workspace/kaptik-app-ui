/**
 * 앱 전역 상태 — localStorage에 영속 저장
 * (로그인 여부 / 결제 여부 / 기본 자막 언어 / 사용자 정보)
 */

import { DEFAULT_FOLLOWS } from './data.js';

const STORAGE_KEY = 'kaptik.state.v1';

const DEFAULTS = {
  isLoggedIn: false,
  // 팔로우한 아티스트 — [{ id, notify }]. notify=라이브 시작 알림 수신 여부
  follows: DEFAULT_FOLLOWS.map((f) => ({ ...f })),
  // 요금제 — 'free' | 'basic' | 'pro' (단일 진실 소스)
  plan: 'free',
  // Pro 전용 게이트용 파생 플래그 (plan === 'pro' 와 항상 동기화)
  isPaid: false,
  // 앱 UI 언어 (기본 한국어). 자막 기본 언어와 함께 변경된다.
  uiLang: 'ko',
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

/**
 * 세션 시작 — 인증을 통과한 사용자 정보로 로그인 상태를 만든다.
 * (검증은 auth.js가 담당, 여기서는 상태만 세팅)
 */
export function startSession({ name, email, provider }) {
  state.isLoggedIn = true;
  state.user = { name, email, provider };
  persist();
}

/** 빠른 로그인 (개발용 토글 등 검증이 필요 없는 경로) */
export function login(provider, email) {
  startSession({
    name: provider === 'google' ? 'Google 사용자' : (email ? email.split('@')[0] : '사용자'),
    email: email || (provider === 'google' ? 'user@gmail.com' : 'user@kaptik.app'),
    provider,
  });
}

/**
 * 요금제 변경 — 'free' | 'basic' | 'pro'
 * 로그인하지 않은 상태에서는 유료 요금제를 가질 수 없으므로 무조건 free로 강제한다.
 * isPaid(Pro 전용 게이트 플래그)는 plan === 'pro' 와 항상 동기화한다.
 */
export function setPlan(plan) {
  const next = state.isLoggedIn ? plan : 'free';
  state.plan = next;
  state.isPaid = next === 'pro';
  persist();
}

/* ── 아티스트 팔로우 ── */
/** 팔로우 중인지 여부 */
export function isFollowing(id) {
  return state.follows.some((f) => f.id === id);
}
/** 해당 아티스트의 팔로우 정보 반환 (없으면 undefined) */
export function getFollow(id) {
  return state.follows.find((f) => f.id === id);
}
/** 팔로우 추가 (이미 팔로우 중이면 notify만 갱신) */
export function followArtist(id, notify = true) {
  const f = getFollow(id);
  if (f) f.notify = notify;
  else state.follows.push({ id, notify });
  persist();
}
/** 팔로우 취소 */
export function unfollowArtist(id) {
  state.follows = state.follows.filter((f) => f.id !== id);
  persist();
}
/** 라이브 알림 on/off */
export function setFollowNotify(id, notify) {
  const f = getFollow(id);
  if (f) { f.notify = notify; persist(); }
}

/** 로그아웃 처리 (요금제/결제 상태도 초기화) */
export function logout() {
  state.isLoggedIn = false;
  state.plan = 'free';
  state.isPaid = false;
  state.user = { ...DEFAULTS.user };
  persist();
}
