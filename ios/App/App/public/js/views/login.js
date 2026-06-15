/**
 * Login 화면 (풀스크린) — 로그인 / 회원가입 전환
 * - 로그인: 가입된 계정 + 비밀번호 검증
 * - 회원가입: 형식·중복·비밀번호 확인 검증 후 계정 생성 → 자동 로그인
 * - Google: 원탭 데모 로그인
 * 검증 로직은 auth.js, 세션은 state.js, 문구는 i18n이 담당한다.
 * (게이트 흐름에서는 modals.js의 로그인 모달을 사용)
 */
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { signIn, signUp, signInWithGoogle } from '../auth.js';
import { toast } from '../modals.js';
import { t } from '../i18n.js';

export function renderLogin(_params, root) {
  // 'signin'(로그인) | 'signup'(회원가입) — 화면 안에서만 쓰는 모드
  let mode = 'signin';

  const render = () => {
    const isSignup = mode === 'signup';
    root.innerHTML = `
      <div class="view fullscreen" style="min-height:100dvh;display:flex;flex-direction:column;padding:0 24px calc(28px + env(safe-area-inset-bottom));">
        <button class="modal-close-x" id="closeLogin" style="position:absolute;top:calc(16px + env(safe-area-inset-top));left:16px;right:auto;">✕</button>

        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div class="logo" style="font-size:34px;margin-bottom:10px;">kap<span>tik</span></div>
          <p style="font-size:16px;color:var(--text-2);font-weight:500;line-height:1.5;margin-bottom:26px;">
            ${t('login.taglineHtml')}
          </p>

          <div class="seg auth-seg" role="group">
            <button class="seg-btn ${!isSignup ? 'on' : ''}" data-mode="signin">${t('login.signin')}</button>
            <button class="seg-btn ${isSignup ? 'on' : ''}" data-mode="signup">${t('login.signup')}</button>
          </div>

          <button class="btn-google" id="googleBtn" style="margin-bottom:18px;">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
            ${isSignup ? t('login.googleStart') : t('login.googleContinue')}
          </button>

          <div class="login-divider">${isSignup ? t('login.orEmailSignup') : t('login.orEmailLogin')}</div>

          <div class="field" data-field="email">
            <input type="email" id="email" placeholder="${t('login.ph.email')}" autocomplete="email" inputmode="email" />
            <p class="field-error"></p>
          </div>
          <div class="field" data-field="pw">
            <input type="password" id="pw" placeholder="${t('login.ph.pw')}" autocomplete="${isSignup ? 'new-password' : 'current-password'}" />
            <p class="field-error"></p>
          </div>
          ${isSignup ? `
          <div class="field" data-field="confirm">
            <input type="password" id="pw2" placeholder="${t('login.ph.pwConfirm')}" autocomplete="new-password" />
            <p class="field-error"></p>
          </div>` : ''}

          <button class="btn-primary" id="submitBtn" style="margin-top:6px;">${isSignup ? t('login.signup') : t('login.signin')}</button>
        </div>

        <p style="text-align:center;font-size:12px;color:var(--text-3);font-weight:500;">
          ${t('login.terms')}
        </p>
      </div>
    `;
    bind(isSignup);
  };

  // 입력 필드 오류 표시/해제
  const clearErrors = () => {
    root.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
  };
  const showError = (field, key) => {
    const wrap = root.querySelector(`.field[data-field="${field}"]`);
    if (!wrap) { toast({ title: t(key), type: 'warn' }); return; }
    wrap.classList.add('invalid');
    wrap.querySelector('.field-error').textContent = t(key);
    wrap.querySelector('input')?.focus();
  };

  const succeed = () => {
    toast({ title: mode === 'signup' ? t('toast.signupDone') : t('toast.loginDone'), sub: getState().user.email, type: 'check' });
    navigate('my');
  };

  const bind = (isSignup) => {
    root.querySelectorAll('.auth-seg .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => { mode = btn.dataset.mode; render(); });
    });

    // 입력 시작하면 해당 필드 오류 해제
    root.querySelectorAll('.field input').forEach((inp) => {
      inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('invalid'));
    });

    root.querySelector('#googleBtn').addEventListener('click', () => {
      signInWithGoogle();
      succeed();
    });

    root.querySelector('#submitBtn').addEventListener('click', () => {
      clearErrors();
      const email = root.querySelector('#email').value;
      const password = root.querySelector('#pw').value;
      const confirm = isSignup ? root.querySelector('#pw2').value : '';

      const result = isSignup
        ? signUp({ email, password, confirm })
        : signIn({ email, password });

      if (result.ok) succeed();
      else showError(result.field, result.key);
    });

    root.querySelector('#closeLogin').addEventListener('click', () => navigate('home'));
  };

  render();
}
