import UIKit
import WebKit

/// OAuth 팝업창 전용 ViewController
/// window.open()으로 열리는 로그인 팝업을 처리한다
class PopupWebViewController: UIViewController {

  private let webView: WKWebView
  private let closeButton: UIButton = {
    let btn = UIButton(type: .system)
    btn.setTitle("닫기", for: .normal)
    btn.setTitleColor(.white, for: .normal)
    btn.backgroundColor = UIColor(white: 0.2, alpha: 1)
    btn.layer.cornerRadius = 8
    btn.translatesAutoresizingMaskIntoConstraints = false
    return btn
  }()

  init(webView: WKWebView) {
    self.webView = webView
    super.init(nibName: nil, bundle: nil)
    self.modalPresentationStyle = .fullScreen
  }

  required init?(coder: NSCoder) { fatalError() }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black

    webView.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(webView)
    view.addSubview(closeButton)

    NSLayoutConstraint.activate([
      closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
      closeButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
      closeButton.widthAnchor.constraint(equalToConstant: 60),
      closeButton.heightAnchor.constraint(equalToConstant: 36),

      webView.topAnchor.constraint(equalTo: closeButton.bottomAnchor, constant: 8),
      webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])

    closeButton.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)

    // 팝업이 window.close()를 호출하면 자동으로 닫힘
    webView.uiDelegate = self
  }

  @objc private func closeTapped() {
    dismiss(animated: true)
  }
}

// MARK: - 팝업이 스스로 window.close() 호출 시 처리
extension PopupWebViewController: WKUIDelegate {
  func webViewDidClose(_ webView: WKWebView) {
    dismiss(animated: t
  }

  // 팝업 안에서 또 팝업이 열리는 경우 (중첩 처리)
  func webView(_ webView: WKWebView,
               createWebViewWith configuration: WKWebViewConfiguration,
               for navigationAction: WKNavigationAction,
               windowFeatures: WKWindowFeatures) -> WKWebView? {
    let nested = WKWebView(frame: .zero, configuration: configuration)
    let vc = PopupWebViewController(webView: nested)
    present(vc, animated: true)
    return nested
  }
}
