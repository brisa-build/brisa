const nothing = (v: any) => v;

const constants = {
  IS_SERVE_PROCESS: false,
  LOG_PREFIX: {},
  CSS_FILES: [],
};

export const fileURLToPath = nothing;
export const createRequire = nothing;
export const pathToFileURL = nothing;
export const isatty = nothing;
export const join = (...args: any) => args.join('/');
export const resolve = nothing;
export const hash = nothing;
export const getConstants = () => constants;

export default { ...constants, isatty, join, resolve };
