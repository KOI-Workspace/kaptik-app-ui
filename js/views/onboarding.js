/**
 * 온보딩 (풀스크린) — 로그인/회원가입을 먼저 받고 신규/기존을 분기한다.
 *
 *  [신규 가입]   로그인/회원가입 → 아티스트·언어 선택 → 요금제(소프트) → Home
 *  [기존 로그인] 로그인/회원가입 → (개인화 건너뜀)
 *               · Pro            → 바로 Home
 *               · Free / Basic   → 결제 유도(업셀) → Home
 *
 * 확장프로그램/랜딩에서 이미 아티스트·언어·결제를 설정한 기존 유저는
 * 개인화 단계를 반복하지 않게 하기 위한 설계다.
 *
 * 단계 상태는 이 화면 내부 변수로만 관리한다(라우터 재진입 없이 내부 render).
 */
import { navigate } from '../router.js';
import { getState, setState, setPlan, followArtist, unfollowArtist, isFollowing } from '../state.js';
import { signIn, signUp, signInWithGoogle } from '../auth.js';
import { t } from '../i18n.js';
import { toast, PLANS, openLegalDoc } from '../modals.js';
import { ARTIST_CATALOG, LANGUAGES } from '../data.js';

const GOOGLE_SVG = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;
const CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

export function renderOnboarding(_params, root) {
  // 단계: 'auth' → 'personalize' → 'plan'
  let step = 'auth';
  // auth 내부 서브스텝: 'main'(Google+Email 버튼) | 'email'(이메일 폼)
  let authSubStep = 'main';
  let authMode = 'signin';   // email 서브스텝 내 모드
  let upsell = false;
  let chosenPlan = 'pro';
  let countdownTimer = null;
  const agree = { tos: false, privacy: false, marketing: false };

  const clearCountdown = () => { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } };

  const finish = () => {
    clearCountdown();
    setState({ onboardingDone: true });
    toast({ title: t('toast.welcome'), type: 'check' });
    navigate('home');
  };

  const afterAuth = (isNew) => {
    if (isNew) { step = 'personalize'; render(); return; }
    if (getState().plan === 'pro') { finish(); return; }
    upsell = true; step = 'plan'; render();
  };

  /* ── 1-A) 인증 메인: Google + Email 버튼 ── */
  function renderAuthMain() {
    root.innerHTML = `
      <div class="onb view fullscreen">
        <div class="onb-body onb-auth-main">
          <div class="logo onb-logo">kap<span>tik</span></div>
          <h1 class="onb-title">${t('onb.auth.title')}</h1>
          <p class="onb-sub">${t('onb.auth.sub')}</p>

          <div class="onb-auth-btns">
            <button class="btn-google btn-auth-pill" id="googleBtn">
              ${GOOGLE_SVG} ${t('login.googleContinue')}
            </button>
            <button class="btn-auth-pill btn-auth-email" id="emailBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
              ${t('login.emailContinue')}
            </button>
          </div>

          <p class="onb-terms" id="termsText"></p>
        </div>
      </div>
    `;

    // innerHTML로 설정해야 <a> 태그가 렌더링됨
    root.querySelector('#termsText').innerHTML = t('login.terms');
    root.querySelectorAll('.terms-link').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); openLegalDoc(a.dataset.doc); });
    });

    root.querySelector('#googleBtn').addEventListener('click', () => {
      const r = signInWithGoogle();
      afterAuth(r.isNew);
    });
    root.querySelector('#emailBtn').addEventListener('click', () => {
      authSubStep = 'email';
      renderAuth();
    });
  }

  /* ── 1-B) 이메일 폼: 로그인 / 회원가입 탭 ── */
  function renderEmailForm() {
    const isSignup = authMode === 'signup';
    root.innerHTML = `
      <div class="onb view fullscreen">
        <div class="onb-body scroll">
          <div class="onb-email-head">
            <button class="onb-back" id="backBtn" aria-label="${t('aria.back')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="seg auth-seg" role="group" style="flex:1;">
              <button class="seg-btn ${!isSignup ? 'on' : ''}" data-mode="signin">${t('login.signin')}</button>
              <button class="seg-btn ${isSignup ? 'on' : ''}" data-mode="signup">${t('login.signup')}</button>
            </div>
          </div>

          ${isSignup ? `
          <div class="field" data-field="name">
            <input type="text" id="name" placeholder="${t('login.ph.name')}" autocomplete="name" />
            <p class="field-error"></p>
          </div>` : ''}
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
          </div>

          <div class="agree-box" id="agreeBox">
            <button type="button" class="agree-row all ${agree.tos && agree.privacy && agree.marketing ? 'on' : ''}" data-agree="all">
              <span class="agree-check"></span><span class="agree-text">${t('agree.all')}</span>
            </button>
            <div class="agree-sub">
              <button type="button" class="agree-row ${agree.tos ? 'on' : ''}" data-agree="tos">
                <span class="agree-check"></span>
                <span class="agree-text"><b class="req">${t('agree.required')}</b> ${t('agree.tos')}</span>
                <span class="agree-view" data-doc="tos">${t('agree.view')}</span>
              </button>
              <button type="button" class="agree-row ${agree.privacy ? 'on' : ''}" data-agree="privacy">
                <span class="agree-check"></span>
                <span class="agree-text"><b class="req">${t('agree.required')}</b> ${t('agree.privacy')}</span>
                <span class="agree-view" data-doc="privacy">${t('agree.view')}</span>
              </button>
              <button type="button" class="agree-row ${agree.marketing ? 'on' : ''}" data-agree="marketing">
                <span class="agree-check"></span>
                <span class="agree-text"><b class="opt">${t('agree.optional')}</b> ${t('agree.marketing')}</span>
              </button>
            </div>
          </div>` : ''}

          <button class="btn-primary" id="submitBtn" style="margin-top:10px;">${isSignup ? t('login.signup') : t('login.signin')}</button>
        </div>
      </div>
    `;

    root.querySelector('#backBtn').addEventListener('click', () => {
      authSubStep = 'main';
      renderAuth();
    });
    root.querySelectorAll('.auth-seg .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => { authMode = btn.dataset.mode; renderAuth(); });
    });
    root.querySelectorAll('.field input').forEach((inp) => {
      inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('invalid'));
    });

    if (isSignup) {
      root.querySelectorAll('[data-agree]').forEach((row) => {
        row.addEventListener('click', () => {
          const key = row.dataset.agree;
          if (key === 'all') {
            const next = !(agree.tos && agree.privacy && agree.marketing);
            agree.tos = agree.privacy = agree.marketing = next;
          } else {
            agree[key] = !agree[key];
          }
          renderAuth();
        });
      });
      root.querySelectorAll('.agree-view').forEach((v) => {
        v.addEventListener('click', (e) => { e.stopPropagation(); openLegalDoc(v.dataset.doc); });
      });
    }

    const showError = (field, key) => {
      const wrap = root.querySelector(`.field[data-field="${field}"]`);
      if (!wrap) { toast({ title: t(key), type: 'warn' }); return; }
      wrap.classList.add('invalid');
      wrap.querySelector('.field-error').textContent = t(key);
      wrap.querySelector('input')?.focus();
    };

    root.querySelector('#submitBtn').addEventListener('click', () => {
      root.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
      if (isSignup && !(agree.tos && agree.privacy)) {
        toast({ title: t('err.agreeRequired'), type: 'warn' });
        root.querySelector('#agreeBox')?.classList.add('shake');
        setTimeout(() => root.querySelector('#agreeBox')?.classList.remove('shake'), 400);
        return;
      }
      const name = isSignup ? (root.querySelector('#name')?.value || '') : '';
      const email = root.querySelector('#email').value;
      const password = root.querySelector('#pw').value;
      const confirm = isSignup ? root.querySelector('#pw2').value : '';
      const r = isSignup ? signUp({ email, password, confirm, name }) : signIn({ email, password });
      if (!r.ok) { showError(r.field, r.key); return; }
      if (isSignup) setState({ agreements: { tos: true, privacy: true, marketing: agree.marketing } });
      afterAuth(r.isNew);
    });
  }

  /* ── 1) 인증 단계 진입점 ── */
  function renderAuth() {
    if (authSubStep === 'email') renderEmailForm();
    else renderAuthMain();
  }

  /* ── 2) 아티스트 + 언어 선택 (신규 전용) ── */
  function renderPersonalize() {
    const uiLang = getState().uiLang;
    root.innerHTML = `
      <div class="onb view fullscreen">
        <div class="onb-progress"><span></span><span class="on"></span><span></span></div>
        <div class="onb-body scroll">
          <h1 class="onb-title">${t('onb.personalize.title')}</h1>
          <p class="onb-sub">${t('onb.personalize.sub')}</p>

          <p class="onb-label">${t('onb.lang.label')}</p>
          <div class="lang-chips">
            ${LANGUAGES.map((l) => `<button class="lang-chip ${l.code === uiLang ? 'on' : ''}" data-lang="${l.code}">${l.label}</button>`).join('')}
          </div>

          <p class="onb-label">${t('onb.artists.label')}</p>
          <p class="onb-hint">${t('onb.artists.hint')}</p>
          <div class="artist-pick-grid">
            ${ARTIST_CATALOG.map(artistPick).join('')}
          </div>
        </div>
        <div class="onb-foot">
          <button class="btn-primary" id="nextBtn">${t('onb.next')}</button>
        </div>
      </div>
    `;

    // 언어 선택 — 전역 langchange 대신 내부 상태만 바꾸고 이 화면만 다시 그린다
    root.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setState({ uiLang: btn.dataset.lang, defaultLang: btn.dataset.lang });
        renderPersonalize();
      });
    });
    // 아티스트 멀티 선택 — 탭하면 즉시 팔로우/언팔로우 (알림 기본 ON)
    root.querySelectorAll('[data-artist]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.artist;
        if (isFollowing(id)) unfollowArtist(id);
        else followArtist(id, true);
        el.classList.toggle('on', isFollowing(id));
      });
    });
    root.querySelector('#nextBtn').addEventListener('click', () => { step = 'plan'; render(); });
  }

  function artistPick(a) {
    const initials = a.name.replace(/[^A-Za-z0-9가-힣]/g, '').slice(0, 2).toUpperCase();
    const inner = a.img
      ? `<img src="${a.img}" alt="${a.name}" />`
      : `<span class="ap-initials">${initials}</span>`;
    return `
      <button class="artist-pick ${isFollowing(a.id) ? 'on' : ''}" data-artist="${a.id}">
        <span class="ap-avatar">${inner}<span class="ap-check">${CHECK}</span></span>
        <span class="ap-name">${a.name}</span>
      </button>`;
  }

  /* ── 3) 요금제 / 결제 유도 ──
   * 노출 플랜은 현재 요금제 기준:
   *   - Free(신규 포함) → Basic + Pro 둘 다
   *   - Basic           → Pro 만
   * X(닫기) 버튼은 5초가 지나야 활성화된다(결제 유도 강화). */
  function renderPlan() {
    clearCountdown();
    const curPlan = getState().plan;
    const plansToShow = curPlan === 'basic' ? ['pro'] : ['basic', 'pro'];
    if (!plansToShow.includes(chosenPlan)) chosenPlan = 'pro';

    const planCard = (key) => {
      const p = PLANS[key];
      const rec = key === 'pro' && plansToShow.length > 1;
      return `
        <button class="plan-option ${key === chosenPlan ? 'selected' : ''}" data-plan="${key}">
          <div class="plan-option-head">
            <span class="plan-option-name">${p.name}${rec ? ' <span class="plan-rec">추천</span>' : ''}</span>
            <span class="plan-option-price">${p.price}<small> ${t('my.perMonth')}</small></span>
          </div>
          <div class="plan-option-tagline">${t(p.tagline)}</div>
          <ul class="plan-feats">${p.feats.map((f) => `<li>✓ ${t(f)}</li>`).join('')}</ul>
        </button>`;
    };

    root.innerHTML = `
      <div class="onb view fullscreen">
        <button class="onb-close" id="onbClose" disabled aria-label="${t('aria.close')}"><span id="onbCd">5</span></button>
        ${upsell ? '' : '<div class="onb-progress"><span></span><span></span><span class="on"></span></div>'}
        <div class="onb-body scroll">
          <h1 class="onb-title">${upsell ? t('onb.upsell.title') : t('onb.plan.title')}</h1>
          <p class="onb-sub">${upsell ? t('onb.upsell.sub') : t('onb.plan.sub')}</p>
          <div class="plan-options" style="margin-top:18px;">
            ${plansToShow.map(planCard).join('')}
          </div>
        </div>
        <div class="onb-foot">
          <button class="btn-primary" id="startBtn">${t('onb.start')}</button>
        </div>
      </div>
    `;

    root.querySelectorAll('.plan-option').forEach((el) => {
      el.addEventListener('click', () => {
        chosenPlan = el.dataset.plan;
        root.querySelectorAll('.plan-option').forEach((o) => o.classList.toggle('selected', o === el));
      });
    });
    root.querySelector('#startBtn').addEventListener('click', () => { setPlan(chosenPlan); finish(); });

    // 5초 카운트다운 → X 버튼 활성화 (활성화 전 클릭은 무시)
    const closeBtn = root.querySelector('#onbClose');
    const cdEl = root.querySelector('#onbCd');
    let remain = 5;
    countdownTimer = setInterval(() => {
      remain -= 1;
      if (remain <= 0) {
        clearCountdown();
        closeBtn.classList.add('ready');
        closeBtn.removeAttribute('disabled');
        closeBtn.textContent = '✕';
      } else {
        cdEl.textContent = remain;
      }
    }, 1000);
    closeBtn.addEventListener('click', () => { if (!closeBtn.hasAttribute('disabled')) finish(); });
  }

  function render() {
    if (step === 'auth') renderAuth();
    else if (step === 'personalize') renderPersonalize();
    else renderPlan();
    window.scrollTo(0, 0);
  }

  render();
  return clearCountdown; // 뷰 전환 시 카운트다운 타이머 정리
}
