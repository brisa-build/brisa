export function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void>;

export function serve({ port }: { port: number }): {
  port: number;
  hostname: string;
  server: ReturnType<typeof http.createServer>;
};
