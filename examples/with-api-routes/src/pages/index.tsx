export default function Homepage() {
  return (
    <>
      <div className="hero">
        <h1 style={{ marginBottom: '40px' }}>
          <span className="h1_addition">Example with </span>API Routes
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <div style={{ width: '400px' }}>
            <h2 style={{ fontSize: '18px' }}>
              Web Component consuming the API:
            </h2>
            <b>Choose an animal:</b>
            <choose-animal />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <p className="edit-note">✏️ Change this page on </p>
            <code>src/pages/about/index.tsx</code>
            <p className="edit-note">✏️ Change the API on </p>
            <code>src/api/animal</code>
            <p className="edit-note">✏️ Change the Web Component on </p>
            <code>src/web-components/choose-animal.tsx</code>
          </div>
        </div>
      </div>
    </>
  );
}
