import UIKit
import WebKit
import Capacitor

/// http/https 이외의 URL 스킴(kakaokompassauth://, naversearchapp:// 등)을 네이티브 앱으로 열어주는 델리게이트
private class DeepLinkNavigationDelegate: NSObject, WKNavigationDelegate {
  func webView(_ webView: WKWebView,
               decidePolicyFor navigationAction: WKNavigationAction,
               decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let url = navigationAction.request.url,
          let scheme = url.scheme?.lowercased() else {
      decisionHandler(.allow)
      return
    }
    if ["http", "https", "about", "blob", "data"].contains(scheme) {
      decisionHandler(.allow)
    } else {
      // 카카오·네이버·애플 등 OAuth 딥링크 → 외부 앱으로 넘김
      UIApplication.shared.open(url, options: [:], completionHandler: nil)
      decisionHandler(.cancel)
    }
  }
}

@objc(NativeWebViewPlugin)
public class NativeWebViewPlugin: CAPPlugin {

  private var nativeWebView: WKWebView?
  private var uiDelegate: NativeWebViewUIDelegate?
  private var navDelegate: DeepLinkNavigationDelegate?

  @objc func open(_ call: CAPPluginCall) {
    guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
      call.reject("Invalid URL"); return
    }
    DispatchQueue.main.async {
      self.showWebView(url: url)
      call.resolve()
    }
  }

  /// Weverse 로그인은 실제 Safari에서 처리해 Safari 세션을 그대로 사용한다.
  @objc func openSafari(_ call: CAPPluginCall) {
    guard let urlString = call.getString("url"),
          let url = URL(string: urlString),
          ["http", "https"].contains(url.scheme?.lowercased() ?? "") else {
      call.reject("Invalid URL")
      return
    }

    DispatchQueue.main.async {
      UIApplication.shared.open(url, options: [:]) { opened in
        if opened {
          call.resolve()
        } else {
          call.reject("Safari에서 URL을 열지 못했습니다.")
        }
      }
    }
  }

  @objc func close(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      self.hideWebView()
      call.resolve()
    }
  }

  /// 타임스탬프 탭 시 기존 WKWebView에서 해당 URL로 이동 (새 뷰 생성 없이)
  @objc func navigate(_ call: CAPPluginCall) {
    guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
      call.reject("Invalid URL"); return
    }
    DispatchQueue.main.async {
      self.nativeWebView?.load(URLRequest(url: url))
      call.resolve()
    }
  }

  private func showWebView(url: URL) {
    guard let vc = bridge?.viewController, let capWebView = bridge?.webView else { return }
    hideWebView()

    let config = WKWebViewConfiguration()
    config.allowsInlineMediaPlayback = true
    if #available(iOS 14.0, *) {
      config.defaultWebpagePreferences.allowsContentJavaScript = true
    }

    let wv = WKWebView(frame: vc.view.bounds, configuration: config)
    wv.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // iOS Safari처럼 보이도록 User-Agent 고정 (Weverse WebView 차단 우회)
    wv.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"

    // 딥링크 처리
    let nav = DeepLinkNavigationDelegate()
    wv.navigationDelegate = nav
    navDelegate = nav

    // window.open() 팝업 처리
    let uiDel = NativeWebViewUIDelegate(viewController: vc)
    wv.uiDelegate = uiDel
    uiDelegate = uiDel

    vc.view.insertSubview(wv, belowSubview: capWebView)

    // Capacitor WebView 투명화 → 아래 WKWebView가 보임
    capWebView.isOpaque = false
    capWebView.backgroundColor = .clear
    capWebView.scrollView.backgroundColor = .clear

    wv.load(URLRequest(url: url))
    nativeWebView = wv
  }

  private func hideWebView() {
    guard let capWebView = bridge?.webView else { return }
    nativeWebView?.removeFromSuperview()
    nativeWebView = nil
    uiDelegate = nil
    navDelegate = nil

    capWebView.isOpaque = true
    capWebView.backgroundColor = UIColor(red: 5/255, green: 5/255, blue: 5/255, alpha: 1)
    capWebView.scrollView.backgroundColor = .clear
  }
}

// MARK: - window.open() 팝업 핸들러
private class NativeWebViewUIDelegate: NSObject, WKUIDelegate {
  weak var viewController: UIViewController?

  init(viewController: UIViewController) {
    self.viewController = viewController
  }

  func webView(_ webView: WKWebView,
               createWebViewWith configuration: WKWebViewConfiguration,
               for navigationAction: WKNavigationAction,
               windowFeatures: WKWindowFeatures) -> WKWebView? {
    let frame = viewController?.view.bounds ?? UIScreen.main.bounds
    let popupWV = WKWebView(frame: frame, configuration: configuration)

    // 팝업에도 동일한 User-Agent + 딥링크 처리 적용
    popupWV.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    let popupNav = DeepLinkNavigationDelegate()
    popupWV.navigationDelegate = popupNav

    let popupVC = PopupWebViewController(webView: popupWV)
    viewController?.present(popupVC, animated: true)
    return popupWV
  }

  func webViewDidClose(_ webView: WKWebView) {}
}
