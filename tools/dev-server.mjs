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

  // A deliberately slow 1x1 image, used to hold the load event open.
  // --dump-dom captures at load and --timeout does not delay it, so a debug
  // view that needs to watch something over time has no way to report what it
  // saw. Requesting this image keeps load pending until the watching is done.
  if (url.pathname === "/__slow") {
    const ms = Math.min(Number(url.searchParams.get("ms") ?? 1500), 15000);
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "image/gif", "Cache-Control": "no-store" });
      res.end(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    }, ms);
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
      // any debug query freezes the marquees for the same reason ?reveal=all does
      // The marquees travel by writing scrollLeft from requestAnimationFrame,
      // so `animation:none` does not stop them and a rAF that never settles
      // keeps the virtual clock from going idle. main.js reads this flag.
      const stillness =
        `<script>window.CESS_NO_AUTOSCROLL=1</script>` +
        `<style>*,*::before,*::after{ animation:none !important; }</style>`;
      // ?debug=travel is the one debug view that needs the motion left alone —
      // it is measuring it.
      if (url.searchParams.has("debug") && url.searchParams.get("debug") !== "travel") {
        body = body.replace(/<\/head>/i, `${stillness}</head>`);
      }
      // ?debug=travel — sample each marquee's scroll position over a couple of
      // seconds and report how far it moved and whether it wrapped cleanly.
      // The row travels by writing scrollLeft, so nothing about it shows up in
      // a screenshot or in the computed styles.
      if (url.searchParams.get("debug") === "travel") {
        body = body.replace(
          /<\/body>/i,
          `<img src="/__slow?ms=7000" alt="" width="1" height="1"
                style="position:absolute;left:-9px;top:0;opacity:0">
          <script>
            /* Each row only travels while it is on screen, so the walk has to
               bring one into view at a time. Sampling starts at DOMContent —
               before load, which the slow image above is holding open. */
            addEventListener("DOMContentLoaded", function(){
              var rows = [].slice.call(document.querySelectorAll(".marq"));
              var out = [];
              (function step(i){
                if (i >= rows.length) { document.title = "TRAVEL " + out.join(" | "); return; }
                var m = rows[i], lap = m.querySelector(".marq__track").scrollWidth;
                m.scrollIntoView({ block: "center", behavior: "instant" });
                /* parked just short of the wrap, so the sample window crosses
                   it: a wrap that does not work shows up as a stall at the end */
                m.scrollLeft = Math.max(0, lap - 30);
                var from = m.scrollLeft, low = from;
                var t = setInterval(function(){ low = Math.min(low, m.scrollLeft); }, 40);
                setTimeout(function(){
                  clearInterval(t);
                  out.push((m.closest("section")||{}).id +
                    " lap=" + lap + " from=" + Math.round(from) +
                    " now=" + Math.round(m.scrollLeft) +
                    " wrapped=" + (low < from - 1));
                  step(i + 1);
                }, 700);
              })(0);
            });
          </script></body>`
        );
      }
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
      // ?debug=rails — report each rail's scroll geometry
      if (url.searchParams.get("debug") === "rails") {
        body = body.replace(
          /<\/body>/i,
          `<script>
            addEventListener("load", function(){
              var out = [];
              document.querySelectorAll(".rail").forEach(function(r){
                out.push(r.id + " x=" + Math.round(r.scrollLeft) +
                         " cw=" + Math.round(r.clientWidth) +
                         " sw=" + Math.round(r.scrollWidth) +
                         " pos=" + r.dataset.pos);
              });
              document.querySelectorAll(".marq").forEach(function(m){
                var tr = m.querySelectorAll(".marq__track");
                out.push("marq[" + (m.closest("section")||{}).id + "] tracks=" + tr.length +
                         " cards=" + (tr[0] ? tr[0].children.length : 0) +
                         " trackW=" + (tr[0] ? tr[0].scrollWidth : 0) +
                         " boxW=" + m.clientWidth +
                         " dur=" + getComputedStyle(tr[0]||m).animationDuration +
                         " ready=" + m.hasAttribute("data-ready"));
              });
              document.title = "RAILS " + out.join(" | ") +
                " || pageScrollWidth=" + document.documentElement.scrollWidth +
                " client=" + document.documentElement.clientWidth;
            });
          </script></body>`
        );
      }
      // ?debug=stack — walk the objectives section past the reading line and
      // report, at each step, which objective is active, what the others faded
      // to, and whether the heading is still pinned. A full-page screenshot
      // cannot show this: sticky never engages in a 15000px-tall window.
      if (url.searchParams.get("debug") === "stack") {
        body = body.replace(
          /<\/body>/i,
          `<script>
            addEventListener("load", function(){
              var sec = document.getElementById("strategy");
              var aside = sec.querySelector(".stack__aside");
              var items = [].slice.call(sec.querySelector(".stack__list").children);
              var top = sec.getBoundingClientRect().top + scrollY;
              var out = [];
              for (var step = 0; step < 8; step++){
                var y = top - 200 + step * 300;
                /* html has scroll-behavior:smooth, which would animate past the
                   sample point and read intermediate values */
                scrollTo({ top: y, behavior: "instant" });
                /* the page repaints the stack on rAF after a scroll, which is too
                   late for --dump-dom; it also repaints synchronously on resize,
                   so a resize event is the way to sample without waiting a frame */
                dispatchEvent(new Event("resize"));
                var ops = items.map(function(el){
                  return (+getComputedStyle(el).opacity).toFixed(2);
                });
                var on = sec.querySelector(".stack__dots li.on");
                out.push("y" + Math.round(y) +
                         " asideTop=" + Math.round(aside.getBoundingClientRect().top) +
                         " dot=" + (on ? on.textContent.trim() : "-") +
                         " op=[" + ops.join(",") + "]");
              }
              document.title = "STACK " + out.join(" | ");
            });
          </script></body>`
        );
      }
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
      // ?y=N — lift the document by N so a viewport-sized screenshot shows the
      // page as it looks at that scroll offset. It cannot scroll for real:
      // headless Chrome screenshots the composited surface at the origin, so a
      // scrolled page comes back blank. Sticky elements therefore sit where
      // they would at scroll 0, not where they would be pinned — use
      // ?debug=stack to measure pinning instead.
      if (url.searchParams.has("y")) {
        const y = Number(url.searchParams.get("y")) || 0;
        body = body.replace(
          /<\/body>/i,
          `<script>
            addEventListener("load", function(){
              document.body.style.marginTop = "${-y}px";
              dispatchEvent(new Event("resize"));
            });
          </script></body>`
        );
      }
      // ?open=all — expand everything a screenshot cannot click: the group
      // buttons first (the real path, so their own state updates too), then any
      // stray <details> not covered by one.
      if (url.searchParams.get("open") === "all") {
        body = body.replace(
          /<\/body>/i,
          `<script>
            addEventListener("load", function(){
              document.querySelectorAll(".disc-all").forEach(function(b){ b.click(); });
              document.querySelectorAll("details").forEach(function(d){ d.open = true; });
              document.title = "OPENALL buttons=" + document.querySelectorAll(".disc-all[aria-expanded='true']").length +
                "/" + document.querySelectorAll(".disc-all").length +
                " details=" + document.querySelectorAll("details[open]").length +
                "/" + document.querySelectorAll("details").length;
            });
          </script></body>`
        );
      }
      // ?pop=N — click the Nth discipline (1-based) and leave its panel open,
      // the only way to see it in a screenshot. Reports what the dialog is
      // actually carrying, so --dump-dom can check the wiring without a
      // picture. The reveal is forced too: the row starts at opacity 0.
      const popN = url.searchParams.get("pop");
      if (popN) {
        body = body.replace(
          /<\/head>/i,
          `${stillness}<style>.r,.disc__i{ opacity:1 !important; transform:none !important; }</style></head>`
        );
        body = body.replace(
          /<\/body>/i,
          `<script>
            addEventListener("load", function(){
              var t = document.querySelectorAll(".disc__t")[${Number(popN) - 1}];
              if(!t){ document.title = "POP no-such-term"; return; }
              t.click();
              var d = document.getElementById("pop");
              document.title = "POP open=" + (d && d.open) +
                " title=" + JSON.stringify(d.querySelector(".pop__title").textContent) +
                " bodyLen=" + d.querySelector(".pop__body").textContent.length +
                " inplaceHidden=" + (getComputedStyle(document.querySelector(".disc__d")).display === "none");
            });
          </script></body>`
        );
      }
      // ?nojs=1 — serve the page with every script stripped, to check the
      // no-JavaScript path. Chrome's --disable-javascript is a no-op in current
      // builds and --blink-settings=scriptEnabled=false renders nothing, so
      // removing the scripts server-side is the only reliable way to see it.
      if (url.searchParams.get("nojs") === "1") {
        body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      }
      if (url.searchParams.get("menu") === "open") {
        body = body.replace(
          /<\/head>/i,
          `<style>.menu{ opacity:1 !important; visibility:visible !important; transform:none !important; }</style></head>`
        );
      }
      if (url.searchParams.get("reveal") === "all") {
        body = body.replace(/<\/head>/i, `${stillness}</head>`);
        body = body.replace(
          /<\/head>/i,
          `<style>
            .r{ opacity:1 !important; transform:none !important; }
            .chart .trk .mark{ width:calc(var(--v) * 1%) !important; transition:none !important; }
            /* an infinite animation never lets headless Chrome's virtual clock
               go idle, so --virtual-time-budget hangs instead of returning.
               The marquees and the drifting orbs are both infinite. */
            *,*::before,*::after{ animation:none !important; }
            /* the objective stack sets its own opacity from the reading line */
            .objx{ opacity:1 !important; transform:none !important; }
            /* children staged inside a revealed parent — a section head's
               eyebrow, heading and line, and the discipline row. These hold at
               opacity 0 behind their own transition-delay, so forcing only the
               parent .r leaves a screenshot showing empty section heads. */
            .head.r > div > .micro, .head.r > div > h2, .head.r > .lede,
            .disc__i{
              opacity:1 !important; transform:none !important; transition:none !important;
            }
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
