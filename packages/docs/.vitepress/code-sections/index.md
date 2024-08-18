<script>
if(typeof window !== 'undefined') {
  import('./custom-counter.js');
}
</script>

<style>
.code-section:nth-child(even) h2 {
    background-image: linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
}

.code-section:nth-child(odd) h2 {
    background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226));
}

.code-section {
  display: flex;
  position: relative;
  height: 100%;
  gap: 20px;
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

  .code {
    margin-top: 70px;
  }

  .code .language-tsx, .demo{
    box-shadow: 1px 1px 5px 0 var(--shadow-color);
  }

  .code,
  .info {
    flex: 1;
  }

  .info {
    position: sticky;
    padding: 20px;
  }
}

.code-section:first-child {
  margin-top: 0;
}

.demo {
  background-color: oklch(from var(--home-bg) l c h / 0.1);
  padding: 20px;
  border-radius: 5px;
}

a.nav {
  display: block;
  width: fit-content;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 20px;
  color: black !important;
  background-image: linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
  opacity: 0.8;
  text-decoration: none;
}

a.nav:hover {
  background-image: linear-gradient(120deg, #2cebcf 60%, #2cc5e2);
  color: #000000bb !important;
}

custom-counter {
  font-weight: bold;
}

@media (max-width: 768px) {
  .code-section {
    flex-direction: column;
  }

  .info {
    order: -1;
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
  return (
    <p>Server-rendered Brisa page</p>
  );
}
```

</div>

</div>

<div class="code-section">

<div class="code">

```tsx
// src/pages/index.tsx
export default function HomePage() {
  return (
    <custom-counter start={5} />
  );
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
  )
}

export default CustomCounter;
```

</div>

<div class="info">

## 🏝️ Web Component island-based

In Brisa everything by default runs only on the server, except the `src/web-components` folder that also runs on the client. Web components are rendered on the server (SSR) and hydrated on the client using native Web APIs, as they are transformed into Web Components with Signals.

<div class="demo">
<custom-counter start="5"></custom-counter>
</div>

<a class="nav" href="/building-your-application/components-details/web-components">
Learn more about Web Components
</a>

</div>

</div>