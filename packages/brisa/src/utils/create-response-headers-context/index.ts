export default function createResponseHeadersContext(
  pageHeaders: Headers,
  responseStatus: number,
) {
  return {
    responseStatus,
    headersSnapshot: (init?: HeadersInit) => {
      const snapshot = new Headers(pageHeaders);

      if (init) {
        const headersToAppend = new Headers(init);
        for (const [key, value] of headersToAppend.entries()) {
          snapshot.append(key, value);
        }
      }

      return snapshot;
    },
  };
}
