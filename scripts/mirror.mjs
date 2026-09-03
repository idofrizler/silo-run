import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = new URL("https://3dscenes.qualityf2p.workers.dev/silo/");
const outputRoot = path.resolve("site");
const pending = [new URL("index.html", sourceRoot)];
const seen = new Set();

const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);

function localPath(url) {
  const relative = decodeURIComponent(url.pathname.slice("/silo/".length)) || "index.html";
  return path.join(outputRoot, relative);
}

function discover(text, baseUrl) {
  const candidates = new Set();
  const patterns = [
    /(?:src|href)=["']([^"'#?]+(?:\?[^"'#]*)?)/g,
    /(?:from|import)\s*\(?\s*[`"']([^`"']+)[`"']/g,
    /["'`](assets\/[^"'`?#]+)["'`]/g,
    /url\(\s*["']?([^"'()#?]+)["']?\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = match[1];
      if (
        !value ||
        value.startsWith("data:") ||
        value.startsWith("blob:") ||
        value.startsWith("mailto:") ||
        value.startsWith("javascript:")
      ) {
        continue;
      }

      try {
        const url = new URL(value, baseUrl);
        if (url.origin === sourceRoot.origin && url.pathname.startsWith("/silo/")) {
          url.hash = "";
          url.search = "";
          candidates.add(url.href);
        }
      } catch {
        // Ignore strings that are not URLs.
      }
    }
  }

  return [...candidates].map((value) => new URL(value));
}

async function download(url, required = false) {
  const response = await fetch(url, {
    headers: { "user-agent": "SiloRunLocalMirror/1.0" },
  });
  if (!response.ok) {
    if (!required && response.status === 404) {
      console.warn(`skipped missing candidate ${url.pathname}`);
      return;
    }
    throw new Error(`${response.status} ${response.statusText}: ${url.href}`);
  }

  const target = localPath(url);
  await mkdir(path.dirname(target), { recursive: true });

  const extension = path.extname(url.pathname).toLowerCase();
  if (textExtensions.has(extension)) {
    let text = await response.text();
    if (url.pathname === "/silo/" || url.pathname === "/silo/index.html") {
      text = text
        .replaceAll('href="/silo/', 'href="./')
        .replaceAll('src="/silo/', 'src="./');
    }
    await writeFile(target, text);
    pending.push(...discover(text, url));
  } else {
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
  }

  console.log(`mirrored ${url.pathname}`);
}

await rm(outputRoot, { recursive: true, force: true });

while (pending.length > 0) {
  const url = pending.shift();
  if (url.pathname === "/silo/") {
    url.pathname = "/silo/index.html";
  }
  if (seen.has(url.href)) continue;
  seen.add(url.href);
  await download(url, url.pathname === "/silo/index.html");
}

const index = await readFile(path.join(outputRoot, "index.html"), "utf8");
if (!index.includes("./assets/")) {
  throw new Error("The mirrored index does not reference local assets.");
}

console.log(`Done: ${seen.size} files mirrored into ${outputRoot}`);
