import type { Sitemap, SitemapItem } from '@/types';

export default async function sitemapToXml(sitemap: Sitemap) {
  const sitemapArray = sitemap instanceof Promise ? await sitemap : sitemap;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const {
    loc,
    lastmod,
    changefreq,
    priority,
    images,
    videos,
  } of sitemapArray) {
    xml += `\t<url>\n\t\t<loc>${loc}</loc>\n`;

    if (lastmod) xml += `\t\t<lastmod>${lastmod}</lastmod>\n`;
    if (changefreq) xml += `\t\t<changefreq>${changefreq}</changefreq>\n`;
    if (priority) xml += `\t\t<priority>${priority.toFixed(1)}</priority>\n`;
    if (images) xml += createImages(images);
    if (videos) xml += createVideos(videos);

    xml += `\t</url>\n`;
  }

  xml += `</urlset>`;

  return xml;
}

function createImages(images: SitemapItem['images']) {
  let xml = '';

  for (const { loc, title, caption } of images!) {
    xml += `\t\t<image:image>\n\t\t\t<image:loc>${loc}</image:loc>\n`;
    if (title) xml += `\t\t\t<image:title>${title}</image:title>\n`;
    if (caption) xml += `\t\t\t<image:caption>${caption}</image:caption>\n`;
    xml += `\t\t</image:image>\n`;
  }

  return xml;
}

function createVideos(videos: SitemapItem['videos']) {
  let xml = '';

  for (const v of videos!) {
    xml += `\t\t<video:video>\n\t\t\t<video:thumbnail_loc>${v.thumbnail_loc}</video:thumbnail_loc>\n\t\t\t<video:title>${v.title}</video:title>\n\t\t\t<video:description>${v.description}</video:description>\n\t\t\t<video:content_loc>${v.content_loc}</video:content_loc>\n\t\t\t<video:player_loc>${v.player_loc}</video:player_loc>\n`;
    if (v.duration)
      xml += `\t\t\t<video:duration>${v.duration}</video:duration>\n`;
    if (v.expiration_date)
      xml += `\t\t\t<video:expiration_date>${v.expiration_date}</video:expiration_date>\n`;
    if (v.rating) xml += `\t\t\t<video:rating>${v.rating}</video:rating>\n`;
    if (v.view_count)
      xml += `\t\t\t<video:view_count>${v.view_count}</video:view_count>\n`;
    if (v.publication_date)
      xml += `\t\t\t<video:publication_date>${v.publication_date}</video:publication_date>\n`;
    if (v.family_friendly)
      xml += `\t\t\t<video:family_friendly>${v.family_friendly}</video:family_friendly>\n`;
    if (v.tag) xml += `\t\t\t<video:tag>${v.tag}</video:tag>\n`;
    if (v.live) xml += `\t\t\t<video:live>${v.live}</video:live>\n`;
    if (v.requires_subscription)
      xml += `\t\t\t<video:requires_subscription>${v.requires_subscription}</video:requires_subscription>\n`;
    if (v.restriction)
      xml += `\t\t\t<video:restriction>${v.restriction}</video:restriction>\n`;
    if (v.platform)
      xml += `\t\t\t<video:platform>${v.platform}</video:platform>\n`;
    if (v.uploader)
      xml += `\t\t\t<video:uploader>${v.uploader}</video:uploader>\n`;
    xml += `\t\t</video:video>\n`;
  }

  return xml;
}
