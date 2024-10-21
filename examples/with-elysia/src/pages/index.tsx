export default function Homepage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">Elysia </span>Example
        </h1>
        <p class="edit-note">✏️ Change defining Elysia entrypoints on </p>
        <code>src/api/[[..slugs]].ts</code>
        <p class="edit-note">✏️ Change consuming Elysia entrypoint on </p>
        <code>src/web-components/consume-elysia-entrypoint.tsx</code>
      </div>

      <section class="example-section">
        <consume-elysia-entrypoint />
      </section>
    </>
  );
}
