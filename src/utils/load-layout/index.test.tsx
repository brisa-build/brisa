import { describe, it, expect, afterEach } from "bun:test";
import LoadLayout from ".";
import path from "node:path";
import { RequestContext, renderToReadableStream } from "../../brisa";
import streamToText from "../../__fixtures__/stream-to-text";
import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";

const join = path.join;
const testRequest = new RequestContext(new Request("https://test.com"));

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
      const result = await streamToText(stream);
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
      const result = await streamToText(stream);
      expect(result).toContain("<title>CUSTOM LAYOUT</title>");
    });
  });
});
