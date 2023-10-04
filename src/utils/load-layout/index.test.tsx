import { describe, it, expect, afterEach } from "bun:test";
import LoadLayout from ".";
import path from "node:path";
import { renderToReadableStream } from "../../core";
import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";
import extendRequestContext from "../extend-request-context";

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
      const layoutPath = getImportableFilepath("layout", getRootDir());
      const layoutModule = layoutPath ? await import(layoutPath) : undefined;
      const stream = renderToReadableStream(
        <LoadLayout layoutModule={layoutModule}>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toContain("<title>Brisa</title>");
    });

    it('should return custom layout if "layout.tsx" exists', async () => {
      path.join = () =>
        join(import.meta.dir, "..", "..", "__fixtures__", "layout");

      const layoutPath = getImportableFilepath("layout", getRootDir());
      const layoutModule = layoutPath ? await import(layoutPath) : undefined;
      const stream = renderToReadableStream(
        <LoadLayout layoutModule={layoutModule}>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toContain("<title>CUSTOM LAYOUT</title>");
    });
  });
});
