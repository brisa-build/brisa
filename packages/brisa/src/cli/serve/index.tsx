import cluster from 'node:cluster';
import { cpus } from 'node:os';
import constants from '@/constants';
import { getServeOptions } from './serve-options';
import type { ServeOptions, Server } from 'bun';
import { blueLog, boldLog } from '@/utils/log/log-color';
import { logError } from '@/utils/log/log-build';
import nodeServe from './node-serve';
import handler from './node-serve/handler';
import bunServe from './bun-serve';
import { runtimeVersion } from '@/utils/js-runtime-util';
import denoServe from './deno-serve';

const { LOG_PREFIX, JS_RUNTIME, VERSION, IS_PRODUCTION } = constants;

function getServe(options: ServeOptions) {
  if (JS_RUNTIME === 'node') {
    return nodeServe.bind(null, { port: Number(options.port) });
  }

  if (JS_RUNTIME === 'deno') {
    return denoServe.bind(null, options);
  }

  return bunServe.bind(null, options);
}

async function init(options: ServeOptions) {
  if (cluster.isPrimary && constants.CONFIG?.clustering) {
    console.log(
      LOG_PREFIX.INFO,
      `Clustering enabled with ${cpus().length} cpus`,
    );

    for (let i = 0; i < cpus().length; i++) {
      cluster.fork();
    }

    let workerId: number;

    cluster.on('message', (worker, message) => {
      if (workerId && worker.id !== workerId) return;
      workerId = worker.id;
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
    const serve = getServe(options);
    const { hostname, port } = await serve();
    const runtimeMsg = `🚀 Brisa ${VERSION}: Runtime on ${runtimeVersion(JS_RUNTIME)}`;
    const listeningMsg = `listening on http://${hostname}:${port}`;
    const log =
      constants.CONFIG?.clustering && cluster.worker
        ? cluster.worker.send.bind(cluster.worker)
        : console.log.bind(console, LOG_PREFIX.INFO);

    // In DEV this log is the first line on build (dev = build + serve)
    if (IS_PRODUCTION) log(runtimeMsg);
    log(listeningMsg);
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

const serveOptions = await getServeOptions().catch((e) => {
  console.log(LOG_PREFIX.ERROR, e.message);
});

if (!serveOptions) process.exit(1);

if (!process.env.USE_HANDLER) {
  init(serveOptions as ServeOptions);
}

// This is necesary for some adapters after build this
// file inside the build folder
export default handler;

declare global {
  var brisaServer: Server;
}
