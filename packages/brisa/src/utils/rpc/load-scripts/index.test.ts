import {
  loadScripts,
  registerCurrentScripts,
  scripts,
} from "@/utils/rpc/load-scripts";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from "bun:test";

let mockLog: ReturnType<typeof spyOn>;

describe("utils", () => {
  describe("load-scripts", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
      mockLog = spyOn(console, "log");
    });
    afterEach(() => {
      mockLog.mockRestore();
      GlobalRegistrator.unregister();
      scripts.clear();
    });

    function createScript(src: string, content?: string, id = "") {
      document.head.innerHTML = content
        ? `<script id="${id}">${content}</script>`
        : `<script src=${src}></script>`;
      const script = document.createElement("script")!;
      if (src) script.src = src;
      if (id) script.id = id;
      if (content) script.innerHTML = content;
      return script;
    }

    it("should load script with 'src' attribute", async () => {
      const src = `data:text/javascript;base64,${btoa(`console.log('hello from fetch')`)}`;
      const script = createScript(src);

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(1);
      expect(scripts.has("data:text/javascript")).toBeTrue();
      expect(mockLog).toHaveBeenCalledWith("hello from fetch");
    });

    it("should load script with content without register", async () => {
      const content = "console.log('hello')";
      const script = createScript("", content);

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(0); // no src neither id
      expect(mockLog).toHaveBeenCalledWith("hello");
    });

    it("should load script with content and register with the id", async () => {
      const content = "console.log('hello')";
      const script = createScript("", content, "some-id");

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(1);
      expect(mockLog).toHaveBeenCalledWith("hello");
    });

    // This is to avoid cases navigating before wait the suspense to be resolved
    // and in the next page there is the same suspense component, it's better to
    // execute the unsuspense script always, after execute the suspense script, it's
    // removed from the DOM
    it("should register to scripts if is a unsuspense script", async () => {
      const content = "console.log('hello')";
      const script = createScript("", content, "R:1");

      await loadScripts(script);
      registerCurrentScripts();

      expect(scripts.size).toBe(0);
      expect(mockLog).toHaveBeenCalledWith("hello");
    });

    it("should execute the scripts in order", async () => {
      const append = document.head.appendChild.bind(document.head);

      // @ts-ignore
      document.head.appendChild = mock(async (script) => {
        // Await the second script to be appended
        if (script.src.endsWith("cp")) await Bun.sleep(1);
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

      expect(mockLog).toHaveBeenCalledWith("first");
      expect(mockLog).toHaveBeenCalledWith("second");
      expect(mockLog).toHaveBeenCalledWith("third");
    });
  });
});
