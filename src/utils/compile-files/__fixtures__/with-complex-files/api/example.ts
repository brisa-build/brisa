import { type RequestContext } from "@/types";

export function GET(request: RequestContext) {
  return new Response(JSON.stringify({ hello: "world" }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: RequestContext) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  return new Response(JSON.stringify({ name, email }));
}
