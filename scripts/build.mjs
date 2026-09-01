import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { syncCareerCatalog } from "./sync-career-catalog.mjs";

const root = resolve(".");
const dist = resolve("dist");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
await syncCareerCatalog({ root });

const required = [
  "index.html",
  "styles.css",
  "src/app.js",
  "src/webmcp.js",
  "src/site-tools.js",
  "src/buddy-journey.js",
  "data/pathwayos-career-catalog.json",
  "manifest.webmanifest",
];

for (const file of required) {
  await readFile(resolve(root, file));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of ["index.html", "styles.css", "manifest.webmanifest", "service-worker.js", "_headers", "src", "public", "data", "_headers", "vercel.json", "netlify.toml"]) {
  await cp(resolve(root, item), resolve(dist, item), { recursive: true });
}
await writeFile(
  resolve(dist, "build-info.json"),
  JSON.stringify({ product: "PathwayOS", version: pkg.version, builtAt: new Date().toISOString() }, null, 2),
);
console.log("Built PathwayOS into ./dist");
