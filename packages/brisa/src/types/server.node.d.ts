export function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void>;

export function serve({ port }: { port: number }): void;
