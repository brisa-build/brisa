import CopyBox from '@/components/copy-box';

export default function Homepage() {
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
    </main>
  );
}
