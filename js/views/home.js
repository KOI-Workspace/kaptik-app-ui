/**
 * Home 화면
 * - URL 입력 박스 (YouTube / Weverse 링크)
 * - Live Now 텍스트 카드 리스트
 * - 영상 클릭 시 로그인/결제 게이트 → Player
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { requireAccess } from '../gate.js';
import { t } from '../i18n.js';
import { LIVE_FEED } from '../data.js';

/** URL에서 플랫폼 추론 */
function detectPlatform(url) {
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/weverse/i.test(url)) return 'weverse';
  if (/(twitter|x\.com)/i.test(url)) return 'x';
  if (/instagram/i.test(url)) return 'instagram';
  return 'weverse';
}

/** 게이트 통과 후 Player로 이동 */
function startTranslation(platform) {
  requireAccess(() => {
    navigate('player', {
      subtitlePending: true,
      subtitleDelayMs: platform === 'youtube' ? 3200 : 5200,
    });
  }, { need: 'pro' });
}

function heroCard(item) {
  return `
    <div class="hero-live-card" data-feed="${item.id}">
      <div class="hero-body">
        ${item.live ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span class="live-dot-red"></span><span style="font-size:11px;font-weight:800;letter-spacing:0.5px;">LIVE</span></div>` : ''}
        <div class="hero-title">${item.title}</div>
        <div class="hero-meta"><span>${item.artist}</span></div>
      </div>
    </div>`;
}

export function renderHome(_params, root) {
  const [hero] = LIVE_FEED;

  root.innerHTML = `
    <div class="view">
      ${headerHTML()}
      <div class="page-content">

        <p class="section-title">Youtube Translation</p>
        <div class="url-input-wrap">
          <input class="url-input" id="urlInput" type="url" inputmode="url"
                 placeholder="${t('translate.placeholder')}" autocomplete="off" />
          <button class="url-submit" id="urlSubmit" aria-label="${t('aria.translateStart')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <p class="section-title" style="display:flex;align-items:center;gap:8px;">
          <span style="width:8px;height:8px;background:var(--notif);border-radius:50%;display:inline-block;animation:blink 1.2s infinite;"></span>
          Weverse Live
        </p>
        ${heroCard(hero)}
      </div>
    </div>
  `;

  bindHeader(root);

  // URL 입력 → Player
  const input = root.querySelector('#urlInput');
  const submit = () => {
    const url = input.value.trim();
    startTranslation(url ? detectPlatform(url) : 'weverse');
  };
  root.querySelector('#urlSubmit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  // 영상 클릭 → 게이트 → Player
  root.querySelectorAll('[data-feed]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.feed;
      const feed = LIVE_FEED.find((f) => f.id === id);
      requireAccess(() => navigate('player', { feed }), { need: 'basic' });
    });
  });
}
