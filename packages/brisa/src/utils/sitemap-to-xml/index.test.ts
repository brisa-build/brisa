import { describe, it, expect } from 'bun:test';
import sitemapToXml from '.';
import type { Sitemap } from '@/types';

describe('utils/sitemap-to-xml', () => {
  it('should return the correct XML', async () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        lastmod: '2022-01-01',
        changefreq: 'monthly',
        priority: 0.8,
        images: [
          {
            loc: 'https://example.com/image.jpg',
            title: 'Image title',
            caption: 'Image caption',
          },
        ],
      },
    ];

    const xml = await sitemapToXml(sitemap);
    const lines = xml.split('\n');

    expect(lines.length).toBe(14);
    expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    expect(lines[1]).toBe(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(lines[2]).toBe('\t<url>');
    expect(lines[3]).toBe('\t\t<loc>https://example.com</loc>');
    expect(lines[4]).toBe('\t\t<lastmod>2022-01-01</lastmod>');
    expect(lines[5]).toBe('\t\t<changefreq>monthly</changefreq>');
    expect(lines[6]).toBe('\t\t<priority>0.8</priority>');
    expect(lines[7]).toBe('\t\t<image:image>');
    expect(lines[8]).toBe(
      '\t\t\t<image:loc>https://example.com/image.jpg</image:loc>',
    );
    expect(lines[9]).toBe('\t\t\t<image:title>Image title</image:title>');
    expect(lines[10]).toBe(
      '\t\t\t<image:caption>Image caption</image:caption>',
    );
    expect(lines[11]).toBe('\t\t</image:image>');
    expect(lines[12]).toBe('\t</url>');
    expect(lines[13]).toBe('</urlset>');
  });

  it('should work with a promise', async () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        lastmod: '2022-01-01',
        changefreq: 'monthly',
        priority: 0.8,
        images: [
          {
            loc: 'https://example.com/image.jpg',
            title: 'Image title',
            caption: 'Image caption',
          },
        ],
      },
    ];

    const xml = await sitemapToXml(Promise.resolve(sitemap));
    const lines = xml.split('\n');

    expect(lines.length).toBe(14);
    expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    expect(lines[1]).toBe(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(lines[2]).toBe('\t<url>');
    expect(lines[3]).toBe('\t\t<loc>https://example.com</loc>');
    expect(lines[4]).toBe('\t\t<lastmod>2022-01-01</lastmod>');
    expect(lines[5]).toBe('\t\t<changefreq>monthly</changefreq>');
    expect(lines[6]).toBe('\t\t<priority>0.8</priority>');
    expect(lines[7]).toBe('\t\t<image:image>');
    expect(lines[8]).toBe(
      '\t\t\t<image:loc>https://example.com/image.jpg</image:loc>',
    );
    expect(lines[9]).toBe('\t\t\t<image:title>Image title</image:title>');
    expect(lines[10]).toBe(
      '\t\t\t<image:caption>Image caption</image:caption>',
    );
    expect(lines[11]).toBe('\t\t</image:image>');
    expect(lines[12]).toBe('\t</url>');
    expect(lines[13]).toBe('</urlset>');
  });

  it('should work only with loc', () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
      },
    ];

    expect(sitemapToXml(sitemap)).resolves.toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>https://example.com</loc>\n\t</url>\n</urlset>',
    );
  });

  it('should work only with loc and lastmod', () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        lastmod: '2022-01-01',
      },
    ];

    expect(sitemapToXml(sitemap)).resolves.toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>https://example.com</loc>\n\t\t<lastmod>2022-01-01</lastmod>\n\t</url>\n</urlset>',
    );
  });

  it('should work only with loc and changefreq', () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        changefreq: 'monthly',
      },
    ];

    expect(sitemapToXml(sitemap)).resolves.toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>https://example.com</loc>\n\t\t<changefreq>monthly</changefreq>\n\t</url>\n</urlset>',
    );
  });

  it('should work only with loc and priority', () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        priority: 0.8,
      },
    ];

    expect(sitemapToXml(sitemap)).resolves.toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>https://example.com</loc>\n\t\t<priority>0.8</priority>\n\t</url>\n</urlset>',
    );
  });

  it('should work only with loc and images', () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        images: [
          {
            loc: 'https://example.com/image.jpg',
            title: 'Image title',
            caption: 'Image caption',
          },
        ],
      },
    ];

    expect(sitemapToXml(sitemap)).resolves.toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>https://example.com</loc>\n\t\t<image:image>\n\t\t\t<image:loc>https://example.com/image.jpg</image:loc>\n\t\t\t<image:title>Image title</image:title>\n\t\t\t<image:caption>Image caption</image:caption>\n\t\t</image:image>\n\t</url>\n</urlset>',
    );
  });

  it('should work with videos', async () => {
    const sitemap: Sitemap = [
      {
        loc: 'https://example.com',
        videos: [
          {
            title: 'Video title',
            description: 'Video description',
            thumbnail_loc: 'https://example.com/thumbnail.jpg',
            content_loc: 'https://example.com/content.mp4',
            player_loc: 'https://example.com/player.swf',
            duration: 600,
            expiration_date: '2022-01-01',
            rating: 4.2,
            view_count: 100,
            publication_date: '2022-01-01',
            family_friendly: 'yes',
            tag: 'tag1,tag2',
            restriction: 'IE GB US CA',
            platform: 'web mobile',
            live: 'no',
            requires_subscription: 'yes',
            uploader: 'uploader',
          },
        ],
      },
    ];

    const xml = await sitemapToXml(sitemap);
    const lines = xml.split('\n');

    expect(lines.length).toBe(25);

    expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    expect(lines[1]).toBe(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(lines[2]).toBe('\t<url>');
    expect(lines[3]).toBe('\t\t<loc>https://example.com</loc>');
    expect(lines[4]).toBe('\t\t<video:video>');
    expect(lines[5]).toBe(
      '\t\t\t<video:thumbnail_loc>https://example.com/thumbnail.jpg</video:thumbnail_loc>',
    );
    expect(lines[6]).toBe('\t\t\t<video:title>Video title</video:title>');
    expect(lines[7]).toBe(
      '\t\t\t<video:description>Video description</video:description>',
    );
    expect(lines[8]).toBe(
      '\t\t\t<video:content_loc>https://example.com/content.mp4</video:content_loc>',
    );
    expect(lines[9]).toBe(
      '\t\t\t<video:player_loc>https://example.com/player.swf</video:player_loc>',
    );
    expect(lines[10]).toBe('\t\t\t<video:duration>600</video:duration>');
    expect(lines[11]).toBe(
      '\t\t\t<video:expiration_date>2022-01-01</video:expiration_date>',
    );
    expect(lines[12]).toBe('\t\t\t<video:rating>4.2</video:rating>');
    expect(lines[13]).toBe('\t\t\t<video:view_count>100</video:view_count>');
    expect(lines[14]).toBe(
      '\t\t\t<video:publication_date>2022-01-01</video:publication_date>',
    );
    expect(lines[15]).toBe(
      '\t\t\t<video:family_friendly>yes</video:family_friendly>',
    );
    expect(lines[16]).toBe('\t\t\t<video:tag>tag1,tag2</video:tag>');
    expect(lines[17]).toBe('\t\t\t<video:live>no</video:live>');
    expect(lines[18]).toBe(
      '\t\t\t<video:requires_subscription>yes</video:requires_subscription>',
    );
    expect(lines[19]).toBe(
      '\t\t\t<video:restriction>IE GB US CA</video:restriction>',
    );
    expect(lines[20]).toBe('\t\t\t<video:platform>web mobile</video:platform>');
    expect(lines[21]).toBe('\t\t\t<video:uploader>uploader</video:uploader>');
    expect(lines[22]).toBe('\t\t</video:video>');
    expect(lines[23]).toBe('\t</url>');
    expect(lines[24]).toBe('</urlset>');
  });
});
