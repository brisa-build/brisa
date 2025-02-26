import { describe, it, expect } from 'bun:test';
import { isJSXIdentifier } from '.';

const VALID_JSX_IDENTIFIERS = [
  'jsx',
  'jsxDEV',
  'jsxs',
  '_jsx',
  '_jsxs',
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

describe('utils / ast / jsx-helpers', () => {
  describe('isJSXIdentifier', () => {
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
});
