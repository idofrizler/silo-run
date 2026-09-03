import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = path.resolve("site");
const pagesRoot = path.resolve("docs");
const assetsRoot = path.join(pagesRoot, "assets");

await rm(pagesRoot, { recursive: true, force: true });
await cp(siteRoot, pagesRoot, { recursive: true });

for (const entry of await readdir(assetsRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(?:css|js)$/.test(entry.name)) continue;

  const file = path.join(assetsRoot, entry.name);
  const source = await readFile(file, "utf8");
  const portable = source.replaceAll("/silo/", "../");
  if (portable !== source) await writeFile(file, portable);
}

await writeFile(path.join(pagesRoot, ".nojekyll"), "");
