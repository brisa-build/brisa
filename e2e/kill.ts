import { $ } from 'bun';

console.log('🎉 Killing all bun processes...');

try {
  if (process.platform === 'win32') {
    await $`taskkill /IM bun.exe /F`.quiet();
  } else {
    await $`pkill -f bun`.quiet();
  }
} finally {
  process.exit(0);
}
