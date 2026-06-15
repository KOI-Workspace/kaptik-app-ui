/**
 * 멤버십 관리 화면 — 현재 요금제 확인, 플랜 변경, 구독 해지
 */
import { navigate } from '../router.js';
import { getState, setPlan } from '../state.js';
import { t } from '../i18n.js';
import { openPaymentModal, toast } from '../modals.js';

const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

const PLAN_BADGE = { free: 'Free', basic: '✦ Basic', pro: '✦ Pro' };

export function renderBilling(_params, root) {
  const reRender = () => renderBilling(_params, root);
  const s = getState();

  root.innerHTML = `
    <div class="view fullscreen settings-page">
      <header class="subpage-header">
        <button class="subpage-back" id="billingBack" aria-label="${t('aria.back')}">${BACK_ICON}</button>
        <h1>${t('billing.title')}</h1>
        <span class="subpage-header-spacer"></span>
      </header>

      <div class="page-content settings-page-content">
        <div class="settings-group" style="margin-top:8px;">
          <div class="settings-row">
            <span class="row-label">${t('my.row.currentPlan')}</span>
            <span class="plan-badge ${s.plan}">${PLAN_BADGE[s.plan]}</span>
          </div>
          ${s.plan !== 'free' ? `
          <div class="settings-row">
            <span class="row-label">${t('billing.nextBilling')}</span>
            <span class="row-value">${t('billing.nextValue')}</span>
          </div>` : ''}
        </div>

        <div class="billing-actions">
          <button class="btn-primary" id="changePlanBtn">
            ${s.plan === 'free' ? t('my.row.upgrade') : t('billing.changePlan')}
          </button>
          ${s.plan !== 'free' ? `
          <button class="btn-secondary danger" id="cancelBtn">${t('billing.cancel')}</button>` : ''}
        </div>
      </div>
    </div>
  `;

  root.querySelector('#billingBack').addEventListener('click', () => navigate('my'));

  root.querySelector('#changePlanBtn').addEventListener('click', () => {
    const target = s.plan === 'basic' ? 'pro' : 'basic';
    openPaymentModal({ select: target, onSuccess: reRender });
  });

  root.querySelector('#cancelBtn')?.addEventListener('click', () => {
    if (!confirm(t('billing.cancelConfirm'))) return;
    setPlan('free');
    toast({ title: t('toast.canceled'), type: 'check' });
    reRender();
  });
}
