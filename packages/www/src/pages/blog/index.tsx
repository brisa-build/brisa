import path from 'node:path';
import fs from 'node:fs';
import matter from 'gray-matter';

export default function Blog() {
  const postsPath = path.join(process.cwd(), 'src', 'posts');
  const posts = fs
    .readdirSync(postsPath)
    .map((slug) => {
      const { data } = matter(
        fs.readFileSync(path.join(postsPath, slug), 'utf-8'),
      );
      return { slug: slug.replace('.md', ''), data };
    })
    .toSorted(
      (a, b) =>
        new Date(b.data.created).getTime() - new Date(a.data.created).getTime(),
    );

  return (
    <main>
      <div class="hero" style={{ padding: '20px 0' }}>
        <section class="brisa-section ">
          <hgroup>
            <img
              src="/brisa.svg"
              alt="Brisa Framework logo"
              width="100"
              height="100"
            />
            <h1>Brisa Blog</h1>
          </hgroup>
        </section>
      </div>
      <div class="blog-list">
        {posts.map(
          ({ slug, data: { title, created, description, author } }: any) => (
            <section class="brisa-section">
              <a href={`/blog/${slug}`}>
                <article key={slug}>
                  <h2>{title}</h2>
                  <p>{description}</p>
                  <small>
                    <time dateTime={created}>{created}</time> by {author}
                  </small>
                </article>
              </a>
            </section>
          ),
        )}
      </div>
    </main>
  );
}

export function Head() {
  const title = `Brisa Blog`;
  const description = `Keep up with the latest news and updates from the Brisa team.`;
  const keywords = `brisa, blog, news, updates`;

  return (
    <>
      <title id="title">{title}</title>
      <meta id="meta:title" name="title" content={title} />
      <meta id="og:title" property="og:title" content={title} />
      <meta id="twitter:title" property="twitter:title" content={title} />
      <meta id="keywords" name="keywords" content={keywords} />
      <meta id="meta:description" name="description" content={description} />
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
