/**
 * 설정 화면 — 알림 종류별 수신 여부와 앱 언어 관리
 */
import { navigate } from '../router.js';
import { getState, setState, setFollowNotify, getFollow } from '../state.js';
import { t, setLang } from '../i18n.js';
import { LANGUAGES, getArtist } from '../data.js';
import { toast } from '../modals.js';

const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

export function renderSettings(_params, root) {
  const state = getState();
  const notifications = {
    live: true,
    product: false,
    ...state.notifications,
  };

  const render = () => {
    const liveEnabled = !!(getState().notifications?.live ?? notifications.live);
    const follows = getState().follows;

    const artistListHTML = follows.length
      ? follows.map((f) => {
          const a = getArtist(f.id) || { id: f.id, name: f.id };
          return `
            <div class="notif-artist-row" data-id="${a.id}">
              <span class="notif-artist-name">${a.name}</span>
              <button class="toggle sm ${f.notify ? 'on' : ''}" data-notif-artist="${a.id}" aria-label="${a.name}"></button>
            </div>`;
        }).join('')
      : `<p class="notif-artist-empty">${t('settings.notification.liveNoArtists')}</p>`;

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
                ${LANGUAGES.map((lang) => `<option value="${lang.code}" ${lang.code === getState().uiLang ? 'selected' : ''}>${lang.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <p class="settings-group-label">${t('settings.notifications')}</p>
          <div class="settings-group">
            <div class="settings-row notification-setting-row">
              <span class="row-label">
                ${t('settings.notification.live')}
                <small class="setting-row-help">${t('settings.notification.liveHelp')}</small>
              </span>
              <button class="toggle ${liveEnabled ? 'on' : ''}" data-notification="live" aria-label="${t('settings.notification.live')}"></button>
            </div>
            <div class="notif-artist-list${liveEnabled ? '' : ' notif-artist-list--hidden'}" id="notifArtistList">
              ${artistListHTML}
            </div>
            ${notificationRow('product', !!(getState().notifications?.product ?? notifications.product))}
          </div>
        </div>
      </div>
    `;

    bindEvents();
  };

  const bindEvents = () => {
    root.querySelector('#settingsBack').addEventListener('click', () => navigate('my'));

    // 마스터 토글 — Artist Live Started ON/OFF
    root.querySelector('[data-notification="live"]').addEventListener('click', (btn) => {
      const toggle = btn.currentTarget;
      const next = !toggle.classList.contains('on');
      toggle.classList.toggle('on', next);
      setState({
        notifications: { ...notifications, ...getState().notifications, live: next },
      });
      const list = root.querySelector('#notifArtistList');
      if (list) list.classList.toggle('notif-artist-list--hidden', !next);
    });

    // 제품 알림 토글
    const productBtn = root.querySelector('[data-notification="product"]');
    if (productBtn) {
      productBtn.addEventListener('click', () => {
        const next = !productBtn.classList.contains('on');
        productBtn.classList.toggle('on', next);
        setState({
          notifications: { ...notifications, ...getState().notifications, product: next },
        });
      });
    }

    // 아티스트별 알림 토글
    root.querySelectorAll('[data-notif-artist]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.notifArtist;
        const cur = getFollow(id);
        const next = !(cur && cur.notify);
        setFollowNotify(id, next);
        btn.classList.toggle('on', next);
      });
    });

    root.querySelector('#settingsLanguage').addEventListener('change', (event) => {
      setLang(event.target.value);
      toast({ title: t('toast.langChanged'), type: 'check' });
    });
  };

  render();
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
