# Weverse Safari 로그인 PoC 확인 방법

## 최초 설정

1. Xcode에서 `ios/App/App.xcodeproj`를 연다.
2. `App`과 `KaptikSafariExtension` 타깃의 Signing Team이 같은지 확인한다.
3. 실제 iPhone에 Kaptik 앱을 설치한다.
4. iPhone의 `설정 → 앱 → Safari → 확장 프로그램`에서 `Kaptik for Weverse`를 켠다.
5. 확장의 웹사이트 접근 권한에서 `weverse.io`를 허용한다.

## 확인 흐름

1. Kaptik의 Translate 화면에서 Weverse를 선택한다.
2. 안내 화면에서 `Safari에서 Weverse 열기`를 누른다.
3. Safari 우측 하단에 `Kaptik 동작 중` 배지가 보이는지 확인한다.
4. Weverse 로그인 버튼을 눌러 계정 로그인을 완료한다.
5. Weverse로 돌아온 뒤에도 Kaptik 배지가 유지되는지 확인한다.

이 PoC의 목적은 실제 Safari 세션에서 Weverse 로그인이 완료되고 Safari 확장이 계속 동작하는지 확인하는 것이다. 자막, 영상 시간 동기화, 전체 화면 기능은 포함하지 않는다.
