import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import getI18nClientMessages from '.';

const I18N_CONFIG = {
  defaultLocale: 'en-US',
  locales: ['en-US', 'pt-BR'],
  messages: {
    'en-US': {
      hello: 'Hello',
      world: 'World',
      'hello-world': 'Hello {{name}}',
      'hello-world-2': 'Hello World 2',
      'hello-world-3': 'Hello World 3',
      'hello-plural': 'Hello World {{count}}',
      'hello-plural_other': 'Hello another world {{count}}',
      'hello-plural_42': 'Hello life {{count}}',
      'cart-message': {
        '0': 'The cart is empty',
        one: 'The cart has only {{count}} product',
        other: 'The cart has {{count}} products',
        '999': 'The cart is full',
      },
      nested: {
        'very-nested': {
          content: 'Very nested content',
          anotherContent: 'Another content',
        },
      },
      array: [
        {
          content: 'Array content',
        },
      ],
      // This crashed the test suit before fixing this issue:
      // https://github.com/brisa-build/brisa/issues/288
      admin: {
        providers: {
          table: {
            id: 'ID',
          },
        },
      },
    },
    'pt-BR': {
      hello: 'Olá',
      world: 'Mundo',
      'hello-world': 'Olá Mundo',
      'hello-world-2': 'Olá Mundo 2',
      'hello-world-3': 'Olá Mundo 3',
      'hello-plural': 'Olá Mundo {{count}}',
      'hello-plural_other': 'Olá outro mundo {{count}}',
      'hello-plural_42': 'Olá vida {{count}}',
      'cart-message': {
        '0': 'O carrinho está vazio',
        one: 'O carrinho tem apenas {{count}} produto',
        other: 'O carrinho tem {{count}} produtos',
        '999': 'O carrinho está cheio',
      },
      nested: {
        'very-nested': {
          content: 'Conteúdo muito aninhado',
          anotherContent: 'Outro conteúdo',
        },
      },
      array: [
        {
          content: 'Conteúdo do array',
        },
      ],
    },
    // This crashed the test suit before fixing this issue:
    // https://github.com/brisa-build/brisa/issues/288
    admin: {
      providers: {
        table: {
          id: 'ID',
        },
      },
    },
  },
};

describe('utils', () => {
  describe('getI18nClientMessages', () => {
    beforeEach(() => {
      globalThis.mockConstants = { I18N_CONFIG };
    });

    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it('should take only the consumed messages', () => {
      const i18nKeys = new Set<string>(['hello-world', 'hello-world-3']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-world': 'Hello {{name}}',
        'hello-world-3': 'Hello World 3',
      };

      expect(output).toEqual(expected);
    });

    it('should take only the consumed messages and nested messages', () => {
      const i18nKeys = new Set<string>([
        'hello-world',
        'nested.very-nested.content',
      ]);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-world': 'Hello {{name}}',
        nested: {
          'very-nested': {
            content: 'Very nested content',
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it('should take only the consumed messages and object translations', () => {
      const i18nKeys = new Set<string>(['hello-world', 'nested.very-nested']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-world': 'Hello {{name}}',
        nested: {
          'very-nested': {
            content: 'Very nested content',
            anotherContent: 'Another content',
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it('should take only the consumed messages and array translations', () => {
      const i18nKeys = new Set<string>(['hello-world', 'array']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-world': 'Hello {{name}}',
        array: [
          {
            content: 'Array content',
          },
        ],
      };

      expect(output).toEqual(expected);
    });

    it('should return the plural message when the key is "hello-plural"', () => {
      const i18nKeys = new Set<string>(['hello-plural']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-plural': 'Hello World {{count}}',
        'hello-plural_other': 'Hello another world {{count}}',
        'hello-plural_42': 'Hello life {{count}}',
      };

      expect(output).toEqual(expected);
    });

    it('should return the plural message when the key is "cart-message"', () => {
      const i18nKeys = new Set<string>(['cart-message']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'cart-message': {
          '0': 'The cart is empty',
          one: 'The cart has only {{count}} product',
          other: 'The cart has {{count}} products',
          '999': 'The cart is full',
        },
      };

      expect(output).toEqual(expected);
    });

    it('should regex work to return all the keys that start with "hello"', () => {
      const i18nKeys = new Set<RegExp>([/hello.*/]);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        hello: 'Hello',
        'hello-world': 'Hello {{name}}',
        'hello-world-2': 'Hello World 2',
        'hello-world-3': 'Hello World 3',
        'hello-plural': 'Hello World {{count}}',
        'hello-plural_other': 'Hello another world {{count}}',
        'hello-plural_42': 'Hello life {{count}}',
      };

      expect(output).toEqual(expected);
    });

    it('should return the plural message when a regex is used to match the key "hello-plural"', () => {
      const i18nKeys = new Set<RegExp>([/hello-plural/]);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        'hello-plural': 'Hello World {{count}}',
        'hello-plural_other': 'Hello another world {{count}}',
        'hello-plural_42': 'Hello life {{count}}',
      };

      expect(output).toEqual(expected);
    });

    it('should work regex with nested values as object', () => {
      const i18nKeys = new Set<RegExp>([/nested.*/]);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        nested: {
          'very-nested': {
            content: 'Very nested content',
            anotherContent: 'Another content',
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it('should work regex with nested values as string', () => {
      const i18nKeys = new Set<RegExp>([/nested.*anotherContent/]);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        nested: {
          'very-nested': {
            anotherContent: 'Another content',
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it('should work with another keySeparator', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          ...I18N_CONFIG,
          messages: {
            ...I18N_CONFIG.messages,
            'en-US': {
              hello: {
                world: 'Hello World',
              },
            },
          },
          keySeparator: '___',
        },
      };

      const i18nKeys = new Set<string>(['hello___world']);
      const output = getI18nClientMessages('en-US', i18nKeys);
      const expected = {
        hello: {
          world: 'Hello World',
        },
      };

      expect(output).toEqual(expected);
    });
  });
});
