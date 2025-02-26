import { describe, it, expect, beforeEach, spyOn, afterEach } from 'bun:test';
import renderToString from '.';
import { spawnSync } from 'child_process';

let mockLog: ReturnType<typeof spyOn>;

describe('utils', () => {
  describe('renderToString', () => {
    beforeEach(() => {
      mockLog = spyOn(console, 'log');
    });
    afterEach(() => {
      mockLog.mockRestore();
    });
    // This test is to verify that is well connected to the render-to-readable-stream,
    // all the other tests are already covered in the render-to-readable-stream
    it('should render to string correctly', async () => {
      const element = <div>test</div>;
      const result = await renderToString(element);
      expect(result).toBe('<div>test</div>');

      // Verify page error logs are not logged in this case
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should render to string correctly in Node.js', async () => {
      const command = spawnSync('node', [
        '--input-type=module',
        '-e',
        `
            import { jsx } from '${import.meta.dirname}/../../../jsx-runtime/index.js';
            import { renderToString } from '${import.meta.dirname}/../../../server/index.js';  
            const element = jsx('div', { children: 'Hello, World!' });
            renderToString(element).then(console.log);
        `,
      ]);
      expect(command.error).toBeUndefined();
      expect(command.stdout.toString()).toBe('<div>Hello, World!</div>\n');
    });

    it('should render the real content without suspense by default', async () => {
      const Component = async () => <div>test</div>;
      Component.suspense = () => <div>suspense</div>;
      const result = await renderToString(<Component />);

      expect(result).toBe('<div>test</div>');
    });

    it('should render with suspense if applySuspense is true', async () => {
      const Component = async () => <div>test</div>;
      Component.suspense = () => <div>suspense</div>;
      const result = await renderToString(<Component />, {
        applySuspense: true,
      });

      expect(result).toBe(
        `<div id="S:1"><div>suspense</div></div><template id="U:1"><div>test</div></template><script id="R:1">u$('1')</script>`,
      );
    });
  });
});
