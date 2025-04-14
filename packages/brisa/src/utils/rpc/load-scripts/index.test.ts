import {
  loadScripts,
  registerCurrentScripts,
  scripts,
} from '@/utils/rpc/load-scripts';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from 'bun:test';

let mockLog: ReturnType<typeof spyOn>;

describe('utils', () => {
  describe('load-scripts', () => {
    beforeEach(() => {
      GlobalRegistrator.register();
      mockLog = spyOn(console, 'log');
    });
    afterEach(() => {
      mockLog.mockRestore();
      GlobalRegistrator.unregister();
      scripts.clear();
    });

    function createScript(
      src: string,
      content?: string,
      id = '',
      withDataRun = false,
    ) {
      let html = content
        ? `<script id="${id}">${content}</script>`
        : `<script src=${src}></script>`;

      if (withDataRun) {
        html = html.replace('<script', '<script data-run');
      }

      document.head.innerHTML = html;
      const script = document.createElement('script')!;
      if (src) script.src = src;
      if (id) script.id = id;
      if (withDataRun) script.dataset.run = '';
      if (content) script.innerHTML = content;
      return script;
    }

    it("should load script with 'src' attribute", async () => {
      const src = `data:text/javascript;base64,${btoa(`console.log('hello from fetch')`)}`;
      const script = createScript(src);

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(1);
      expect(scripts.has('data:text/javascript')).toBeTrue();
      expect(mockLog).toHaveBeenCalledWith('hello from fetch');
    });

    it('should load script with content without register', async () => {
      const content = "console.log('hello')";
      const script = createScript('', content);

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(0); // no src neither id
      expect(mockLog).toHaveBeenCalledWith('hello');
    });

    it('should load script with content and register with the id', async () => {
      const content = "console.log('hello')";
      const script = createScript('', content, 'some-id');

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(1);
      expect(mockLog).toHaveBeenCalledWith('hello');
    });

    // This is to avoid cases navigating before wait the suspense to be resolved
    // and in the next page there is the same suspense component, it's better to
    // execute the unsuspense script always, after execute the suspense script, it's
    // removed from the DOM
    it('should register to scripts if is a unsuspense script', async () => {
      const content = "console.log('hello')";
      const script = createScript('', content, 'R:1');

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(0);
      expect(mockLog).toHaveBeenCalledWith('hello');
    });

    it('should run script with data-run attribute although is registered #822', async () => {
      const src = `data:text/javascript;base64,${btoa(`console.log('foo')`)}`;
      const withDataRun = true;
      const script = createScript(src, '', 'some-id', withDataRun);

      await loadScripts(script);
      registerCurrentScripts();
      await loadScripts(script);

      expect(scripts.size).toBe(1);
      expect(mockLog).toHaveBeenCalledTimes(2);
    });

    it('should execute the scripts in order', async () => {
      const append = document.head.appendChild.bind(document.head);

      // @ts-ignore
      document.head.appendChild = mock(async (script) => {
        // Await the second script to be appended
        if (script.src.endsWith('cp')) await Bun.sleep(1);
        append(script);
      });

      const src1 = `data:text/javascript;base64,${btoa(`console.log('first')`)}`;
      const src2 = `data:text/javascript;base64,${btoa(`console.log('second')`)}`;
      const src3 = `data:text/javascript;base64,${btoa(`console.log('third')`)}`;

      const script1 = createScript(src1);
      const script2 = createScript(src2);
      const script3 = createScript(src3);

      await loadScripts(script1);
      await loadScripts(script2);
      await loadScripts(script3);
      await Bun.sleep(1);

      registerCurrentScripts();

      expect(mockLog).toHaveBeenCalledWith('first');
      expect(mockLog).toHaveBeenCalledWith('second');
      expect(mockLog).toHaveBeenCalledWith('third');
    });

    it('should execute the scripts in order between src and injected', async () => {
      const append = document.head.appendChild.bind(document.head);

      // @ts-ignore
      document.head.appendChild = mock(async (script) => {
        // Await the second script to be appended
        if (script.src.endsWith('cp')) await Bun.sleep(1);
        append(script);
      });

      const script1 = createScript(
        `data:text/javascript;base64,${btoa(`console.log('first')`)}`,
      );
      const script2 = createScript('', "console.log('second')", 'R:1');
      const script3 = createScript(
        `data:text/javascript;base64,${btoa(`console.log('third')`)}`,
      );
      const script4 = createScript(
        `data:text/javascript;base64,${btoa(`console.log('fourth')`)}`,
      );

      await loadScripts(script1);
      await loadScripts(script2);
      await loadScripts(script3);
      await loadScripts(script4);
      await Bun.sleep(1);

      registerCurrentScripts();

      expect(mockLog).toHaveBeenCalledWith('first');
      expect(mockLog).toHaveBeenCalledWith('second');
      expect(mockLog).toHaveBeenCalledWith('third');
      expect(mockLog).toHaveBeenCalledWith('fourth');
    });

    it('should copy the script with the "type" attribute', async () => {
      const content =
        "console.log(!!document.querySelector('script[type=text/javascript]'))";
      const node = createScript('', content, 'some-id');
      node.setAttribute('type', 'text/javascript');
      await loadScripts(node);
      registerCurrentScripts();
      expect(mockLog).toBeCalledTimes(1);
      expect(mockLog.mock.calls[0][0]).toBeTrue();
    });
  });
});
