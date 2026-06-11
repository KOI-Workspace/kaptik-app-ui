/**
 * 모달 / 오버레이 / 토스트
 * - 로그인 모달, 결제(Upgrade) 모달
 * - Processing 로딩 오버레이(스크립트 추출 → STT 분기 → 번역)
 * - 토스트 알림
 */
import {
  setState, setPlan, getState,
  isFollowing, getFollow, followArtist, unfollowArtist, setFollowNotify,
} from './state.js';
import { quickAuth, signInWithGoogle } from './auth.js';
import { t } from './i18n.js';
import { ARTIST_CATALOG, getArtist } from './data.js';

const modalRoot = () => document.getElementById('modal-root');
const toastRoot = () => document.getElementById('toast-root');

/** 아티스트 아바타 마크업 — 로고 이미지가 있으면 이미지, 없으면 이니셜 */
function artistAvatar(a, size = 44) {
  const initials = a.name.replace(/[^A-Za-z0-9가-힣]/g, '').slice(0, 2).toUpperCase();
  return a.img
    ? `<div class="asr-avatar" style="width:${size}px;height:${size}px;"><img src="${a.img}" alt="${a.name}" /></div>`
    : `<div class="asr-avatar initials" style="width:${size}px;height:${size}px;">${initials}</div>`;
}

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
      <div class="modal-title">${t('loginModal.title')}</div>
      <div class="modal-desc">${t('loginModal.desc')}</div>

      <button class="btn-google" data-act="google">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
        ${t('login.googleContinue')}
      </button>

      <div class="login-divider">${t('loginModal.or')}</div>

      <div class="field" data-field="email"><input type="email" placeholder="${t('login.ph.email')}" autocomplete="email" inputmode="email" /><p class="field-error"></p></div>
      <div class="field" data-field="pw"><input type="password" placeholder="${t('login.ph.pw')}" autocomplete="current-password" /><p class="field-error"></p></div>
      <button class="btn-primary" data-act="email">${t('loginModal.continue')}</button>
    </div>
  `;

  const finish = () => {
    toast({ title: t('toast.loginDone'), sub: getState().user.email, type: 'check' });
    closeScrim(scrim);
    if (onSuccess) onSuccess();
  };

  const fieldError = (field, key) => {
    const wrap = scrim.querySelector(`.field[data-field="${field}"]`);
    if (!wrap) return;
    wrap.classList.add('invalid');
    wrap.querySelector('.field-error').textContent = t(key);
  };

  scrim.querySelectorAll('.field input').forEach((inp) => {
    inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('invalid'));
  });

  scrim.querySelector('[data-act="google"]').addEventListener('click', () => { signInWithGoogle(); finish(); });
  scrim.querySelector('[data-act="email"]').addEventListener('click', () => {
    scrim.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    const email = scrim.querySelector('input[type="email"]').value;
    const password = scrim.querySelector('input[type="password"]').value;
    const result = quickAuth({ email, password });
    if (result.ok) finish();
    else fieldError(result.field, result.key);
  });
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });

  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   결제(Upgrade) 모달
   ───────────────────────────────────────── */
// 요금제 정의 — 단일 진실 소스. modal·my 화면이 공유한다.
// name/price는 브랜드 고정값, tagline/feats는 i18n 키로 두고 표시할 때 t()로 번역한다.
export const PLANS = {
  basic: {
    name: 'Basic',
    price: '$2.9',
    tagline: 'plan.basic.tagline',
    feats: ['plan.basic.f1', 'plan.basic.f2'],
  },
  pro: {
    name: 'Pro',
    price: '$7.9',
    tagline: 'plan.pro.tagline',
    feats: ['plan.pro.f1', 'plan.pro.f2', 'plan.pro.f3'],
  },
};

/**
 * 결제(Upgrade) 모달 — Basic / Pro 두 요금제 중 선택
 * @param {{ onSuccess?: Function, select?: 'basic'|'pro' }} opts select: 기본 선택 요금제
 */
export function openPaymentModal({ onSuccess, select = 'pro' } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const check = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  let chosen = select;

  const planCard = (key) => {
    const p = PLANS[key];
    return `
      <button class="plan-option ${key === chosen ? 'selected' : ''}" data-plan="${key}">
        <div class="plan-option-head">
          <span class="plan-option-name">${p.name}</span>
          <span class="plan-option-price">${p.price}<small> / 월</small></span>
        </div>
        <div class="plan-option-tagline">${t(p.tagline)}</div>
        <ul class="plan-feats">
          ${p.feats.map((f) => `<li>${check} ${t(f)}</li>`).join('')}
        </ul>
      </button>`;
  };

  scrim.innerHTML = `
    <div class="modal-card" style="position:relative;">
      <button class="modal-close-x" aria-label="닫기">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">${t('payment.title')}</div>
      <div class="modal-desc">${t('payment.desc')}</div>

      <div class="plan-options">
        ${planCard('basic')}
        ${planCard('pro')}
      </div>

      <div class="modal-actions">
        <button class="btn-primary" data-act="pay">${t('payment.start', { name: PLANS[chosen].name })}</button>
        <button class="btn-secondary" data-act="later">${t('payment.later')}</button>
      </div>
    </div>
  `;

  // 요금제 카드 선택
  const payBtn = scrim.querySelector('[data-act="pay"]');
  scrim.querySelectorAll('.plan-option').forEach((el) => {
    el.addEventListener('click', () => {
      chosen = el.dataset.plan;
      scrim.querySelectorAll('.plan-option').forEach((o) => o.classList.toggle('selected', o === el));
      payBtn.textContent = t('payment.start', { name: PLANS[chosen].name });
    });
  });

  payBtn.addEventListener('click', () => {
    setPlan(chosen);
    toast({ title: t('toast.planActive.title', { name: PLANS[chosen].name }), sub: t('toast.planActive.sub'), type: 'check' });
    closeScrim(scrim);
    if (onSuccess) onSuccess();
  });
  scrim.querySelector('[data-act="later"]').addEventListener('click', () => closeScrim(scrim));
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });

  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   아티스트 검색 / 팔로우 모달
   - 검색어로 카탈로그 필터 → 결과마다 [라이브 알림 스위치 + 팔로우 버튼]
   - 알림 스위치 기본 ON. 스위치 상태로 팔로우하면 그 설정으로 알림 수신/차단.
   ───────────────────────────────────────── */
export function openArtistSearch({ onChange } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  // 결과 행마다 "팔로우 전 알림 선호" 상태를 기억 (기본 ON)
  const notifPref = {};

  scrim.innerHTML = `
    <div class="modal-card sheet-modal" style="position:relative;">
      <button class="modal-close-x" aria-label="${t('aria.close')}">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">${t('artist.search.title')}</div>
      <div class="field" style="margin:6px 0 4px;">
        <input type="text" id="artistSearch" placeholder="${t('artist.search.placeholder')}" autocomplete="off" />
      </div>
      <div class="artist-results" id="artistResults"></div>
    </div>
  `;

  const input = scrim.querySelector('#artistSearch');
  const results = scrim.querySelector('#artistResults');

  const rowHTML = (a) => {
    const following = isFollowing(a.id);
    const notify = following ? !!getFollow(a.id).notify : (notifPref[a.id] ?? true);
    return `
      <div class="artist-result" data-id="${a.id}">
        ${artistAvatar(a)}
        <div class="asr-info">
          <div class="asr-name">${a.name}${a.live ? ' <span class="asr-live">LIVE</span>' : ''}</div>
          <label class="asr-notify">
            <span>${t('artist.notify')}</span>
            <button class="toggle sm ${notify ? 'on' : ''}" data-act="notify" aria-label="${t('artist.notify')}"></button>
          </label>
        </div>
        <button class="asr-follow ${following ? 'following' : ''}" data-act="follow">${following ? t('artist.following') : t('artist.follow')}</button>
      </div>`;
  };

  const renderResults = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = `<p class="asr-hint">${t('artist.search.hint')}</p>`;
      return;
    }
    const matched = ARTIST_CATALOG.filter((a) => a.name.toLowerCase().includes(q));
    results.innerHTML = matched.length
      ? matched.map(rowHTML).join('')
      : `<p class="asr-hint">${t('artist.search.empty')}</p>`;
    bindRows();
  };

  const bindRows = () => {
    results.querySelectorAll('.artist-result').forEach((row) => {
      const id = row.dataset.id;
      const a = getArtist(id);
      const notifBtn = row.querySelector('[data-act="notify"]');
      const followBtn = row.querySelector('[data-act="follow"]');

      notifBtn.addEventListener('click', () => {
        const next = !notifBtn.classList.contains('on');
        notifBtn.classList.toggle('on', next);
        if (isFollowing(id)) setFollowNotify(id, next); // 이미 팔로우 중이면 즉시 반영
        else notifPref[id] = next;                       // 아니면 선호만 기억
        if (onChange) onChange();
      });

      followBtn.addEventListener('click', () => {
        if (isFollowing(id)) {
          unfollowArtist(id);
          toast({ title: t('toast.unfollowed', { name: a.name }), type: 'check' });
        } else {
          const notify = notifBtn.classList.contains('on');
          followArtist(id, notify);
          toast({ title: t('toast.followed', { name: a.name }), type: 'check' });
        }
        renderResults();
        if (onChange) onChange();
      });
    });
  };

  input.addEventListener('input', renderResults);
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });
  modalRoot().appendChild(scrim);
  renderResults();
  setTimeout(() => input.focus(), 100);
}

/* ─────────────────────────────────────────
   팔로우한 아티스트 목록 모달 (My에서 진입)
   - 팔로우 목록 + 각 아티스트의 라이브 알림 스위치 상태 확인/토글 + 언팔로우
   ───────────────────────────────────────── */
export function openFollowedArtists({ onChange } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';

  const render = () => {
    const follows = getState().follows;
    const listHTML = follows.length
      ? follows.map((f) => {
          const a = getArtist(f.id) || { id: f.id, name: f.id };
          return `
            <div class="artist-result" data-id="${a.id}">
              ${artistAvatar(a)}
              <div class="asr-info">
                <div class="asr-name">${a.name}${a.live ? ' <span class="asr-live">LIVE</span>' : ''}</div>
                <div class="asr-status ${f.notify ? 'on' : 'off'}">${f.notify ? t('followed.notifOn') : t('followed.notifOff')}</div>
              </div>
              <button class="toggle ${f.notify ? 'on' : ''}" data-act="notify" aria-label="${t('artist.notify')}"></button>
              <button class="asr-unfollow" data-act="unfollow" aria-label="${t('artist.following')}">✕</button>
            </div>`;
        }).join('')
      : `<div class="asr-empty"><p>${t('followed.empty')}</p><span>${t('followed.emptyHint')}</span></div>`;

    scrim.innerHTML = `
      <div class="modal-card sheet-modal" style="position:relative;">
        <button class="modal-close-x" aria-label="${t('aria.close')}">✕</button>
        <div class="modal-grip"></div>
        <div class="modal-title">${t('followed.title')}</div>
        <div class="modal-desc">${t('followed.count', { n: follows.length })}</div>
        <div class="artist-results">${listHTML}</div>
      </div>
    `;

    scrim.querySelectorAll('.artist-result').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-act="notify"]').addEventListener('click', (e) => {
        const cur = getFollow(id);
        setFollowNotify(id, !(cur && cur.notify));
        render();
        if (onChange) onChange();
      });
      row.querySelector('[data-act="unfollow"]').addEventListener('click', () => {
        unfollowArtist(id);
        render();
        if (onChange) onChange();
      });
    });
    scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  };

  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });
  render();
  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   멤버십 관리 모달 (결제 정보 관리 — Pro/Basic 유저)
   ───────────────────────────────────────── */
export function openBillingModal({ onChange } = {}) {
  const s = getState();
  const planName = s.plan === 'pro' ? 'Pro' : 'Basic';
  const price = s.plan === 'pro' ? '$7.9' : '$2.9';
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `
    <div class="modal-card" style="position:relative;">
      <button class="modal-close-x" aria-label="${t('aria.close')}">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">${t('billing.title')}</div>

      <div class="settings-group" style="margin:14px 0 18px;">
        <div class="settings-row">
          <span class="row-label">${t('my.row.currentPlan')}</span>
          <span class="plan-badge ${s.plan}">✦ ${planName} · ${price} ${t('my.perMonth')}</span>
        </div>
        <div class="settings-row">
          <span class="row-label">${t('billing.nextBilling')}</span>
          <span class="row-value">${t('billing.nextValue')}</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" data-act="change">${t('billing.changePlan')}</button>
        <button class="btn-secondary danger" data-act="cancel">${t('billing.cancel')}</button>
      </div>
    </div>
  `;

  scrim.querySelector('[data-act="change"]').addEventListener('click', () => {
    closeScrim(scrim);
    openPaymentModal({ select: s.plan === 'basic' ? 'pro' : 'basic', onSuccess: onChange });
  });
  scrim.querySelector('[data-act="cancel"]').addEventListener('click', () => {
    if (!confirm(t('billing.cancelConfirm'))) return;
    setPlan('free');
    toast({ title: t('toast.canceled'), type: 'check' });
    closeScrim(scrim);
    if (onChange) onChange();
  });
  scrim.querySelector('.modal-close-x').addEventListener('click', () => closeScrim(scrim));
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closeScrim(scrim); });
  modalRoot().appendChild(scrim);
}

/* ─────────────────────────────────────────
   약관 / 개인정보 문서 모달
   key: 'tos' | 'privacy' → legal.<key>.title / legal.<key>.body
   ───────────────────────────────────────── */
export function openLegalDoc(key) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `
    <div class="modal-card sheet-modal" style="position:relative;">
      <button class="modal-close-x" aria-label="${t('aria.close')}">✕</button>
      <div class="modal-grip"></div>
      <div class="modal-title">${t(`legal.${key}.title`)}</div>
      <div class="legal-body">${t(`legal.${key}.body`)}</div>
    </div>
  `;
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
    { key: 'analyze', label: t('proc.analyze') },
    { key: 'extract', label: hasScript ? t('proc.extractOk') : t('proc.extractTry') },
    { key: 'stt',     label: hasScript ? t('proc.sttSkip') : t('proc.sttDo'), skip: hasScript },
    { key: 'translate', label: t('proc.translate') },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'processing';
  overlay.innerHTML = `
    <div class="proc-spinner"></div>
    <div class="proc-title">${t('proc.title')}</div>
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
