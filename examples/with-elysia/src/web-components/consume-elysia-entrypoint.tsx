export default async function ConsumeElysiaEntrypoint() {
  const res = await fetch('/api/hello');
  return (
    <div>
      <h2>Response from Elysia entrypoint</h2>
      <pre>{await res.text()}</pre>
    </div>
  );
}

ConsumeElysiaEntrypoint.suspense = () => <div>Fetching to Elysia...</div>;
