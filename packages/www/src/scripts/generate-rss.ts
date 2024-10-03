import fs from 'node:fs';
import path from 'node:path';
import marker from 'gray-matter';

const BUILD_PATH = path.join(
  import.meta.dirname,
  '..',
  '..',
  '.vercel',
  'output',
  'static',
);
const POSTS_PATH = path.join(import.meta.dirname, '..', 'posts');
const posts = fs.readdirSync(POSTS_PATH);

let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>Brisa Blog</title>
<link>https://brisa.build/blog</link>
<description>Keep up with the latest news and updates from the Brisa team.</description>
<language>en-us</language>
`;

for (const post of posts) {
  const { data } = marker(
    fs.readFileSync(path.join(POSTS_PATH, post), 'utf-8'),
  );
  console.log(data);
  rss += `
  <item>
    <title>${data.title}</title>
    <link>https://brisa.build/blog/${post.replace('.md', '')}</link>
    <description>${data.description}</description>
    <pubDate>${new Date(data.created).toUTCString()}</pubDate>
  </item>
  `;
}

rss += `
</channel>
</rss>
`;

fs.writeFileSync(path.join(BUILD_PATH, 'rss.xml'), rss);
