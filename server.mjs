import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const root = existsSync(join(projectRoot, "dist")) ? join(projectRoot, "dist") : projectRoot;
const rootBoundary = root.endsWith(sep) ? root : `${root}${sep}`;
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);

  if (!requested.endsWith("/") && !extname(requested) && existsSync(join(root, requested, "index.html"))) {
    send(res, 301, "", {
      "Location": `${url.pathname}/${url.search}`,
      "Content-Type": "text/plain; charset=utf-8"
    });
    return;
  }

  if (requested.endsWith("/")) requested += "index.html";

  let filePath = normalize(join(root, requested));
  if (!extname(filePath) && existsSync(join(filePath, "index.html"))) {
    filePath = normalize(join(filePath, "index.html"));
  }

  if (!(filePath === root || filePath.startsWith(rootBoundary)) || !existsSync(filePath)) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  try {
    const body = await readFile(filePath);
    send(res, 200, body, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
  } catch {
    send(res, 500, "Server error", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

const server = createServer(serveStatic);
server.listen(port, () => {
  console.log(`Local site is running at http://localhost:${port}`);
});
