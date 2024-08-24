import { describe, it, expect } from 'bun:test';
import { jsx } from '.';

describe('utils', () => {
  describe('jsx (createNode) SERVER', () => {
    it('should convert to object node in server-side', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' });

      expect(node).toEqual(['div', { id: 'test' }, 'Hello World']);
    });

    it('should convert a nested node to object node in server-side', () => {
      const node = jsx('div', {
        id: 'test',
        children: jsx('span', { children: 'Hello World' }) as any,
      });

      expect(node).toEqual([
        'div',
        { id: 'test' },
        ['span', {}, 'Hello World'],
      ]);
    });

    it('should append the "key" attribute to the props', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' }, 'key');

      expect(node).toEqual(['div', { id: 'test', key: 'key' }, 'Hello World']);
    });
  });
});
