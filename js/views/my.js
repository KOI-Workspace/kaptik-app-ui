/**
 * My 화면 — 프로필 / 계정 정보 / 기본 언어 / 결제 정보 + 개발용 상태 토글
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { getState, setState, logout, login } from '../state.js';
import { openPaymentModal, toast } from '../modals.js';
import { LANGUAGES } from '../data.js';

const PROVIDER_LABEL = { google: 'Google 계정', email: '이메일 로그인', '': '–' };

export function renderMy(_params, root) {
  const s = getState();
  const langLabel = (LANGUAGES.find((l) => l.code === s.defaultLang) || LANGUAGES[0]).label;
  const reRender = () => navigate('my');

  root.innerHTML = `
    <div class="view">
      ${headerHTML({ showSearch: false, hasNotif: true })}
      <div class="page-content">
        <div class="profile-head">
          <div class="profile-avatar">${s.isLoggedIn ? (s.user.name[0] || 'U').toUpperCase() : '?'}</div>
          <div>
            <div class="profile-name">${s.isLoggedIn ? s.user.name : 'Guest'}</div>
            <div class="profile-email">${s.isLoggedIn ? s.user.email : '로그인하고 모든 기능을 사용해 보세요'}</div>
          </div>
        </div>

        ${s.isLoggedIn ? '' : `<button class="btn-primary" id="loginBtn" style="margin-bottom:22px;">로그인 / 회원가입</button>`}

        <p class="settings-group-label">계정</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">이메일</span>
            <span class="row-value">${s.isLoggedIn ? s.user.email : '–'}</span>
          </div>
          <div class="settings-row">
            <span class="row-label">로그인 수단</span>
            <span class="row-value">${PROVIDER_LABEL[s.user.provider] || '–'}</span>
          </div>
          ${s.isLoggedIn ? `
          <div class="settings-row clickable" id="logoutRow">
            <span class="row-label" style="color:var(--notif);">로그아웃</span>
          </div>` : ''}
        </div>

        <p class="settings-group-label">자막</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">기본 언어</span>
            <select class="row-select" id="langSelect">
              ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === s.defaultLang ? 'selected' : ''}>${l.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <p class="settings-group-label">멤버십 / 결제</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">현재 플랜</span>
            <span class="plan-badge ${s.isPaid ? 'pro' : 'free'}">${s.isPaid ? '✦ Kaptik Pro' : 'Free'}</span>
          </div>
          <div class="settings-row clickable" id="planRow">
            <span class="row-label">${s.isPaid ? '결제 정보 관리' : 'Pro로 업그레이드'}</span>
            <span class="row-value brand">${s.isPaid ? '₩9,900 / 월' : '〉'}</span>
          </div>
        </div>

        <p class="settings-group-label">개발용 (프로토타입 시연)</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">로그인 상태</span>
            <button class="toggle ${s.isLoggedIn ? 'on' : ''}" id="tglLogin" aria-label="로그인 토글"></button>
          </div>
          <div class="settings-row">
            <span class="row-label">결제(Pro) 상태</span>
            <button class="toggle ${s.isPaid ? 'on' : ''}" id="tglPaid" aria-label="결제 토글"></button>
          </div>
        </div>
        <p class="dev-note">게이트 동작을 확인하려고 만든 스위치예요. 로그인/결제를 끄고 홈에서 라이브를 눌러보면 로그인·결제 모달이 뜹니다.</p>
      </div>
    </div>
  `;

  bindHeader(root);

  root.querySelector('#loginBtn')?.addEventListener('click', () => navigate('login'));
  root.querySelector('#logoutRow')?.addEventListener('click', () => {
    logout();
    toast({ title: '로그아웃되었어요', type: 'check' });
    reRender();
  });

  root.querySelector('#langSelect').addEventListener('change', (e) => {
    setState({ defaultLang: e.target.value });
    toast({ title: '기본 자막 언어가 변경됐어요', type: 'check' });
  });

  root.querySelector('#planRow').addEventListener('click', () => {
    if (s.isPaid) toast({ title: 'Kaptik Pro 구독 중', sub: '다음 결제일: 매월 16일', type: 'check' });
    else openPaymentModal({ onSuccess: reRender });
  });

  // 개발용 토글
  root.querySelector('#tglLogin').addEventListener('click', () => {
    if (s.isLoggedIn) logout();
    else login('email', 'dev@kaptik.app');
    reRender();
  });
  root.querySelector('#tglPaid').addEventListener('click', () => {
    setState({ isPaid: !s.isPaid });
    reRender();
  });
}
