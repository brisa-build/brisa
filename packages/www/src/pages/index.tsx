import CopyBox from '@/components/copy-box';
import { RenderCode } from '@/helpers/markdown-loader';

const fastAppsCode = `
// src/pages/index.tsx
export default function HomePage() {
  return <p>Server-rendered Brisa page</p>;
}`;

const wc1 = `
// src/pages/index.tsx
export default function HomePage() {
  return <custom-counter start={5} />;
}`;

const wc2 = `
// src/web-components/custom-counter.tsx
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

const actionsCode = `
// src/pages/index.tsx
export default function HomePage() {
  function handleInput(event) {
    // This console.log will run on the server
    console.log(event.target.value);
  }

  return (
    <input 
      type="text" 
      onInput={handleInput} 
      debounceInput={400} 
    />
  );
}`;

const i18nCode = `
// src/pages/index.tsx
export default function HomePage() {
  return <I18nExample />;
}

function I18nExample({}, { i18n: { t, lang } }) {
  console.log(lang); // en-US
  return (
    <p>
      {/* Hello, Brisa! */}
      {t("hello-key", { name: "Brisa" })}
    </p>
  );
}`;

const multiPlatformCode = `
// brisa.config.ts
import type { Configuration } from "brisa";

export default {
  // bun, node, static, android, ios, desktop
  output: "android",
} satisfies Configuration;
`;

export default function Homepage() {
  return (
    <main>
      <div class="hero">
        <section class="brisa-section">
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
      <section class="brisa-section fast-apps">
        <div class="code-example">
          <div class="info">
            <h2>🚀 Build fast apps fast</h2>
            <p>
              Brisa pages are dynamically server-rendered JSX components, so
              there's <b>zero JavaScript</b> shipped to the browser{' '}
              <b>by default</b>.
            </p>
            <p>Simple to write; fast to run.</p>
          </div>
          <div class="code">
            <RenderCode code={fastAppsCode} />
            <p class="bytes">0 bytes</p>
          </div>
        </div>
      </section>

      <section class="brisa-section wc">
        <div class="code-example">
          <div class="info">
            <h2>🏝️ Web Component island-based</h2>
            <p>
              In Brisa everything by default runs only on the server, except the{' '}
              <code>src/web-components</code> folder that also runs on the
              client. Web components are rendered on the server (<b>SSR</b>) and
              hydrated on the client using native Web APIs, as they are
              transformed into Web Components with <b>Signals</b>.
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

      <section class="brisa-section actions">
        <div class="code-example">
          <div class="info">
            <h2>📲 Browser-events on Server </h2>
            <p>
              Brisa mixes ideas from React's "<b>Server Actions</b>" and HTMX
              concepts. With Brisa, you can handle all browser events on the
              server, such as forms, click events, etc. In addition, we offer
              some extra <b>HTML attributes</b> to manage debounces, optimistic
              updates, etc.
            </p>
            <p>
              The idea is that if you want you can create a SPA without Web
              Components, only with the weight of the Brisa RPC to make the
              connection with the server.
            </p>
            <a
              class="cta"
              href="/building-your-application/data-management/server-actions"
            >
              More about Server Actions
            </a>
          </div>
          <div class="code">
            <RenderCode code={actionsCode} />
            <p class="bytes">+2 KB (RPC code)</p>
          </div>
        </div>
      </section>

      <section class="brisa-section i18n">
        <div class="code-example">
          <div class="info">
            <h2>🌐 Full i18n support</h2>
            <p>
              Brisa has a built-in internationalization (i18n) support that
              allows you to <b>translate</b> your pages and <b>routing</b>,
              carrying only the translations you consume.
            </p>
            <a
              class="cta"
              href="/building-your-application/routing/internationalization"
            >
              More about i18n
            </a>
          </div>
          <div class="code">
            <RenderCode code={i18nCode} />
            <p class="bytes">+0 B (Server Components)</p>
            <p class="bytes">+800 B (Web Components)</p>
          </div>
        </div>
      </section>

      <section class="brisa-section multi-platform">
        <div class="code-example">
          <div class="info">
            <h2>📱 Multi-platform</h2>
            <p>
              Brisa allows you to build web applications that can be easily
              converted to native applications for <b>Android</b>, <b>iOS</b>,
              and <b>desktop</b>. It's full integrated with Tauri.
            </p>
            <img
              width="500"
              height="332"
              src="/images/multi-platform.avif"
              alt="Multi-platform"
              loading="lazy"
            />
          </div>
          <div class="code">
            <RenderCode code={multiPlatformCode} />
            <p class="bytes">Web or: .apk, .ipa, .exe, .dmg, .deb</p>
          </div>
        </div>
      </section>
    </main>
  );
}
