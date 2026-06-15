#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeWebViewPlugin, "NativeWebViewPlugin",
  CAP_PLUGIN_METHOD(open, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(openSafari, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(close, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(navigate, CAPPluginReturnPromise);
)
