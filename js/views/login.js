/**
 * Login 화면 (풀스크린) — 구글 소셜 로그인 + 자체 로그인
 * 직접 진입(My의 로그인 버튼) 시 사용. 성공하면 My로 돌아간다.
 * (게이트 흐름에서는 modals.js의 로그인 모달을 사용)
 */
import { navigate } from '../router.js';
import { login, getState } from '../state.js';
import { toast } from '../modals.js';

export function renderLogin(_params, root) {
  root.innerHTML = `
    <div class="view fullscreen" style="min-height:100dvh;display:flex;flex-direction:column;padding:0 24px calc(28px + env(safe-area-inset-bottom));">
      <button class="modal-close-x" id="closeLogin" style="position:absolute;top:calc(16px + env(safe-area-inset-top));left:16px;right:auto;">✕</button>

      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <div class="logo" style="font-size:34px;margin-bottom:10px;">kap<span>tik</span></div>
        <p style="font-size:16px;color:var(--text-2);font-weight:500;line-height:1.5;margin-bottom:34px;">
          좋아하는 아티스트의 라이브를<br>내 언어로 실시간 자막과 함께.
        </p>

        <button class="btn-google" id="googleBtn" style="margin-bottom:18px;">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
          Google로 계속하기
        </button>

        <div class="login-divider">또는 이메일로 로그인</div>

        <div class="field"><input type="email" id="email" placeholder="이메일" autocomplete="email" /></div>
        <div class="field" style="margin-bottom:18px;"><input type="password" id="pw" placeholder="비밀번호" autocomplete="current-password" /></div>
        <button class="btn-primary" id="emailBtn">로그인</button>
      </div>

      <p style="text-align:center;font-size:12px;color:var(--text-3);font-weight:500;">
        계속 진행하면 Kaptik의 약관 및 개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  `;

  const done = (provider, email) => {
    login(provider, email);
    toast({ title: '로그인되었어요', sub: getState().user.email, type: 'check' });
    navigate('my');
  };

  root.querySelector('#googleBtn').addEventListener('click', () => done('google'));
  root.querySelector('#emailBtn').addEventListener('click', () => {
    const email = root.querySelector('#email').value.trim();
    done('email', email || 'me@kaptik.app');
  });
  root.querySelector('#closeLogin').addEventListener('click', () => navigate('home'));
}
