/**
 * 모달 / 오버레이 / 토스트
 * - 로그인 모달, 결제(Upgrade) 모달
 * - Processing 로딩 오버레이(스크립트 추출 → STT 분기 → 번역)
 * - 토스트 알림
 */
import { login, setState, getState } from './state.js';

const modalRoot = () => document.getElementById('modal-root');
const toastRoot = () => document.getElementById('toast-root');

/* ── 공통: 스크림 닫기 ── */
function closeScrim(scrim) {
  scrim.style.animation = 'fadeIn 180ms var(--ease) reverse';
  setTimeout(() => scrim.remove(), 170);
}

/* ─────────────────────────────────────────
   로그인 모달 (구글 + 자체 로그인)
   ───────────────────────────────────────── */
export function openLoginModal({ onSuccess } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `
    <div class="modal-card" style="position:relative;">
      <button class="modal-close-x" aria-label="닫기">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">로그인이 필요해요</div>
      <div class="modal-desc">영상을 번역하고 자막을 보려면 먼저 로그인해 주세요.</div>

      <button class="btn-google" data-act="google">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
        Google로 계속하기
      </button>

      <div class="login-divider">또는</div>

      <div class="field"><input type="email" placeholder="이메일" autocomplete="email" /></div>
      <div class="field"><input type="password" placeholder="비밀번호" autocomplete="current-password" /></div>
      <button class="btn-primary" data-act="email">로그인</button>
    </div>
  `;

  const finish = (provider, email) => {
    login(provider, email);
    toast({ title: '로그인되었어요', sub: getState().user.email, type: 'check' });
    closeScrim(scrim);
    if (onSuccess) onSuccess();
  };

  scrim.querySelector('[data-act="google"]').addEventListener('click', () => finish('google'));
  scrim.querySelector('[data-act="email"]').addEventListener('click', () => {
    const email = scrim.querySelector('input[type="email"]').value.trim();
    finish('email', email || 'me@kaptik.app');
  });
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });

  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   결제(Upgrade) 모달
   ───────────────────────────────────────── */
export function openPaymentModal({ onSuccess } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const check = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  scrim.innerHTML = `
    <div class="modal-card" style="position:relative;">
      <button class="modal-close-x" aria-label="닫기">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">Kaptik Pro로 업그레이드</div>
      <div class="modal-desc">실시간 다국어 자막과 무제한 번역은 Pro 멤버십에서 이용할 수 있어요.</div>

      <div class="plan-card">
        <div class="plan-price">₩9,900<small> / 월</small></div>
        <ul class="plan-feats">
          <li>${check} 무제한 영상 번역</li>
          <li>${check} 실시간 16개 언어 자막</li>
          <li>${check} 문화맥락 해설 + 화자 구분</li>
          <li>${check} 자막 클릭 → 영상 구간 이동</li>
        </ul>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" data-act="pay">Pro 시작하기</button>
        <button class="btn-secondary" data-act="later">나중에</button>
      </div>
    </div>
  `;

  scrim.querySelector('[data-act="pay"]').addEventListener('click', () => {
    setState({ isPaid: true });
    toast({ title: 'Kaptik Pro가 활성화됐어요', sub: '이제 모든 기능을 사용할 수 있어요', type: 'check' });
    closeScrim(scrim);
    if (onSuccess) onSuccess();
  });
  scrim.querySelector('[data-act="later"]').addEventListener('click', () => closeScrim(scrim));
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });

  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   Processing 오버레이
   platform에 따라 스크립트 추출/STT 분기를 시뮬레이션
   ───────────────────────────────────────── */
export function showProcessing(platform, onDone) {
  // YouTube는 공개 자막 트랙이 있어 STT 생략, 그 외(Weverse 등)는 STT 진행
  const hasScript = /youtube/i.test(platform);

  const steps = [
    { key: 'analyze', label: '링크 분석' },
    { key: 'extract', label: hasScript ? '스크립트 추출 (성공)' : '스크립트 추출 시도' },
    { key: 'stt',     label: hasScript ? 'STT 생략 (스크립트 양호)' : '음성 인식(STT) 처리', skip: hasScript },
    { key: 'translate', label: '다국어 번역' },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'processing';
  overlay.innerHTML = `
    <div class="proc-spinner"></div>
    <div class="proc-title">자막을 만드는 중…</div>
    <div class="proc-steps">
      ${steps.map((s) => `
        <div class="proc-step ${s.skip ? 'skip' : ''}" data-key="${s.key}">
          <span class="dot"></span><span class="txt">${s.label}</span>
        </div>`).join('')}
    </div>
  `;
  modalRoot().appendChild(overlay);

  const stepEls = [...overlay.querySelectorAll('.proc-step')];
  const checkSvg = '✓';
  let i = 0;

  function advance() {
    if (i > 0) {
      const prev = stepEls[i - 1];
      prev.classList.remove('active');
      if (!prev.classList.contains('skip')) {
        prev.classList.add('done');
        prev.querySelector('.dot').textContent = checkSvg;
      } else {
        prev.querySelector('.dot').textContent = '–';
      }
    }
    if (i >= stepEls.length) {
      setTimeout(() => {
        overlay.style.animation = 'fadeIn 200ms var(--ease) reverse';
        setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 190);
      }, 250);
      return;
    }
    stepEls[i].classList.add('active');
    // skip 단계는 빨리, 나머지는 약간 더 길게
    const delay = stepEls[i].classList.contains('skip') ? 500 : (700 + Math.random() * 500);
    i += 1;
    setTimeout(advance, delay);
  }
  advance();

  return () => overlay.remove();
}

/* ─────────────────────────────────────────
   토스트
   ───────────────────────────────────────── */
export function toast({ title, sub = '', type = 'check', duration = 3200 }) {
  const icons = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    live: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
    bell: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <div class="toast-icon ${type === 'live' ? 'live' : ''}">${icons[type] || icons.check}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
    </div>
  `;
  toastRoot().appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 280);
  }, duration);
}
