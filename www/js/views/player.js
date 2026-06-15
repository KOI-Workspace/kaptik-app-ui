/**
 * Player 화면 — 상단 영상 + 하단 드래그 자막 시트
 *
 * 재생 소스를 "컨트롤러"로 추상화한다.
 *  - YouTube: IFrame Player API (실제 재생 + seekTo)
 *  - Weverse 등 임베드 불가 플랫폼: 위버스 스타일 목업 영상 영역 + 가상 재생 클럭
 *
 * 두 경우 모두 전체 자막 목록에서 현재 구간을 강조하고,
 * 자막 한 줄을 탭하면 해당 타임스탬프로 이동(seekTo)한다.
 */
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { t } from '../i18n.js';
import { whenYTReady } from '../ytapi.js';
import {
  SUBTITLES, ANNOTATIONS, SPEAKER_COLORS, SPEAKER_INITIALS, SPEAKER_IMAGES,
  SCROLL_TO_TOP_LABELS, LANGUAGES, DEMO_VIDEO,
} from '../data.js';

/* ── 모듈 스코프 상태 (render마다 리셋) ── */
let sheet, sheetContent, subtitleList, scrollToTopBtn, langPanel, langSelect;
let controller = null;      // { getTime, seekTo, play, pause, isRunning, destroy }
let pollTimer = null;
let subtitleReadyTimer = null;
let currentLang = 'en';
let subtitlesReady = true;

let lastSubtitleStart = -1;

let sheetTop = 0;
let MIN_TOP = 100;
const MAX_TOP = () => window.innerHeight - 130;

let isDragging = false, dragStartY = 0, dragStartTop = 0;
const DRAG_ZONE = 70;

let isUserScrolled = false;

let landscapeSubtitleOverlay = null;
let panelCollapsed = false;
let overlaySettings = { showSpeaker: true, showTranscript: true, subtitleLines: 2, subtitleSize: 80, bgOpacity: 65 };

let activeContextKey = null, activeContextEl = null;

/* ── 유틸 ── */
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildAnnotatedHtml(text) {
  let result = escapeHtml(text);
  Object.keys(ANNOTATIONS).forEach((keyword) => {
    const ann = ANNOTATIONS[keyword];
    const esc = escapeHtml(keyword);
    result = result.replace(
      new RegExp(escapeRegex(esc)),
      `<span class="annotated-word" data-key="${esc}" style="color:${ann.color};text-decoration-color:${ann.color}55">${esc}</span>`
    );
  });
  return result;
}

/* ─────────────────────────────────────────
   재생 컨트롤러
   ───────────────────────────────────────── */
function makeYouTubeController(videoId, onReady) {
  let player = null;
  whenYTReady(() => {
    player = new window.YT.Player('yt-player', {
      videoId,
      // mute:1 — 브라우저 자동재생 정책상 음소거여야 자동 시작됨. 영상에서 해제 가능.
      playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1 },
      events: { onReady: (e) => { e.target.playVideo(); onReady(); } },
    });
  });
  return {
    getTime: () => (player && player.getCurrentTime ? player.getCurrentTime() : 0),
    seekTo: (s) => { if (player && player.seekTo) { player.seekTo(s, true); player.playVideo(); } },
    play: () => player && player.playVideo && player.playVideo(),
    pause: () => player && player.pauseVideo && player.pauseVideo(),
    isRunning: () => true,
    destroy: () => { if (player && player.destroy) { try { player.destroy(); } catch {} } player = null; },
  };
}

/* 임베드 불가 플랫폼(위버스 등): 가상 클럭으로 자막을 흐르게 한다 */
function makeMockController() {
  let startTime = Date.now();
  let elapsed = 0;
  let running = true;
  return {
    getTime: () => (running ? (Date.now() - startTime) / 1000 : elapsed),
    seekTo: (s) => { elapsed = s; startTime = Date.now() - s * 1000; running = true; },
    play: () => { startTime = Date.now() - elapsed * 1000; running = true; },
    pause: () => { elapsed = (Date.now() - startTime) / 1000; running = false; },
    isRunning: () => running,
    destroy: () => { running = false; },
  };
}

/* ── 자막 엘리먼트 ── */
function createSubtitleEl(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'subtitle-item';
  wrapper.dataset.start = String(item.start);

  const speaker = item.speaker || '';
  const color = SPEAKER_COLORS[speaker] || '#888888';
  const initials = SPEAKER_INITIALS[speaker] || speaker.slice(0, 2).toUpperCase();
  const text = item[currentLang] || item.en || '';

  const row = document.createElement('div');
  row.className = 'subtitle-row';

  const avatar = document.createElement('div');
  avatar.className = 'subtitle-avatar';
  avatar.style.border = `1.5px solid ${color}55`;
  const imgSrc = SPEAKER_IMAGES[speaker];
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc; img.alt = speaker;
    img.onerror = () => { img.remove(); avatar.textContent = initials; avatar.style.background = color + '22'; avatar.style.color = color; };
    avatar.appendChild(img);
  } else {
    avatar.textContent = initials; avatar.style.background = color + '22'; avatar.style.color = color;
  }

  const body = document.createElement('div');
  body.className = 'subtitle-body';
  const nameEl = document.createElement('div');
  nameEl.className = 'subtitle-name';
  nameEl.style.color = color;
  nameEl.innerHTML = `${escapeHtml(speaker)}<span class="subtitle-time">${fmtTime(item.start)}</span>`;
  const textEl = document.createElement('div');
  textEl.className = 'subtitle-text';
  textEl.innerHTML = buildAnnotatedHtml(text);
  body.appendChild(nameEl);
  body.appendChild(textEl);

  row.appendChild(avatar);
  row.appendChild(body);
  wrapper.appendChild(row);

  wrapper.querySelectorAll('.annotated-word').forEach((span) => {
    span.addEventListener('click', (e) => { e.stopPropagation(); showContext(span.dataset.key, span); });
  });
  row.addEventListener('click', () => seekToSubtitle(item));

  return wrapper;
}

/* ── 자막 클릭 → seek ── */
function seekToSubtitle(item) {
  if (controller) controller.seekTo(item.start);
  updateSubtitle(item.start);
}

function updateSubtitle(time) {
  if (!subtitlesReady) return;
  const cur = SUBTITLES.find((s) => time >= s.start && time < s.end);
  const nextStart = cur ? cur.start : -1;
  if (nextStart === lastSubtitleStart) return;
  lastSubtitleStart = nextStart;

  subtitleList.querySelector('.subtitle-row.current')?.classList.remove('current');

  updateOverlay(cur || null);

  if (!cur) return;
  subtitleList
    .querySelector(`.subtitle-item[data-start="${cur.start}"] .subtitle-row`)
    ?.classList.add('current');
}

function rerenderAll() {
  const scrollTop = sheetContent.scrollTop;
  subtitleList.innerHTML = '';
  SUBTITLES.forEach((item) => subtitleList.appendChild(createSubtitleEl(item)));
  lastSubtitleStart = -1;
  if (controller) updateSubtitle(controller.getTime());
  sheetContent.scrollTop = scrollTop;
}

/** 자막 준비 완료 시 현재 재생 구간부터 자막을 시작한다. */
function finishSubtitlePreparation(statusEl) {
  if (!controller || !statusEl) return;
  subtitlesReady = true;
  statusEl.classList.add('complete');
  statusEl.querySelector('.subtitle-status-title').textContent = t('player.subtitleReady');
  statusEl.querySelector('.subtitle-status-desc').textContent = t('player.subtitleReadyDesc');

  const currentTime = controller.getTime();
  rerenderAll();
  updateSubtitle(currentTime);

  setTimeout(() => statusEl.classList.add('leaving'), 600);
  setTimeout(() => statusEl.remove(), 950);
}

/* ── 문화맥락 해설 ── */
function showContext(key, triggerSpan) {
  if (activeContextKey === key) { hideContext(); return; }
  hideContext();
  activeContextKey = key;
  const ann = ANNOTATIONS[key];
  if (!ann) return;
  const subtitleItem = triggerSpan.closest('.subtitle-item');
  if (!subtitleItem) return;
  const card = document.createElement('div');
  card.className = 'context-inline-card';
  card.innerHTML = `
    <div class="context-inline-card-inner">
      <div class="context-card-header">
        <span class="context-card-title" style="color:${ann.color}">${escapeHtml(ann.title)}</span>
        <button class="context-card-close">✕</button>
      </div>
      <p class="context-card-body">${escapeHtml(ann.content)}</p>
    </div>`;
  card.querySelector('.context-card-close').addEventListener('click', hideContext);
  subtitleItem.appendChild(card);
  activeContextEl = card;
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('open')));
}
function hideContext() {
  if (!activeContextEl) return;
  const el = activeContextEl;
  activeContextEl = null; activeContextKey = null;
  el.classList.remove('open');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

/* ── 시트 드래그 / 위치 ── */
function applySheetTop(top, animate = false) {
  if (window.matchMedia('(orientation: landscape)').matches) return;
  sheetTop = Math.max(MIN_TOP, Math.min(MAX_TOP(), top));
  if (animate) sheet.classList.add('animating');
  sheet.style.top = sheetTop + 'px';
  if (animate) setTimeout(() => sheet.classList.remove('animating'), 340);
}
function updateScrollToTopLabel() {
  scrollToTopBtn.textContent = SCROLL_TO_TOP_LABELS[currentLang] || '↑ Latest';
}

/* ── 영상 영역 마크업 ── */
function videoAreaHTML(source) {
  if (source.platform === 'youtube' && source.youtubeId) {
    return `<div class="video-frame"><div id="yt-player"></div></div>`;
  }
  // 위버스 등 임베드 불가 → 목업 영상 영역 (위버스 로고는 복제하지 않음)
  return `
    <div class="video-frame mock-video" id="mockVideo">
      ${source.thumb ? `<img class="mock-bg" src="${source.thumb}" alt="" />` : ''}
      <div class="mock-scrim"></div>
      <div class="mock-mute"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg></div>
      <div class="mock-center">
        <span class="mock-live"><span class="mock-live-dot"></span>LIVE</span>
        <button class="mock-play" id="mockPlay" aria-label="${t('aria.playPause')}">
          <svg class="ic-pause" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        </button>
      </div>
      <div class="mock-tag">${t('player.mockTag')}</div>
    </div>`;
}

/* ─────────────────────────────────────────
   render
   ───────────────────────────────────────── */
export function renderPlayer(params, root) {
  // source 결정 (없으면 데모 유튜브)
  const source = (params && params.source) || {
    platform: 'youtube', youtubeId: DEMO_VIDEO.youtubeId,
    title: DEMO_VIDEO.title, artist: DEMO_VIDEO.channel, isLive: true, thumb: '',
  };
  const title = source.title || DEMO_VIDEO.title;
  const artist = source.artist || DEMO_VIDEO.channel;
  const isLive = !!source.isLive;
  const isYouTube = source.platform === 'youtube' && source.youtubeId;

  // 상태 리셋
  lastSubtitleStart = -1;
  isUserScrolled = false;
  panelCollapsed = false;
  landscapeSubtitleOverlay = null;
  overlaySettings = { showSpeaker: true, showTranscript: true, subtitleLines: 2, subtitleSize: 80, bgOpacity: 65 };
  currentLang = getState().defaultLang || 'en';
  subtitlesReady = !(params && params.subtitlePending);

  root.innerHTML = `
    <div class="player-view view fullscreen">
      <div class="video-area" id="videoArea">
        ${videoAreaHTML(source)}
      </div>

      <div class="sheet" id="sheet">
        <button class="panel-toggle-btn" id="panelToggleBtn" aria-label="자막 패널">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="scroll-to-top-btn" id="scrollToTopBtn">${t('player.latest')}</button>
        <div class="sheet-content" id="sheetContent">
          ${subtitlesReady ? '' : `
            <div class="subtitle-status" id="subtitleStatus" role="status" aria-live="polite">
              <div class="subtitle-status-indicator" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <div>
                <div class="subtitle-status-title">${t('player.subtitlePreparing')}</div>
                <div class="subtitle-status-desc">${t('player.subtitlePreparingDesc')}</div>
              </div>
            </div>
          `}
        </div>
      </div>

      <div class="fab-group">
        <button class="player-fab" id="langFab" aria-label="${t('aria.playerSettings')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="6" x2="8" y2="3"/><line x1="8" y1="6" x2="8" y2="9"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="16" y1="18" x2="16" y2="15"/><line x1="16" y1="18" x2="16" y2="21"/></svg>
        </button>
        <button class="player-fab" id="exitFab" aria-label="${t('aria.playerExit')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <div class="lang-panel" id="langPanel">
        <div class="lang-panel-title">${escapeHtml(title)}</div>
        <div class="lang-panel-meta">
          ${isLive ? `<div class="live-chip"><span class="live-dot"></span>LIVE</div>` : ''}
          <span class="meta-text">${escapeHtml(artist)} · ${t('player.kaptikLive')}</span>
        </div>
        <div class="lang-panel-divider lang-panel-header-divider"></div>
        <div class="settings-row">
          <span class="settings-label">Language</span>
          <select id="langSelect" class="lang-select lang-select-sm">
            ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${l.label}</option>`).join('')}
          </select>
        </div>
        <div class="lang-panel-divider"></div>
        <div class="settings-row">
          <span class="settings-label">Speaker ID</span>
          <button class="toggle-pill${overlaySettings.showSpeaker ? ' on' : ''}" id="speakerToggle"></button>
        </div>
        <div class="settings-row">
          <span class="settings-label">Transcript</span>
          <button class="toggle-pill${overlaySettings.showTranscript ? ' on' : ''}" id="transcriptToggle"></button>
        </div>
        <div class="settings-row">
          <span class="settings-label">Lines</span>
          <div class="seg-ctrl">
            <button class="seg-btn${overlaySettings.subtitleLines === 1 ? ' active' : ''}" data-lines="1">1</button>
            <button class="seg-btn${overlaySettings.subtitleLines === 2 ? ' active' : ''}" data-lines="2">2</button>
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row-hd">
            <span class="settings-label">Subtitle size</span>
            <span class="settings-val" id="sizeVal">${overlaySettings.subtitleSize}%</span>
          </div>
          <input type="range" class="settings-slider" id="sizeSlider" min="50" max="150" value="${overlaySettings.subtitleSize}">
        </div>
        <div class="settings-col">
          <div class="settings-row-hd">
            <span class="settings-label">Background opacity</span>
            <span class="settings-val" id="opacityVal">${overlaySettings.bgOpacity}%</span>
          </div>
          <input type="range" class="settings-slider" id="opacitySlider" min="0" max="100" value="${overlaySettings.bgOpacity}">
        </div>
      </div>
    </div>
  `;

  // 요소 참조
  sheet = root.querySelector('#sheet');
  sheetContent = root.querySelector('#sheetContent');
  scrollToTopBtn = root.querySelector('#scrollToTopBtn');
  langPanel = root.querySelector('#langPanel');
  langSelect = root.querySelector('#langSelect');

  subtitleList = document.createElement('div');
  subtitleList.className = 'subtitle-list';
  sheetContent.appendChild(subtitleList);

  // 영상 위 현재 자막 오버레이 생성 (세로/가로 공통)
  landscapeSubtitleOverlay = document.createElement('div');
  landscapeSubtitleOverlay.className = 'subtitle-overlay';
  root.querySelector('#videoArea').appendChild(landscapeSubtitleOverlay);

  if (subtitlesReady) {
    rerenderAll();
  } else {
    const statusEl = root.querySelector('#subtitleStatus');
    const delay = Math.max(0, Number(params.subtitleDelayMs) || 4000);
    subtitleReadyTimer = setTimeout(() => finishSubtitlePreparation(statusEl), delay);
  }

  // 시트 초기 위치 — 영상 영역 바로 아래
  const videoArea = root.querySelector('#videoArea');
  requestAnimationFrame(() => {
    const h = videoArea.offsetHeight || 290;
    MIN_TOP = Math.round(h * 0.5);
    if (!window.matchMedia('(orientation: landscape)').matches) applySheetTop(h + 6);
  });

  // 이벤트
  bindSheetDrag();
  bindScroll();
  bindLang(root);
  bindPanelToggle(root);
  bindOrientationChange();
  bindSettings(root);
  root.querySelector('#exitFab').addEventListener('click', () => navigate('home'));
  updateScrollToTopLabel();

  // 컨트롤러 생성
  if (isYouTube) {
    controller = makeYouTubeController(source.youtubeId, () => startPolling());
  } else {
    controller = makeMockController();
    bindMockControls(root);
    startPolling();
  }

  return cleanup;
}

/* ── 목업 영상 영역 재생/일시정지 ── */
function bindMockControls(root) {
  const mockVideo = root.querySelector('#mockVideo');
  const btn = root.querySelector('#mockPlay');
  if (!mockVideo || !btn) return;
  const playIco = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const pauseIco = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const toggle = () => {
    if (!controller) return;
    if (controller.isRunning()) { controller.pause(); btn.innerHTML = playIco; mockVideo.classList.add('paused'); }
    else { controller.play(); btn.innerHTML = pauseIco; mockVideo.classList.remove('paused'); }
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
}

/* ── 폴링: 컨트롤러 시간 → 자막 동기화 ── */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (!controller) return;
    const t = controller.getTime();
    if (typeof t === 'number') updateSubtitle(t);
  }, 120);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function bindSheetDrag() {
  sheetContent.addEventListener('touchstart', (e) => {
    const rect = sheet.getBoundingClientRect();
    const relY = e.touches[0].clientY - rect.top;
    if (relY < DRAG_ZONE) { isDragging = true; dragStartY = e.touches[0].clientY; dragStartTop = sheetTop; e.preventDefault(); }
    else isDragging = false;
  }, { passive: false });

  const onMove = (e) => {
    if (!isDragging) return;
    applySheetTop(dragStartTop + (e.touches[0].clientY - dragStartY));
    e.preventDefault();
  };
  const onEnd = () => { isDragging = false; };
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  cleanup._drag = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
}

function bindScroll() {
  sheetContent.addEventListener('scroll', () => {
    isUserScrolled = sheetContent.scrollTop > 20;
    scrollToTopBtn.classList.toggle('visible', isUserScrolled);
  });
  scrollToTopBtn.addEventListener('click', () => {
    sheetContent.scrollTo({ top: 0, behavior: 'smooth' });
    isUserScrolled = false;
    scrollToTopBtn.classList.remove('visible');
  });
}

function bindLang(root) {
  const langFab = root.querySelector('#langFab');
  langFab.addEventListener('click', (e) => { e.stopPropagation(); langPanel.classList.toggle('open'); });
  document.addEventListener('click', closeLangPanel);
  langPanel.addEventListener('click', (e) => e.stopPropagation());
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    langPanel.classList.remove('open');
    updateScrollToTopLabel();
    rerenderAll();
  });
  cleanup._lang = () => document.removeEventListener('click', closeLangPanel);
}
function closeLangPanel() { if (langPanel) langPanel.classList.remove('open'); }

/* ── 영상 위 자막 오버레이 빌드 (세로/가로 공통) ── */
function updateOverlay(cur) {
  if (!landscapeSubtitleOverlay) return;
  landscapeSubtitleOverlay.innerHTML = '';

  const alpha = (overlaySettings.bgOpacity / 100).toFixed(2);
  landscapeSubtitleOverlay.style.background = `rgba(0,0,0,${alpha})`;

  if (!cur) { landscapeSubtitleOverlay.style.opacity = '0'; return; }
  landscapeSubtitleOverlay.style.opacity = '1';

  // 2줄 모드: 바로 이전 자막도 표시
  const items = [];
  if (overlaySettings.subtitleLines === 2) {
    const idx = SUBTITLES.findIndex((s) => s.start === cur.start);
    if (idx > 0) items.push(SUBTITLES[idx - 1]);
  }
  items.push(cur);

  const fontSize = Math.round(14 * overlaySettings.subtitleSize / 100);

  items.forEach((item, i) => {
    const text = item[currentLang] || item.en || '';
    const speaker = item.speaker || '';
    const color = SPEAKER_COLORS[speaker] || '#888888';
    const initials = SPEAKER_INITIALS[speaker] || speaker.slice(0, 2).toUpperCase();

    const row = document.createElement('div');
    row.className = i > 0 ? 'overlay-row overlay-row-sep' : 'overlay-row';

    if (overlaySettings.showSpeaker && speaker) {
      const av = document.createElement('div');
      av.className = 'overlay-avatar';
      av.style.cssText = `background:${color}22;border:1.5px solid ${color}66;color:${color}`;
      const imgSrc = SPEAKER_IMAGES[speaker];
      if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc; img.alt = speaker;
        img.onerror = () => { img.remove(); av.textContent = initials; };
        av.appendChild(img);
      } else { av.textContent = initials; }
      row.appendChild(av);
    }

    const body = document.createElement('div');
    body.className = 'overlay-body';
    if (overlaySettings.showSpeaker && speaker) {
      const nm = document.createElement('div');
      nm.className = 'overlay-name';
      nm.style.color = color;
      nm.textContent = speaker;
      body.appendChild(nm);
    }
    const tx = document.createElement('div');
    tx.className = 'overlay-text-main';
    tx.style.fontSize = fontSize + 'px';
    tx.textContent = text;
    body.appendChild(tx);

    row.appendChild(body);
    landscapeSubtitleOverlay.appendChild(row);
  });
}

/** 설정 변경 시 오버레이를 강제 갱신한다. */
function refreshOverlay() {
  if (!landscapeSubtitleOverlay || !subtitlesReady || !controller) return;
  const time = controller.getTime();
  const cur = SUBTITLES.find((s) => time >= s.start && time < s.end) || null;
  updateOverlay(cur);
}

/* ── 설정 패널 컨트롤 바인딩 ── */
function bindSettings(root) {
  const speakerToggle = root.querySelector('#speakerToggle');
  const transcriptToggle = root.querySelector('#transcriptToggle');
  const segBtns = root.querySelectorAll('.seg-btn[data-lines]');
  const sizeSlider = root.querySelector('#sizeSlider');
  const sizeVal = root.querySelector('#sizeVal');
  const opacitySlider = root.querySelector('#opacitySlider');
  const opacityVal = root.querySelector('#opacityVal');
  const playerView = root.querySelector('.player-view');

  if (!speakerToggle) return;
  updateSliderTrack(sizeSlider);
  updateSliderTrack(opacitySlider);

  speakerToggle.addEventListener('click', () => {
    overlaySettings.showSpeaker = !overlaySettings.showSpeaker;
    speakerToggle.classList.toggle('on', overlaySettings.showSpeaker);
    refreshOverlay();
  });

  transcriptToggle.addEventListener('click', () => {
    overlaySettings.showTranscript = !overlaySettings.showTranscript;
    transcriptToggle.classList.toggle('on', overlaySettings.showTranscript);
    sheet.classList.toggle('transcript-hidden', !overlaySettings.showTranscript);
    playerView?.classList.toggle('transcript-off', !overlaySettings.showTranscript);
  });

  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      overlaySettings.subtitleLines = Number(btn.dataset.lines);
      segBtns.forEach((b) => b.classList.toggle('active', b === btn));
      refreshOverlay();
    });
  });

  sizeSlider.addEventListener('input', () => {
    overlaySettings.subtitleSize = Number(sizeSlider.value);
    sizeVal.textContent = overlaySettings.subtitleSize + '%';
    updateSliderTrack(sizeSlider);
    refreshOverlay();
  });

  opacitySlider.addEventListener('input', () => {
    overlaySettings.bgOpacity = Number(opacitySlider.value);
    opacityVal.textContent = overlaySettings.bgOpacity + '%';
    updateSliderTrack(opacitySlider);
    refreshOverlay();
  });
}

/** range 슬라이더의 채워진 트랙 색상을 CSS 변수로 업데이트한다. */
function updateSliderTrack(slider) {
  if (!slider) return;
  const pct = (((+slider.value) - (+slider.min)) / ((+slider.max) - (+slider.min)) * 100).toFixed(1) + '%';
  slider.style.setProperty('--pct', pct);
}

/* ── 가로 모드: 자막 패널 열기/닫기 토글 ── */
function bindPanelToggle(root) {
  const btn = root.querySelector('#panelToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panelCollapsed = !panelCollapsed;
    sheet.classList.toggle('panel-collapsed', panelCollapsed);
  });
}

/* ── 방향 전환 시 시트 top 관리 ── */
function bindOrientationChange() {
  const mq = window.matchMedia('(orientation: landscape)');
  const onChange = () => {
    if (mq.matches) {
      // 가로 전환: CSS가 top을 제어하므로 인라인 style 제거
      if (sheet) sheet.style.top = '';
    } else {
      // 세로 전환: 비디오 영역 기준으로 시트 위치 재계산
      const va = document.querySelector('#videoArea');
      const h = va ? va.offsetHeight : 290;
      MIN_TOP = Math.round(h * 0.5);
      applySheetTop(sheetTop > MIN_TOP ? sheetTop : h + 6);
    }
  };
  mq.addEventListener('change', onChange);
  cleanup._orientation = () => mq.removeEventListener('change', onChange);
}

/* ── 뷰 정리 ── */
function cleanup() {
  stopPolling();
  if (subtitleReadyTimer) {
    clearTimeout(subtitleReadyTimer);
    subtitleReadyTimer = null;
  }
  if (cleanup._drag) cleanup._drag();
  if (cleanup._lang) cleanup._lang();
  if (cleanup._orientation) cleanup._orientation();
  if (controller) controller.destroy();
  controller = null;
  landscapeSubtitleOverlay = null;
  panelCollapsed = false;
  overlaySettings = { showSpeaker: true, showTranscript: true, subtitleLines: 2, subtitleSize: 80, bgOpacity: 65 };
}
