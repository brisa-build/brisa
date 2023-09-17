import dangerHTML from "../bunrise/danger-html";

const LIVE_RELOAD_WEBSOCKET_PATH = "__bunrise_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";

globalThis.ws?.send?.(LIVE_RELOAD_COMMAND);

export function LiveReloadScript({
  port,
  children,
}: {
  port: number;
  children: JSX.Element;
}) {
  const wsUrl = `ws://0.0.0.0:${port}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

  return (
    <>
      <script>
        {dangerHTML(`(new WebSocket("${wsUrl}")).onmessage = e => e.data === "${LIVE_RELOAD_COMMAND}" && location.reload();`)}
      </script>
      {children}
    </>
  );
}
