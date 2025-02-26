import type { RequestContext } from '@/types';

export function GET(request: RequestContext) {
  return new Response(JSON.stringify({ hello: 'world' }), {
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: RequestContext) {
  const data = await request.json();
  return new Response(JSON.stringify(data));
}
