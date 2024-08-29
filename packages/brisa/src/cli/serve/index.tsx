import cluster from 'node:cluster';
import { cpus } from 'node:os';
import constants from '@/constants';
import { getServeOptions } from './serve-options';
import type { ServeOptions, Server } from 'bun';
import { blueLog, boldLog } from '@/utils/log/log-color';
import { logError } from '@/utils/log/log-build';
import nodeServe from './node-serve';
import bunServe from './bun-serve';

const { LOG_PREFIX, JS_RUNTIME } = constants;
const isNode = JS_RUNTIME === 'node';

async function init(options: ServeOptions) {
  if (cluster.isPrimary && constants.CONFIG?.clustering) {
    console.log(
      LOG_PREFIX.INFO,
      `Clustering enabled with ${cpus().length} cpus`,
    );

    for (let i = 0; i < cpus().length; i++) {
      cluster.fork();
    }

    let messageDisplayed = false;

    cluster.on('message', (worker, message) => {
      if (messageDisplayed) return;
      messageDisplayed = true;
      console.log(LOG_PREFIX.INFO, message);
    });

    cluster.on('exit', (worker, code, signal) => {
      console.log(LOG_PREFIX.ERROR, `Worker ${worker.process.pid} exited`);
      console.log(LOG_PREFIX.ERROR, `Code: ${code}`);
      console.log(LOG_PREFIX.ERROR, `Signal: ${signal}`);
      console.log(LOG_PREFIX.INFO, 'Starting a new worker');
      cluster.fork();
    });

    return;
  }

  try {
    const serve = isNode
      ? nodeServe.bind(null, { port: Number(options.port) })
      : bunServe.bind(null, options);

    const { hostname, port } = await serve();
    const listeningMsg = `listening on http://${hostname}:${port}`;

    if (!constants.CONFIG?.clustering) {
      console.log(LOG_PREFIX.INFO, listeningMsg);
    }

    cluster.worker?.send(listeningMsg);
  } catch (error) {
    const { message } = error as Error;

    if (message?.includes(`Is port ${options.port} in use?`)) {
      console.log(LOG_PREFIX.ERROR, message);
      init({ ...options, port: 0 });
    } else {
      console.error(LOG_PREFIX.ERROR, message ?? 'Error on start server');
      process.exit(1);
    }
  }
}

function handleError(errorName: string) {
  return (e: Error) => {
    logError({
      messages: [
        `Oops! An ${errorName} occurred:`,
        '',
        ...e.message.split('\n').map(boldLog),
        '',
        `This happened because there might be an unexpected issue in the code or an unforeseen situation.`,
        `If the problem persists, please report this error to the Brisa team:`,
        blueLog('🔗 https://github.com/brisa-build/brisa/issues/new'),
        `Please don't worry, we are here to help.`,
        'More details about the error:',
      ],
      stack: e.stack,
    });
  };
}

process.on('unhandledRejection', handleError('Unhandled Rejection'));
process.on('uncaughtException', handleError('Uncaught Exception'));
process.on(
  'uncaughtExceptionMonitor',
  handleError('Uncaught Exception Monitor'),
);

const serveOptions = await getServeOptions();

if (!serveOptions) process.exit(1);

init(serveOptions);

declare global {
  var brisaServer: Server;
}
