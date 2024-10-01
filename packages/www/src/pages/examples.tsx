import fs from 'node:fs';
import path from 'node:path';

type PackageJSON = Record<string, any>;

const { integrations, basics } = loadExamples();

export default function Examples() {
  const renderListItem = ({ name, webTitle }: PackageJSON) => (
    <li key={name}>
      <a
        alt={webTitle ?? normalize(name)}
        href={`https://github.com/brisa-build/brisa/tree/main/examples/${name}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {webTitle ?? normalize(name)}
      </a>
    </li>
  );

  return (
    <main>
      <div class="hero" style={{ padding: '20px 0' }}>
        <section class="brisa-section">
          <hgroup>
            <img
              src="/brisa.svg"
              alt="Brisa Framework logo"
              width="100"
              height="100"
            />
            <hgroup>
              <h1>Brisa by Example</h1>
              <p
                style={{
                  maxWidth: '656px',
                  fontSize: '1rem',
                  lineHeight: '24px',
                }}
              >
                A collection of annotated Brisa examples, to be used as a
                reference for how to build with Brisa, or as a guide to learn
                about many of Brisa's features 📚
              </p>
            </hgroup>
          </hgroup>
        </section>
      </div>
      <div class="examples">
        <section
          class="brisa-section"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            alignItems: 'self-start',
            gap: '30px',
          }}
        >
          <div>
            <h2>Basics</h2>
            <ul>{basics.map(renderListItem)}</ul>
          </div>
          <div>
            <h2>Integrations</h2>
            <ul>{integrations.map(renderListItem)}</ul>
          </div>
        </section>
      </div>
      <div class="examples more">
        <section class="brisa-section">
          <h2>Add your example 👇</h2>
          <p>
            Need an example that isn't here? Or want to add one of your own? We
            welcome contributions! You can request more examples, or add your
            own at our{' '}
            <a
              alt="Contribute adding an example"
              href="https://github.com/brisa-build/brisa/tree/main/examples"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

function normalize(str: string) {
  const name = str.replace('with-', '').replaceAll('-', ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function Head() {
  const title = `Brisa by Example`;
  const description = `A collection of annotated Brisa examples, to be used as a reference for how to build with Brisa, or as a guide to learn about many of Brisa's features 📚`;
  const keywords = `brisa, examples, basics, integrations`;

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

function loadExamples() {
  const basics: PackageJSON[] = [];
  const integrations: PackageJSON[] = [];

  try {
    const EXAMPLES_FOLDER = path.join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'examples',
    );
    const examples = fs
      .readdirSync(EXAMPLES_FOLDER)
      .toSorted((a, b) => a.localeCompare(b));

    for (const example of examples) {
      // .DS_Store ...
      if (example.startsWith('.')) continue;

      const packageJSON = JSON.parse(
        fs.readFileSync(
          path.join(EXAMPLES_FOLDER, example, 'package.json'),
          'utf-8',
        ),
      );
      if (packageJSON['example-category'] === 'basics')
        basics.push(packageJSON);
      else integrations.push(packageJSON);
    }
  } catch (error) {
    console.error('Error loading examples:', error);
  }

  return { basics, integrations };
}
