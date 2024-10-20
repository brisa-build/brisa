import type { RequestContext } from 'brisa';
import path from 'node:path';
import fs from 'node:fs';
import { loadMarkdownFromPath } from '@/helpers/markdown-loader';
import RSSIcon from '@/icons/rss-icon';
import { formatDate } from '@/helpers/date';

export default function BlogContent({}, { store }: RequestContext) {
  const post = store.get('post');
  const { title, created, author, author_site, cover_image, cover_color } =
    post?.data ?? {};

  return (
    <main class="markdown-content" style={{ margin: '0 auto' }}>
      {cover_image && (
        <div
          key={cover_image}
          style={{ '--cover-color': cover_color }}
          class="cover-image"
        >
          <img
            loading="eager"
            src={cover_image}
            style={{ aspectRatio: '960/432' }}
          />
        </div>
      )}
      <hgroup>
        <h1
          style={{
            paddingBottom: '10px',
            borderBottom: '1px solid var(--color-light-gray)',
            margin: '60px 0 10px',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <small>
            <time dateTime={created}>{formatDate(created)}</time> by{' '}
            <a href={author_site} title={author} target="_blank">
              {author}
            </a>
          </small>
          <a
            title="RSS"
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RSSIcon />
          </a>
        </div>
      </hgroup>
      {post?.element}
    </main>
  );
}

export function Head({}, { route, store }: RequestContext) {
  const filePath = path.join(
    process.cwd(),
    'src',
    'posts',
    `${(route.params as Record<string, string>)?.slug}.md`,
  );
  const post = loadMarkdownFromPath(filePath);
  const title = `${post.data.title} - Brisa Blog`;
  const description = post.data.description;
  const keywords = post.data.keywords;

  store.set('post', post);

  return (
    <>
      <title id="title">{title}</title>
      <meta id="meta:title" name="title" content={title} />
      <meta id="og:title" property="og:title" content={title} />
      <meta id="twitter:title" property="twitter:title" content={title} />
      {keywords && <meta id="keywords" name="keywords" content={keywords} />}
      <meta id="meta:description" name="description" content={description} />
      <meta id="og:image" property="og:image" content={post.data.cover_image} />
      <meta
        id="twitter:image"
        property="twitter:image"
        content={post.data.cover_image}
      />
      <meta
        id="og:description"
        property="og:description"
        content={description}
      />
      <meta
        id="twitter:description"
        property="twitter:description"
        content={description}
      />
    </>
  );
}

export async function prerender() {
  const posts = fs.readdirSync(path.join(process.cwd(), 'src', 'posts'));
  return posts.map((slug) => ({
    slug: slug.replace('.md', ''),
  }));
}
