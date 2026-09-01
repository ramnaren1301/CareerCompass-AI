import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const root = resolve(valueAfter("--root", "."));
const port = Number(valueAfter("--port", process.env.PORT || "3000"));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

function safePath(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = resolve(join(root, clean === "/" ? "index.html" : clean));
  return candidate.startsWith(root) ? candidate : join(root, "index.html");
}

const server = createServer(async (request, response) => {
  try {
    let filePath = safePath(request.url || "/");
    const info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) filePath = join(filePath, "index.html");
    let content = await readFile(filePath).catch(() => null);
    if (!content) {
      filePath = join(root, "index.html");
      content = await readFile(filePath);
    }
    response.writeHead(200, {
      "Content-Type": mime[extname(filePath)] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
    response.end(content);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`PathwayOS server error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`PathwayOS running at http://localhost:${port}`);
  console.log(`Serving ${root}`);
});
