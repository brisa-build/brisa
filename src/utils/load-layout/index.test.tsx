import { describe, it, expect, afterEach } from "bun:test";
import LoadLayout from ".";
import path from "node:path";
import { BunriseRequest, renderToReadableStream } from "../../bunrise";
import streamToText from "../../__fixtures__/stream-to-text";

const join = path.join;
const testRequest = new BunriseRequest(new Request("https://test.com"));

describe("utils", () => {
  afterEach(() => { path.join = join });

  describe("LoadLayout", () => {
    it('should return default layout if "layout.tsx" does not exist', async () => {
      const stream = renderToReadableStream(
        <LoadLayout>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest,
      );
      const result = await streamToText(stream);
      expect(result).toContain("<title>Bunrise</title>");
    });

    it('should return custom layout if "layout.tsx" exists', async () => {
      path.join = () => join(import.meta.dir, "..", "..", "__fixtures__", "layout");

      const stream = renderToReadableStream(
        <LoadLayout>
          <div>Hello world</div>
        </LoadLayout>,
        testRequest,
      );
      const result = await streamToText(stream);
      expect(result).toContain("<title>CUSTOM LAYOUT</title>");
    });
  });
});
