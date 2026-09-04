import { createHash } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../site/index.html", import.meta.url);
const gameScriptPath = new URL("../site/game/game.js", import.meta.url);
const gameStylePath = new URL("../site/game/game.css", import.meta.url);
let html = await readFile(indexPath, "utf8");

const theme = `<script>
  (() => {
    const param = new URLSearchParams(window.location.search).get("scoutTheme");
    const theme =
      param || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>
<style>
:root {
  color-scheme: light;
  --cp-bg: #f7f4ef;
  --cp-bg-elevated: #fcfbf8;
  --cp-surface: #ffffff;
  --cp-surface-soft: #f5f5f5;
  --cp-border: #dedede;
  --cp-border-strong: #919191;
  --cp-text: #242424;
  --cp-text-muted: #5c5c5c;
  --cp-text-soft: #6f6f6f;
  --cp-accent: #b11f4b;
  --cp-accent-hover: #9a1a41;
  --cp-accent-soft: rgba(177, 31, 75, 0.08);
  --cp-accent-fg: #ffffff;
  --cp-success: #16a34a;
  --cp-danger: #dc2626;
  --cp-warning: #f59e0b;
  --cp-link: #0078d4;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
  --cp-overlay: rgba(255, 255, 255, 0.8);
  --cp-panel: rgba(255, 255, 255, 0.86);
  --cp-panel-strong: rgba(255, 255, 255, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.55);
  --cp-highlight: rgba(177, 31, 75, 0.12);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: #3d3b3a;
  --cp-bg-elevated: #343231;
  --cp-surface: #292929;
  --cp-surface-soft: #2e2e2e;
  --cp-border: #474747;
  --cp-border-strong: #5f5f5f;
  --cp-text: #dedede;
  --cp-text-muted: #919191;
  --cp-text-soft: #b0b0b0;
  --cp-accent: #fd8ea1;
  --cp-accent-hover: #fb7b91;
  --cp-accent-soft: rgba(253, 142, 161, 0.14);
  --cp-accent-fg: #1a1a1a;
  --cp-success: #4ade80;
  --cp-danger: #f87171;
  --cp-warning: #fbbf24;
  --cp-link: #4da6ff;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  --cp-overlay: rgba(41, 41, 41, 0.88);
  --cp-panel: rgba(41, 41, 41, 0.72);
  --cp-panel-strong: rgba(41, 41, 41, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.04);
  --cp-highlight: rgba(253, 142, 161, 0.12);
}
</style>
<link rel="stylesheet" href="./game/game.css" />`;

const loadingUi = `<div id="game-loading">
  <div class="game-loading-card">
    <strong>SILO RUN</strong>
    <div class="game-loading-indicator" aria-hidden="true"></div>
    <span>Preparing Silo 18</span>
  </div>
</div>`;

const questTracker = `<aside id="quest-tracker" class="show">
  <button id="quest-summary" type="button" aria-expanded="false">
    <span class="quest-summary-label">QUESTS · CLICK TO EXPAND</span>
    <strong id="quest-tracked-title">QUEST JOURNAL</strong>
    <span id="quest-objective"></span>
  </button>
  <div id="quest-list" hidden></div>
</aside>`;

const questUi = `${questTracker}
<div id="quest-prompt"></div>
<section id="quest-dialogue" role="dialog" aria-live="polite">
  <strong id="quest-speaker"></strong>
  <p id="quest-dialogue-text"></p>
  <span>Press E to continue</span>
</section>
<div id="quest-toast" role="status"></div>`;

const mobileUi = `<div id="mobile-controls" aria-label="Touch controls">
  <div id="mobile-stick" aria-label="Movement joystick">
    <span id="mobile-stick-knob"></span>
  </div>
  <div id="mobile-actions">
    <button id="mobile-interact" type="button">ACT</button>
    <button id="mobile-jump" type="button">JUMP</button>
  </div>
</div>`;

const gameUi = `${loadingUi}<div id="game-hud">
  <div class="game-brand"><strong>SILO RUN</strong><span id="game-level">LEVEL 67</span></div>
  <div class="game-help"><span>WASD move</span><span>Mouse aim</span><span>Scroll zoom</span><span>E interact</span><span>Space jump</span><span>R reset</span></div>
</div>
<div id="game-crosshair" aria-hidden="true"></div>
<button id="game-enter" type="button"><strong>Enter Silo 18</strong><span>Click to capture the mouse</span></button>
<div id="game-status" role="status"></div>${questUi}${mobileUi}
<script type="module" src="./game/game.js"></script>`;

if (!html.includes("./game/game.js")) {
  html = html
    .replace("<head>", `<head>${theme}`)
    .replace(/<title>.*?<\/title>/, "<title>Silo Run</title>")
    .replace("</body>", `${gameUi}</body>`);
}

if (!html.includes('id="game-loading"')) {
  html = html.replace('<div id="game-hud">', `${loadingUi}<div id="game-hud">`);
}

if (!html.includes('id="quest-tracker"')) {
  html = html.replace(
    '<script type="module" src="./game/game.js"></script>',
    `${questUi}<script type="module" src="./game/game.js"></script>`,
  );
} else {
  html = html.replace(
    /<aside id="quest-tracker"[\s\S]*?<\/aside>/,
    questTracker,
  );
}

if (!html.includes('id="mobile-controls"')) {
  html = html.replace(
    '<script type="module" src="./game/game.js"></script>',
    `${mobileUi}<script type="module" src="./game/game.js"></script>`,
  );
}

html = html.replace("<span>Mouse camera</span>", "<span>Mouse aim</span>");
if (!html.includes("<span>Scroll zoom</span>")) {
  html = html.replace(
    "<span>Mouse aim</span>",
    "<span>Mouse aim</span><span>Scroll zoom</span>",
  );
}
if (!html.includes("<span>E interact</span>")) {
  html = html.replace(
    "<span>Scroll zoom</span>",
    "<span>Scroll zoom</span><span>E interact</span>",
  );
}
html = html.replace(
  "<span>Shift sprint</span>",
  "",
);
html = html.replace("<span>Shift toggle run</span>", "");
html = html.replace(
  /\s*<button id="mobile-run"[^>]*>RUN<\/button>/,
  "",
);

function setMeta(attribute, key, content) {
  const expression = new RegExp(
    `<meta\\s+${attribute}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`,
  );
  const tag = `<meta ${attribute}="${key}" content="${content}" />`;
  html = expression.test(html)
    ? html.replace(expression, tag)
    : html.replace("</head>", `  ${tag}\n</head>`);
}

html = html.replace(/<title>.*?<\/title>/, "<title>Silo Run</title>");
html = html.replace(
  /<link rel="canonical"[^>]*>/,
  '<link rel="canonical" href="https://idofrizler.github.io/silo-run/" />',
);
setMeta(
  "name",
  "description",
  "Explore Silo 18 as Juliette, follow clues across 147 levels, help its residents, and uncover what waits below Mechanical.",
);
setMeta("property", "og:type", "website");
setMeta("property", "og:site_name", "Silo Run");
setMeta("property", "og:title", "Silo Run · Explore Silo 18");
setMeta(
  "property",
  "og:description",
  "A third-person exploration game across Silo 18. Take quests, uncover forbidden relics, and descend below Mechanical.",
);
setMeta("property", "og:url", "https://idofrizler.github.io/silo-run/");
setMeta(
  "property",
  "og:image",
  "https://idofrizler.github.io/silo-run/preview.jpg",
);
setMeta("property", "og:image:type", "image/jpeg");
setMeta("property", "og:image:width", "1100");
setMeta("property", "og:image:height", "800");
setMeta(
  "property",
  "og:image:alt",
  "Silo Run gameplay inside the Generator on Level 145",
);
setMeta("name", "twitter:card", "summary_large_image");
setMeta("name", "twitter:title", "Silo Run · Explore Silo 18");
setMeta(
  "name",
  "twitter:description",
  "Take quests and explore all the way from the Surface to The Digger.",
);
setMeta(
  "name",
  "twitter:image",
  "https://idofrizler.github.io/silo-run/preview.jpg",
);

const [gameScript, gameStyle] = await Promise.all([
  readFile(gameScriptPath),
  readFile(gameStylePath),
]);
const assetVersion = createHash("sha256")
  .update(gameScript)
  .update(gameStyle)
  .digest("hex")
  .slice(0, 12);
html = html
  .replace(
    /\.\/game\/game\.css(?:\?v=[a-f0-9]+)?/g,
    `./game/game.css?v=${assetVersion}`,
  )
  .replace(
    /\.\/game\/game\.js(?:\?v=[a-f0-9]+)?/g,
    `./game/game.js?v=${assetVersion}`,
  );

await Promise.all([
  writeFile(indexPath, html),
  copyFile(
    new URL("../src/assets/silo-run-preview.jpg", import.meta.url),
    new URL("../site/preview.jpg", import.meta.url),
  ),
]);
