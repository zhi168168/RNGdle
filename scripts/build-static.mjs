import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const publicDir = join(root, "public");
const pagesDir = join(root, "content", "pages");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function absoluteUrl(config, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimSlash(config.site.domain)}${cleanPath}`;
}

function pageHref(slug) {
  return slug === "index" ? "/" : `/${slug}/`;
}

function renderAnalytics(gaId) {
  if (!gaId) return "";
  return `    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(gaId)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeHtml(gaId)}');
    </script>
`;
}

function renderSchema(config, page, path, kind) {
  const base = {
    "@context": "https://schema.org",
    "@type": kind,
    "name": page.title || config.site.name,
    "url": absoluteUrl(config, path),
    "dateModified": config.site.dateModified,
    "publisher": {
      "@type": "Organization",
      "name": config.site.name,
      "url": absoluteUrl(config, "/")
    }
  };

  if (kind === "WebApplication") {
    return {
      ...base,
      "applicationCategory": "GameApplication",
      "operatingSystem": "Any",
      "isAccessibleForFree": true,
      "description": page.schemaDescription || page.description || config.site.description,
      "creator": base.publisher
    };
  }

  if (kind === "FAQPage") {
    return {
      ...base,
      "mainEntity": (page.questions || []).map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };
  }

  return {
    ...base,
    "headline": page.title,
    "description": page.description,
    "datePublished": config.site.datePublished,
    "mainEntityOfPage": absoluteUrl(config, path),
    "author": {
      "@type": "Organization",
      "name": `${config.site.name} Editorial Team`,
      "url": absoluteUrl(config, "/about/")
    }
  };
}

function renderHead(config, page, path, schemaType) {
  const title = page.title || config.site.name;
  const description = page.description || config.site.description;
  const canonical = absoluteUrl(config, path);
  const schema = renderSchema(config, page, path, schemaType);

  return `  <head>
${renderAnalytics(config.site.gaId)}    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="manifest" href="/site.webmanifest">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="${schemaType === "WebApplication" ? "website" : "article"}">
    <meta property="og:site_name" content="${escapeHtml(config.site.name)}">
    <meta property="og:locale" content="${escapeHtml(config.site.locale)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(page.twitterDescription || description)}">
    <link rel="stylesheet" href="/styles.css">
    <script type="application/ld+json">
${safeJson(schema).split("\n").map((line) => `      ${line}`).join("\n")}
    </script>
  </head>`;
}

function renderNav(config, activeKey) {
  const links = config.nav.map((item) => {
    const classes = [];
    if (item.key === "play") classes.push("nav-play");
    if (item.key === activeKey) classes.push("nav-active");
    const classAttr = classes.length ? ` class="${classes.join(" ")}"` : "";
    const currentAttr = item.key === activeKey ? ` aria-current="page"` : "";
    return `          <a${classAttr} href="${escapeHtml(item.href)}"${currentAttr}>${escapeHtml(item.label)}</a>`;
  }).join("\n");

  return `    <header class="site-header">
      <nav class="primary-nav" aria-label="primary">
        <a class="brand-link" href="/">${escapeHtml(config.site.name)}</a>
        <div class="nav-links">
${links}
        </div>
      </nav>
    </header>`;
}

function replaceConfigTokens(html, config) {
  return html.replace(/<a data-config="(contactEmail|reportEmail)"><\/a>/g, (_, key) => {
    const email = config.site[key] || config.site.contactEmail;
    return `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`;
  });
}

function replaceTemplateTokens(html, config) {
  return html
    .replace(/\{\{site\.name\}\}/g, escapeHtml(config.site.name))
    .replace(/\{\{site\.shortName\}\}/g, escapeHtml(config.site.shortName || config.site.name))
    .replace(/\{\{game\.question\}\}/g, escapeHtml(config.game.question || ""));
}

function renderParagraphs(paragraphs = [], config) {
  return paragraphs.map((text) => `        <p>${replaceConfigTokens(text, config)}</p>`).join("\n");
}

function renderList(items = []) {
  if (!items.length) return "";
  return `        <ul>
${items.map((item) => `          <li>${item}</li>`).join("\n")}
        </ul>`;
}

function renderHome(config, home, gameHtml) {
  const faqBlocks = home.seoSections.map((section) => `        <details class="faq-item">
          <summary><h2>${escapeHtml(section.title)}</h2></summary>
          <div class="faq-body">
${renderParagraphs(section.paragraphs, config)}
          </div>
        </details>`).join("\n\n");
  const runtime = {
    siteName: config.site.name,
    game: config.game
  };

  return `<!doctype html>
<html lang="${escapeHtml(config.site.language)}">
${renderHead(config, home, "/", "WebApplication")}
  <body>
${renderNav(config, "play")}
    <main class="app-shell">
      <h1 class="sr-only">${escapeHtml(home.hiddenH1 || config.site.name)}</h1>
      <header class="topbar">
        <p>${escapeHtml(config.game.question)}</p>
      </header>

${gameHtml}

      <section class="seo-content faq-accordion" aria-label="frequently asked questions about ${escapeHtml(config.site.name)}">
        <h2>FAQ</h2>
${faqBlocks}
      </section>
    </main>

    <script>
      window.GAME_SITE_CONFIG = ${safeJson(runtime)};
    </script>
    <script src="/app.js" type="module"></script>
  </body>
</html>
`;
}

function renderContentPage(config, page) {
  const body = page.schemaType === "FAQPage"
    ? (page.questions || []).map((item) => `        <h2>${escapeHtml(item.question)}</h2>
        <p>${escapeHtml(item.answer)}</p>`).join("\n")
    : (page.sections || []).map((section) => `        <h2>${escapeHtml(section.heading)}</h2>
${renderParagraphs(section.paragraphs, config)}
${renderList(section.list)}`).join("\n");

  const cta = page.cta ? `        <p class="content-cta"><a href="${escapeHtml(page.cta.href)}">${escapeHtml(page.cta.label)}</a></p>` : "";

  return `<!doctype html>
<html lang="${escapeHtml(config.site.language)}">
${renderHead(config, page, pageHref(page.slug), page.schemaType || "Article")}
  <body>
${renderNav(config, page.slug)}
    <main class="content-shell">
      <article class="content-card">
        <h1>${escapeHtml(page.title)}</h1>
        <p class="content-meta">${escapeHtml(page.meta || `Reviewed and updated by the ${config.site.name} Editorial Team.`)} ${escapeHtml(config.site.dateModified)}.</p>
${body}
${cta}
      </article>
    </main>
  </body>
</html>
`;
}

async function loadPages() {
  const files = (await readdir(pagesDir)).filter((file) => extname(file) === ".json");
  const pages = await Promise.all(files.map((file) => readJson(join(pagesDir, file))));
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function writePage(path, html) {
  const fullDir = path === "/" ? dist : join(dist, path);
  await mkdir(fullDir, { recursive: true });
  await writeFile(join(fullDir, "index.html"), html);
}

async function writeSitemap(config, pages) {
  const urls = ["/", ...pages.map((page) => pageHref(page.slug))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${absoluteUrl(config, url)}</loc>
    <lastmod>${config.site.dateModified}</lastmod>
  </url>`).join("\n")}
</urlset>
`;
  await writeFile(join(dist, "sitemap.xml"), xml);
}

async function writeRobots(config) {
  const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl(config, "/sitemap.xml")}
`;
  await writeFile(join(dist, "robots.txt"), robots);
}

async function writeManifest(config) {
  const manifest = {
    name: config.site.name,
    short_name: config.site.shortName || config.site.name,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    theme_color: config.site.themeColor,
    background_color: config.site.backgroundColor,
    display: "standalone",
    start_url: "/"
  };
  await writeFile(join(dist, "site.webmanifest"), `${safeJson(manifest)}\n`);
}

async function build() {
  const config = await readJson(join(root, "site.config.json"));
  const home = await readJson(join(root, "content", "home.json"));
  const gameHtml = replaceTemplateTokens(await readFile(join(root, "content", "game.html"), "utf8"), config);
  const pages = await loadPages();

  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  if (existsSync(publicDir)) {
    await cp(publicDir, dist, { recursive: true });
  }

  await writePage("/", renderHome(config, home, gameHtml));
  for (const page of pages) {
    await writePage(page.slug, renderContentPage(config, page));
  }

  await writeSitemap(config, pages);
  await writeRobots(config);
  await writeManifest(config);

  console.log(`Built ${config.site.name} into ${dist}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
