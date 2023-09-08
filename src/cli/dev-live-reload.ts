import { Serve, Server, ServerWebSocket } from "bun";

const LIVE_RELOAD_WEBSOCKET_PATH = "__bunrise_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";

globalThis.ws?.send?.(LIVE_RELOAD_COMMAND);

declare global {
  var ws: ServerWebSocket<unknown> | undefined;
}

export function enableLiveReload(options: {
  fetch: Server["fetch"];
  port: number;
}): Serve<unknown> {
  const { port } = options;
  const wsUrl = `ws://0.0.0.0:${port}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

  async function injectReloadScript(response: Response) {
    if (!response.headers.get("Content-Type")?.includes("text/html")) {
      return response;
    }

    const html = await response.text();
    const script = `
      <script>
        const socket = new WebSocket("${wsUrl}");
        socket.onmessage = evt => {
          if (evt.data === "${LIVE_RELOAD_COMMAND}") {
            location.reload();
          }
        }
      </script>
    `;

    return new Response(html + script, response);
  }

  return {
    development: true,
    async fetch(request: Request, server: Server) {
      if (server.upgrade(request)) {
        return;
      }

      const response = await options.fetch(request);

      return await injectReloadScript(response);
    },

    websocket: {
      open: (ws: ServerWebSocket<unknown>) => {
        globalThis.ws = ws;
      },
      message: () => {
        /* void */
      },
    },
  };
}
