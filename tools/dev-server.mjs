// Zero-dependency dev server with live reload.
//   node tools/dev-server.mjs [file] [port]
// Serves the repo, opens the page, and reloads the browser whenever a
// watched file changes. No npm install, no build step.

import { createServer } from "node:http";
import { readFile, watch, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { exec } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const ENTRY = process.argv[2] ?? "index.html";
const PORT = Number(process.argv[3] ?? 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// Injected into every HTML response: listens for a reload ping.
const RELOAD_SNIPPET = `
<script>
(function(){
  var es = new EventSource("/__reload");
  es.onmessage = function(){ location.reload(); };
  es.onerror = function(){ /* server restarting; EventSource retries on its own */ };
})();
</script>`;

const clients = new Set();

function broadcast() {
  for (const res of clients) res.write("data: reload\n\n");
}

// Coalesce editor save-storms (many events for one save) into one reload.
let pending = null;
function scheduleReload(name) {
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    console.log(`  ↻ ${name} — reloading`);
    broadcast();
  }, 60);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("retry: 500\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/" + ENTRY;

  // Keep requests inside the repo.
  const path = join(ROOT, normalize(rel));
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    // Allow /about → /about.html and directory → index.html.
    let target = path;
    let info = await stat(target).catch(() => null);
    if (info?.isDirectory()) {
      target = join(target, "index.html");
      info = await stat(target).catch(() => null);
    }
    if (!info && !extname(target)) {
      target = target + ".html";
      info = await stat(target).catch(() => null);
    }
    if (!info) throw new Error("not found");

    const ext = extname(target).toLowerCase();
    let body = await readFile(target);

    if (ext === ".html") {
      body = body.toString().replace(/<\/body>/i, RELOAD_SNIPPET + "\n</body>");
      // ?reveal=all — force every scroll-reveal into its final state, so a
      // headless screenshot doesn't capture a page of invisible sections.
      // ?debug=widths — report any element wider than the viewport into the
      // document title, so a headless --dump-dom can read it back.
      if (url.searchParams.get("debug") === "widths") {
        body = body.replace(
          /<\/body>/i,
          `<script>
            (function(){
              var vw = document.documentElement.clientWidth, bad = [];
              document.querySelectorAll("*").forEach(function(el){
                var r = el.getBoundingClientRect();
                if (r.width > vw + 1 || r.right > vw + 1) {
                  bad.push(el.tagName.toLowerCase()
                    + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).join(".") : "")
                    + " w=" + Math.round(r.width) + " right=" + Math.round(r.right));
                }
              });
              document.title = "OVERFLOW(vw=" + vw + "): " + (bad.slice(0, 14).join(" | ") || "none");
            })();
          </script></body>`
        );
      }
      // ?menu=open — force the mobile panel open, which a headless
      // screenshot cannot do by clicking
      // ?debug=sections — report each section's id and vertical extent, so the
      // colour ramp can be checked against real section boundaries
      if (url.searchParams.get("debug") === "sections") {
        body = body.replace(
          /<\/body>/i,
          `<script>
            (function(){
              var out = [];
              document.querySelectorAll("section[id]").forEach(function(el){
                var r = el.getBoundingClientRect(), top = r.top + scrollY;
                out.push(el.id + ":" + Math.round(top) + "-" + Math.round(top + r.height));
              });
              document.title = "SECTIONS " + document.body.scrollHeight + " " + out.join(" ");
            })();
          </script></body>`
        );
      }
      if (url.searchParams.get("menu") === "open") {
        body = body.replace(
          /<\/head>/i,
          `<style>.menu{ opacity:1 !important; visibility:visible !important; transform:none !important; }</style></head>`
        );
      }
      if (url.searchParams.get("reveal") === "all") {
        body = body.replace(
          /<\/head>/i,
          `<style>
            .r{ opacity:1 !important; transform:none !important; }
            .chart .trk .mark{ width:calc(var(--v) * 1%) !important; transition:none !important; }
          </style></head>`
        );
      }
    }

    res.writeHead(200, {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<pre style="font:14px ui-monospace;padding:2rem">404 — ${rel}</pre>`);
  }
});

server.listen(PORT, async () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\n  CESS dev server\n  ${url}  →  ${ENTRY}\n  watching for changes — ctrl+c to stop\n`);
  if (!process.env.NO_OPEN) exec(`open ${url}`);

  // Recursive watch is supported on macOS.
  try {
    const watcher = watch(ROOT, { recursive: true });
    for await (const event of watcher) {
      const f = event.filename ?? "";
      if (
        f.includes("node_modules") ||
        f.includes(".git/") ||
        f.startsWith(".git") ||
        f.endsWith(".DS_Store") ||
        f.endsWith("~")
      ) continue;
      if (/\.(html|css|js|mjs|json|svg|jpg|jpeg|png|webp|avif)$/i.test(f)) {
        scheduleReload(f);
      }
    }
  } catch (err) {
    console.error("  watch failed:", err.message);
  }
});
