/**
 * My 화면 — 프로필 / 계정 정보 / 앱 언어 / 멤버십·결제 + 개발용 상태 토글
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { getState, setState, setPlan, setAgreement, logout, login } from '../state.js';
import { openPaymentModal, openFollowedArtists, openBillingModal, openLegalDoc, toast, PLANS } from '../modals.js';
import { t, setLang } from '../i18n.js';
import { LANGUAGES } from '../data.js';

// 로그인 수단 라벨 키 (PROVIDER_LABEL → i18n 키 매핑)
const PROVIDER_KEY = { google: 'provider.google', email: 'provider.email' };

// 4-포인트 스파클 — Upgrade CTA 아이콘
const ICON_SPARK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6a4 4 0 0 0 2.5 2.5L22 12l-5.6 1.9a4 4 0 0 0-2.5 2.5L12 22l-1.9-5.6a4 4 0 0 0-2.5-2.5L2 12l5.6-1.9a4 4 0 0 0 2.5-2.5z"/></svg>`;

// 플랜 배지 — 브랜드 고유어라 번역하지 않음
const PLAN_BADGE = { free: 'Free', basic: '✦ Basic', pro: '✦ Pro' };

export function renderMy(_params, root) {
  const s = getState();
  const reRender = () => navigate('my');

  // Free·Basic 유저에게만 상단 업그레이드 배너를 노출 (Pro는 이미 최상위라 숨김)
  const showUpgradeBanner = s.plan !== 'pro';
  const providerLabel = PROVIDER_KEY[s.user.provider] ? t(PROVIDER_KEY[s.user.provider]) : '–';

  root.innerHTML = `
    <div class="view">
      ${headerHTML()}
      <div class="page-content">
        ${showUpgradeBanner ? `
        <button class="upgrade-banner" id="upgradeBanner">
          <span class="ub-cta">${ICON_SPARK} Upgrade</span>
          <span class="ub-desc">${t('my.banner.descHtml')}</span>
        </button>` : ''}

        <div class="profile-head">
          <div class="profile-avatar">${s.isLoggedIn ? (s.user.name[0] || 'U').toUpperCase() : '?'}</div>
          <div>
            <div class="profile-name">${s.isLoggedIn ? s.user.name : t('my.guest')}</div>
            <div class="profile-email">${s.isLoggedIn ? s.user.email : t('my.loginPrompt')}</div>
          </div>
        </div>

        ${s.isLoggedIn ? '' : `<button class="btn-primary" id="loginBtn" style="margin-bottom:22px;">${t('my.loginSignup')}</button>`}

        <div class="settings-group" style="margin-bottom:18px;">
          <div class="settings-row clickable" id="followsRow">
            <span class="row-label">${t('my.row.follows')}</span>
            <span class="row-value brand">${t('followed.count', { n: s.follows.length })} 〉</span>
          </div>
        </div>

        <p class="settings-group-label">${t('my.group.account')}</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">${t('my.row.email')}</span>
            <span class="row-value">${s.isLoggedIn ? s.user.email : '–'}</span>
          </div>
          <div class="settings-row">
            <span class="row-label">${t('my.row.provider')}</span>
            <span class="row-value">${providerLabel}</span>
          </div>
          ${s.isLoggedIn ? `
          <div class="settings-row clickable" id="logoutRow">
            <span class="row-label" style="color:var(--notif);">${t('my.row.logout')}</span>
          </div>` : ''}
        </div>

        <p class="settings-group-label">${t('my.group.subtitle')}</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">${t('my.row.appLang')}</span>
            <select class="row-select" id="langSelect">
              ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === s.uiLang ? 'selected' : ''}>${l.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <p class="settings-group-label">${t('my.group.membership')}</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">${t('my.row.currentPlan')}</span>
            <span class="plan-badge ${s.plan}">${PLAN_BADGE[s.plan]}</span>
          </div>
          <div class="settings-row clickable" id="planRow">
            <span class="row-label">${s.plan === 'pro' ? t('my.row.managePayment') : t('my.row.upgrade')}</span>
            <span class="row-value brand">${s.plan === 'free' ? '〉' : `${PLANS[s.plan].price} ${t('my.perMonth')}`}</span>
          </div>
        </div>

        <p class="settings-group-label">${t('my.group.legal')}</p>
        <div class="settings-group">
          <div class="settings-row clickable" id="tosRow">
            <span class="row-label">${t('my.row.tos')}</span>
            <span class="row-value">〉</span>
          </div>
          <div class="settings-row clickable" id="privacyRow">
            <span class="row-label">${t('my.row.privacy')}</span>
            <span class="row-value">〉</span>
          </div>
          <div class="settings-row">
            <span class="row-label">${t('my.row.marketing')}</span>
            <button class="toggle ${s.agreements.marketing ? 'on' : ''}" id="tglMarketing" aria-label="${t('my.row.marketing')}"></button>
          </div>
        </div>

        <p class="settings-group-label">${t('my.group.dev')}</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">${t('my.row.loginState')}</span>
            <button class="toggle ${s.isLoggedIn ? 'on' : ''}" id="tglLogin" aria-label="${t('my.row.loginState')}"></button>
          </div>
          <div class="settings-row">
            <span class="row-label">${t('my.row.plan')}</span>
            <div class="seg ${s.isLoggedIn ? '' : 'disabled'}" id="planSeg" role="group" aria-label="${t('my.row.plan')}">
              ${['free', 'basic', 'pro'].map((p) => `
                <button class="seg-btn ${s.plan === p ? 'on' : ''}" data-plan="${p}" ${s.isLoggedIn ? '' : 'disabled'}>${PLAN_BADGE[p].replace('✦ ', '')}</button>`).join('')}
            </div>
          </div>
        </div>
        <p class="dev-note">${s.isLoggedIn ? t('my.devNote.in') : t('my.devNote.out')}</p>
      </div>
    </div>
  `;

  bindHeader(root);

  root.querySelector('#upgradeBanner')?.addEventListener('click', () => {
    openPaymentModal({ select: s.plan === 'basic' ? 'pro' : 'basic', onSuccess: reRender });
  });

  root.querySelector('#loginBtn')?.addEventListener('click', () => navigate('login'));
  root.querySelector('#logoutRow')?.addEventListener('click', () => {
    logout();                       // onboardingDone도 false로 초기화됨
    toast({ title: t('toast.logout'), type: 'check' });
    navigate('onboarding');         // 로그아웃하면 온보딩(로그인)부터 다시
  });

  // 앱 언어 변경 — UI 전체가 해당 언어로 다시 그려진다 (langchange 이벤트 → app.js)
  root.querySelector('#langSelect').addEventListener('change', (e) => {
    setLang(e.target.value);
    toast({ title: t('toast.langChanged'), type: 'check' });
  });

  // 팔로우한 아티스트 목록
  root.querySelector('#followsRow').addEventListener('click', () => {
    openFollowedArtists({ onChange: reRender });
  });

  // 약관 / 동의
  root.querySelector('#tosRow').addEventListener('click', () => openLegalDoc('tos'));
  root.querySelector('#privacyRow').addEventListener('click', () => openLegalDoc('privacy'));
  root.querySelector('#tglMarketing').addEventListener('click', () => {
    const next = !s.agreements.marketing;
    setAgreement('marketing', next);
    toast({ title: t(next ? 'toast.marketingOn' : 'toast.marketingOff'), type: 'check' });
    reRender();
  });

  root.querySelector('#planRow').addEventListener('click', () => {
    // Pro/Basic이면 멤버십 관리(변경/해지), Free면 결제 유도
    if (s.plan === 'free') openPaymentModal({ select: 'basic', onSuccess: reRender });
    else openBillingModal({ onChange: reRender });
  });

  // 개발용 토글 — 로그인 ON 시 온보딩은 건너뛴 것으로 처리(시연 편의)
  root.querySelector('#tglLogin').addEventListener('click', () => {
    if (s.isLoggedIn) { logout(); navigate('onboarding'); }
    else { login('email', 'dev@kaptik.app'); setState({ onboardingDone: true }); reRender(); }
  });

  // 요금제 세그먼트 — 로그인 상태에서만 동작 (로그아웃이면 버튼이 disabled)
  root.querySelectorAll('#planSeg .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setPlan(btn.dataset.plan);
      reRender();
    });
  });
}
