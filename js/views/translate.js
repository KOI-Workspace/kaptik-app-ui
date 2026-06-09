/**
 * Translate 화면 — Immersive Translate 참고
 * - URL 입력 + 플랫폼 바로가기(Weverse / YouTube / X / Instagram)
 * - 제출 시 로그인/결제 게이트 → Processing 로딩 → Player + 완료 알림
 */
import { headerHTML, bindHeader } from '../ui.js';
import { navigate } from '../router.js';
import { requireAccess } from '../gate.js';
import { showProcessing, toast } from '../modals.js';

/* 플랫폼 정의 (Weverse 로고 복제 금지 → 심볼/컬러로 표현) */
const PLATFORMS = [
  { id: 'weverse', label: 'Weverse', bg: 'linear-gradient(135deg,#8353EB,#B7A0FF)', color: '#fff', glyph: 'W' },
  { id: 'youtube', label: 'YouTube', bg: '#FF0000', color: '#fff', glyph: '▶' },
  { id: 'x', label: 'X', bg: '#000', color: '#fff', glyph: '𝕏' },
  { id: 'instagram', label: 'Instagram', bg: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)', color: '#fff', glyph: '◎' },
];

/** URL에서 플랫폼 추론 */
function detectPlatform(url) {
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/weverse/i.test(url)) return 'weverse';
  if (/(twitter|x\.com)/i.test(url)) return 'x';
  if (/instagram/i.test(url)) return 'instagram';
  return 'weverse';
}

/** 게이트 통과 후 번역 시작 → Processing → Player */
function startTranslation(platform) {
  requireAccess(() => {
    showProcessing(platform, () => {
      toast({ title: '번역이 완료됐어요', sub: '실시간 자막을 확인해 보세요', type: 'check' });
      navigate('player', { feed: null });
    });
  });
}

export function renderTranslate(_params, root) {
  root.innerHTML = `
    <div class="view">
      ${headerHTML({ showSearch: false, hasNotif: true })}
      <div class="page-content">
        <h1 class="translate-hero">URL을 입력하면<br><span class="accent">실시간 번역 자막</span>이 시작돼요</h1>

        <div class="url-input-wrap">
          <input class="url-input" id="urlInput" type="url" inputmode="url"
                 placeholder="영상 링크를 붙여넣으세요" autocomplete="off" />
          <button class="url-submit" id="urlSubmit" aria-label="번역 시작">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <div class="platform-grid">
          ${PLATFORMS.map((p) => `
            <button class="platform-item" data-platform="${p.id}">
              <span class="platform-icon" style="background:${p.bg};color:${p.color};font-size:26px;font-weight:800;">${p.glyph}</span>
              <span class="platform-label">${p.label}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>
  `;

  bindHeader(root);

  const input = root.querySelector('#urlInput');
  const submit = () => {
    const url = input.value.trim();
    startTranslation(url ? detectPlatform(url) : 'weverse');
  };
  root.querySelector('#urlSubmit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  // 플랫폼 아이콘 클릭 → 해당 플랫폼으로 시작
  root.querySelectorAll('[data-platform]').forEach((el) => {
    el.addEventListener('click', () => startTranslation(el.dataset.platform));
  });
}
