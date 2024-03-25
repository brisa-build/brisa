const parser = new DOMParser();

// Temporal parser meanwhile the diffing algorithm is not working with streaming
export default function parseHTML(markup: string, rootName: string) {
  const doc = parser.parseFromString(markup, "text/html");
  return rootName === "HTML" ? doc.documentElement : doc.body.firstChild;
}
