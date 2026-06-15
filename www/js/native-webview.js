/**
 * iOS 네이티브 WKWebView 플러그인 래퍼
 * 앱(iOS) 환경에서만 동작하고, 웹(localhost)에서는 no-op으로 처리한다
 */

let nativeWebViewPlugin = null;

/** Capacitor 8에서는 커스텀 네이티브 플러그인을 JavaScript에서 명시적으로 등록해야 한다. */
function getPlugin() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  if (!capacitor.isPluginAvailable?.('NativeWebViewPlugin')) return null;

  if (!nativeWebViewPlugin) {
    nativeWebViewPlugin = capacitor.registerPlugin('NativeWebViewPlugin');
  }
  return nativeWebViewPlugin;
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

/** 실제 Safari에서 URL을 열어 Safari 로그인 세션을 사용한다 */
export function openInSafari(url) {
  const p = getPlugin();
  if (!p) {
    console.warn('[Kaptik] NativeWebViewPlugin 없음 — 새 브라우저 창으로 폴백');
    window.open(url, '_blank', 'noopener,noreferrer');
    return Promise.resolve();
  }
  console.info('[Kaptik] NativeWebViewPlugin openSafari:', url);
  return p.openSafari({ url });
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
