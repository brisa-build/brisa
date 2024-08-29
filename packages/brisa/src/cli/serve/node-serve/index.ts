import http from 'node:http';
import handler from './handler';

const PORT = process.env.PORT ?? 3000;

export default async function serve({ port = PORT } = { port: PORT }) {
  const server = await http.createServer(handler).listen(port);

  return { server, port, hostname: 'localhost' };
}
