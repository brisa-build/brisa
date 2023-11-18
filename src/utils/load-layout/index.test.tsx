import { describe, it, expect, afterEach } from "bun:test";
import LoadLayout from ".";
import path from "node:path";
import renderToReadableStream from "../render-to-readable-stream";
import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";
import extendRequestContext from "../extend-request-context";

const buildDir = path.join(getRootDir(), "build");
const join = path.join;
const testRequest = extendRequestContext({
  originalRequest: new Request("https://test.com"),
});

describe("utils", () => {
  afterEach(() => {
    path.join = join;
  });

  describe("LoadLayout", () => {
    it('should return default layout if "layout.tsx" does not exist', async () => {
      const layoutPath = getImportableFilepath("layout", buildDir);
      const layoutModule = layoutPath ? await import(layoutPath) : undefined;
      const stream = renderToReadableStream(
        <LoadLayout layoutModule={layoutModule}>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toContain("<title>Brisa</title>");
    });

    it('should return custom layout if "layout.tsx" exists', async () => {
      path.join = () =>
        join(import.meta.dir, "..", "..", "__fixtures__", "layout");

      const layoutPath = getImportableFilepath("layout", buildDir);
      const layoutModule = layoutPath ? await import(layoutPath) : undefined;
      const stream = renderToReadableStream(
        <LoadLayout layoutModule={layoutModule}>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toContain('<title id="title">CUSTOM LAYOUT</title>');
    });
  });
});
