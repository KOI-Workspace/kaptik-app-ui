/**
 * i18n 엔진 — UI 텍스트를 현재 앱 언어로 번역해 돌려준다.
 * 번역 문자열은 strings.js의 STRINGS 사전에 들어 있다.
 *
 * 사용: t('home.liveNow') / t('payment.start', { name: 'Pro' })
 * 언어 변경: setLang('ja') → state 갱신 + 'langchange' 이벤트 → app.js가 전체 리렌더
 *
 * 영상 제목·아티스트명 같은 콘텐츠는 번역 대상이 아니다(데이터 그대로 사용).
 */
import { getState, setState } from './state.js';
import { STRINGS } from './strings.js';

/** 현재 UI 언어 코드 (기본 'ko') */
export function getLang() {
  return getState().uiLang || 'ko';
}

/**
 * 키에 해당하는 번역 문자열 반환.
 * 없으면 영어 → 한국어 → 키 순으로 폴백한다.
 * @param {string} key
 * @param {Record<string,string|number>} [vars] {name} 같은 치환 변수
 */
export function t(key, vars) {
  const entry = STRINGS[key];
  let str = entry ? (entry[getLang()] ?? entry.en ?? entry.ko ?? key) : key;
  if (vars) for (const k in vars) str = str.split(`{${k}}`).join(vars[k]);
  return str;
}

/**
 * 앱 언어 변경 — UI 언어 + 자막 기본 언어를 함께 바꾸고
 * 'langchange' 이벤트를 쏴서 전체 화면을 다시 그리게 한다.
 */
export function setLang(lang) {
  setState({ uiLang: lang, defaultLang: lang });
  window.dispatchEvent(new Event('langchange'));
}
