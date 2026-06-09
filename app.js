/**
 * Kaptik — 바텀시트 자막 플레이어
 */

const subtitles = [
  // ── 인사 & 치과 드립 (6:50~6:59) ──
  {"start":  0.0, "end":  0.8, "speaker": "j-hope",
    "ko": "형의 인사가 이상했다",
    "en": "Jin hyung's greeting was kinda weird.",
    "id": "Salamnya Jin hyung agak aneh.",
    "es": "El saludo de Jin hyung fue bastante raro."},
  {"start":  0.8, "end":  2.7, "speaker": "RM",
    "ko": "진형은 그냥 인사를 한 것 뿐인데 그냥",
    "en": "Jin hyung was just saying hi, that's all.",
    "id": "Jin hyung cuma nyapa biasa, kok.",
    "es": "Jin hyung solo estaba saludando, eso es todo."},
  {"start":  2.7, "end":  3.4, "speaker": "j-hope",
    "ko": "Hello",
    "en": "Hello.",
    "id": "Hello.",
    "es": "Hola."},
  {"start":  3.4, "end":  5.4, "speaker": "Jin",
    "ko": "근데 이상하면 치과가야 되는거 아니야? 하하하",
    "en": "But if something feels weird, shouldn't you go to the dentist? Hahaha.",
    "id": "Tapi kalau ada yang terasa aneh, bukannya harus ke dokter gigi? Hahaha.",
    "es": "Pero si algo se siente raro, ¿no deberías ir al dentista? Jajaja."},
  {"start":  5.4, "end":  6.4, "speaker": "RM",
    "ko": "형 아직 안죽었네?",
    "en": "You've still got it, hyung.",
    "id": "Masih jago aja, hyung.",
    "es": "Todavía la tienes, hyung."},
  {"start":  6.4, "end":  7.1, "speaker": "Jungkook",
    "ko": "정말 재밌다",
    "en": "That was actually funny.",
    "id": "Itu beneran lucu.",
    "es": "Eso fue gracioso de verdad."},
  {"start":  7.1, "end":  9.0, "speaker": "RM",
    "ko": "살아있네요 형?",
    "en": "Still sharp, hyung.",
    "id": "Masih lucu aja, hyung.",
    "es": "Sigues en forma, hyung."},

  // ── 앨범 언제 나와 (6:59~7:16) ──
  {"start":  9.0, "end": 14.2, "speaker": "Suga",
    "ko": "아 앨범이 좀 빨리 나왔으면 하는데 뭔가 멀어멀어멀어",
    "en": "Ah, I wish the album would come out sooner, but it still feels so far away.",
    "id": "Ah, aku pengin albumnya cepat keluar, tapi rasanya masih jauh banget.",
    "es": "Ah, ojalá el álbum saliera antes, pero sigue sintiéndose tan lejos."},
  {"start": 14.2, "end": 15.4, "speaker": "Jin",
    "ko": "아직도 좀 멀지",
    "en": "Yeah, it's still a bit far off.",
    "id": "Iya, masih agak lama.",
    "es": "Sí, todavía falta un poco."},
  {"start": 15.4, "end": 17.0, "speaker": "Jungkook",
    "ko": "제발 제발좀 제발좀",
    "en": "Please, please, please.",
    "id": "Tolong, tolong, tolong.",
    "es": "Por favor, por favor, por favor."},
  {"start": 17.0, "end": 23.5, "speaker": "Jimin",
    "ko": "아직 봄이 안왔잖아요. 이제 한겨울이니까 얼른 봄이 왔으면 좋겠어요",
    "en": "Spring isn't here yet. It's still the middle of winter, so I really hope spring comes soon.",
    "id": "Musim semi belum datang, kan. Sekarang masih tengah musim dingin, jadi aku berharap musim semi cepat datang.",
    "es": "La primavera aún no llegó. Todavía es pleno invierno, así que espero que llegue pronto."},
  {"start": 23.5, "end": 25.0, "speaker": "Jin",
    "ko": "내일부터 다시 추워진대요",
    "en": "They said it's getting cold again tomorrow.",
    "id": "Katanya mulai besok bakal dingin lagi.",
    "es": "Dicen que mañana vuelve a hacer frío."},
  {"start": 25.0, "end": 26.0, "speaker": "Jimin",
    "ko": "그러니까요",
    "en": "Exactly.",
    "id": "Iya, makanya.",
    "es": "Exactamente."},

  // ── 아리랑 → 이맘때 (7:16~7:34) ──
  {"start": 26.0, "end": 27.5, "speaker": "Jimin",
    "ko": "아리랑 아리랑",
    "en": "Arirang, arirang…",
    "id": "Arirang, arirang…",
    "es": "Arirang, arirang…"},
  {"start": 27.5, "end": 34.0, "speaker": "V",
    "ko": "와 진짜 근데 이맘때쯤에 진짜",
    "en": "Wow, seriously, around this time of year…",
    "id": "Wah, serius deh, sekitar waktu-waktu begini…",
    "es": "Vaya, en serio, en esta época del año…"},
  {"start": 34.0, "end": 36.2, "speaker": "RM",
    "ko": "생각하지마 생각하지마",
    "en": "Don't think about it, don't think about it.",
    "id": "Jangan dipikirin, jangan dipikirin.",
    "es": "No lo pienses, no lo pienses."},
  {"start": 36.2, "end": 37.8, "speaker": "Jin",
    "ko": "아하하 아 이맘때쯤?",
    "en": "Ahaha, \"around this time of year\"?",
    "id": "Ahaha, \"sekitar waktu-waktu begini\"?",
    "es": "Ajaja, ¿\"en esta época del año\"?"},

  // ── 40키로 행군 ~ 100곡 (7:34~8:38) ──
  {"start": 37.8, "end": 39.5, "speaker": "V",
    "ko": "아 40키로 행군.",
    "en": "The 40-kilometer march.",
    "id": "Jalan 40 kilometer.",
    "es": "Ah, la marcha de 40 kilómetros."},
  {"start": 39.5, "end": 40.5, "speaker": "Jin",
    "ko": "군대군대",
    "en": "Military, military.",
    "id": "Militer, militer.",
    "es": "Ejército, ejército."},
  {"start": 40.5, "end": 42.0, "speaker": "j-hope",
    "ko": "아 갑자기 군대",
    "en": "Ah, suddenly we're talking about the military.",
    "id": "Ah, tiba-tiba bahas militer.",
    "es": "Ah, de repente hablando del ejército."},
  {"start": 42.0, "end": 44.0, "speaker": "RM",
    "ko": "아 군대얘기 하지말고 이제, 그만 얘기하고.",
    "en": "Let's not talk about the military anymore. Let's stop.",
    "id": "Udah, jangan bahas militer lagi. Stop.",
    "es": "Ya no hablemos del ejército. Dejémoslo."},
  {"start": 44.0, "end": 48.5, "speaker": "j-hope",
    "ko": "불현듯 떠오르긴해, 갑자기 스쳐지나가긴해.",
    "en": "It does just pop into your head, though. It just flashes by.",
    "id": "Tapi memang tiba-tiba keinget sih. Lewat gitu aja di kepala.",
    "es": "Pero es que te viene a la mente de repente, te cruza así."},
  {"start": 48.5, "end": 53.5, "speaker": "RM",
    "ko": "잊자잊자잊자 나 잊고싶어 정말. 자, 아무튼.",
    "en": "Forget it, forget it, forget it. I really want to forget. Anyway.",
    "id": "Lupakan, lupakan, lupakan. Aku beneran pengin lupa. Pokoknya.",
    "es": "Olvidémoslo, olvidémoslo. De verdad quiero olvidarlo. Bueno, de todas formas."},
  {"start": 53.5, "end": 55.8, "speaker": "j-hope",
    "ko": "ㄱㄷ(군대) 그만, 아리랑으로 돌아가자",
    "en": "Let's stop with \"military\" and go back to \"Arirang.\"",
    "id": "Udah, stop soal 'militer'-nya, balik ke 'Arirang' aja.",
    "es": "Ya basta del \"ejército\", volvamos al \"Arirang\"."},
  {"start": 55.8, "end": 56.5, "speaker": "V",
    "ko": "와.",
    "en": "Wow.",
    "id": "Wow.",
    "es": "Vaya."},
  {"start": 56.5, "end": 57.2, "speaker": "j-hope",
    "ko": "하하하.",
    "en": "Hahaha.",
    "id": "Hahaha.",
    "es": "Jajaja."},
  {"start": 57.2, "end": 59.8, "speaker": "Suga",
    "ko": "그러면 이제 수록곡 수가 나왔잖아요?",
    "en": "So the number of tracks on the album is out now, right?",
    "id": "Jadi jumlah lagunya sudah keluar, kan?",
    "es": "Entonces ya salió el número de canciones del álbum, ¿verdad?"},
  {"start": 59.8, "end": 60.8, "speaker": "RM",
    "ko": "열네 곡.",
    "en": "Fourteen.",
    "id": "Empat belas.",
    "es": "Catorce."},
  {"start": 60.8, "end": 61.8, "speaker": "j-hope",
    "ko": "열네 곡.",
    "en": "Fourteen.",
    "id": "Empat belas.",
    "es": "Catorce."},
  {"start": 61.8, "end": 68.0, "speaker": "Jimin",
    "ko": "저 솔로 라이브에서 몇 곡이나 원하냐고 물어봤더니, 15곡이면 좋겠다, 14곡이면 좋겠다 하더라고요.",
    "en": "I once asked during a solo live how many songs people wanted. Someone said they hoped it would have 15 songs, or 14 songs.",
    "id": "Dulu waktu live sendiri, aku pernah tanya maunya ada berapa lagu. Terus ada yang bilang semoga ada 15 lagu, atau 14 lagu.",
    "es": "Una vez en un live en solitario pregunté cuántas canciones querían. Alguien dijo que esperaba 15 canciones, o 14."},
  {"start": 68.0, "end": 70.0, "speaker": "Suga",
    "ko": "정규는 그만큼 채워야지.",
    "en": "If it's a full-length album, you do have to fill it up like that.",
    "id": "Kalau album penuh, memang harus sebanyak itu sih.",
    "es": "Si es un álbum completo, hay que llenarlo así."},
  {"start": 70.0, "end": 70.8, "speaker": "Jungkook",
    "ko": "맞아요.",
    "en": "That's right.",
    "id": "Betul sekali.",
    "es": "Exacto."},
  {"start": 70.8, "end": 72.5, "speaker": "Jimin",
    "ko": "그래서 깜짝 놀랐어요.",
    "en": "Yeah, so I was surprised.",
    "id": "Iya, jadi aku kaget.",
    "es": "Sí, me sorprendí."},
  {"start": 72.5, "end": 74.5, "speaker": "Suga",
    "ko": "정규는 꽉 찬 느낌이어야 하잖아.",
    "en": "A full-length album should feel full.",
    "id": "Album penuh memang harus terasa penuh.",
    "es": "Un álbum completo tiene que sentirse lleno."},
  {"start": 74.5, "end": 76.5, "speaker": "RM",
    "ko": "100곡 넘게 만든 것 같죠?",
    "en": "I think we had over 100 songs, right?",
    "id": "Kayaknya kita punya lebih dari 100 lagu, kan?",
    "es": "Creo que hicimos más de 100 canciones, ¿verdad?"},
  {"start": 76.5, "end": 78.0, "speaker": "Jimin",
    "ko": "더 넘었죠.",
    "en": "Yeah, we had more than that.",
    "id": "Iya, lebih dari itu.",
    "es": "Sí, más de eso."},
  {"start": 78.0, "end": 80.8, "speaker": "RM",
    "ko": "100곡 넘게 만들어서, 그 중에 14곡 추린 거잖아요.",
    "en": "We made over 100 songs, and then picked 14 from them.",
    "id": "Kami membuat lebih dari 100 lagu, lalu memilih 14 di antaranya.",
    "es": "Hicimos más de 100 canciones y elegimos 14 de ellas."},
  {"start": 80.8, "end": 82.5, "speaker": "Jungkook",
    "ko": "100곡 넘게 작업했어요.",
    "en": "We worked on more than 100 songs.",
    "id": "Kita mengerjakan lebih dari 100 lagu.",
    "es": "Trabajamos en más de 100 canciones."},
  {"start": 82.5, "end": 86.5, "speaker": "Jimin",
    "ko": "각자 10곡씩 하면 그게 다 모여서 14곡으로 추려진 거잖아요.",
    "en": "Each of us worked on around 10 songs, and from all of that, we narrowed it down to 14.",
    "id": "Masing-masing dari kami ikut mengerjakan sekitar 10 lagu, lalu dari semuanya itu dipilih jadi 14 lagu.",
    "es": "Cada uno trabajó en unas 10 canciones y de todo eso lo redujimos a 14."},
  {"start": 86.5, "end": 87.5, "speaker": "j-hope",
    "ko": "진짜 많이 만들었다.",
    "en": "We really made a lot.",
    "id": "Kita benar-benar bikin banyak banget.",
    "es": "De verdad hicimos muchísimas."},
  {"start": 87.5, "end": 88.5, "speaker": "Jungkook",
    "ko": "진짜.",
    "en": "Seriously.",
    "id": "Serius.",
    "es": "En serio."},

  // ── 감정 부분 (8:38~8:50) ──
  {"start": 88.5, "end": 115.0, "speaker": "RM",
    "ko": "그래서 여러 가지 감정이 다 담겨있어요. 오랜만에 정규니까, 여러가지 감정이 담겨있는 앨범으로 봐줬으면 해요.",
    "en": "So we put a lot of different emotions into it. Since it's our first full-length album in a while, I hope you'll think of it as an album with all kinds of emotions.",
    "id": "Jadi kami memasukkan banyak emosi yang berbeda ke dalam album ini. Karena ini album penuh pertama kami setelah sekian lama, semoga kalian bisa menganggapnya sebagai album yang berisi berbagai macam emosi.",
    "es": "Así que pusimos muchas emociones diferentes. Como es nuestro primer álbum completo en mucho tiempo, espero que lo vean como un álbum con todo tipo de emociones."},
];

const ANNOTATIONS = {
  // ── 치과 드립 ──
  '근데 이상하면 치과가야 되는거 아니야? 하하하': {
    color: '#A78BFA',
    title: '이상하다 = 이상해 (Pun)',
    content: '"이상하다"는 weird란 뜻이지만 발음이 치아 문제처럼 들린다. Jin이 아빠 개그로 받아친 것.',
  },
  "But if something feels weird, shouldn't you go to the dentist? Hahaha.": {
    color: '#A78BFA',
    title: 'Dad joke on "이상하다"',
    content: '"Weird" in Korean (이상하다) sounds like a dental complaint. Jin turned J-Hope\'s observation into a dentist joke.',
  },
  'Tapi kalau ada yang terasa aneh, bukannya harus ke dokter gigi? Hahaha.': {
    color: '#A78BFA',
    title: 'Permainan kata 이상하다',
    content: '"Aneh" dalam bahasa Korea (이상하다) terdengar seperti keluhan gigi. Jin langsung menjadikannya lelucon dokter gigi.',
  },
  'Pero si algo se siente raro, ¿no deberías ir al dentista? Jajaja.': {
    color: '#A78BFA',
    title: 'Juego de palabras: 이상하다',
    content: '"Raro" en coreano (이상하다) suena como queja dental. Jin convirtió el comentario en un chiste de dentista.',
  },
  // ── 40km 행군 ──
  '40키로 행군': {
    color: '#A78BFA',
    title: '40km 행군',
    content: '1월 기초훈련의 극한 코스. V의 "이맘때쯤"에 멤버들이 즉시 군대 기억을 떠올린 이유.',
  },
  '40-kilometer march': {
    color: '#A78BFA',
    title: '40km March',
    content: 'A grueling January basic-training march. V\'s "this time of year" instantly triggered military flashbacks.',
  },
  'Jalan 40 kilometer': {
    color: '#A78BFA',
    title: 'Mars 40 km',
    content: 'Latihan wajib militer Korea di bulan Januari. Ucapan V langsung memicu kenangan militer semua orang.',
  },
  'marcha de 40 kilómetros': {
    color: '#A78BFA',
    title: 'La marcha de 40 km',
    content: 'Marcha de entrenamiento militar coreano en enero. Lo que dijo V activó al instante los recuerdos del ejército.',
  },
};

// 언어별 "최신으로 이동" 버튼 라벨
const SCROLL_TO_TOP_LABELS = {
  'en': '↑ Latest',    'id': '↑ Terbaru',  'ja': '↑ 最新へ',
  'zh-CN': '↑ 最新',   'zh-TW': '↑ 最新',  'es': '↑ Reciente',
  'pt': '↑ Recente',   'fr': '↑ Récent',   'de': '↑ Neueste',
  'ko': '↑ 최신',      'ar': '↑ الأحدث',  'hi': '↑ नवीनतम',
  'th': '↑ ล่าสุด',    'vi': '↑ Mới nhất', 'ru': '↑ Новое',
  'tr': '↑ En yeni',
};

const SPEAKER_COLORS = {
  'RM': '#7B8CFF', 'Jin': '#FF7EB3', 'Suga': '#FFB347',
  'j-hope': '#FFE066', 'Jimin': '#FF6B6B', 'V': '#4ECDC4', 'Jungkook': '#5BC8FF',
};

const SPEAKER_INITIALS = {
  'RM': 'RM', 'Jin': 'JN', 'Suga': 'SG',
  'j-hope': 'JH', 'Jimin': 'JM', 'V': 'V', 'Jungkook': 'JK',
};

const SPEAKER_IMAGES = {
  'RM':       'public/images/RM 프로필.jpeg',
  'Jin':      'public/images/진 프로필.jpeg',
  'Suga':     'public/images/슈가 프로필.webp',
  'j-hope':   'public/images/제이홉 프로필.jpeg',
  'Jimin':    'public/images/지민 프로필.jpg',
  'V':        'public/images/뷔 프로필.jpg',
  'Jungkook': 'public/images/정국 프로필.jpeg',
};

// ── DOM ──
const startBtn         = document.getElementById('startBtn');
const resetBtn         = document.getElementById('resetBtn');
const sheet            = document.getElementById('sheet');
const sheetContent     = document.getElementById('sheetContent');
const scrollToTopBtn   = document.getElementById('scrollToTopBtn');
const langFab          = document.getElementById('langFab');
const langPanel        = document.getElementById('langPanel');
const langSelect       = document.getElementById('langSelect');

// 자막 리스트 컨테이너
const subtitleList = document.createElement('div');
subtitleList.className = 'subtitle-list';
sheetContent.appendChild(subtitleList);

// ── 바텀 시트 드래그 ──
let sheetTop     = 80;
const MIN_TOP    = 60;
const MAX_TOP    = () => Math.round(window.innerHeight * 0.75);

function applySheetTop(top, animate = false) {
  sheetTop = Math.max(MIN_TOP, Math.min(MAX_TOP(), top));
  if (animate) sheet.classList.add('animating');
  sheet.style.top = sheetTop + 'px';
  if (animate) {
    setTimeout(() => sheet.classList.remove('animating'), 340);
  }
}

let isDragging   = false;
let dragStartY   = 0;
let dragStartTop = 0;
const DRAG_ZONE  = 70; // 시트 상단 70px 터치 → 시트 이동

// sheetContent 상단 70px 터치 시 시트 드래그
sheetContent.addEventListener('touchstart', (e) => {
  const sheetRect = sheet.getBoundingClientRect();
  const relY = e.touches[0].clientY - sheetRect.top;
  if (relY < DRAG_ZONE) {
    isDragging   = true;
    dragStartY   = e.touches[0].clientY;
    dragStartTop = sheetTop;
    e.preventDefault(); // 해당 영역에서 스크롤 방지
  } else {
    isDragging = false;
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const delta = e.touches[0].clientY - dragStartY;
  applySheetTop(dragStartTop + delta);
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { isDragging = false; });

// ── 스크롤 감지 + 모멘텀 종료 후 삽입 ──
let isUserScrolled = false;
let isScrolling    = false;
let scrollEndTimer = null;
const pendingItems = [];

sheetContent.addEventListener('scroll', () => {
  isUserScrolled = sheetContent.scrollTop > 20;
  scrollToTopBtn.classList.toggle('visible', isUserScrolled);

  if (isUserScrolled) {
    isScrolling = true;
    clearTimeout(scrollEndTimer);
    // 스크롤이 200ms 동안 없으면 완전히 멈춘 것으로 판단
    scrollEndTimer = setTimeout(flushPending, 200);
  }
});

/** 지연된 자막을 한 번에 삽입하고 scrollTop을 보정해 덜컹거림 방지 */
function flushPending() {
  isScrolling = false;
  if (pendingItems.length === 0) return;
  const prevTop    = sheetContent.scrollTop;
  const prevHeight = sheetContent.scrollHeight;
  pendingItems.splice(0).forEach(item => subtitleList.appendChild(createSubtitleEl(item)));
  while (subtitleList.children.length > MAX_HISTORY) {
    subtitleList.removeChild(subtitleList.firstChild);
  }
  const diff = sheetContent.scrollHeight - prevHeight;
  if (diff > 0) sheetContent.scrollTop = prevTop + diff;
}

scrollToTopBtn.addEventListener('click', () => {
  clearTimeout(scrollEndTimer);
  isScrolling    = false;
  pendingItems.length = 0; // 최신으로 이동하므로 지연 자막 버림
  sheetContent.scrollTo({ top: 0, behavior: 'smooth' });
  isUserScrolled = false;
  scrollToTopBtn.classList.remove('visible');
});

// ── 언어 팝업 ──
langFab.addEventListener('click', (e) => {
  e.stopPropagation();
  langPanel.classList.toggle('open');
});
document.addEventListener('click', () => langPanel.classList.remove('open'));
langPanel.addEventListener('click', (e) => e.stopPropagation());

let currentLang = 'en';
langSelect.addEventListener('change', () => {
  currentLang = langSelect.value;
  langPanel.classList.remove('open');
  updateScrollToTopBtn();
  rerenderAll();
});

function updateScrollToTopBtn() {
  scrollToTopBtn.textContent = SCROLL_TO_TOP_LABELS[currentLang] || '↑ Latest';
}

// ── 재생 ──
let startTime     = null;
let timerInterval = null;
let isRunning     = false;
let pausedAt      = 0;

startBtn.addEventListener('click', () => {
  if (!isRunning) startSubtitles();
  else stopSubtitles();
});
resetBtn.addEventListener('click', clearSubtitles);

function startSubtitles() {
  isRunning = true;
  startTime = Date.now() - pausedAt * 1000;
  startBtn.textContent = '⏹ Stop';
  startBtn.classList.add('running');
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    updateSubtitle(elapsed);
    if (elapsed > subtitles[subtitles.length - 1].end + 1) stopSubtitles();
  }, 80);
}

function stopSubtitles() {
  isRunning = false;
  pausedAt  = (Date.now() - startTime) / 1000;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.textContent = '▶ Start';
  startBtn.classList.remove('running');
}

function clearSubtitles() {
  history           = [];
  lastSubtitleStart = -1;
  pausedAt          = 0;
  isUserScrolled    = false;
  isScrolling       = false;
  clearTimeout(scrollEndTimer);
  pendingItems.length = 0;
  subtitleList.innerHTML = '';
  scrollToTopBtn.classList.remove('visible');
  hideContext();
}

// ── 자막 히스토리 ──
const MAX_HISTORY = 50;
let history           = [];
let lastSubtitleStart = -1;

function updateSubtitle(elapsed) {
  const current = subtitles.find(s => elapsed >= s.start && elapsed < s.end);
  if (!current || current.start === lastSubtitleStart) return;
  lastSubtitleStart = current.start;
  history.push(current);

  // 스크롤 중(터치 모멘텀 포함)이면 큐에 넣고 스크롤 종료 후 처리
  if (isScrolling && isUserScrolled) {
    pendingItems.push(current);
  } else {
    prependSubtitle(current);
  }
}

// ── 어노테이션 ──
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAnnotatedHtml(text) {
  let result = escapeHtml(text);
  Object.keys(ANNOTATIONS).forEach(keyword => {
    const ann = ANNOTATIONS[keyword];
    const esc = escapeHtml(keyword);
    result = result.replace(
      new RegExp(escapeRegex(esc)),
      `<span class="annotated-word" data-key="${esc}" style="color:${ann.color};text-decoration-color:${ann.color}55">${esc}</span>`
    );
  });
  return result;
}

function bindAnnotationClicks(el) {
  el.querySelectorAll('.annotated-word').forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      showContext(span.dataset.key, span);
    });
  });
}

function createSubtitleEl(item) {
  const wrapper  = document.createElement('div');
  wrapper.className = 'subtitle-item';

  const speaker  = item.speaker || '';
  const color    = SPEAKER_COLORS[speaker]  || '#888888';
  const initials = SPEAKER_INITIALS[speaker] || speaker.slice(0, 2).toUpperCase();
  const text     = item[currentLang] || item.en || '';

  // 아바타
  const avatar = document.createElement('div');
  avatar.className = 'subtitle-avatar';
  avatar.style.border = `1.5px solid ${color}55`;

  const imgSrc = SPEAKER_IMAGES[speaker];
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = speaker;
    img.onerror = () => {
      img.remove();
      avatar.textContent = initials;
      avatar.style.background = color + '22';
      avatar.style.color = color;
    };
    avatar.appendChild(img);
  } else {
    avatar.textContent = initials;
    avatar.style.background = color + '22';
    avatar.style.color = color;
  }

  // 본문 (이름 + 텍스트)
  const body = document.createElement('div');
  body.className = 'subtitle-body';

  const nameEl = document.createElement('div');
  nameEl.className = 'subtitle-name';
  nameEl.style.color = color;
  nameEl.textContent = speaker;

  const textEl = document.createElement('div');
  textEl.className = 'subtitle-text';
  textEl.innerHTML = buildAnnotatedHtml(text);

  body.appendChild(nameEl);
  body.appendChild(textEl);

  // 아바타+텍스트를 row로 묶고, 카드는 row 아래에 별도 블록으로 추가
  const row = document.createElement('div');
  row.className = 'subtitle-row';
  row.appendChild(avatar);
  row.appendChild(body);
  wrapper.appendChild(row);

  bindAnnotationClicks(wrapper);
  return wrapper;
}

// ── 최신 자막 추가 (column-reverse: appendChild = 시각적 맨 위) ──
function prependSubtitle(item) {
  const atTop = sheetContent.scrollTop <= 20;
  const existingEls = [...subtitleList.querySelectorAll('.subtitle-item')];
  const newEl = createSubtitleEl(item);

  if (!atTop) {
    // 히스토리 읽는 중: 삽입 후 scrollTop 수동 보정으로 위치 유지
    const prevTop    = sheetContent.scrollTop;
    const prevHeight = sheetContent.scrollHeight;
    subtitleList.appendChild(newEl);
    if (subtitleList.children.length > MAX_HISTORY) {
      subtitleList.removeChild(subtitleList.firstChild);
    }
    const diff = sheetContent.scrollHeight - prevHeight;
    if (diff > 0) sheetContent.scrollTop = prevTop + diff;
    return;
  }

  // 최상단에서 보는 중: FLIP 슬라이드 다운
  const firstTops = existingEls.map(el => el.getBoundingClientRect().top);

  newEl.style.opacity = '0';
  subtitleList.appendChild(newEl);

  if (subtitleList.children.length > MAX_HISTORY) {
    subtitleList.removeChild(subtitleList.firstChild);
  }

  if (existingEls.length > 0) {
    const lastTops = existingEls.map(el =>
      el.parentElement ? el.getBoundingClientRect().top : null
    );
    existingEls.forEach((el, i) => {
      if (!el.parentElement || lastTops[i] === null) return;
      const delta = firstTops[i] - lastTops[i];
      if (Math.abs(delta) < 0.5) return;
      el.style.transition = 'none';
      el.style.transform  = `translateY(${delta}px)`;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        existingEls.forEach(el => {
          if (!el.parentElement) return;
          el.style.transition = 'transform 0.32s ease-out';
          el.style.transform  = '';
        });
        newEl.style.transition = 'opacity 0.2s ease-out 0.1s';
        newEl.style.opacity    = '1';
      });
    });

    setTimeout(() => {
      existingEls.forEach(el => {
        if (!el.parentElement) return;
        el.style.transition = '';
        el.style.transform  = '';
      });
    }, 360);
  } else {
    newEl.style.opacity = '1';
  }
}

// ── 전체 재렌더 (언어 변경 시) ──
function rerenderAll() {
  subtitleList.innerHTML = '';
  // column-reverse: 오래된 것 먼저 append → 시각적으로 최신이 맨 위
  history.forEach(item => subtitleList.appendChild(createSubtitleEl(item)));
}

// ── 문화맥락 해설 (인라인 카드) ──
let activeContextKey = null;
let activeContextEl  = null;

function showContext(key, triggerSpan) {
  // 같은 키 재클릭 → 닫기
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
    </div>
  `;
  card.querySelector('.context-card-close').addEventListener('click', hideContext);

  // subtitle-item 안에 자식으로 삽입 → 새 자막 추가 시 함께 이동
  subtitleItem.appendChild(card);
  activeContextEl = card;

  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('open')));
}

function hideContext() {
  if (!activeContextEl) return;
  const el     = activeContextEl;
  activeContextEl  = null;
  activeContextKey = null;
  el.classList.remove('open');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 초기화
updateScrollToTopBtn();
applySheetTop(sheetTop);
