/**
 * Home 화면
 * - My Artists 레일 (+ Add)
 * - Live Now 히어로 카드 + 라이브 소식 리스트
 * - 영상 클릭 시 로그인/결제 게이트 → Player
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { requireAccess } from '../gate.js';
import { toast } from '../modals.js';
import { FOLLOWED_ARTISTS, LIVE_FEED } from '../data.js';

function artistItem(a) {
  return `
    <div class="artist-item" data-artist="${a.id}">
      <div class="artist-ring ${a.live ? 'live-ring' : ''}">
        <div class="artist-avatar-inner" style="background:#fff;">
          <img src="${a.img}" alt="${a.name}" />
        </div>
      </div>
      <span class="artist-label">${a.name}</span>
    </div>`;
}

function addArtistItem() {
  return `
    <div class="artist-item" data-act="add-artist">
      <div class="artist-ring" style="background:var(--border);">
        <div class="artist-avatar-inner" style="background:var(--surface-el);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>
      <span class="artist-label">Add</span>
    </div>`;
}

function heroCard(item) {
  return `
    <div class="hero-live-card" data-feed="${item.id}">
      <div class="hero-thumb">
        <img src="${item.thumb}" alt="${item.title}" />
        <div class="thumb-badges">
          ${item.live ? `<div class="live-pill"><span class="live-dot-red"></span>LIVE</div>` : ''}
        </div>
        <div class="kaptik-badge">✦ Kaptik 자막</div>
      </div>
      <div class="hero-body">
        <div class="hero-title">${item.title}</div>
        <div class="hero-meta">
          <div class="hero-avatar"><img src="${item.artistImg}" alt="${item.artist}" /></div>
          <span>${item.artist}</span>
          <span style="color:var(--text-3);">· ${item.time}</span>
        </div>
      </div>
    </div>`;
}

function liveRow(item) {
  return `
    <div class="live-row" data-feed="${item.id}">
      <div class="live-row-thumb">
        <img src="${item.thumb}" alt="${item.title}" />
        ${item.live ? `<span class="mini-live">LIVE</span>` : ''}
      </div>
      <div class="live-row-info">
        <div class="live-row-title">${item.title}</div>
        <div class="live-row-meta">${item.artist} · ${item.time}</div>
      </div>
    </div>`;
}

export function renderHome(_params, root) {
  const [hero, ...rest] = LIVE_FEED;

  root.innerHTML = `
    <div class="view">
      ${headerHTML({ showSearch: true, hasNotif: true })}
      <div class="page-content">
        <p class="section-label">My Artists</p>
        <div class="artists-rail">
          ${FOLLOWED_ARTISTS.map(artistItem).join('')}
          ${addArtistItem()}
        </div>

        <p class="section-title" style="display:flex;align-items:center;gap:8px;">
          <span style="width:8px;height:8px;background:var(--notif);border-radius:50%;display:inline-block;animation:blink 1.2s infinite;"></span>
          Live Now
        </p>
        ${heroCard(hero)}

        ${rest.length ? `
          <p class="section-title" style="font-size:18px;margin:30px 0 14px;">More from your artists</p>
          <div class="live-list">${rest.map(liveRow).join('')}</div>
        ` : ''}
      </div>
    </div>
  `;

  bindHeader(root);

  // 아티스트 추가
  root.querySelector('[data-act="add-artist"]')?.addEventListener('click', () => {
    toast({ title: '아티스트 추가', sub: '팔로우할 아티스트를 검색해 보세요', type: 'check' });
  });

  // 영상 클릭 → 게이트 → Player
  root.querySelectorAll('[data-feed]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.feed;
      const feed = LIVE_FEED.find((f) => f.id === id);
      requireAccess(() => navigate('player', { feed }));
    });
  });
}
