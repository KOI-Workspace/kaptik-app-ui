/**
 * 공통 UI 헬퍼 — 앱 헤더(로고 + Upgrade 버튼 + 선택적 검색)
 * 알림(종) 아이콘은 제거 — 라이브 알림은 시스템 푸시로 처리하고,
 * 지난 라이브는 별도 아카이브 화면에서 다룬다.
 */
import { getState } from './state.js';
import { openPaymentModal, toast } from './modals.js';
import { t } from './i18n.js';

const ICON_SEARCH = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const ICON_ROCKET = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`;

/**
 * 앱 헤더 마크업 문자열 반환
 * @param {{ showSearch?: boolean }} opts
 */
export function headerHTML({ showSearch = false } = {}) {
  const paid = getState().isPaid;
  const upgrade = paid
    ? `<button class="upgrade-btn paid" data-act="upgrade">Pro</button>`
    : `<button class="upgrade-btn" data-act="upgrade">${ICON_ROCKET} Upgrade</button>`;
  return `
    <header class="app-header">
      <div class="logo">kap<span>tik</span></div>
      <div class="header-actions">
        ${upgrade}
        ${showSearch ? `<button class="icon-btn" data-act="search" aria-label="${t('aria.search')}">${ICON_SEARCH}</button>` : ''}
      </div>
    </header>
  `;
}

/** 헤더 버튼 이벤트 바인딩 */
export function bindHeader(root) {
  const up = root.querySelector('[data-act="upgrade"]');
  if (up) up.addEventListener('click', () => {
    if (getState().isPaid) toast({ title: t('toast.proActive.title'), sub: t('toast.proActive.sub'), type: 'check' });
    else openPaymentModal();
  });
  const search = root.querySelector('[data-act="search"]');
  if (search) search.addEventListener('click', () => toast({ title: t('toast.searchSoon'), type: 'check' }));
}
