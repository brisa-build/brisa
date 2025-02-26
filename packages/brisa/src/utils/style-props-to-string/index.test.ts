import { describe, expect, it } from 'bun:test';
import stylePropsToString from '.';

describe('utils', () => {
  describe('stylePropsToString', () => {
    it('should convert style props to string', () => {
      const styleProps = {
        color: 'red',
        backgroundColor: 'blue',
        padding: '10px',
        margin: '10px',
        border: '1px solid black',
      };
      const output = stylePropsToString(styleProps);
      const expected = `color:red;background-color:blue;padding:10px;margin:10px;border:1px solid black;`;

      expect(output).toEqual(expected);
    });
  });
});
