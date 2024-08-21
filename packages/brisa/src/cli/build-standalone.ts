import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';
import { logError } from '@/utils/log/log-build';

export default async function buildStandalone(
  standaloneWC: string[],
  standaloneSC: string[],
) {
  const { BUILD_DIR, LOG_PREFIX } = getConstants();
  const start = Bun.nanoseconds();

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  if (!standaloneSC.length && !standaloneWC.length) {
    logError({ messages: ['No standalone components provided'] });
    process.exit(1);
  }

  console.log(LOG_PREFIX.WAIT, `🚀 building your standalone components...`);

  const end = Bun.nanoseconds();
  const ms = ((end - start) / 1e6).toFixed(2);

  console.log(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
}

if (import.meta.main) {
  const { ROOT_DIR } = getConstants();
  const standaloneWC: string[] = [];
  const standaloneSC: string[] = [];

  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === 'WC') {
      standaloneWC.push(path.resolve(ROOT_DIR, process.argv[i + 1]));
    }
    if (process.argv[i] === 'SC') {
      standaloneSC.push(path.resolve(ROOT_DIR, process.argv[i + 1]));
    }
  }

  await buildStandalone(standaloneWC, standaloneSC);
  process.exit(0);
}
