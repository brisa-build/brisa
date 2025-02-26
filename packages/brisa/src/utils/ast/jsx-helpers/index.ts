import { jsxDEV, jsx, jsxs } from '../constants';

const VALID_JSX_IDENTIFIERS = new Set([
  // Old versions of Bun (< 1.1.33)
  'jsx',
  'jsxDEV',
  'jsxs',

  // swc transformer
  '_jsx',
  '_jsxs',

  // New versions of Bun (>= 1.1.33) if has a hash with the same name of the identifier
  // done in this Bun PR: https://github.com/oven-sh/bun/pull/14343
  jsxDEV,
  jsx,
  jsxs,
]);

export function isJSXIdentifier(identifier: string) {
  return VALID_JSX_IDENTIFIERS.has(identifier);
}
