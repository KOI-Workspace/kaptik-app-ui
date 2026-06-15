import Capacitor

/// Kaptik 전용 네이티브 플러그인을 Capacitor 브리지에 등록한다.
final class MainViewController: CAPBridgeViewController {
  override func capacitorDidLoad() {
    bridge?.registerPluginInstance(NativeWebViewPlugin())
  }
}
