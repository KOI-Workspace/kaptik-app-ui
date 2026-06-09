/**
 * Player 화면 — 상단 YouTube 임베드 + 하단 드래그 자막 시트
 * - 자막은 영상의 실제 재생 시간(getCurrentTime)에 동기화되어 흘러나온다.
 * - 자막 한 줄을 클릭하면 해당 타임스탬프로 영상을 seek 한다.
 * (기존 app.js의 자막 시트 로직을 이관 + YouTube 연동으로 교체)
 */
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { whenYTReady } from '../ytapi.js';
import {
  SUBTITLES, ANNOTATIONS, SPEAKER_COLORS, SPEAKER_INITIALS, SPEAKER_IMAGES,
  SCROLL_TO_TOP_LABELS, LANGUAGES, DEMO_VIDEO,
} from '../data.js';

/* ── 모듈 스코프 상태 (render마다 리셋) ── */
let sheet, sheetContent, subtitleList, scrollToTopBtn, langPanel, langSelect;
let ytPlayer = null;
let pollTimer = null;
let currentLang = 'en';

let history = [];
let lastSubtitleStart = -1;
const MAX_HISTORY = 50;

let sheetTop = 0;
let MIN_TOP = 100;
const MAX_TOP = () => window.innerHeight - 130;

let isDragging = false, dragStartY = 0, dragStartTop = 0;
const DRAG_ZONE = 70;

let isUserScrolled = false, isScrolling = false, scrollEndTimer = null;
const pendingItems = [];

let activeContextKey = null, activeContextEl = null;

/* ── 유틸 ── */
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

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

/* ── 자막 엘리먼트 ── */
function createSubtitleEl(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'subtitle-item';

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

  // 어노테이션 클릭
  wrapper.querySelectorAll('.annotated-word').forEach((span) => {
    span.addEventListener('click', (e) => { e.stopPropagation(); showContext(span.dataset.key, span); });
  });
  // 자막 클릭 → 해당 타임스탬프로 영상 이동
  row.addEventListener('click', () => seekToSubtitle(item, row));

  return wrapper;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ── 자막 클릭 → seek ── */
function seekToSubtitle(item, rowEl) {
  if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
    ytPlayer.seekTo(item.start, true);
    ytPlayer.playVideo();
  }
  rebuildHistoryUpTo(item.start + 0.01);
  // 시각 피드백
  const fresh = subtitleList.querySelector('.subtitle-item:last-child .subtitle-row') || rowEl;
  fresh.classList.add('seeking');
  setTimeout(() => fresh.classList.remove('seeking'), 600);
  sheetContent.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── 재생 위치까지 자막 히스토리 재구성 (seek 대응) ── */
function rebuildHistoryUpTo(time) {
  history = SUBTITLES.filter((s) => s.start <= time);
  lastSubtitleStart = history.length ? history[history.length - 1].start : -1;
  rerenderAll();
}

/* ── 순방향 진행 시 한 줄씩 추가 ── */
function updateSubtitle(t) {
  const cur = SUBTITLES.find((s) => t >= s.start && t < s.end);
  if (!cur) return;
  if (cur.start === lastSubtitleStart) return;
  // seek 등으로 뒤로 이동 → 재구성
  if (cur.start < lastSubtitleStart) { rebuildHistoryUpTo(t); return; }
  lastSubtitleStart = cur.start;
  history.push(cur);
  if (isScrolling && isUserScrolled) pendingItems.push(cur);
  else prependSubtitle(cur);
}

/* ── 최신 자막 추가 (column-reverse: append = 시각적 맨 위) ── */
function prependSubtitle(item) {
  const atTop = sheetContent.scrollTop <= 20;
  const existingEls = [...subtitleList.querySelectorAll('.subtitle-item')];
  const newEl = createSubtitleEl(item);

  if (!atTop) {
    const prevTop = sheetContent.scrollTop;
    const prevHeight = sheetContent.scrollHeight;
    subtitleList.appendChild(newEl);
    if (subtitleList.children.length > MAX_HISTORY) subtitleList.removeChild(subtitleList.firstChild);
    const diff = sheetContent.scrollHeight - prevHeight;
    if (diff > 0) sheetContent.scrollTop = prevTop + diff;
    return;
  }

  const firstTops = existingEls.map((el) => el.getBoundingClientRect().top);
  newEl.style.opacity = '0';
  subtitleList.appendChild(newEl);
  if (subtitleList.children.length > MAX_HISTORY) subtitleList.removeChild(subtitleList.firstChild);

  if (existingEls.length > 0) {
    const lastTops = existingEls.map((el) => (el.parentElement ? el.getBoundingClientRect().top : null));
    existingEls.forEach((el, i) => {
      if (!el.parentElement || lastTops[i] === null) return;
      const delta = firstTops[i] - lastTops[i];
      if (Math.abs(delta) < 0.5) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      existingEls.forEach((el) => { if (!el.parentElement) return; el.style.transition = 'transform 0.32s ease-out'; el.style.transform = ''; });
      newEl.style.transition = 'opacity 0.2s ease-out 0.1s';
      newEl.style.opacity = '1';
    }));
    setTimeout(() => existingEls.forEach((el) => { if (!el.parentElement) return; el.style.transition = ''; el.style.transform = ''; }), 360);
  } else {
    newEl.style.opacity = '1';
  }
}

function rerenderAll() {
  subtitleList.innerHTML = '';
  history.forEach((item) => subtitleList.appendChild(createSubtitleEl(item)));
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
  sheetTop = Math.max(MIN_TOP, Math.min(MAX_TOP(), top));
  if (animate) sheet.classList.add('animating');
  sheet.style.top = sheetTop + 'px';
  if (animate) setTimeout(() => sheet.classList.remove('animating'), 340);
}

function updateScrollToTopLabel() {
  scrollToTopBtn.textContent = SCROLL_TO_TOP_LABELS[currentLang] || '↑ Latest';
}

/* ─────────────────────────────────────────
   render
   ───────────────────────────────────────── */
export function renderPlayer(params, root) {
  const feed = (params && params.feed) || null;
  const title = feed?.title || DEMO_VIDEO.title;
  const artist = feed?.artist || DEMO_VIDEO.channel;
  const thumb = feed?.artistImg || feed?.thumb || '';
  const isLive = feed ? !!feed.live : true;

  // 상태 리셋
  history = []; lastSubtitleStart = -1; pendingItems.length = 0;
  isUserScrolled = false; isScrolling = false;
  currentLang = getState().defaultLang || 'en';

  root.innerHTML = `
    <div class="player-view view fullscreen">
      <div class="video-area" id="videoArea">
        <div class="video-frame"><div id="yt-player"></div></div>
        <div class="video-info">
          <div class="vi-thumb">${thumb ? `<img src="${thumb}" alt="${artist}" />` : ''}</div>
          <div class="vi-text">
            <div class="vi-title">${escapeHtml(title)}</div>
            <div class="vi-meta">
              ${isLive ? `<span class="vi-live"><span class="live-dot-red" style="width:5px;height:5px;background:var(--notif);border-radius:50%;display:inline-block;"></span>LIVE</span>` : ''}
              <span>${escapeHtml(artist)} · Kaptik 실시간 자막</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sheet" id="sheet">
        <div class="sheet-grip"></div>
        <div class="sheet-hint">자막을 탭하면 영상이 해당 장면으로 이동해요</div>
        <button class="scroll-to-top-btn" id="scrollToTopBtn">↑ Latest</button>
        <div class="sheet-content" id="sheetContent"></div>
      </div>

      <div class="fab-group">
        <button class="player-fab" id="langFab" aria-label="자막 언어">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="6" x2="8" y2="3"/><line x1="8" y1="6" x2="8" y2="9"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="16" y1="18" x2="16" y2="15"/><line x1="16" y1="18" x2="16" y2="21"/></svg>
        </button>
        <button class="player-fab" id="exitFab" aria-label="나가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <div class="lang-panel" id="langPanel">
        <div class="lang-panel-title">자막 언어</div>
        <select id="langSelect" class="lang-select">
          ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${l.label}</option>`).join('')}
        </select>
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

  // 시트 초기 위치 — 영상 영역 바로 아래
  const videoArea = root.querySelector('#videoArea');
  requestAnimationFrame(() => {
    const h = videoArea.offsetHeight || 290;
    MIN_TOP = Math.round(h * 0.5);
    applySheetTop(h + 6);
  });

  // ── 이벤트 바인딩 ──
  bindSheetDrag();
  bindScroll();
  bindLang();
  root.querySelector('#exitFab').addEventListener('click', () => navigate('home'));
  updateScrollToTopLabel();

  // ── YouTube 플레이어 ──
  whenYTReady(() => {
    ytPlayer = new window.YT.Player('yt-player', {
      videoId: DEMO_VIDEO.youtubeId,
      // mute:1 — 브라우저 자동재생 정책상 음소거여야 자동 시작됨(자막이 흐르도록).
      // 사용자는 영상 컨트롤에서 음소거를 해제할 수 있다.
      playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e) => { e.target.playVideo(); startPolling(); },
      },
    });
  });

  // 정리 함수
  return cleanup;
}

/* ── 폴링: 영상 시간 → 자막 동기화 ── */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
    const t = ytPlayer.getCurrentTime();
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
  // 그립 영역도 드래그
  sheet.querySelector('.sheet-grip').addEventListener('touchstart', (e) => {
    isDragging = true; dragStartY = e.touches[0].clientY; dragStartTop = sheetTop; e.preventDefault();
  }, { passive: false });

  const onMove = (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY;
    applySheetTop(dragStartTop + delta);
    e.preventDefault();
  };
  const onEnd = () => { isDragging = false; };
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  // cleanup에서 제거하기 위해 보관
  cleanup._drag = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };

  // 마우스(데스크톱)에서도 그립 드래그 가능
  const grip = sheet.querySelector('.sheet-grip');
  let mDown = false;
  grip.addEventListener('mousedown', (e) => { mDown = true; dragStartY = e.clientY; dragStartTop = sheetTop; e.preventDefault(); });
  const mMove = (e) => { if (!mDown) return; applySheetTop(dragStartTop + (e.clientY - dragStartY)); };
  const mUp = () => { mDown = false; };
  document.addEventListener('mousemove', mMove);
  document.addEventListener('mouseup', mUp);
  const prevDragCleanup = cleanup._drag;
  cleanup._drag = () => { prevDragCleanup(); document.removeEventListener('mousemove', mMove); document.removeEventListener('mouseup', mUp); };
}

function bindScroll() {
  sheetContent.addEventListener('scroll', () => {
    isUserScrolled = sheetContent.scrollTop > 20;
    scrollToTopBtn.classList.toggle('visible', isUserScrolled);
    if (isUserScrolled) {
      isScrolling = true;
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(flushPending, 200);
    }
  });
  scrollToTopBtn.addEventListener('click', () => {
    clearTimeout(scrollEndTimer);
    isScrolling = false;
    pendingItems.length = 0;
    sheetContent.scrollTo({ top: 0, behavior: 'smooth' });
    isUserScrolled = false;
    scrollToTopBtn.classList.remove('visible');
  });
}

function flushPending() {
  isScrolling = false;
  if (pendingItems.length === 0) return;
  const prevTop = sheetContent.scrollTop;
  const prevHeight = sheetContent.scrollHeight;
  pendingItems.splice(0).forEach((item) => subtitleList.appendChild(createSubtitleEl(item)));
  while (subtitleList.children.length > MAX_HISTORY) subtitleList.removeChild(subtitleList.firstChild);
  const diff = sheetContent.scrollHeight - prevHeight;
  if (diff > 0) sheetContent.scrollTop = prevTop + diff;
}

function bindLang() {
  const langFab = sheet.parentElement.querySelector('#langFab');
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

/* ── 뷰 정리 ── */
function cleanup() {
  stopPolling();
  if (cleanup._drag) cleanup._drag();
  if (cleanup._lang) cleanup._lang();
  if (ytPlayer && typeof ytPlayer.destroy === 'function') { try { ytPlayer.destroy(); } catch {} }
  ytPlayer = null;
}
