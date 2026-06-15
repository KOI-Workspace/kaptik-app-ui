/**
 * Translate 화면
 *
 * Weverse / YouTube 모두 실제 사이트를 iframe으로 열고
 * 그 위에 Kaptik 자막 오버레이를 얹는 방식.
 *
 * - sandbox 없이 열어 사용자가 iframe 안에서 직접 로그인 가능
 * - YouTube는 X-Frame-Options 정책으로 차단될 수 있음 (사이트 정책)
 */
import { getState } from '../state.js';
import { requireAccess } from '../gate.js';
import { t } from '../i18n.js';
import {
  SUBTITLES, ANNOTATIONS, SPEAKER_COLORS, SPEAKER_INITIALS, SPEAKER_IMAGES,
  LANGUAGES, SCROLL_TO_TOP_LABELS,
} from '../data.js';
import { isNativeEnv, openNativeWebView, closeNativeWebView, navigateNativeWebView } from '../native-webview.js';

/* ── 플랫폼 정의 ── */
const PLATFORMS = [
  {
    id: 'weverse',
    name: 'Weverse',
    sub: '위버스 라이브 · 아티스트 영상',
    url: 'https://weverse.io/',
    iconBg: 'linear-gradient(135deg,#222,#444)',
    iconColor: '#fff',
    glyph: 'W',
    displayUrl: 'weverse.io',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    sub: 'YouTube 영상 · 뮤직비디오',
    url: 'https://m.youtube.com',
    iconBg: '#FF0000',
    iconColor: '#fff',
    glyph: '▶',
    displayUrl: 'm.youtube.com',
  },
];

/* ── 모듈 스코프 상태 ── */
let trSheet, trSheetContent, trSubtitleList, trScrollToTopBtn, trLangPanel, trLangSelect;
let trCurrentPlatform = null;
let trController = null;
let trPollTimer = null;
let trSubtitleReadyTimer = null;
let trCurrentLang = 'en';
let trSubtitlesReady = false;
let trLastSubtitleStart = -1;
let trSheetTop = 0;
let trMinTop = 100;
const trMaxTop = () => window.innerHeight - 130;
let trIsDragging = false, trDragStartY = 0, trDragStartTop = 0;
let trIsUserScrolled = false;
let trSubtitleOverlay = null;
let trPanelCollapsed = false;
let trOverlaySettings = { showSpeaker: true, showTranscript: true, subtitleLines: 2, subtitleSize: 80, bgOpacity: 65 };
let trActiveContextKey = null, trActiveContextEl = null;
let trRoot = null;
let trCleanupFns = [];

/* ── 유틸 ── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function buildAnnotated(text) {
  let result = esc(text);
  Object.keys(ANNOTATIONS).forEach((kw) => {
    const ann = ANNOTATIONS[kw];
    const escaped = esc(kw);
    result = result.replace(
      new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `<span class="annotated-word" data-key="${escaped}" style="color:${ann.color};text-decoration-color:${ann.color}55">${escaped}</span>`
    );
  });
  return result;
}

/* ── 가상 재생 클럭 (자막 동기화용) ── */
function makeMockCtrl() {
  let startTime = Date.now(), elapsed = 0, running = true;
  return {
    getTime:   () => (running ? (Date.now() - startTime) / 1000 : elapsed),
    seekTo:    (s) => { elapsed = s; startTime = Date.now() - s * 1000; running = true; },
    play:      () => { startTime = Date.now() - elapsed * 1000; running = true; },
    pause:     () => { elapsed = (Date.now() - startTime) / 1000; running = false; },
    isRunning: () => running,
    destroy:   () => { running = false; },
  };
}

/* ── 자막 엘리먼트 ── */
function createSubItem(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'subtitle-item';
  wrapper.dataset.start = String(item.start);
  const speaker = item.speaker || '';
  const color = SPEAKER_COLORS[speaker] || '#888888';
  const initials = SPEAKER_INITIALS[speaker] || speaker.slice(0, 2).toUpperCase();
  const text = item[trCurrentLang] || item.en || '';
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
  nameEl.innerHTML = `${esc(speaker)}<span class="subtitle-time">${fmtTime(item.start)}</span>`;
  const textEl = document.createElement('div');
  textEl.className = 'subtitle-text';
  textEl.innerHTML = buildAnnotated(text);
  body.appendChild(nameEl);
  body.appendChild(textEl);
  row.appendChild(avatar);
  row.appendChild(body);
  wrapper.appendChild(row);
  wrapper.querySelectorAll('.annotated-word').forEach((span) => {
    span.addEventListener('click', (e) => { e.stopPropagation(); showTrContext(span.dataset.key, span); });
  });
  row.addEventListener('click', () => {
    if (trController) trController.seekTo(item.start);
    updateTrSub(item.start);
    // 네이티브 앱: WKWebView를 해당 타임스탬프 URL로 이동
    if (trCurrentPlatform && isNativeEnv()) {
      const tsUrl = `${trCurrentPlatform.url}?t=${Math.floor(item.start)}`;
      navigateNativeWebView(tsUrl);
    }
  });
  return wrapper;
}

function updateTrSub(time) {
  if (!trSubtitlesReady) return;
  const cur = SUBTITLES.find((s) => time >= s.start && time < s.end);
  const nextStart = cur ? cur.start : -1;
  if (nextStart === trLastSubtitleStart) return;
  trLastSubtitleStart = nextStart;
  trSubtitleList?.querySelector('.subtitle-row.current')?.classList.remove('current');
  updateTrOverlay(cur || null);
  if (!cur) return;
  trSubtitleList?.querySelector(`.subtitle-item[data-start="${cur.start}"] .subtitle-row`)?.classList.add('current');
}

function rerenderTrAll() {
  const scrollTop = trSheetContent.scrollTop;
  trSubtitleList.innerHTML = '';
  SUBTITLES.forEach((item) => trSubtitleList.appendChild(createSubItem(item)));
  trLastSubtitleStart = -1;
  if (trController) updateTrSub(trController.getTime());
  trSheetContent.scrollTop = scrollTop;
}

function updateTrOverlay(cur) {
  if (!trSubtitleOverlay) return;
  trSubtitleOverlay.innerHTML = '';
  const alpha = (trOverlaySettings.bgOpacity / 100).toFixed(2);
  trSubtitleOverlay.style.background = `rgba(0,0,0,${alpha})`;
  if (!cur) { trSubtitleOverlay.style.opacity = '0'; return; }
  trSubtitleOverlay.style.opacity = '1';
  const items = [];
  if (trOverlaySettings.subtitleLines === 2) {
    const idx = SUBTITLES.findIndex((s) => s.start === cur.start);
    if (idx > 0) items.push(SUBTITLES[idx - 1]);
  }
  items.push(cur);
  const scale = trOverlaySettings.subtitleSize / 100;
  const fontSize = Math.round(14 * scale);
  const avatarSize = Math.round(26 * scale);
  const avatarFontSize = Math.round(8 * scale);
  const nameFontSize = Math.round(11 * scale);
  items.forEach((item, i) => {
    const text = item[trCurrentLang] || item.en || '';
    const speaker = item.speaker || '';
    const color = SPEAKER_COLORS[speaker] || '#888888';
    const initials = SPEAKER_INITIALS[speaker] || speaker.slice(0, 2).toUpperCase();
    const rowEl = document.createElement('div');
    rowEl.className = i > 0 ? 'overlay-row overlay-row-sep' : 'overlay-row';
    if (trOverlaySettings.showSpeaker && speaker) {
      const av = document.createElement('div');
      av.className = 'overlay-avatar';
      av.style.cssText = `background:${color}22;border:1.5px solid ${color}66;color:${color};width:${avatarSize}px;height:${avatarSize}px;font-size:${avatarFontSize}px`;
      const imgSrc = SPEAKER_IMAGES[speaker];
      if (imgSrc) {
        const img = document.createElement('img'); img.src = imgSrc; img.alt = speaker;
        img.onerror = () => { img.remove(); av.textContent = initials; };
        av.appendChild(img);
      } else { av.textContent = initials; }
      rowEl.appendChild(av);
    }
    const bodyEl = document.createElement('div');
    bodyEl.className = 'overlay-body';
    if (trOverlaySettings.showSpeaker && speaker) {
      const nm = document.createElement('div');
      nm.className = 'overlay-name';
      nm.style.color = color; nm.style.fontSize = nameFontSize + 'px';
      nm.textContent = speaker;
      bodyEl.appendChild(nm);
    }
    const tx = document.createElement('div');
    tx.className = 'overlay-text-main';
    tx.style.fontSize = fontSize + 'px';
    tx.textContent = text;
    bodyEl.appendChild(tx);
    rowEl.appendChild(bodyEl);
    trSubtitleOverlay.appendChild(rowEl);
  });
}

function refreshTrOverlay() {
  if (!trSubtitleOverlay || !trSubtitlesReady || !trController) return;
  const time = trController.getTime();
  updateTrOverlay(SUBTITLES.find((s) => time >= s.start && time < s.end) || null);
}

function showTrContext(key, triggerSpan) {
  if (trActiveContextKey === key) { hideTrContext(); return; }
  hideTrContext();
  trActiveContextKey = key;
  const ann = ANNOTATIONS[key];
  if (!ann) return;
  const subtitleItem = triggerSpan.closest('.subtitle-item');
  if (!subtitleItem) return;
  const card = document.createElement('div');
  card.className = 'context-inline-card';
  card.innerHTML = `<div class="context-inline-card-inner"><div class="context-card-header"><span class="context-card-title" style="color:${ann.color}">${esc(ann.title)}</span><button class="context-card-close">✕</button></div><p class="context-card-body">${esc(ann.content)}</p></div>`;
  card.querySelector('.context-card-close').addEventListener('click', hideTrContext);
  subtitleItem.appendChild(card);
  trActiveContextEl = card;
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('open')));
}
function hideTrContext() {
  if (!trActiveContextEl) return;
  const el = trActiveContextEl;
  trActiveContextEl = null; trActiveContextKey = null;
  el.classList.remove('open');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

function startTrPolling() {
  stopTrPolling();
  trPollTimer = setInterval(() => {
    if (trController) updateTrSub(trController.getTime());
  }, 120);
}
function stopTrPolling() {
  if (trPollTimer) { clearInterval(trPollTimer); trPollTimer = null; }
}

/* ── 바텀시트 위치 ── */
function applyTrSheet(top, animate = false) {
  if (window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches) return;
  trSheetTop = Math.max(trMinTop, Math.min(trMaxTop(), top));
  if (animate) trSheet.classList.add('animating');
  trSheet.style.top = trSheetTop + 'px';
  if (animate) setTimeout(() => trSheet.classList.remove('animating'), 340);
}

function bindTrSheetDrag() {
  const handle = trSheet.querySelector('.tr-sheet-handle');
  if (!handle) return;
  const onStart = (e) => {
    trIsDragging = true;
    trDragStartY = e.touches[0].clientY;
    trDragStartTop = trSheetTop;
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!trIsDragging) return;
    applyTrSheet(trDragStartTop + (e.touches[0].clientY - trDragStartY));
    e.preventDefault();
  };
  const onEnd = () => {
    if (!trIsDragging) return;
    trIsDragging = false;
    if (trSheetTop >= trMaxTop() - 60) applyTrSheet(trMaxTop(), true);
    else if (trSheetTop < window.innerHeight * 0.5) applyTrSheet(trMinTop, true);
  };
  handle.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  trCleanupFns.push(() => {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  });
}

function bindTrScroll() {
  trSheetContent.addEventListener('scroll', () => {
    trIsUserScrolled = trSheetContent.scrollTop > 20;
    trScrollToTopBtn.classList.toggle('visible', trIsUserScrolled);
  });
  trScrollToTopBtn.addEventListener('click', () => {
    trSheetContent.scrollTo({ top: 0, behavior: 'smooth' });
    trIsUserScrolled = false;
    trScrollToTopBtn.classList.remove('visible');
  });
}

function finishTrSub(statusEl) {
  if (!statusEl) return;
  trSubtitlesReady = true;
  statusEl.classList.add('complete');
  statusEl.querySelector('.subtitle-status-title').textContent = t('player.subtitleReady');
  statusEl.querySelector('.subtitle-status-desc').textContent = t('player.subtitleReadyDesc');
  rerenderTrAll();
  if (trController) updateTrSub(trController.getTime());
  setTimeout(() => statusEl.classList.add('leaving'), 600);
  setTimeout(() => statusEl.remove(), 950);
}

function updateTrSlider(slider) {
  if (!slider) return;
  const pct = (((+slider.value) - (+slider.min)) / ((+slider.max) - (+slider.min)) * 100).toFixed(1) + '%';
  slider.style.setProperty('--pct', pct);
}

/* ── 바텀시트 HTML ── */
function sheetHTML() {
  return `
    <div class="sheet tr-sheet-webview" id="trSheet" style="display:none">
      <button class="panel-toggle-btn" id="trPanelToggleBtn" aria-label="자막 패널">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <div class="tr-sheet-handle">
        <div class="tr-sheet-handle-bar"></div>
        <div class="tr-sheet-header">
          <div class="tr-sheet-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h7"/><path d="M7 4c0 4.5-2 7-3 8"/><path d="M5 9c0 2 2 4.5 5 5"/><path d="M12 20l4-9 4 9"/><path d="M13.5 17h5"/></svg>
            Kaptik 자막
          </div>
          <button class="player-fab tr-lang-fab" id="trLangFab" aria-label="자막 설정">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="6" x2="8" y2="3"/><line x1="8" y1="6" x2="8" y2="9"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="16" y1="18" x2="16" y2="15"/><line x1="16" y1="18" x2="16" y2="21"/></svg>
          </button>
        </div>
      </div>
      <button class="scroll-to-top-btn" id="trScrollToTopBtn">↑ Latest</button>
      <div class="sheet-content" id="trSheetContent">
        <div class="subtitle-status" id="trSubtitleStatus" role="status" aria-live="polite">
          <div class="subtitle-status-indicator" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div>
            <div class="subtitle-status-title">${t('player.subtitlePreparing')}</div>
            <div class="subtitle-status-desc">${t('player.subtitlePreparingDesc')}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function langPanelHTML(platformName) {
  return `
    <div class="lang-panel tr-lang-panel-webview" id="trLangPanel">
      <div class="lang-panel-title">${esc(platformName)} 자막 설정</div>
      <div class="lang-panel-divider lang-panel-header-divider"></div>
      <div class="settings-row">
        <span class="settings-label">Language</span>
        <select id="trLangSelect" class="lang-select lang-select-sm">
          ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === trCurrentLang ? 'selected' : ''}>${l.label}</option>`).join('')}
        </select>
      </div>
      <div class="lang-panel-divider"></div>
      <div class="settings-row">
        <span class="settings-label">Speaker ID</span>
        <button class="toggle-pill on" id="trSpeakerToggle"></button>
      </div>
      <div class="settings-row">
        <span class="settings-label">Lines</span>
        <div class="seg-ctrl">
          <button class="seg-btn" data-lines="1">1</button>
          <button class="seg-btn active" data-lines="2">2</button>
        </div>
      </div>
      <div class="settings-col">
        <div class="settings-row-hd">
          <span class="settings-label">Subtitle size</span>
          <span class="settings-val" id="trSizeVal">80%</span>
        </div>
        <input type="range" class="settings-slider" id="trSizeSlider" min="50" max="150" value="80">
      </div>
      <div class="settings-col">
        <div class="settings-row-hd">
          <span class="settings-label">BG opacity</span>
          <span class="settings-val" id="trOpacityVal">65%</span>
        </div>
        <input type="range" class="settings-slider" id="trOpacitySlider" min="0" max="100" value="65">
      </div>
    </div>`;
}

/* ── 공통 바인딩 ── */
function bindTrLang() {
  const fab = trRoot.querySelector('#trLangFab');
  if (!fab) return;
  const closePanel = () => trLangPanel?.classList.remove('open');
  fab.addEventListener('click', (e) => { e.stopPropagation(); trLangPanel.classList.toggle('open'); });
  document.addEventListener('click', closePanel);
  trLangPanel.addEventListener('click', (e) => e.stopPropagation());
  trLangSelect.addEventListener('change', () => {
    trCurrentLang = trLangSelect.value;
    trLangPanel.classList.remove('open');
    updateTrScrollTopLabel();
    if (trSubtitlesReady) rerenderTrAll();
  });
  trCleanupFns.push(() => document.removeEventListener('click', closePanel));
}
function updateTrScrollTopLabel() {
  if (trScrollToTopBtn) trScrollToTopBtn.textContent = SCROLL_TO_TOP_LABELS[trCurrentLang] || '↑ Latest';
}
function bindTrPanelToggle() {
  const btn = trRoot.querySelector('#trPanelToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    trPanelCollapsed = !trPanelCollapsed;
    trSheet.classList.toggle('panel-collapsed', trPanelCollapsed);
  });
}
function bindTrOrientation() {
  const mq = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
  const onChange = () => {
    if (!mq.matches && trSheet && trSheet.style.display !== 'none') {
      applyTrSheet(trSheetTop > trMinTop ? trSheetTop : window.innerHeight * 0.55);
    }
  };
  mq.addEventListener('change', onChange);
  trCleanupFns.push(() => mq.removeEventListener('change', onChange));
}
function bindTrSettings() {
  const sizeSlider = trRoot.querySelector('#trSizeSlider');
  const sizeVal = trRoot.querySelector('#trSizeVal');
  const opacitySlider = trRoot.querySelector('#trOpacitySlider');
  const opacityVal = trRoot.querySelector('#trOpacityVal');
  const speakerToggle = trRoot.querySelector('#trSpeakerToggle');
  const segBtns = trRoot.querySelectorAll('.seg-btn[data-lines]');
  if (!sizeSlider) return;
  updateTrSlider(sizeSlider);
  updateTrSlider(opacitySlider);
  speakerToggle.addEventListener('click', () => {
    trOverlaySettings.showSpeaker = !trOverlaySettings.showSpeaker;
    speakerToggle.classList.toggle('on', trOverlaySettings.showSpeaker);
    refreshTrOverlay();
  });
  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      trOverlaySettings.subtitleLines = Number(btn.dataset.lines);
      segBtns.forEach((b) => b.classList.toggle('active', b === btn));
      refreshTrOverlay();
    });
  });
  sizeSlider.addEventListener('input', () => {
    trOverlaySettings.subtitleSize = Number(sizeSlider.value);
    sizeVal.textContent = trOverlaySettings.subtitleSize + '%';
    updateTrSlider(sizeSlider);
    refreshTrOverlay();
  });
  opacitySlider.addEventListener('input', () => {
    trOverlaySettings.bgOpacity = Number(opacitySlider.value);
    opacityVal.textContent = trOverlaySettings.bgOpacity + '%';
    updateTrSlider(opacitySlider);
    refreshTrOverlay();
  });
}

/* ═══════════════════════════════════════════
   플랫폼 선택 화면
   ═══════════════════════════════════════════ */
function renderPlatformSelect() {
  trCleanupDetail();
  trRoot.innerHTML = `
    <div class="view tr-platform-view">
      <h1 class="tr-platform-title">어디서 볼까요?<br/><span>자막을 입힐 플랫폼을 선택하세요</span></h1>
      <p class="tr-platform-desc">영상을 자유롭게 탐색하다가<br/>자막 버튼을 누르면 Kaptik이 자막을 준비해요.</p>
      <div class="tr-platform-cards">
        ${PLATFORMS.map((p) => `
          <button class="tr-platform-card" data-platform="${p.id}">
            <div class="tr-platform-card-icon" style="background:${p.iconBg};color:${p.iconColor}">
              ${p.glyph}
            </div>
            <div class="tr-platform-card-text">
              <div class="tr-platform-card-name">${esc(p.name)}</div>
              <div class="tr-platform-card-sub">${esc(p.sub)}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3)"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  trRoot.querySelectorAll('[data-platform]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PLATFORMS.find((x) => x.id === btn.dataset.platform);
      if (p) renderWebView(p);
    });
  });
}

/* ═══════════════════════════════════════════
   WebView 화면 — 실제 사이트 iframe + Kaptik 오버레이
   ═══════════════════════════════════════════ */
function renderWebView(platform) {
  trCleanupDetail();
  trCurrentPlatform = platform;
  trLastSubtitleStart = -1;
  trIsUserScrolled = false;
  trPanelCollapsed = false;
  trSubtitleOverlay = null;
  trOverlaySettings = { showSpeaker: true, showTranscript: true, subtitleLines: 2, subtitleSize: 80, bgOpacity: 65 };
  trCurrentLang = getState().defaultLang || 'en';
  trSubtitlesReady = false;

  // 렌더 시점에 플러그인 가용 여부 체크 (앱 시작 시 체크하면 아직 준비 안 됐을 수 있음)
  const native = isNativeEnv();
  if (native) {
    document.body.classList.add('native-webview-mode');
    openNativeWebView(platform.url);
  }

  trRoot.innerHTML = `
    <div class="tr-webview-root" id="trWebviewRoot">
      ${native ? '' : `
      <iframe
        id="trIframe"
        src="${platform.url}"
        allow="autoplay; fullscreen; picture-in-picture; payment; camera; microphone"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        title="${esc(platform.name)}"
      ></iframe>`}

      <div class="tr-kaptik-overlay" id="trKaptikOverlay">

        <!-- 상단 바 -->
        <div class="tr-url-bar" id="trUrlBar">
          <button class="tr-back-platform" id="trBackBtn" aria-label="플랫폼 선택으로">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="tr-url-display">
            <span class="tr-url-icon" style="background:${platform.iconBg};color:${platform.iconColor}">${platform.glyph}</span>
            <span class="tr-url-text">${esc(platform.displayUrl)}</span>
          </div>
          <div style="width:36px"></div>
        </div>

        <!-- 자막 바텀시트 -->
        ${sheetHTML()}

        <!-- 현재 자막 오버레이 -->
        <div class="tr-subtitle-overlay" id="trSubtitleOverlay" style="opacity:0"></div>

        <!-- 자막 시작 FAB -->
        <div class="tr-fab-group">
          <button class="tr-caption-fab" id="trCaptionFab" aria-label="Kaptik 자막 시작">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h7"/><path d="M7 4c0 4.5-2 7-3 8"/><path d="M5 9c0 2 2 4.5 5 5"/><path d="M12 20l4-9 4 9"/><path d="M13.5 17h5"/></svg>
          </button>
        </div>

        <!-- 자막 설정 패널 -->
        ${langPanelHTML(platform.name)}

      </div>
    </div>
  `;

  // DOM 참조
  trSheet        = trRoot.querySelector('#trSheet');
  trSheetContent = trRoot.querySelector('#trSheetContent');
  trScrollToTopBtn = trRoot.querySelector('#trScrollToTopBtn');
  trLangPanel    = trRoot.querySelector('#trLangPanel');
  trLangSelect   = trRoot.querySelector('#trLangSelect');
  trSubtitleOverlay = trRoot.querySelector('#trSubtitleOverlay');

  trSubtitleList = document.createElement('div');
  trSubtitleList.className = 'subtitle-list';
  trSheetContent.appendChild(trSubtitleList);

  // 뒤로 가기
  trRoot.querySelector('#trBackBtn').addEventListener('click', renderPlatformSelect);

  // 자막 FAB → Pro 체크 → 자막 시작
  const captionFab = trRoot.querySelector('#trCaptionFab');
  captionFab.addEventListener('click', () => {
    requireAccess(() => {
      captionFab.closest('.tr-fab-group').style.display = 'none';
      trSheet.style.display = '';
      trMinTop = 100;
      applyTrSheet(window.innerHeight * 0.55, true);

      trController = makeMockCtrl();
      startTrPolling();
      trSubtitleReadyTimer = setTimeout(() => {
        finishTrSub(trRoot.querySelector('#trSubtitleStatus'));
      }, 5200);
    }, { need: 'pro' });
  });

  bindTrSheetDrag();
  bindTrScroll();
  bindTrLang();
  bindTrPanelToggle();
  bindTrSettings();
  bindTrOrientation();
  updateTrScrollTopLabel();

  // 웹 환경에서만 iframe 에러 감지
  if (!native) {
    const iframe = trRoot.querySelector('#trIframe');
    iframe?.addEventListener('error', () => showIframeError(platform));
  }
}

/* iframe 차단 안내 (YouTube 등에서 발생 가능) */
function showIframeError(platform) {
  const overlay = trRoot.querySelector('#trKaptikOverlay');
  if (!overlay) return;
  const errEl = document.createElement('div');
  errEl.className = 'tr-iframe-error';
  errEl.innerHTML = `
    <div class="tr-iframe-error-inner">
      <div class="tr-iframe-error-icon">⛔</div>
      <div class="tr-iframe-error-title">${esc(platform.name)} 연결 차단됨</div>
      <div class="tr-iframe-error-desc">${esc(platform.name)}이 외부 앱에서의 iframe 연결을 막고 있습니다.<br/>브라우저에서 직접 열어보세요.</div>
    </div>
  `;
  overlay.appendChild(errEl);
}

/* ── 정리 ── */
function trCleanupDetail() {
  stopTrPolling();
  if (trSubtitleReadyTimer) { clearTimeout(trSubtitleReadyTimer); trSubtitleReadyTimer = null; }
  if (trController) { trController.destroy(); trController = null; }
  trCleanupFns.forEach((fn) => fn());
  trCleanupFns = [];
  trSubtitleOverlay = null;
  trPanelCollapsed = false;
  trSubtitlesReady = false;
  trCurrentPlatform = null;
  // 네이티브 WKWebView 닫기 및 Capacitor WebView 투명도 복원
  document.body.classList.remove('native-webview-mode');
  closeNativeWebView();
}

function trCleanup() {
  trCleanupDetail();
}

/* ── 엔트리포인트 ── */
export function renderTranslate(_params, root) {
  trRoot = root;
  trCurrentLang = getState().defaultLang || 'en';
  renderPlatformSelect();
  return trCleanup;
}
