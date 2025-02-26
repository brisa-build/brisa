import type { RequestContext } from 'brisa';

export default function Page404({}, req: RequestContext) {
  return (
    <main style={{ paddingTop: '100px' }}>
      <h1>404 - Page not found</h1>
      <p>The URL {req.url} was not found on this server.</p>
    </main>
  );
}
