import { normalizeHTML } from '@/helpers';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { describe, expect, it, afterEach, mock } from 'bun:test';

let resolveRPC: (
  res: Response,
  dataSet: DOMStringMap,
  args?: unknown[] | string,
) => Promise<void>;
const dataSet = { cid: '123' };
const decoder = new TextDecoder();

async function initBrowser() {
  GlobalRegistrator.register();
  await import('.');
  resolveRPC = window._rpc;
}

describe('utils', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    window._s = window._S = undefined;
    GlobalRegistrator.unregister();
  });

  describe('resolve-rpc', () => {
    describe('when navigate', () => {
      it('should redirect to a different page', async () => {
        const res = new Response('[]', {
          headers: {
            'X-Navigate': 'http://localhost/some-page',
          },
        });

        await initBrowser();
        await resolveRPC(res, dataSet);

        expect(location.toString()).toBe('http://localhost/some-page');
        expect(window._xm).toBeNull();
      });

      it('should redirect to a different page with reactivity', async () => {
        const res = new Response('[]', {
          headers: {
            'X-Navigate': 'http://localhost/some-page',
            'X-Mode': 'reactivity',
          },
        });

        await initBrowser();
        await resolveRPC(res, dataSet);

        expect(location.toString()).toBe('http://localhost/some-page');
        expect(window._xm).toBe('reactivity');
      });

      it('should redirect to a different page with transition', async () => {
        const res = new Response('[]', {
          headers: {
            'X-Navigate': 'http://localhost/some-page',
            'X-Mode': 'transition',
          },
        });

        await initBrowser();
        await resolveRPC(res, dataSet);

        expect(location.toString()).toBe('http://localhost/some-page');
        expect(window._xm).toBe('transition');
      });

      it('should redirect to a different page with native', async () => {
        const res = new Response('[]', {
          headers: {
            'X-Navigate': 'http://localhost/some-page',
            'X-Mode': 'native',
          },
        });

        await initBrowser();
        await resolveRPC(res, dataSet);

        expect(location.toString()).toBe('http://localhost/some-page');
        expect(window._xm).toBe('native');
      });
    });

    it('should update the store', async () => {
      const res = new Response(JSON.stringify([['foo', 'bar']]), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await initBrowser();
      // Init store
      window._s = {
        Map: new Map(),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      await resolveRPC(res, dataSet);

      expect(window._s.get('foo')).toBe('bar');
    });

    it('should update the store without initialize (no signals, only server store with transferToClient)', async () => {
      const res = new Response(JSON.stringify([['foo', 'bar']]), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let error = false;

      await initBrowser();
      await resolveRPC(res, dataSet).catch(() => {
        error = true;
      });

      expect(window._s).toBeUndefined();
      expect(window._S).toEqual([['foo', 'bar']]);
      expect(error).toBe(false);
    });

    it('should allow emojis in the transmited store', async () => {
      const res = new Response(JSON.stringify([['foo', '🚀']]), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let error = false;

      await initBrowser();
      await resolveRPC(res, dataSet).catch(() => {
        error = true;
      });

      expect(window._s).toBeUndefined();
      expect(window._S).toEqual([['foo', '🚀']]);
      expect(error).toBe(false);
    });

    describe('when receive streamed HTML', () => {
      it('should call the diff-dom-streaming library', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('<html>'));
            controller.enqueue(encoder.encode('<head />'));
            controller.enqueue(encoder.encode('<body>'));

            controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

            controller.enqueue(encoder.encode('</body>'));
            controller.enqueue(encoder.encode('</html>'));
            controller.close();
          },
        });
        const res = new Response(stream, {
          headers: { 'content-type': 'text/html' },
        });

        await initBrowser();
        document.body.innerHTML = '<div class="foo">Foo</div>';

        await resolveRPC(res, dataSet);
        expect(document.body.innerHTML).toBe('<div class="foo">Bar</div>');
      });

      it('should call the diff-dom-streaming library also for 404 pages', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('<html>'));
            controller.enqueue(encoder.encode('<head />'));
            controller.enqueue(encoder.encode('<body>'));

            controller.enqueue(encoder.encode('<div class="foo">404</div>'));

            controller.enqueue(encoder.encode('</body>'));
            controller.enqueue(encoder.encode('</html>'));
            controller.close();
          },
        });
        const res = new Response(stream, {
          headers: { 'content-type': 'text/html' },
          status: 404,
        });

        await initBrowser();
        document.body.innerHTML = '<div class="foo">Foo</div>';

        await resolveRPC(res, dataSet);
        expect(document.body.innerHTML).toBe('<div class="foo">404</div>');
      });
    });

    it('should call e.target.reset() if receive the X-Reset header', async () => {
      const formEvent = {
        target: { reset: mock(() => {}) },
      };

      const res = new Response('[]', {
        headers: {
          'X-Reset': '1',
        },
      });

      await initBrowser();
      await resolveRPC(res, dataSet, [formEvent]);

      expect(formEvent.target.reset).toHaveBeenCalled();
    });

    it('should not do transition with X-Mode header as "reactivity"', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('<html>'));
          controller.enqueue(encoder.encode('<head />'));
          controller.enqueue(encoder.encode('<body>'));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode('</body>'));
          controller.enqueue(encoder.encode('</html>'));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Mode': 'reactivity',
        },
      });

      await initBrowser();
      await resolveRPC(res, dataSet);

      expect(mockDiff).toBeCalledTimes(1);
      expect(mockDiff.mock.calls[0][2]).toEqual({
        onNextNode: expect.any(Function),
        transition: false,
        shouldIgnoreNode: expect.any(Function),
      });
    });

    it('should do transition with X-Mode header as "transition"', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('<html>'));
          controller.enqueue(encoder.encode('<head />'));
          controller.enqueue(encoder.encode('<body>'));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode('</body>'));
          controller.enqueue(encoder.encode('</html>'));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Mode': 'transition',
        },
      });

      await initBrowser();

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      expect(mockDiff).toBeCalledTimes(1);
      expect(mockDiff.mock.calls[0][2]).toEqual({
        onNextNode: expect.any(Function),
        transition: true,
        shouldIgnoreNode: expect.any(Function),
      });
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should not do transition with second param as renderMode as "reactivity"', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('<html>'));
          controller.enqueue(encoder.encode('<head />'));
          controller.enqueue(encoder.encode('<body>'));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode('</body>'));
          controller.enqueue(encoder.encode('</html>'));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
        },
      });

      await initBrowser();
      await resolveRPC(res, dataSet, 'reactivity');

      expect(mockDiff).toBeCalledTimes(1);
      expect(mockDiff.mock.calls[0][2]).toEqual({
        onNextNode: expect.any(Function),
        transition: false,
        shouldIgnoreNode: expect.any(Function),
      });
    });

    it('should not do transition without renderMode neither X-Mode header', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('<html>'));
          controller.enqueue(encoder.encode('<head />'));
          controller.enqueue(encoder.encode('<body>'));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode('</body>'));
          controller.enqueue(encoder.encode('</html>'));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
        },
      });

      await initBrowser();
      await resolveRPC(res, dataSet);

      expect(mockDiff).toBeCalledTimes(1);
      expect(mockDiff.mock.calls[0][2]).toEqual({
        onNextNode: expect.any(Function),
        transition: false,
        shouldIgnoreNode: expect.any(Function),
      });
    });

    it('should do transition with second param as renderMode as "transition"', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('<html>'));
          controller.enqueue(encoder.encode('<head />'));
          controller.enqueue(encoder.encode('<body>'));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode('</body>'));
          controller.enqueue(encoder.encode('</html>'));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
        },
      });

      await initBrowser();

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet, 'transition');

      expect(mockDiff).toBeCalledTimes(1);
      expect(mockDiff.mock.calls[0][2]).toEqual({
        onNextNode: expect.any(Function),
        transition: true,
        shouldIgnoreNode: expect.any(Function),
      });
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should NOT replace when the target does not exist, and work as the component', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Target': 'form',
          'X-Placement': 'replace',
        },
      });

      await initBrowser();

      document.body.innerHTML =
        '<section><!--o:123--><div class="foo">Foo</div><!--c:123--></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should replace an element into target with reactivity', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Placement': 'replace',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should replace an element into a target with transition', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'transition',
          'X-Type': 'component',
          'X-Placement': 'replace',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should append an element into target with reactivity', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Placement': 'append',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
              <form>
                Foo
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
                </form>
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should append an element into a target with transition', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'transition',
          'X-Type': 'component',
          'X-Placement': 'append',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <form>
                Foo
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
                </form>
              </section>
            </body>
          </html>
      `),
      );
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should prepend an element into target with reactivity', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Placement': 'prepend',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
              <form>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
                Foo
                </form>
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should prepend an element into a target with transition', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'transition',
          'X-Type': 'component',
          'X-Placement': 'prepend',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <form>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
                Foo
                </form>
              </section>
            </body>
          </html>
      `),
      );
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should after an element into target with reactivity', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Placement': 'after',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
              <form>
                Foo
              </form>
              <!--o:123-->
                <div class="foo">Bar</div>
              <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should after an element into a target with transition', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'transition',
          'X-Type': 'component',
          'X-Placement': 'after',
          'X-Target': 'form',
        },
      });

      await initBrowser();

      document.body.innerHTML = '<section><form>Foo</form></section>';

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <form>
                Foo
                </form>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
      expect(mockTransitionFinished).toBeCalled();
    });

    // TODO: Remove this .todo after this happy-DOM issue will be fixed:
    // https://github.com/capricorn86/happy-dom/issues/1637
    it.todo(
      'should before an element into target with reactivity',
      async () => {
        const mockDiff = mock((...args: any) => {});

        mock.module('diff-dom-streaming', () => ({
          default: (...args: any) => mockDiff(...args),
        }));

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
              ),
            );
            controller.close();
          },
        });
        const res = new Response(stream, {
          headers: {
            'content-type': 'text/html',
            'X-Cid': '123',
            'X-Mode': 'reactivity',
            'X-Type': 'component',
            'X-Placement': 'before',
            'X-Target': 'form',
          },
        });

        await initBrowser();

        document.body.innerHTML = '<section><form>Foo</form></section>';

        await resolveRPC(res, dataSet);

        const [, s] = mockDiff.mock.calls[0];
        const reader = s.getReader();
        let text = '';

        while (true) {
          const buffer = await reader.read();
          if (buffer.done) break;
          text += decoder.decode(buffer.value);
        }

        expect(text).toBe(
          normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
              <!--o:123-->
                <div class="foo">Bar</div>
              <!--c:123-->
              <form>
                Foo
              </form>
              </section>
            </body>
          </html>
      `),
        );
      },
    );

    // TODO: Remove this .todo after this happy-DOM issue will be fixed:
    // https://github.com/capricorn86/happy-dom/issues/1637
    it.todo(
      'should before an element into a target with transition',
      async () => {
        const mockDiff = mock((...args: any) => {});
        const mockTransitionFinished = mock(() => {});

        mock.module('diff-dom-streaming', () => ({
          default: (...args: any) => mockDiff(...args),
        }));

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
              ),
            );
            controller.close();
          },
        });
        const res = new Response(stream, {
          headers: {
            'content-type': 'text/html',
            'X-Cid': '123',
            'X-Mode': 'transition',
            'X-Type': 'component',
            'X-Placement': 'before',
            'X-Target': 'form',
          },
        });

        await initBrowser();

        document.body.innerHTML = '<section><form>Foo</form></section>';

        window.lastDiffTransition = {
          get finished() {
            mockTransitionFinished();
            return Promise.resolve();
          },
        };

        await resolveRPC(res, dataSet);

        const [, s] = mockDiff.mock.calls[0];
        const reader = s.getReader();
        let text = '';

        while (true) {
          const buffer = await reader.read();
          if (buffer.done) break;
          text += decoder.decode(buffer.value);
        }

        expect(text).toBe(
          normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
                <form>
                Foo
                </form>
              </section>
            </body>
          </html>
      `),
        );
        expect(mockTransitionFinished).toBeCalled();
      },
    );

    it('should render component with reactivity using the comments wrappers (cid)', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Target': 'component',
        },
      });

      await initBrowser();

      document.body.innerHTML =
        '<section><!--o:123--><div class="foo">Foo</div><!--c:123--></section>';

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
    });

    it('should render component with transition using the comments wrappers (cid)', async () => {
      const mockDiff = mock((...args: any) => {});
      const mockTransitionFinished = mock(() => {});

      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<!--o:123--><div class="foo">Bar</div><!--c:123-->',
            ),
          );
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'transition',
          'X-Type': 'component',
          'X-Target': 'component',
        },
      });

      await initBrowser();

      document.body.innerHTML =
        '<section><!--o:123--><div class="foo">Foo</div><!--c:123--></section>';

      window.lastDiffTransition = {
        get finished() {
          mockTransitionFinished();
          return Promise.resolve();
        },
      };

      await resolveRPC(res, dataSet);

      const [, s] = mockDiff.mock.calls[0];
      const reader = s.getReader();
      let text = '';

      while (true) {
        const buffer = await reader.read();
        if (buffer.done) break;
        text += decoder.decode(buffer.value);
      }

      expect(text).toBe(
        normalizeHTML(`
          <html>
            <head></head>
            <body>
              <section>
                <!--o:123-->
                  <div class="foo">Bar</div>
                <!--c:123-->
              </section>
            </body>
          </html>
      `),
      );
      expect(mockTransitionFinished).toBeCalled();
    });

    it('should ignore the node with id "S" and update the store with component', async () => {
      const mockDiff = mock((...args: any) => {});
      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));
      const stream = new ReadableStream();
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'component',
          'X-Target': 'component',
        },
      });

      await initBrowser();
      window._s = newStore();

      await resolveRPC(res, dataSet);

      const options = mockDiff.mock.calls[0][2];
      const nodeToIgnore = document.createElement('SCRIPT');
      nodeToIgnore.id = 'S';
      nodeToIgnore.innerHTML = '[["foo", "bar"]]';

      expect(options.shouldIgnoreNode(nodeToIgnore)).toBe(true);
      expect(window._s.get('foo')).toBe('bar');
    });

    it('should ignore the node with id "S" and update the store with an element into target', async () => {
      const mockDiff = mock((...args: any) => {});
      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));
      const stream = new ReadableStream();
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Placement': 'replace',
          'X-Target': 'form',
        },
      });

      await initBrowser();
      window._s = newStore();

      await resolveRPC(res, dataSet);

      const options = mockDiff.mock.calls[0][2];
      const nodeToIgnore = document.createElement('SCRIPT');
      nodeToIgnore.id = 'S';
      nodeToIgnore.innerHTML = '[["foo", "bar"]]';

      expect(options.shouldIgnoreNode(nodeToIgnore)).toBe(true);
      expect(window._s.get('foo')).toBe('bar');
    });

    it('should ignore the node with id "S" and update the store with page', async () => {
      const mockDiff = mock((...args: any) => {});
      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));
      const stream = new ReadableStream();
      const res = new Response(stream, {
        headers: {
          'content-type': 'text/html',
          'X-Cid': '123',
          'X-Mode': 'reactivity',
          'X-Type': 'page',
        },
      });

      await initBrowser();
      window._s = newStore();

      await resolveRPC(res, dataSet);

      const options = mockDiff.mock.calls[0][2];
      const nodeToIgnore = document.createElement('SCRIPT');
      nodeToIgnore.id = 'S';
      nodeToIgnore.innerHTML = '[["foo", "bar"]]';

      expect(options.shouldIgnoreNode(nodeToIgnore)).toBe(true);
      expect(window._s.get('foo')).toBe('bar');
    });

    it('should NOT call "shouldIgnoreNode" returning a JSON response', async () => {
      const mockDiff = mock((...args: any) => {});
      mock.module('diff-dom-streaming', () => ({
        default: (...args: any) => mockDiff(...args),
      }));
      const res = new Response('[]', {
        headers: {
          'content-type': 'application/json',
        },
      });

      await initBrowser();
      await resolveRPC(res, dataSet);

      const options = mockDiff.mock.calls[0]?.[2];
      expect(options?.shouldIgnoreNode).toBeUndefined();
    });
  });
});

function newStore() {
  const store = new Map();
  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: any) => store.set(key, value),
    delete: (key: string) => store.delete(key),
    has: (key: string) => store.has(key),
    Map: store,
  };
}
