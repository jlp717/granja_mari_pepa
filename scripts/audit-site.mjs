/**
 * Auditoría de contenido del sitio público.
 * Rastrea sitemap + páginas dinámicas, extrae metadatos, encabezados,
 * imágenes y repeticiones de copy. Genera docs/auditoria/inventory.json.
 *
 * Uso: node scripts/audit-site.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://www.mari-pepa.com";
const OUT_DIR = path.resolve("docs/auditoria");
const CONCURRENCY = 4;

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function firstMatch(html, regex) {
  const match = regex.exec(html);
  return match ? decode(match[1].trim()) : "";
}

function allMatches(html, regex) {
  const out = [];
  let match;
  while ((match = regex.exec(html)) !== null) out.push(decode(stripTags(match[1])));
  return out;
}

function countOf(text, needle) {
  const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(pattern) || []).length;
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 60);
}

function extractMain(html) {
  // Next.js streaming: el contenido real llega en el bloque hidden S:0.
  const streamed = /<div hidden id="S:0"[^>]*>([\s\S]*)/i.exec(html);
  if (streamed) return streamed[1];
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return match ? match[1] : html;
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "MariPepaAudit/1.0 (+https://www.mari-pepa.com)",
      "Accept-Language": options.lang || "es-ES,es;q=0.9",
      ...options.headers,
    },
  });
  return { response, text: await response.text() };
}

async function auditUrl(url) {
  try {
    const { response, text: html } = await fetchText(url);
    const mainHtml = extractMain(html);
    const body = stripTags(mainHtml);
    const fullBody = stripTags(html);
    const images = [...mainHtml.matchAll(/<img\b[^>]*>/gi)].map((match) => {
      const tag = match[0];
      const src = firstMatch(tag, /\bsrc="([^"]+)"/i);
      const alt = firstMatch(tag, /\balt="([^"]*)"/i);
      const width = firstMatch(tag, /\bwidth="([^"]*)"/i);
      const height = firstMatch(tag, /\bheight="([^"]*)"/i);
      return { src, alt, width, height };
    });
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((m) => decode(m[1]));
    const jsonLd = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].length;
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      bytes: html.length,
      title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: firstMatch(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
      robots: firstMatch(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
      canonical: firstMatch(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
      lang: firstMatch(html, /<html[^>]+lang="([^"]*)"/i),
      h1: allMatches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi),
      h2: allMatches(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi),
      counts: {
        lorca: countOf(body, "Lorca"),
        year1966: countOf(body, "1966"),
        brand: countOf(body, "Mari Pepa") + countOf(body, "Maripepa"),
      },
      fullCounts: {
        lorca: countOf(fullBody, "Lorca"),
        year1966: countOf(fullBody, "1966"),
      },
      words: body ? body.split(/\s+/).length : 0,
      images,
      imagesWithoutAlt: images.filter((img) => !img.alt).length,
      internalLinks: links.filter((href) => href.startsWith("/") || href.startsWith(BASE)).length,
      jsonLd,
      sentences: sentences(body),
      mainText: body,
      bodySample: body.slice(0, 400),
    };
  } catch (error) {
    return { url, status: 0, error: error.message };
  }
}

async function main() {
  const { text: sitemap } = await fetchText(`${BASE}/sitemap.xml`);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  let index = 0;
  async function worker() {
    while (index < urls.length) {
      const current = urls[index++];
      results.push(await auditUrl(current));
      process.stdout.write(`. ${current}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Frases repetidas en 2 o más páginas.
  const map = new Map();
  for (const page of results) {
    if (!page.sentences) continue;
    for (const sentence of page.sentences) {
      const key = sentence.toLowerCase().replace(/\s+/g, " ").slice(0, 180);
      if (!map.has(key)) map.set(key, { sentence, pages: [] });
      map.get(key).pages.push(page.url);
    }
  }
  const duplicates = [...map.values()]
    .filter((item) => item.pages.length > 1)
    .sort((a, b) => b.pages.length - a.pages.length)
    .slice(0, 40);

  const payload = {
    generatedAt: new Date().toISOString(),
    urls: urls.length,
    pages: results.sort((a, b) => a.url.localeCompare(b.url)),
    duplicates,
  };
  await writeFile(path.join(OUT_DIR, "inventory.json"), JSON.stringify(payload, null, 2));

  const rows = payload.pages.map(
    (p) =>
      `| ${p.url.replace(BASE, "") || "/"} | ${p.status} | ${p.words} | ${p.counts?.year1966 ?? 0} | ${p.counts?.lorca ?? 0} | ${p.images?.length ?? 0} | ${p.imagesWithoutAlt ?? 0} | ${p.h1?.[0]?.slice(0, 60) ?? ""} |`,
  );
  const markdown = [
    "# Inventario del sitio",
    "",
    `Generado: ${payload.generatedAt}`,
    "",
    "| URL | HTTP | Palabras | 1966 | Lorca | Imágenes | Sin alt | H1 |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Frases repetidas en varias páginas",
    "",
    ...duplicates.map(
      (d) => `- (${d.pages.length} páginas) ${d.sentence} — ${d.pages.map((u) => u.replace(BASE, "")).join(", ")}`,
    ),
  ].join("\n");
  await writeFile(path.join(OUT_DIR, "INVENTARIO.md"), markdown);
  console.log(`\nOK ${results.length} páginas → docs/auditoria/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
