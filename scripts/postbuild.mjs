// Post-build step for static GitHub Pages hosting under a subpath.
//
// React Router's SPA prerender always bakes `"basename":"/"` into the HTML
// and refuses a non-root `basename` in the config (its prerender preview
// server 302-redirects and the build fails). So we patch the prerendered
// basename here to match the client `basename` (import.meta.env.VITE_BASE_PATH),
// keeping the hydrated router in sync and avoiding a 404 flash.
//
// It also copies index.html to 404.html so deep links resolve on GitHub Pages.

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const clientDir = join(process.cwd(), "build", "client");
const basePath = (process.env.VITE_BASE_PATH || "").replace(/\/$/, "");

if (basePath) {
  const from = '"basename":"/"';
  const to = `"basename":"${basePath}"`;
  for (const file of ["index.html", "__spa-fallback.html"]) {
    const path = join(clientDir, file);
    const html = await readFile(path, "utf8");
    if (!html.includes(from)) {
      throw new Error(`postbuild: expected ${from} in ${file}, not found`);
    }
    await writeFile(path, html.replaceAll(from, to));
    console.log(`postbuild: patched basename in ${file} -> ${basePath}`);
  }
}

await copyFile(join(clientDir, "index.html"), join(clientDir, "404.html"));
console.log("postbuild: wrote 404.html");
