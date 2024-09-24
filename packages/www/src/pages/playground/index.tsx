export default function Playground() {
  return (
    <main class="hero">
      <section class="home-section">
        <hgroup>
          <img
            src="/brisa.svg"
            alt="Brisa Framework logo"
            width="100"
            height="100"
          />
          <h1>Brisa Playground</h1>
        </hgroup>
      </section>
      <play-ground skipSSR />
    </main>
  );
}
