import { describe, it, expect } from 'bun:test';
import isJSXIdentifier from '.';

const VALID_JSX_IDENTIFIERS = [
  // Old versions of Bun (< 1.1.33)
  'jsx',
  'jsxDEV',
  'jsxs',

  // swc transformer
  '_jsx',
  '_jsxs',

  // New versions of Bun (>= 1.1.33) if has a hash with the same name of the identifier
  // done in this Bun PR: https://github.com/oven-sh/bun/pull/14343
  'jsxDEV_7x81h0kn',
  'jsx_w77yafs4',
  'jsxs_eh6c78nj',
];

const INVALID_JSX_IDENTIFIERS = [
  'jsxToSomething',
  'jsxDEVToSomething',
  'jsxsToSomething',
  '_jsxToSomething',
  '_jsxsToSomething',
  'toJSX',
];

describe('utils / isJSXIdentifier', () => {
  it.each(VALID_JSX_IDENTIFIERS)(
    'should return true for valid JSX identifier: %s',
    (identifier) => {
      expect(isJSXIdentifier(identifier)).toBeTrue();
    },
  );

  it.each(INVALID_JSX_IDENTIFIERS)(
    'should return false for invalid JSX identifier: %s',
    (identifier) => {
      expect(isJSXIdentifier(identifier)).toBeFalse();
    },
  );
});
