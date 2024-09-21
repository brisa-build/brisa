import CopyBox from '@/components/copy-box';
import { RenderCode } from '@/helpers/markdown-loader';

const fastAppsCode = `// src/pages/index.tsx
export default function HomePage() {
  return <p>Server-rendered Brisa page</p>;
}`;

const wc1 = `// src/pages/index.tsx
export default function HomePage() {
  return <custom-counter start={5} />;
}`;

const wc2 = `// src/web-components/custom-counter.tsx
function CustomCounter(props, { state }) {
  const count = state(props.start || 0);

  return (
    <>
      <div>Counter: {count.value}</div>
      <button onClick={() => count.value++}>
        Increment
      </button>
      <button onClick={() => count.value--}>
        Decrement
      </button>
    </>
  );
}

export default CustomCounter;`;

export default function Homepage() {
  return (
    <main>
      <div class="hero">
        <section class="home-section">
          <hgroup>
            <img
              src="/brisa.svg"
              alt="Brisa Framework logo"
              width="100"
              height="100"
            />
            <h1>Brisa Web Framework</h1>
            <p>
              <b>Build</b> web applications with <b>speed</b> and{' '}
              <b>simplicity</b>
            </p>
          </hgroup>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <a href="/getting-started/quick-start" class="cta">
              Get Started
            </a>
            <CopyBox ariaLabel="Copy" text="bun create brisa my-app" />
          </div>
        </section>
      </div>
      <section class="home-section fast-apps">
        <div class="code-example">
          <div class="info">
            <h2>🚀 Build fast apps fast</h2>
            <p>
              Brisa pages are dynamically server-rendered JSX components, so
              there's zero JavaScript shipped to the browser by default.
            </p>
            <p>Simple to write; fast to run.</p>
          </div>
          <div class="code">
            <RenderCode code={fastAppsCode} />
            <p class="bytes">0 bytes</p>
          </div>
        </div>
      </section>

      <section class="home-section wc">
        <div class="code-example">
          <div class="info">
            <h2>🏝️ Web Component island-based</h2>
            <p>
              In Brisa everything by default runs only on the server, except the{' '}
              <code>src/web-components</code> folder that also runs on the
              client. Web components are rendered on the server (SSR) and
              hydrated on the client using native Web APIs, as they are
              transformed into Web Components with Signals.
            </p>
            <custom-counter start={5} />
          </div>
          <div class="code">
            <RenderCode code={wc1} />
            <RenderCode code={wc2} />
            <p class="bytes">+3 KB</p>
          </div>
        </div>
      </section>
    </main>
  );
}
