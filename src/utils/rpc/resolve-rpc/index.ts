import parseHTMLStream from "../parse-html-stream";

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  if (urlToNavigate) {
    window.location.href = urlToNavigate;
    return;
  }

  console.log("rerender started");
  for await (const node of parseHTMLStream(res.body!.getReader())) {
    console.log({ node });
    // TODO: Implement diffing algorithm
  }
  console.log("rerender resolved");
}

window._rpc = resolveRPC;
