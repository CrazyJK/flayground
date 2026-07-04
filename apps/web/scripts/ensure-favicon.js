// favicon.ico 가 없으면 기본값(favicon.default.ico)을 복사한다.
// favicon.ico 는 개인 이미지 오버라이드용으로 gitignore 되어 있어
// 새로 체크아웃한 환경에서도 파비콘이 비지 않도록 predev/prebuild 에서 실행된다.
const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..", "src", "app");
const favicon = path.join(appDir, "favicon.ico");
const fallback = path.join(appDir, "favicon.default.ico");

if (!fs.existsSync(favicon) && fs.existsSync(fallback)) {
  fs.copyFileSync(fallback, favicon);
  console.log("[ensure-favicon] favicon.ico 없음 → favicon.default.ico 복사");
}
