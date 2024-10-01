export default function Blog() {
  return (
    <main class="hero">
      <section class="brisa-section">
        <hgroup>
          <img
            src="/brisa.svg"
            alt="Brisa Framework logo"
            width="100"
            height="100"
          />
          <h1>Brisa Blog</h1>
          <p>TODO</p>
        </hgroup>
      </section>
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
