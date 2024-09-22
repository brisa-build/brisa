import type { Sitemap } from '@/types';

export default async function sitemapJsonToXml(sitemap: Sitemap) {
  const sitemapArray = sitemap instanceof Promise ? await sitemap : sitemap;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const { loc, lastmod, changefreq, priority, images } of sitemapArray) {
    xml += `\t<url>\n\t\t<loc>${loc}</loc>\n`;
    if (lastmod) xml += `\t\t<lastmod>${lastmod}</lastmod>\n`;
    if (changefreq) xml += `\t\t<changefreq>${changefreq}</changefreq>\n`;
    if (priority) xml += `\t\t<priority>${priority}</priority>\n`;
    if (images) {
      for (const { loc, title, caption } of images) {
        xml += `\t\t<image:image>\n\t\t\t<image:loc>${loc}</image:loc>\n`;
        if (title) xml += `\t\t\t<image:title>${title}</image:title>\n`;
        if (caption) xml += `\t\t\t<image:caption>${caption}</image:caption>\n`;
        xml += `\t\t</image:image>\n`;
      }
    }
    xml += `\t</url>\n`;
  }

  xml += `</urlset>`;

  return xml;
}
