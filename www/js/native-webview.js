/**
 * iOS 네이티브 WKWebView 플러그인 래퍼
 * 앱(iOS) 환경에서만 동작하고, 웹(localhost)에서는 no-op으로 처리한다
 */

/** 플러그인을 그때그때 조회 — 앱 시작 시 한 번만 체크하면 아직 준비 안 됐을 수 있음 */
function getPlugin() {
  return window.Capacitor?.Plugins?.NativeWebViewPlugin;
}

/** 네이티브 WKWebView 사용 가능 여부 (호출 시점에 체크) */
export function isNativeEnv() {
  return !!getPlugin();
}

/** 지정 URL을 네이티브 WKWebView로 연다 */
export function openNativeWebView(url) {
  const p = getPlugin();
  if (!p) {
    console.warn('[Kaptik] NativeWebViewPlugin 없음 — iframe으로 폴백');
    return Promise.resolve();
  }
  return p.open({ url });
}

/** 네이티브 WKWebView를 닫고 Capacitor WebView를 복원한다 */
export function closeNativeWebView() {
  return getPlugin()?.close() ?? Promise.resolve();
}

/**
 * 타임스탬프 탭 시 네이티브 WKWebView를 해당 URL로 이동
 */
export function navigateNativeWebView(url) {
  const p = getPlugin();
  if (!p) return Promise.resolve();
  return p.navigate({ url });
}
