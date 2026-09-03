import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve("site");
const prototypeRoot = path.resolve("dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const isPrototype = pathname === "/prototype" || pathname.startsWith("/prototype/");
    const isOriginalAsset = pathname === "/silo" || pathname.startsWith("/silo/");
    const base = isPrototype ? prototypeRoot : root;
    const relative = isPrototype
      ? pathname.replace(/^\/prototype\/?/, "") || "index.html"
      : isOriginalAsset
        ? pathname.replace(/^\/silo\/?/, "") || "index.html"
      : pathname.replace(/^\/+/, "") || "index.html";
    const target = path.resolve(base, relative);

    if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, "index.html") : target;
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": types[path.extname(file)] || "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Silo Run running at http://127.0.0.1:${port}`);
  console.log(`Old prototype at http://127.0.0.1:${port}/prototype/`);
});
