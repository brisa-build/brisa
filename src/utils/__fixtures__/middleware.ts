export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== "/test") return;

  return new Response("", {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}
