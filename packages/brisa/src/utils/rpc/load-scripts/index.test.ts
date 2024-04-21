import {
  loadScripts,
  registerCurrentScripts,
  scripts,
} from "@/utils/rpc/load-scripts";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";

let mockLog: ReturnType<typeof spyOn>;

describe("utils", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
    mockLog = spyOn(console, "log");
  });
  afterEach(() => {
    mockLog.mockRestore();
    GlobalRegistrator.unregister();
    scripts.clear();
  });

  function createScript(src: string, content?: string) {
    document.head.innerHTML = content
      ? `<script>${content}</script>`
      : `<script src=${src}></script>`;
    registerCurrentScripts();
    const script = document.createElement("script");
    if (src) script.src = src;
    if (content) script.innerHTML = content;
    return script;
  }

  describe("load-scripts", () => {
    it("should load script with 'src' attribute", async () => {
      const src = `data:text/javascript;base64,${btoa(
        `console.log('hello from fetch')`,
      )}`;
      const script = createScript(src);
      loadScripts(script);
      expect(scripts.size).toBe(1);
      expect(scripts.has("data:text/javascript")).toBeTrue();
      expect(mockLog).toHaveBeenCalledWith("hello from fetch");
    });

    it("should load script with content", () => {
      const content = "console.log('hello')";
      const script = createScript("", content);
      expect(scripts.size).toBe(0); // no src
      loadScripts(script);
      expect(mockLog).toHaveBeenCalledWith("hello");
    });
  });
});
