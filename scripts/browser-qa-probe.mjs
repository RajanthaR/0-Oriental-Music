// Browser QA probe for the P02 follow-up slice.
// Usage: node scripts/browser-qa-probe.mjs <baseURL> <outDir>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseURL = process.argv[2] ?? "http://localhost:3100";
const outDir = process.argv[3] ?? "../browser-qa-artifacts";
mkdirSync(outDir, { recursive: true });

const quarantinedTalas = [
  "tala-dadra", "tala-keherwa", "tala-teental", "tala-jhaptal",
  "tala-deepchandi", "tala-roopak", "tala-lawani", "tala-khemta",
];

const routes = [
  { path: "/", label: "home" },
  { path: "/sources", label: "sources" },
  { path: "/talas", label: "talas" },
  ...quarantinedTalas.map((id) => ({ path: `/talas/${id}`, label: `tala-${id}` })),
  { path: "/search?q=රාග", label: "search-normalized" },
  { path: "/search?q=", label: "search-empty" },
  { path: "/search?q=<script>alert(1)</script>", label: "search-hostile" },
  { path: "/admin", label: "admin" },
  { path: "/lessons", label: "lessons" },
  { path: "/lessons/les-intro-01", label: "lesson-detail" },
  { path: "/ragas/raga-bilawal", label: "raga-detail" },
];

const viewports = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "360x568", width: 360, height: 568 },
];

const report = [];

for (const vp of viewports) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${msg.location()?.url}: ${msg.text()}`);
    if (msg.type() === "warning" && /hydrat/i.test(msg.text())) consoleErrors.push(`HYDRATION-WARN: ${msg.text()}`);
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("requestfailed", (req) => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText}`));
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  for (const route of routes) {
    const entry = {
      viewport: vp.name,
      route: route.path,
      label: route.label,
      status: null,
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      horizontalOverflow: null,
      smallTouchTargets: [],
      keyboardFocusWorks: false,
    };
    try {
      const response = await page.goto(baseURL + encodeURI(route.path).replace(/%3Cscript/g, "%3Cscript"), { waitUntil: "networkidle", timeout: 30_000 });
      entry.status = response?.status() ?? null;
      // Horizontal overflow check
      entry.horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      // Touch-target audit for interactive elements visible in viewport
      const smallTargets = await page.evaluate(() => {
        const selectors = 'a[href], button:not([disabled]), [role="button"], input, select, textarea';
        return Array.from(document.querySelectorAll(selectors))
          .filter((el) => {
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
            return true;
          })
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
          }))
          .filter((t) => t.w < 44 || t.h < 44);
      });
      entry.smallTouchTargets = smallTargets.slice(0, 12);
      entry.smallTouchTargetCount = smallTargets.length;
      // Keyboard access smoke test on first route of each viewport
      await page.keyboard.press("Tab");
      entry.keyboardFocusWorks = await page.evaluate(() => document.activeElement !== document.body);
      entry.consoleErrors = consoleErrors.splice(0, consoleErrors.length);
      entry.pageErrors = pageErrors.splice(0, pageErrors.length);
      entry.failedRequests = failedRequests.splice(0, failedRequests.length);
    } catch (err) {
      entry.error = String(err).slice(0, 300);
      entry.consoleErrors = consoleErrors.splice(0, consoleErrors.length);
      entry.pageErrors = pageErrors.splice(0, pageErrors.length);
      entry.failedRequests = failedRequests.splice(0, failedRequests.length);
    }
    report.push(entry);
    const slug = `${vp.name}_${route.label}`.replace(/[^a-z0-9_-]/gi, "_");
    try {
      await page.screenshot({ path: join(outDir, `${slug}.png`), fullPage: false });
    } catch {}
  }

  await browser.close();
}

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));

// Summary
let problems = 0;
for (const r of report) {
  const flags = [];
  if (r.error) flags.push("NAV-ERROR");
  if (r.status && r.status >= 400) flags.push(`HTTP-${r.status}`);
  if (r.consoleErrors.length) flags.push(`console:${r.consoleErrors.length}`);
  if (r.pageErrors.length) flags.push(`pageerr:${r.pageErrors.length}`);
  if (r.failedRequests.length) flags.push(`failedreq:${r.failedRequests.length}`);
  if (r.horizontalOverflow) flags.push("H-OVERFLOW");
  if ((r.smallTouchTargetCount ?? 0) > 0) flags.push(`smallTargets:${r.smallTouchTargetCount}`);
  if (!r.keyboardFocusWorks && !r.error) flags.push("no-kbd-focus");
  if (flags.length) {
    problems += 1;
    console.log(`${r.viewport} ${r.route} => ${flags.join(", ")}`);
  }
}
console.log(`\n${report.length} route checks, ${problems} with flags`);
