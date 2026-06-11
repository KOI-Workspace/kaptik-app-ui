/**
 * 목업 인증 — 백엔드 없이 localStorage에 계정을 저장해
 * 회원가입 / 로그인이 실제로 구분되어 동작하도록 한다.
 *
 * 계정 저장소: kaptik.accounts.v1 = [{ email, password, name, provider }]
 * 세션(로그인 상태)은 state.js가 보관한다 — 여기서는 검증만 하고 startSession을 호출한다.
 *
 * 모든 함수는 { ok: true } 또는 { ok: false, field, key } 형태를 반환한다.
 * (field: 오류를 표시할 입력 — 'email' | 'pw' | 'confirm', key: i18n 메시지 키)
 * 메시지를 직접 만들지 않고 i18n 키를 돌려줘, 화면에서 현재 언어로 번역해 보여준다.
 */
import { startSession } from './state.js';

const ACCOUNTS_KEY = 'kaptik.accounts.v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PW = 8;
// 영문(대소문자) + 숫자 각 1자 이상 포함
const PW_STRONG_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/* ── 계정 저장소 ── */
function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || []; }
  catch { return []; }
}
function saveAccounts(list) {
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); } catch {}
}
/** 이메일로 계정 찾기 (대소문자 무시) */
function findAccount(email) {
  const key = email.trim().toLowerCase();
  return loadAccounts().find((a) => a.email.toLowerCase() === key);
}

/** 이메일에서 표시용 이름 추출 (입력한 이름이 없을 때) */
function nameFromEmail(email) {
  return email.split('@')[0] || '사용자';
}

const fail = (field, key) => ({ ok: false, field, key });

/* ── 입력 검증 헬퍼 ── */
function validateEmail(email) {
  if (!email) return fail('email', 'err.emailRequired');
  if (!EMAIL_RE.test(email)) return fail('email', 'err.emailFormat');
  return null;
}
// strict=true: 회원가입용 — 길이·복잡도까지 검사
// strict=false: 로그인용 — 빈 값만 검사 (기존 계정 차단 방지)
function validatePassword(password, strict = false) {
  if (!password) return fail('pw', 'err.pwRequired');
  if (strict) {
    if (password.length < MIN_PW) return fail('pw', 'err.pwShort');
    if (!PW_STRONG_RE.test(password)) return fail('pw', 'err.pwWeak');
  }
  return null;
}

/**
 * 회원가입 — 새 이메일이어야 한다.
 * @param {{ email:string, password:string, confirm:string, name?:string }} input
 */
export function signUp({ email = '', password = '', confirm = '', name = '' } = {}) {
  email = email.trim();
  const invalidEmail = validateEmail(email);
  if (invalidEmail) return invalidEmail;
  const invalidPw = validatePassword(password, true);
  if (invalidPw) return invalidPw;
  if (password !== confirm) return fail('confirm', 'err.pwMismatch');
  if (findAccount(email)) return fail('email', 'err.emailExists');

  const account = { email, password, name: name.trim() || nameFromEmail(email), provider: 'email' };
  saveAccounts([...loadAccounts(), account]);
  startSession({ name: account.name, email: account.email, provider: 'email' });
  return { ok: true, isNew: true };
}

/**
 * 로그인 — 가입된 계정 + 비밀번호 일치 검증.
 * @param {{ email:string, password:string }} input
 */
export function signIn({ email = '', password = '' } = {}) {
  email = email.trim();
  const invalidEmail = validateEmail(email);
  if (invalidEmail) return invalidEmail;
  const invalidPw = validatePassword(password, false);
  if (invalidPw) return invalidPw;

  const account = findAccount(email);
  if (!account) return fail('email', 'err.emailNotFound');
  if (account.password !== password) return fail('pw', 'err.pwWrong');

  startSession({ name: account.name, email: account.email, provider: 'email' });
  return { ok: true, isNew: false };
}

/**
 * Google 로그인 — 데모용 단일 계정. 없으면 만들고(신규), 있으면 그대로 로그인(기존).
 * 항상 성공한다.
 */
export function signInWithGoogle() {
  const email = 'user@gmail.com';
  let account = findAccount(email);
  const isNew = !account;
  if (!account) {
    account = { email, password: null, name: 'Google 사용자', provider: 'google' };
    saveAccounts([...loadAccounts(), account]);
  }
  startSession({ name: account.name, email: account.email, provider: 'google' });
  return { ok: true, isNew };
}

/**
 * 게이트(영상 시청 중) 빠른 로그인 — 마찰 최소화.
 * 가입된 이메일이면 비밀번호를 검증하고, 처음 보는 이메일이면 즉시 가입 처리한다.
 * @param {{ email:string, password:string }} input
 */
export function quickAuth({ email = '', password = '' } = {}) {
  email = email.trim();
  const invalidEmail = validateEmail(email);
  if (invalidEmail) return invalidEmail;
  // quickAuth는 신규/기존 모두 처리하므로 복잡도 검사 적용
  const invalidPw = validatePassword(password, true);
  if (invalidPw) return invalidPw;

  return findAccount(email)
    ? signIn({ email, password })
    : signUp({ email, password, confirm: password });
}
