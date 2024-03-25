import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let diff: typeof import("./index").default;

describe("utils", () => {
  describe("rpc", () => {
    describe("diff", () => {
      beforeEach(async () => {
        GlobalRegistrator.register();
        diff = (await import("./index")).default;
      });
      afterEach(() => {
        GlobalRegistrator.unregister();
      });

      it("should error with invalid arguments", () => {
        expect(() => diff("hello world" as any, "something else")).toThrow(
          Error,
        );
      });

      it("should diff attributes", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update attribute.
        el2.setAttribute("a", "1");
        el2.setAttribute("b", "2");
        diff(el1, el2);

        expect(el1.getAttribute("a")).toBe("1");
        expect(el1.getAttribute("b")).toBe("2");

        // Remove attribute.
        el2.removeAttribute("a");
        diff(el1, el2);
        expect(el1.getAttribute("a")).toBeNull();
      });

      it("should diff nodeValue", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner text
        el1.appendChild(document.createTextNode("text a"));
        el1.appendChild(document.createTextNode("text b"));
        el2.appendChild(document.createTextNode("text a"));
        el2.appendChild(document.createTextNode("text c"));
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.firstChild === originalFirstChild).toBeTrue();
        expect(originalFirstChild?.nodeValue).toBe("text a");
        expect(originalFirstChild?.nextSibling?.nodeValue).toBe("text c");
      });

      it("should diff nodeType", () => {
        const parent = document.createElement("div");
        const el1 = document.createElement("div");
        const el2 = document.createTextNode("hello world");
        el1.id = "test";
        el2.id = "test";

        parent.appendChild(el1);
        diff(el1, el2);

        expect(parent?.firstChild?.nodeType).toEqual(el2.nodeType);
        expect(parent?.firstChild?.nodeValue).toEqual(el2.nodeValue);
      });

      it("should diff children", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<a href="link">hello</a><b>text</b><i>text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a><i>text1</i>';
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i>text1</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
      });

      it("should diff children with spaces", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<a href="link">hello</a> <b>text</b> <i>text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a><i>text1</i>';
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i>text1</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
      });

      it("should diff children (id)", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b>text</b><i id="test">text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a><i id="test">text1</i>';
        const originalFirstChild = el1.firstChild;
        const originalLastChild = el1.lastChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i id="test">text1</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
        expect(el1.lastChild).toEqual(originalLastChild);
      });

      it("should diff children (key) move by deleting", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b>text</b><i key="test">text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a><i key="test">text1</i>';
        const originalFirstChild = el1.firstChild;
        const originalLastChild = el1.lastChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i key="test">text1</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
        expect(el1.lastChild).toEqual(originalLastChild);
      });

      it("should diff children (key) move by shuffling", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b key="test1">text</b><i key="test2">text2</i>';
        el2.innerHTML =
          '<a href="link">hello</a><i key="test2">text2</i><b key="test1">text</b>';
        const originalSecondChild = el1.childNodes[1];
        const originalThirdChild = el1.childNodes[2];
        diff(el1, el2);

        expect(el1.innerHTML).toBe(
          '<a href="link">hello</a><i key="test2">text2</i><b key="test1">text</b>',
        );
        // Ensure that other was not discarded.
        expect(el1.childNodes[1]).toEqual(originalThirdChild);
        expect(el1.childNodes[2]).toEqual(originalSecondChild);
      });

      it("should diff children (key) remove", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b>text</b><i key="test">text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a>';
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe('<div><a href="link2">hello2</a></div>');
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
      });

      it("should diff children (key) insert new key", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<a href="link">hello</a><b>text</b>';
        el2.innerHTML = '<a href="link2">hello2</a><i key="test">text2</i>';
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i key="test">text2</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
      });

      it("should diff children (key) insert new node", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<a href="link">hello</a><i key="test">text2</i>';
        el2.innerHTML =
          '<a href="link2">hello2</a><b>test</b><i key="test">text2</i>';
        const originalFirstChild = el1.firstChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><b>test</b><i key="test">text2</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
      });

      it("should diff children (key) with xhtml namespaceURI", () => {
        const el1 = document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "div",
        );
        const el2 = document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "div",
        );

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b>text</b><i key="test">text2</i>';
        el2.innerHTML = '<a href="link2">hello2</a><i key="test">text1</i>';
        const originalFirstChild = el1.firstChild;
        const originalLastChild = el1.lastChild;
        diff(el1, el2);

        expect(el1.outerHTML).toBe(
          '<div><a href="link2">hello2</a><i key="test">text1</i></div>',
        );
        // Ensure that other was not discarded.
        expect(el1.firstChild).toEqual(originalFirstChild);
        expect(el1.lastChild).toEqual(originalLastChild);
      });

      it("should diff children (key) move (custom attribute)", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML =
          '<a href="link">hello</a><b key="test1">text</b><i key="test2">text2</i>';
        el2.innerHTML =
          '<a href="link">hello</a><i key="test2">text2</i><b key="test1">text</b>';
        const originalSecondChild = el1.childNodes[1];
        const originalThirdChild = el1.childNodes[2];
        diff(el1, el2);

        expect(el1.innerHTML).toEqual(
          '<a href="link">hello</a><i key="test2">text2</i><b key="test1">text</b>',
        );
        // Ensure that other was not discarded.
        expect(el1.childNodes[1]).toEqual(originalThirdChild);
        expect(el1.childNodes[2]).toEqual(originalSecondChild);
      });

      it("should diff children (data-checksum)", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<div class="a" data-checksum="abc">initial</div>';
        el2.innerHTML = '<div class="b" data-checksum="efg">final</div>';

        // Attempt to diff
        diff(el1, el2);
        expect(el1.innerHTML).toBe(
          '<div class="b" data-checksum="efg">final</div>',
        );
      });

      it("should diff children", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner html
        el1.innerHTML = '<div class="a">initial</div>';
        el2.innerHTML = '<div class="b">final</div>';

        // Attempt to diff
        diff(el1, el2);
        expect(el1.innerHTML).toBe('<div class="b">final</div>');
      });

      it("should automatically parse html for diff", () => {
        const el = document.createElement("div");

        diff(el, "<div><h1>hello world</h1></div>");
        expect(el.innerHTML).toBe("<h1>hello world</h1>");
      });

      it("should diff an entire document", () => {
        const doc = document.implementation.createHTMLDocument("test");

        expect(doc.body).toBeDefined();
        diff(
          doc,
          "<!DOCTYPE html><html><head></head><body>hello world</body></html>",
        );
        expect(doc.body.innerHTML).toBe("hello world");
      });

      it("should diff a document fragment", () => {
        const fragment1 = document.createDocumentFragment();
        const fragment2 = document.createDocumentFragment();

        const el1 = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner text
        el1.innerHTML = "hello world";
        el2.innerHTML = "hello world 2";

        fragment1.appendChild(el1);
        fragment2.appendChild(el2);

        diff(fragment1, fragment2);
        expect(el1?.firstChild?.nodeValue).toBe("hello world 2");
      });

      it("should call u$('1') when an script has the 'R:1' id", () => {
        window.u$ = mock(() => {});

        const el = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner text
        el.innerHTML = "<h1>hello world</h1>";
        el2.innerHTML = "<h1>hello suspense</h1><script id='R:1'></script>";

        diff(el, el2);

        expect(window.u$).toHaveBeenCalledWith("1");
      });

      it("should call u$('2') when an script has the 'R:2' id", () => {
        window.u$ = mock(() => {});

        const el = document.createElement("div");
        const el2 = document.createElement("div");

        // Update inner text
        el.innerHTML = "<h1>hello world</h1>";
        el2.innerHTML = "<h1>hello suspense</h1><script id='R:2'></script>";

        diff(el, el2);

        expect(window.u$).toHaveBeenCalledWith("2");
      });
    });
  });
});
