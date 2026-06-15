(() => {
  const badgeId = 'kaptik-weverse-status';
  const checkIntervalMs = 1500;
  const loginTextPattern = /\b(log\s*in|sign\s*in)\b|로그인|ログイン|登录|登入/i;
  let lastUrl = location.href;
  let renderTimer = null;

  function getPageState() {
    if (location.hostname === 'account.weverse.io') {
      return 'login';
    }

    const visibleLoginControl = [...document.querySelectorAll('a, button')]
      .find((element) => {
        const rect = element.getBoundingClientRect();
        const text = element.textContent?.trim() || '';
        return rect.width > 0 && rect.height > 0 && loginTextPattern.test(text);
      });

    return visibleLoginControl ? 'login' : 'ready';
  }

  function ensureBadge() {
    let badge = document.getElementById(badgeId);
    if (badge) return badge;

    badge = document.createElement('button');
    badge.id = badgeId;
    badge.type = 'button';
    badge.setAttribute('aria-live', 'polite');
    badge.addEventListener('click', () => badge.classList.toggle('kaptik-collapsed'));
    document.documentElement.appendChild(badge);
    return badge;
  }

  function renderState() {
    if (!document.documentElement || !document.body) return;

    const state = getPageState();
    const badge = ensureBadge();
    badge.dataset.state = state;
    badge.textContent = state === 'ready'
      ? 'Kaptik 동작 중 · Weverse 페이지 연결됨'
      : 'Kaptik 동작 중 · Safari에서 로그인을 완료해 주세요';
  }

  const observer = new MutationObserver(() => {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderState, 250);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.setInterval(() => {
    if (lastUrl !== location.href) {
      lastUrl = location.href;
      renderState();
    }
  }, checkIntervalMs);

  renderState();
})();
