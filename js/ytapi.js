/**
 * YouTube IFrame Player API 준비 헬퍼
 * index.html이 https://www.youtube.com/iframe_api 를 로드하고,
 * 로드 완료 시 window.onYouTubeIframeAPIReady 가 호출된다.
 * (콜백을 놓칠 수 있는 경쟁 조건 대비로 window.YT 폴링 안전망도 둔다)
 */
let ready = false;
const waiting = [];

function flush() {
  ready = true;
  waiting.splice(0).forEach((fn) => fn());
}

window.onYouTubeIframeAPIReady = flush;

// 콜백을 놓친 경우를 대비한 폴링 안전망
const poll = setInterval(() => {
  if (window.YT && window.YT.Player) { clearInterval(poll); flush(); }
}, 100);

/** YT API가 준비되면 cb 실행 (이미 준비됐으면 즉시) */
export function whenYTReady(cb) {
  if (ready && window.YT && window.YT.Player) cb();
  else waiting.push(cb);
}
