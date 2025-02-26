import { it, describe, expect } from 'bun:test';
import overrideClientTranslations from './override-client-translations';

describe('utils', () => {
  describe('translate-core', () => {
    describe('override-client-translations', () => {
      it('should not override if client messages is empty', () => {
        const clientMessages = {};
        const overrideMessages = {
          a: 'aa',
          b: 'bb',
          c: 'cc',
        };
        expect(
          overrideClientTranslations(clientMessages, overrideMessages),
        ).toEqual({});
      });

      it('should only override these fields that exists in client messages', () => {
        const clientMessages = {
          a: 'a',
          b: 'b',
          c: 'c',
        };
        const overrideMessages = {
          a: 'aa',
          b: 'bb',
          c: 'cc',
          d: 'dd',
        };
        expect(
          overrideClientTranslations(clientMessages, overrideMessages),
        ).toEqual({
          a: 'aa',
          b: 'bb',
          c: 'cc',
        });
      });

      it('should override very nested fields, but only if they exists in client messages', () => {
        const clientMessages = {
          a: 'a',
          b: 'b',
          c: 'c',
          d: {
            e: 'e',
            f: 'f',
            g: {
              h: 'h',
              i: 'i',
            },
          },
        };
        const overrideMessages = {
          a: 'aa',
          b: 'bb',
          c: 'cc',
          d: {
            e: 'ee',
            f: 'ff',
            g: {
              h: 'hh',
              i: 'ii',
              j: 'jj',
            },
          },
        };
        expect(
          overrideClientTranslations(clientMessages, overrideMessages),
        ).toEqual({
          a: 'aa',
          b: 'bb',
          c: 'cc',
          d: {
            e: 'ee',
            f: 'ff',
            g: {
              h: 'hh',
              i: 'ii',
            },
          },
        });
      });
      it('should override array fields', () => {
        const clientMessages = {
          a: 'a',
          b: 'b',
          c: 'c',
          d: ['e', 'f', 'g'],
        };
        const overrideMessages = {
          a: 'aa',
          b: 'bb',
          c: 'cc',
          d: ['ee', 'ff', 'gg'],
        };
        expect(
          overrideClientTranslations(clientMessages, overrideMessages),
        ).toEqual({
          a: 'aa',
          b: 'bb',
          c: 'cc',
          d: ['ee', 'ff', 'gg'],
        });
      });

      it('should override array inside nested object fields', () => {
        const clientMessages = {
          a: 'a',
          b: 'b',
          c: 'c',
          d: {
            e: 'e',
            f: 'f',
            g: ['h', 'i'],
          },
        };
        const overrideMessages = {
          d: {
            g: ['hh', 'ii'],
          },
        };
        expect(
          overrideClientTranslations(clientMessages, overrideMessages),
        ).toEqual({
          a: 'a',
          b: 'b',
          c: 'c',
          d: {
            e: 'e',
            f: 'f',
            g: ['hh', 'ii'],
          },
        });
      });
    });
  });
});
