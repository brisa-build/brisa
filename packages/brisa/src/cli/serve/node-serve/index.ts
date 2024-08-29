import http from 'node:http';
import handler from './handler';
import constants from '@/constants';

const PORT = process.env.PORT ?? 3000;

export default async function serve({ port = PORT } = { port: PORT }) {
  console.log(
    constants.LOG_PREFIX.INFO,
    `• Runtime: Node.js ${process.version}`,
  );
  const server = await http.createServer(handler).listen(port);

  return { server, port, hostname: 'localhost' };
}
