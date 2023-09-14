export default async function middleware(request: Request) {
  if (request.url !== "/test") return;

  return new Response("", {
    status: 302,
    headers: {
      Location: "/new-url",
    },
  });
}
