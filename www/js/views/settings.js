/**
 * 설정 화면 — 알림 종류별 수신 여부와 앱 언어 관리
 */
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { t, setLang } from '../i18n.js';
import { LANGUAGES } from '../data.js';
import { toast } from '../modals.js';

const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

export function renderSettings(_params, root) {
  const state = getState();
  const notifications = {
    live: true,
    subtitle: true,
    product: false,
    ...state.notifications,
  };

  root.innerHTML = `
    <div class="view fullscreen settings-page">
      <header class="subpage-header">
        <button class="subpage-back" id="settingsBack" aria-label="${t('aria.back')}">${BACK_ICON}</button>
        <h1>${t('settings.title')}</h1>
        <span class="subpage-header-spacer"></span>
      </header>

      <div class="page-content settings-page-content">
        <p class="settings-group-label">${t('settings.language')}</p>
        <div class="settings-group">
          <div class="settings-row">
            <span class="row-label">${t('settings.language')}</span>
            <select class="row-select" id="settingsLanguage">
              ${LANGUAGES.map((lang) => `<option value="${lang.code}" ${lang.code === state.uiLang ? 'selected' : ''}>${lang.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <p class="settings-group-label">${t('settings.notifications')}</p>
        <div class="settings-group">
          ${notificationRow('live', notifications.live)}
          ${notificationRow('subtitle', notifications.subtitle)}
          ${notificationRow('product', notifications.product)}
        </div>
      </div>
    </div>
  `;

  root.querySelector('#settingsBack').addEventListener('click', () => navigate('my'));

  root.querySelectorAll('[data-notification]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.notification;
      const next = !getState().notifications?.[key];
      setState({
        notifications: {
          ...notifications,
          ...getState().notifications,
          [key]: next,
        },
      });
      button.classList.toggle('on', next);
    });
  });

  root.querySelector('#settingsLanguage').addEventListener('change', (event) => {
    setLang(event.target.value);
    toast({ title: t('toast.langChanged'), type: 'check' });
  });
}

function notificationRow(key, enabled) {
  return `
    <div class="settings-row notification-setting-row">
      <span class="row-label">
        ${t(`settings.notification.${key}`)}
        <small class="setting-row-help">${t(`settings.notification.${key}Help`)}</small>
      </span>
      <button class="toggle ${enabled ? 'on' : ''}" data-notification="${key}" aria-label="${t(`settings.notification.${key}`)}"></button>
    </div>
  `;
}
