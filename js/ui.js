/**
 * 공통 UI 헬퍼 — 앱 헤더(로고 + Upgrade 버튼 + 검색/알림)
 */
import { getState } from './state.js';
import { openPaymentModal, toast } from './modals.js';

const ICON_SEARCH = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const ICON_BELL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const ICON_ROCKET = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`;

/**
 * 앱 헤더 마크업 문자열 반환
 * @param {{ showSearch?: boolean, hasNotif?: boolean }} opts
 */
export function headerHTML({ showSearch = true, hasNotif = true } = {}) {
  const paid = getState().isPaid;
  const upgrade = paid
    ? `<button class="upgrade-btn paid" data-act="upgrade">Pro</button>`
    : `<button class="upgrade-btn" data-act="upgrade">${ICON_ROCKET} Upgrade</button>`;
  return `
    <header class="app-header">
      <div class="logo">kap<span>tik</span></div>
      <div class="header-actions">
        ${upgrade}
        ${showSearch ? `<button class="icon-btn" data-act="search" aria-label="검색">${ICON_SEARCH}</button>` : ''}
        <button class="icon-btn" data-act="bell" aria-label="알림">
          ${ICON_BELL}${hasNotif ? '<span class="notif-badge"></span>' : ''}
        </button>
      </div>
    </header>
  `;
}

/** 헤더 버튼 이벤트 바인딩 */
export function bindHeader(root) {
  const up = root.querySelector('[data-act="upgrade"]');
  if (up) up.addEventListener('click', () => {
    if (getState().isPaid) toast({ title: 'Kaptik Pro 이용 중', sub: '모든 기능이 활성화돼 있어요', type: 'check' });
    else openPaymentModal();
  });
  const search = root.querySelector('[data-act="search"]');
  if (search) search.addEventListener('click', () => toast({ title: '검색은 준비 중이에요', type: 'check' }));
  const bell = root.querySelector('[data-act="bell"]');
  if (bell) bell.addEventListener('click', () => toast({ title: '알림', sub: 'BTS가 라이브를 시작했어요', type: 'live' }));
}
