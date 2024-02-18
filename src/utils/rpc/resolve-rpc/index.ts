// import parseHTMLStream, { getNextNode } from "../parse-html-stream";
import diff from "../diff";

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  if (urlToNavigate) {
    window.location.href = urlToNavigate;
    return;
  }

  // This is temporal meanwhile the diffing algorithm is not working with streaming
  const html = await res.text();

  await diff(document, html);
}

window._rpc = resolveRPC;
