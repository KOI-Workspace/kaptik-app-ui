/**
 * 접근 게이트 — 보호된 액션(라이브 시청 / 링크 번역) 앞에서 호출.
 *
 * 요금제 등급: free < basic < pro
 *  - 라이브 시청      : Basic 이상 필요  (need='basic')
 *  - 링크(영상) 번역  : Pro 필요        (need='pro')
 *  - Free(미결제)     : 어떤 것도 불가 — 아티스트 팔로우/알림만 가능
 *
 * 단계: ① 로그인 안 됨 → 로그인 모달 → 같은 액션 재시도
 *       ② 등급 부족 → 결제 모달(필요 등급 선점) → 같은 액션 재시도
 *       ③ 통과 → action() 실행
 */
import { getState } from './state.js';
import { openLoginModal, openPaymentModal } from './modals.js';

const PLAN_RANK = { free: 0, basic: 1, pro: 2 };

/**
 * @param {Function} action 게이트를 모두 통과했을 때 실행할 콜백
 * @param {{ need?: 'basic'|'pro' }} opts 이 액션에 필요한 최소 요금제 (기본 'pro')
 */
export function requireAccess(action, { need = 'pro' } = {}) {
  const s = getState();

  if (!s.isLoggedIn) {
    openLoginModal({ onSuccess: () => requireAccess(action, { need }) });
    return;
  }
  if (PLAN_RANK[s.plan] < PLAN_RANK[need]) {
    // 필요한 등급을 결제 모달에서 미리 선택해 보여준다
    openPaymentModal({ select: need, onSuccess: () => requireAccess(action, { need }) });
    return;
  }
  action();
}
