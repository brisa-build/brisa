export default function Homepage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">Example with </span>External WC
        </h1>
        <p class="edit-note">✏️ Change WC integrations on </p>
        <code>src/web-components/_integrations.tsx</code>
        <section
          style={{
            borderTop: '1px solid black',
            maxWidth: '400px',
            margin: '20px auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h2 style={{ marginTop: '20px' }}>
            External <code>{'<counter-wc />'}</code>
          </h2>
          <counter-wc start={42} />
          <h2>
            External <code>{'<date-picker />'}</code>
          </h2>
          <date-picker />
        </section>
      </div>
    </>
  );
}
