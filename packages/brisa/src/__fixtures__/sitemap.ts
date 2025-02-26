async function sitemap() {
  return [
    {
      loc: 'https://example.com',
      lastmod: '2021-10-01T00:00:00.000Z',
      changefreq: 'daily',
      priority: 1.0,
      images: [
        {
          loc: 'https://example.com/image.jpg',
          title: 'Image title',
          caption: 'Image caption',
        },
      ],
    },
  ];
}

export default sitemap();
