import { describe, expect, it } from 'bun:test';
import brisaPandacss from '.';

describe('brisa-pandacss', () => {
  it('should return the correct name', () => {
    const integration = brisaPandacss();
    expect(integration.name).toBe('brisa-pandacss');
  });

  it('should return transpileCSS function', () => {
    const integration = brisaPandacss();
    expect(integration.transpileCSS).toBeInstanceOf(Function);
  });

  it('should return default CSS content', () => {
    const integration = brisaPandacss();
    expect(integration.defaultCSS.content).toContain(
      '@layer reset, base, tokens, recipes, utilities;',
    );
  });
});
