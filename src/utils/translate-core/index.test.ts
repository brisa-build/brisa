import { describe, expect, it, afterAll } from 'bun:test'
import translateCore from '.'

const nsNestedKeys = {
  key_1: {
    key_1_nested: 'message 1 nested',
    key_2_nested: 'message 2 nested',
  },
  key_2: 'message 2',
}

const nsRootKeys = {
  root_key_1: 'root message 1',
  root_key_2: 'root message 2',
}

const nsInterpolate = {
  key_1: {
    key_1_nested: 'message 1 {{count}}',
    key_2_nested: 'message 2 {{count}}',
  },
  key_2: 'message 2',
}

const nsWithEmpty = {
  emptyKey: '',
}

function mockDir(dir) {
  globalThis.mockConstants = {
    I18N_CONFIG: {
      locales: ['en', 'ru'],
      defaultLocale: 'en',
      messages: {
        en: dir,
      },
    },
  }
}

describe('utils', () => {
  afterAll(() => {
    globalThis.mockConstants = undefined
  })

  describe('translateCore', () => {
    it('should translate a key interpoleting correctly', async () => {
      mockDir({ hello_world: 'Hello {{name}}' })
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('hello_world', { name: 'Test' })).toBe('Hello Test')
    });

    it('should translate a nested key interpoleting correctly', async () => {
      mockDir({
        hello_world: {
          hello_world_nested: 'Hello {{name}}',
        },
      })

      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('hello_world.hello_world_nested', { name: 'Test' })).toBe('Hello Test')
    });

    it('should return an object of root keys', async () => {
      mockDir(nsRootKeys)
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('.', null, { returnObjects: true })).toEqual(nsRootKeys)
    })

    it('should return an object of nested keys', async () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: nsNestedKeys,
          }
        },
      }
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('key_1', null, { returnObjects: true })).toEqual(
        nsNestedKeys.key_1
      )
      expect(t('key_2', null, { returnObjects: true })).toEqual(
        nsNestedKeys.key_2
      )
    })

    it('should return an object of nested keys and interpolate correctly', async () => {
      mockDir(nsInterpolate)
      const t = translateCore('en')
      const count = 999
      const expected = {
        key_1: {
          key_1_nested: `message 1 ${count}`,
          key_2_nested: `message 2 ${count}`,
        },
        key_2: 'message 2',
      }

      expect(typeof t).toBe('function')
      expect(t('.', { count }, { returnObjects: true })).toEqual(
        expected
      )
    })

    it('should return empty string when allowEmptyStrings is passed as true', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: nsWithEmpty,
          },
          allowEmptyStrings: true,
        },
      }
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('emptyKey')).toBe('')
    })

    it('should return empty string when allowEmptyStrings is omitted', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: nsWithEmpty,
          },
        },
      }
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('emptyKey')).toBe('')
    })

    it('should return the key name when allowEmptyStrings is omit passed as false.', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: nsWithEmpty,
          },
          allowEmptyStrings: false,
        },
      }
      const t = translateCore('en')

      expect(typeof t).toBe('function')
      expect(t('emptyKey')).toBe('emptyKey')
    })

    it('should work with different interpolation preffix and suffix', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: {
              key_1: 'hello [[name]]',
            },
          },
          interpolation: {
            prefix: '[[',
            suffix: ']]',
          }
        },
      }
      const t = translateCore('en')
      expect(t('key_1', { name: 'test' })).toBe('hello test')
    })

    it('should work with format', () => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          messages: {
            en: {
              key_1: 'hello {{name, uppercase}}',
            },
          },
          interpolation: {
            format: (value, format) => {
              if (format === 'uppercase') {
                return value.toUpperCase()
              }
              return value
            }
          }
        },
      }
      const t = translateCore('en')
      expect(t('key_1', { name: 'test' })).toBe('hello TEST')
    })
  })
})
