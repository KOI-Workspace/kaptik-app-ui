/**
 * Home 화면
 * - My Artists 레일 (+ Add)
 * - Live Now 히어로 카드 + 라이브 소식 리스트
 * - 영상 클릭 시 로그인/결제 게이트 → Player
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { requireAccess } from '../gate.js';
import { openArtistSearch } from '../modals.js';
import { t } from '../i18n.js';
import { getState } from '../state.js';
import { LIVE_FEED, getArtist } from '../data.js';

function artistItem(a) {
  // 로고 이미지가 없는 아티스트는 이니셜 아바타로 대체
  const initials = a.name.replace(/[^A-Za-z0-9가-힣]/g, '').slice(0, 2).toUpperCase();
  const inner = a.img
    ? `<div class="artist-avatar-inner" style="background:#fff;"><img src="${a.img}" alt="${a.name}" /></div>`
    : `<div class="artist-avatar-inner initials">${initials}</div>`;
  return `
    <div class="artist-item" data-artist="${a.id}">
      <div class="artist-ring ${a.live ? 'live-ring' : ''}">
        ${inner}
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
      <span class="artist-label">${t('home.add')}</span>
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
        <div class="kaptik-badge">${t('home.kaptikCaption')}</div>
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
  // 팔로우 상태에서 아티스트 정보를 끌어와 레일을 구성 (카탈로그에 없는 id는 제외)
  const followedArtists = getState().follows
    .map((f) => getArtist(f.id))
    .filter(Boolean);

  root.innerHTML = `
    <div class="view">
      ${headerHTML()}
      <div class="page-content">
        <p class="section-label">${t('home.myArtists')}</p>
        <div class="artists-rail">
          ${followedArtists.map(artistItem).join('')}
          ${addArtistItem()}
        </div>

        <p class="section-title" style="display:flex;align-items:center;gap:8px;">
          <span style="width:8px;height:8px;background:var(--notif);border-radius:50%;display:inline-block;animation:blink 1.2s infinite;"></span>
          ${t('home.liveNow')}
        </p>
        ${heroCard(hero)}

        ${rest.length ? `
          <p class="section-title" style="font-size:18px;margin:30px 0 14px;">${t('home.moreArtists')}</p>
          <div class="live-list">${rest.map(liveRow).join('')}</div>
        ` : ''}
      </div>
    </div>
  `;

  bindHeader(root);

  // 아티스트 추가 → 검색/팔로우 모달 (변경 시 홈 레일 갱신)
  root.querySelector('[data-act="add-artist"]')?.addEventListener('click', () => {
    openArtistSearch({ onChange: () => navigate('home') });
  });

  // 영상 클릭 → 게이트 → Player
  root.querySelectorAll('[data-feed]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.feed;
      const feed = LIVE_FEED.find((f) => f.id === id);
      requireAccess(() => navigate('player', { feed }), { need: 'basic' });
    });
  });
}
