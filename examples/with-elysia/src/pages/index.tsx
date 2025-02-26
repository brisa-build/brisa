export default function Homepage() {
  return (
    <>
      <div className="hero">
        <h1>
          <span className="h1_addition">Elysia </span>Example
        </h1>
        <p className="edit-note">✏️ Change defining Elysia entrypoints on </p>
        <code>src/api/[[..slugs]].ts</code>
        <p className="edit-note">✏️ Change consuming Elysia entrypoint on </p>
        <code>src/web-components/consume-elysia-entrypoint.tsx</code>
      </div>

      <section className="example-section">
        <consume-elysia-entrypoint />
      </section>
    </>
  );
}
