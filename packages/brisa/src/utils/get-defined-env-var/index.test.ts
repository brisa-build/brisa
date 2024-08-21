import { describe, expect, it, afterEach } from 'bun:test';
import getDefinedEnvVar from '.';

describe('utils', () => {
  afterEach(() => {
    delete Bun.env['BRISA_PUBLIC_ENV_VAR'];
    delete Bun.env['BRISA_PUBLIC_ENV_VAR_2'];
  });
  describe('get-defined-env-var', () => {
    it('should return an object with the defined env vars', () => {
      Bun.env['BRISA_PUBLIC_ENV_VAR'] = 'value';
      Bun.env['BRISA_PUBLIC_ENV_VAR_2'] = 'value2';

      const definedEnvVar = getDefinedEnvVar();

      expect(definedEnvVar['process.env.BRISA_PUBLIC_ENV_VAR']).toBe('value');
      expect(definedEnvVar['process.env.BRISA_PUBLIC_ENV_VAR_2']).toBe(
        'value2',
      );
    });
  });
});
