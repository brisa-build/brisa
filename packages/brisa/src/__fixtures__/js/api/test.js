function GET() {
  return new Response(JSON.stringify({ test: 'test' }), {
    headers: { 'content-type': 'application/json' },
  });
}

module.exports = { GET, POST: GET };
