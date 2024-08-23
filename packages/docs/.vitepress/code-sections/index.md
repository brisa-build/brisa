<script>
if(typeof window !== 'undefined') {
  import('./custom-counter.js');
}
</script>

<style>
.code-section:nth-child(odd) {
    h2 {
      background-image: linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
    }

    a.nav {
        background-image: linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
    }

    a.nav:hover {
        background-image: linear-gradient(120deg, #2cebcf 60%, #2cc5e2);
    }
}

.code-section:nth-child(even)  {
    h2 {
      background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226));
    }

    a.nav {
        background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226));
    }

    a.nav:hover {
        background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226 / 0.8));
    }
}

.code-section {
  display: flex;
  position: relative;
  height: 100%;
  gap: 20px;
  flex-wrap: wrap;
  margin: 50px 0;
  font-size: 18px;

  h2 {
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
    background-clip: text;
    color: rgba(0, 0, 0, 0);
    margin-bottom: 30px;
  }

  .code:not(.start) {
    margin-top: 70px;
  }

  .start {
    display: flex;
    gap: 10px;
    justify-content: flex-start;
    align-items: center;

    a.nav {
      padding: 20px;
      margin: 0;
      box-shadow: 1px 1px 5px 0 var(--shadow-color);
    }
  }

  .code .language-tsx, .code .language-sh, .demo, .get-started{
    box-shadow: 1px 1px 5px 0 var(--shadow-color);
  }

  .code,
  .info {
    flex: 1;
    max-width: 90%;
  }

  .info {
    position: sticky;
    padding: 20px;
    margin-left: 25px;
  }
}

.code-section:first-child {
  margin-top: 0;
}

.demo {
  background-color: oklch(from var(--home-bg) l c h / 0.1);
  padding: 20px;
  border-radius: 5px;
  max-width: max-content;
}

a.nav {
  display: block;
  width: fit-content;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 20px;
  color: black !important;
  opacity: 0.8;
  text-decoration: none;
  text-wrap: nowrap;
}

a.nav:hover {
  color: #000000bb !important;
}

custom-counter {
  font-weight: bold;
}

.bytes {
  font-size: 0.8em;
  font-weight: bold;
  text-align: right;
}

@media (max-width: 922px) {
  .code-section {
    flex-direction: column;
  }

  .info {
    order: -1;
  }

  .start {
    flex-direction: column;
  }
}

@media  (max-width: 900px) {
  .code-section {
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: pre-wrap; /* Allows code to wrap within the container */
    word-wrap: break-word; /* Break long words to fit within the container */
    gap: 5px;
    flex-wrap: wrap;
    margin: 0;

    .code:not(.start) {
      margin-top: 20px;
    }

    .info,
    .code {
      margin: auto;
      padding: 5px;
    }

    .code {
      font-size: 0.9rem;
    }

    a, .demo {
      margin: 20px auto;
    }
  }
}

</style>

<div class="code-section">

<div class="info">

## 🚀 Build fast apps fast

Brisa pages are dynamically server-rendered JSX components, so there's zero JavaScript shipped to the browser by default.

Simple to write; fast to run.

</div>

<div class="code">

```tsx
// src/pages/index.tsx
export default function HomePage() {
  return <p>Server-rendered Brisa page</p>;
}
```

<p class="bytes">0 bytes</p>

</div>

</div>

<div class="code-section">

<div class="code">

```tsx
// src/pages/index.tsx
export default function HomePage() {
  return <custom-counter start={5} />;
}
```

```tsx
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

export default CustomCounter;
```

<p class="bytes">+3 KB</p>

</div>

<div class="info">

## 🏝️ Web Component island-based

In Brisa everything by default runs only on the server, except the `src/web-components` folder that also runs on the client. Web components are rendered on the server (SSR) and hydrated on the client using native Web APIs, as they are transformed into Web Components with Signals.

<div class="demo">
  <custom-counter start="5"></custom-counter>
</div>

<a class="nav" href="/building-your-application/components-details/web-components">
More about Web Components
</a>

</div>

</div>

<div class="code-section">

<div class="info">

## 📲 Browser-events on Server

Brisa mixes ideas from React's "Server Actions" and HTMX concepts. With Brisa, you can handle all browser events on the server, such as forms, click events, etc. In addition, we offer some extra HTML attributes to manage debounces, optimistic updates, etc.

The idea is that if you want you can create a SPA without Web Components, only with the weight of the Brisa RPC to make the connection with the server.

<a class="nav" href="/building-your-application/data-management/server-actions">
  More about Server Actions
</a>

</div>

<div class="code">

```tsx
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
}
```

<p class="bytes">+2 KB <small>(RPC code)</small></p>

</div>

</div>

<div class="code-section">

<div class="code">

```tsx
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
}
```

<p class="bytes">+0 B <small>(Server Components)</small><br /> +800 B <small>(Web Components)</small></p>

</div>

<div class="info">

## 🌐 Full i18n support

Brisa has a built-in internationalization (i18n) support that allows you to translate your text and routing, carrying only the translations you consume.

<a class="nav" href="/building-your-application/routing/internationalization">
 More about i18n
</a>

</div>

</div>
