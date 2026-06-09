/**
 * 접근 게이트 — 영상 재생 / 링크 제출 같은 보호된 액션 앞에서 호출.
 * 1단계: 로그인 안 됨 → 로그인 모달 (성공 시 같은 액션 재시도)
 * 2단계: 로그인 됐지만 미결제 → 결제 모달 (성공 시 같은 액션 재시도)
 * 둘 다 통과 → action() 실행
 */
import { getState } from './state.js';
import { openLoginModal, openPaymentModal } from './modals.js';

/** action: 게이트를 모두 통과했을 때 실행할 콜백 */
export function requireAccess(action) {
  const s = getState();

  if (!s.isLoggedIn) {
    // 로그인 성공 후, 결제 게이트까지 이어서 재평가
    openLoginModal({ onSuccess: () => requireAccess(action) });
    return;
  }
  if (!s.isPaid) {
    openPaymentModal({ onSuccess: () => requireAccess(action) });
    return;
  }
  action();
}
