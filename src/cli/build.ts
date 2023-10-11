import compileAll from "../utils/compile-all";
import getConstants from "../constants";

const { IS_PRODUCTION, LOG_PREFIX } = getConstants();

console.log(
  LOG_PREFIX.WAIT,
  IS_PRODUCTION
    ? "🚀 building your Brisa app..."
    : "starting the development server...",
);
const start = Bun.nanoseconds();
const success = await compileAll();
const end = Bun.nanoseconds();
const ms = ((end - start) / 1e6).toFixed(2);

if (!success) process.exit(1);

if (IS_PRODUCTION) console.info(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
else console.info(LOG_PREFIX.INFO, `compiled successfully in ${ms}ms.`);
