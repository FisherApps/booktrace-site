// Generates /audiobook-length/<slug>/ pages and the /audiobook-length/ hub. Run: node scripts/generate-book-pages.mjs
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { books as raw, slugify } from "./books.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const SITE = "https://booktrace.app";
const APP = "https://apps.apple.com/app/id6800459830";
const LASTMOD = new Date().toISOString().slice(0, 10);

const books = raw.map(([title, author, h, m, series, narrator, genre]) => ({
  title, author, h, m, series, narrator, genre, slug: slugify(title), mins: h * 60 + m,
})).sort((a, b) => a.mins - b.mins);
const seen = new Set();
for (const b of books) { if (seen.has(b.slug)) throw new Error("dup slug " + b.slug); seen.add(b.slug); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonEsc = (s) => JSON.stringify(s);
const fmt = (mins) => {
  mins = Math.round(mins);
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};
const fmtLong = (mins) => {
  mins = Math.round(mins);
  const h = Math.floor(mins / 60), m = mins % 60;
  const hp = `${h} hour${h === 1 ? "" : "s"}`;
  return m === 0 ? hp : h === 0 ? `${m} minutes` : `${hp} and ${m} minutes`;
};
const days = (mins, speed, perDay) => Math.ceil(mins / speed / perDay);
const dayWord = (n) => `${n} day${n === 1 ? "" : "s"}`;
const speeds = [0.8, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const dailies = [15, 30, 45, 60, 90, 120];
const wordsPerMin = 155; // typical narration pace, used only for a rough word-count estimate

function analogy(mins) {
  const h = mins / 60;
  if (h < 6) return "about one long-haul flight leg or a single weekend afternoon";
  if (h < 10) return "roughly a cross-country flight from New York to Los Angeles with time to spare";
  if (h < 14) return "close to a full workday of listening, or a New York to London flight and then some";
  if (h < 20) return "about the length of a drive from Chicago to Washington, D.C. and back";
  if (h < 30) return "roughly a full day of non-stop listening, a road trip from Seattle to Denver";
  if (h < 50) return "more than a full day and a half of non-stop listening";
  return "multiple full days of non-stop listening, closer to a week of commutes than a weekend";
}

function pickRelated(b) {
  const sameSeries = b.series ? books.filter((x) => x !== b && x.series === b.series) : [];
  const sameAuthor = books.filter((x) => x !== b && x.author === b.author && !sameSeries.includes(x));
  const idx = books.indexOf(b);
  const near = [];
  for (let d = 1; near.length < 6 && (idx - d >= 0 || idx + d < books.length); d++) {
    if (books[idx - d]) near.push(books[idx - d]);
    if (books[idx + d]) near.push(books[idx + d]);
  }
  const out = [];
  for (const x of [...sameSeries, ...sameAuthor, ...near]) if (!out.includes(x) && out.length < 4) out.push(x);
  return out;
}

const head = ({ title, desc, path, ogTitle, ld, crumbs, depth }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#161419">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE}${path}">
  <meta name="apple-itunes-app" content="app-id=6800459830, app-argument=${SITE}${path}">
  <meta property="og:site_name" content="Booktrace">
  <meta property="og:title" content="${esc(ogTitle || title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}${path}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${SITE}/assets/og-booktrace.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Booktrace audiobook tools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(ogTitle || title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}/assets/og-booktrace.png">
  <link rel="icon" href="${depth}assets/mark.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${depth}assets/app-icon.png">
  <link rel="stylesheet" href="${depth}style.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": ld }, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  }, null, 2)}
  </script>
</head>
<body class="home resource-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${depth}" aria-label="Booktrace home"><span class="brand-mark" aria-hidden="true"><img src="${depth}assets/mark.svg" alt=""></span><span>Booktrace</span></a>
      <nav class="desktop-nav" aria-label="Primary navigation">
        <a href="${depth}audiobook-length/">Audiobook lengths</a>
        <a href="${depth}audiobook-speed-calculator/">Speed calculator</a>
        <a href="${depth}audiobook-tools/">All tools</a>
      </nav>
      <a class="button button-small header-cta" href="${APP}">Download</a>
    </div>
  </header>
`;

const foot = (depth) => `
  <footer class="site-footer">
    <div class="shell footer-inner">
      <div><a class="brand" href="${depth}"><span class="brand-mark" aria-hidden="true"><img src="${depth}assets/mark.svg" alt=""></span><span>Booktrace</span></a><p>Built for hours, not pages.</p></div>
      <nav aria-label="Footer navigation"><a href="${depth}audiobook-length/">Audiobook lengths</a><a href="${depth}audiobook-tools/">Audiobook tools</a><a href="${depth}audiobook-goal-calculator/">Listening goals</a><a href="${depth}about/">About</a><a href="${depth}support.html">Support</a></nav>
    </div>
  </footer>
</body>
</html>
`;

function bookPage(b) {
  const depth = "../../";
  const path = `/audiobook-length/${b.slug}/`;
  const len = fmt(b.mins), lenLong = fmtLong(b.mins);
  const by = `by ${b.author}`;
  const narr = b.narrator ? ` narrated by ${b.narrator}` : "";
  const rank = books.filter((x) => x.mins < b.mins).length;
  const pctShorter = Math.round((rank / (books.length - 1)) * 100);
  const words = Math.round((b.mins * wordsPerMin) / 1000) * 1000;
  const at15 = fmt(b.mins / 1.5), at2 = fmt(b.mins / 2);
  const d1h = days(b.mins, 1, 60), d1h15 = days(b.mins, 1.5, 60), d30 = days(b.mins, 1, 30), d45x15 = days(b.mins, 1.5, 45);
  const related = pickRelated(b);
  const title = `How Long Is ${b.title} Audiobook? ${len} | Booktrace`;
  const desc = `${b.title} ${by} is about ${lenLong} as an audiobook. See the listening time at 1.25x, 1.5x and 2x speed, and how many days it takes at 30, 60 or 90 minutes a day.`;

  const faqs = [
    [`How long is the ${b.title} audiobook?`, `The ${b.title} audiobook ${by} runs about ${lenLong} at normal (1x) speed${b.narrator ? `, in the edition narrated by ${b.narrator}` : ""}. Exact runtime can differ by a few minutes between editions and stores.`],
    [`How long is ${b.title} at 1.5x speed?`, `At 1.5x speed, ${b.title} takes about ${fmtLong(b.mins / 1.5)}. At 2x it takes about ${fmtLong(b.mins / 2)}.`],
    [`How many days does it take to listen to ${b.title}?`, `At one hour a day and normal speed, ${b.title} takes about ${dayWord(d1h)}. At 1.5x speed and an hour a day it takes about ${dayWord(d1h15)}. At 30 minutes a day and normal speed it takes about ${dayWord(d30)}.`],
    [`Is the ${b.title} audiobook long?`, `Compared with the ${books.length} popular audiobooks on this site, ${b.title} is longer than about ${pctShorter}% of them. At ${len} it is ${analogy(b.mins)}.`],
  ];

  const ld = [
    { "@type": "WebPage", "@id": `${SITE}${path}#page`, name: title, url: `${SITE}${path}`, description: desc, isPartOf: { "@id": `${SITE}/#website` }, dateModified: LASTMOD },
    { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  const speedRows = speeds.map((s) => `<tr><td>${s}&times;</td><td>${fmt(b.mins / s)}</td></tr>`).join("");
  const dayHeaders = dailies.map((d) => `<th scope="col">${d >= 60 ? d / 60 + " hr" : d + " min"}</th>`).join("");
  const dayRows = [1, 1.25, 1.5, 2].map((s) => `<tr><th scope="row">${s}&times;</th>${dailies.map((d) => `<td>${days(b.mins, s, d)}</td>`).join("")}</tr>`).join("");

  return head({ title, desc, path, ogTitle: `How long is ${b.title}? ${len} audiobook`, ld, depth,
    crumbs: [["Booktrace", SITE + "/"], ["Audiobook lengths", SITE + "/audiobook-length/"], [b.title, SITE + path]] }) + `
  <main id="main">
    <section class="resource-hero shell">
      <div class="resource-copy">
        <p class="breadcrumbs"><a href="${depth}">Booktrace</a><span>/</span><a href="../">Audiobook lengths</a><span>/</span>${esc(b.title)}</p>
        <p class="eyebrow amber">${esc(b.genre)} audiobook${b.series ? ` &middot; ${esc(b.series)}` : ""}</p>
        <h1>How long is the ${esc(b.title)} audiobook?</h1>
        <p class="resource-lede"><strong>${esc(b.title)}</strong> ${esc(by)}${esc(narr)} is about <strong>${esc(lenLong)}</strong> long at normal speed. At 1.5&times; that drops to about ${esc(at15)}, and at 2&times; to about ${esc(at2)}.</p>
        <p class="calculator-supporting-copy">Runtimes are approximate and vary slightly by edition and retailer. Check the length shown in Audible, Libby, Spotify or Apple Books for your copy.</p>
      </div>
      <div class="speed-table-wrap">
        <table class="speed-table">
          <caption>${esc(b.title)} listening time by speed</caption>
          <thead><tr><th scope="col">Playback speed</th><th scope="col" style="text-align:right">Total time</th></tr></thead>
          <tbody>${speedRows}</tbody>
        </table>
      </div>
    </section>

    <section class="resource-band">
      <div class="shell resource-grid">
        <article class="resource-prose">
          <p class="eyebrow mint">Plan your listen</p>
          <h2>How many days to finish ${esc(b.title)}?</h2>
          <p>At one hour a day and normal speed, you'll finish in about ${dayWord(d1h)}. Speed it up to 1.5&times; and the same hour a day finishes it in about ${dayWord(d1h15)}. At 45 minutes a day and 1.5&times;, plan on about ${dayWord(d45x15)}.</p>
          <p>The table below shows whole days needed for every combination of speed and daily listening time.</p>
          <div class="table-scroll" style="margin-top:20px">
            <table class="speed-table">
              <caption>Days to finish by speed and daily listening time</caption>
              <thead><tr><th scope="col">Speed</th>${dayHeaders}</tr></thead>
              <tbody>${dayRows}</tbody>
            </table>
          </div>
        </article>
        <article class="resource-prose">
          <p class="eyebrow lilac">How long, really</p>
          <h2>${esc(len)} in perspective</h2>
          <p>At ${esc(len)}, ${esc(b.title)} is ${esc(analogy(b.mins))}. That's longer than about ${pctShorter}% of the ${books.length} popular audiobooks we list.</p>
          <p>Spoken at an average narration pace, ${esc(b.title)} comes to roughly ${words.toLocaleString("en-US")} words. Narrators vary, so a faster or slower reader will shift that number and the total runtime.</p>
          <p>Want to try other speeds or your own schedule? Use the <a href="${depth}audiobook-speed-calculator/">audiobook speed calculator</a> or the <a href="${depth}audiobook-goal-calculator/">listening goal calculator</a> to find the daily minutes you need.</p>
        </article>
      </div>
    </section>

    <section class="resource-feature shell">
      <div class="resource-feature-copy">
        <p class="eyebrow lilac">Track it as you listen</p>
        <h2>Know exactly how far along you are.</h2>
        <p>Booktrace is an iPhone audiobook tracker that logs your sessions, chapters, narrator and playback speed in one place, so you can see real progress through ${esc(b.title)} and how many hours remain, whichever app you listen in.</p>
        <ul class="clean-list">
          <li><span>Time remaining</span> at your own speed</li>
          <li><span>Sessions and chapters</span> logged as you listen</li>
          <li><span>One library</span> across Audible, Libby, Spotify and more</li>
        </ul>
        <a class="button button-primary resource-cta" href="${APP}">Try Booktrace free</a>
      </div>
      <div class="resource-phone phone"><img src="${depth}assets/live-listening.webp" width="1320" height="2868" loading="lazy" alt="Booktrace showing live audiobook listening progress and time remaining"></div>
    </section>

    <section class="resource-faq shell">
      <p class="eyebrow amber">Common questions</p>
      <h2>${esc(b.title)} audiobook length, answered</h2>
      <div class="faq-grid">
${faqs.map(([q, a]) => `        <article><h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join("\n")}
      </div>
    </section>

    <section class="related-resources shell"><p class="eyebrow mint">Keep browsing</p><h2>Other audiobook lengths.</h2><div class="related-grid">
${related.map((r) => `<a href="../${r.slug}/"><span>${esc(r.genre)}</span><strong>${esc(r.title)}</strong><p>About ${esc(fmt(r.mins))} &middot; ${esc(r.author)}</p></a>`).join("\n")}
<a href="../"><span>Hub</span><strong>All audiobook lengths</strong><p>Browse ${books.length} popular audiobooks by runtime.</p></a></div></section>
  </main>
` + foot(depth);
}

function hubPage() {
  const depth = "../";
  const path = "/audiobook-length/";
  const title = "How Long Is That Audiobook? Runtimes for Popular Books | Booktrace";
  const desc = `Look up how long ${books.length} popular audiobooks are, from Atomic Habits to War and Peace, with listening time at faster speeds and days to finish at your daily pace.`;
  const groups = [
    ["Under 8 hours", "Quick listens", (b) => b.mins < 480],
    ["8 to 12 hours", "A week of commutes", (b) => b.mins >= 480 && b.mins < 720],
    ["12 to 20 hours", "A solid listen", (b) => b.mins >= 720 && b.mins < 1200],
    ["20 to 40 hours", "Long hauls", (b) => b.mins >= 1200 && b.mins < 2400],
    ["40+ hours", "Epic listens", (b) => b.mins >= 2400],
  ];
  const ld = [
    { "@type": "CollectionPage", "@id": `${SITE}${path}#page`, name: title, url: SITE + path, description: desc, isPartOf: { "@id": `${SITE}/#website` }, dateModified: LASTMOD },
    { "@type": "ItemList", itemListElement: books.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: `${b.title} audiobook length`, url: `${SITE}/audiobook-length/${b.slug}/` })) },
  ];
  const sections = groups.map(([name, tag, fn]) => {
    const list = books.filter(fn);
    if (!list.length) return "";
    return `    <section class="related-resources shell"><p class="eyebrow mint">${esc(tag)}</p><h2>${esc(name)}</h2><div class="related-grid">
${list.map((b) => `<a href="${b.slug}/"><span>${esc(b.genre)}</span><strong>${esc(b.title)}</strong><p>${esc(fmt(b.mins))} &middot; ${esc(b.author)}</p></a>`).join("\n")}
</div></section>`;
  }).join("\n");
  return head({ title, desc, path, ld, depth, crumbs: [["Booktrace", SITE + "/"], ["Audiobook lengths", SITE + path]] }) + `
  <main id="main">
    <section class="resource-hero shell">
      <div class="resource-copy">
        <p class="breadcrumbs"><a href="${depth}">Booktrace</a><span>/</span>Audiobook lengths</p>
        <p class="eyebrow amber">Audiobook runtime lookup</p>
        <h1>How long is that audiobook?</h1>
        <p class="resource-lede">Runtimes for ${books.length} popular audiobooks, with listening time at faster speeds and the number of days to finish at 15 to 120 minutes a day.</p>
        <p class="calculator-supporting-copy">Lengths are approximate and vary slightly by edition. For any book not listed, use the <a href="${depth}audiobook-speed-calculator/">speed calculator</a> or <a href="${depth}audiobook-goal-calculator/">goal calculator</a> with the runtime from your app.</p>
      </div>
    </section>
${sections}
    <section class="resource-feature shell">
      <div class="resource-feature-copy">
        <p class="eyebrow lilac">Beyond the runtime</p>
        <h2>Track what you actually listen to.</h2>
        <p>Booktrace is an iPhone audiobook tracker that records sessions, chapters, narrators and speed across every app you listen in.</p>
        <a class="button button-primary resource-cta" href="${APP}">Try Booktrace free</a>
      </div>
      <div class="resource-phone phone"><img src="${depth}assets/bookshelf.webp" width="1320" height="2868" loading="lazy" alt="Booktrace bookshelf of tracked audiobooks"></div>
    </section>
  </main>
` + foot(depth);
}

await mkdir(`${root}audiobook-length`, { recursive: true });
await writeFile(`${root}audiobook-length/index.html`, hubPage());
for (const b of books) {
  await mkdir(`${root}audiobook-length/${b.slug}`, { recursive: true });
  await writeFile(`${root}audiobook-length/${b.slug}/index.html`, bookPage(b));
}

// Sitemap: replace any previous generated block
let sm = await readFile(`${root}sitemap.xml`, "utf8");
sm = sm.replace(/\s*<url>\s*<loc>https:\/\/booktrace\.app\/audiobook-length\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
const urls = ["/audiobook-length/", ...books.map((b) => `/audiobook-length/${b.slug}/`)];
const block = urls.map((u) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n  </url>\n`).join("");
sm = sm.replace("</urlset>", block + "</urlset>");
await writeFile(`${root}sitemap.xml`, sm);
console.log(`Generated hub + ${books.length} pages`);
