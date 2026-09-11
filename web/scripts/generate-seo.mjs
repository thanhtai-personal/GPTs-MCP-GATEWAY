import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(import.meta.dirname, "..", "public");
const baseUrl = (
  process.env.VITE_PUBLIC_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  "http://127.0.0.1:5656"
).replace(/\/+$/u, "");

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /app\nSitemap: ${baseUrl}/sitemap.xml\n`,
);
fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/vi</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`,
);
console.log(`SEO files generated for ${baseUrl}`);
