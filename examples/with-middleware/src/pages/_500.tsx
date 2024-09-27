export default function Page500({ error }: { error: Error }) {
  return (
    <main style={{ paddingTop: '100px' }}>
      <h1>500 - Server-side error occurred</h1>
      <p>{error.message}</p>
      <p>An internal server error occurred. Please try again later.</p>
    </main>
  );
}
