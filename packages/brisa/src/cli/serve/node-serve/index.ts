import http from 'node:http';
import handler from './handler';
import constants from '@/constants';

export default async function serve(
  { port = constants.PORT } = { port: constants.PORT },
) {
  const server = await http.createServer(handler).listen(port);

  return { server, port, hostname: 'localhost' };
}