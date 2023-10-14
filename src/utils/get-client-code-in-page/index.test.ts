import path from "node:path";
import fs from "node:fs";
import { BunFile } from "bun";
import {
  Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from "bun:test";

import getClientCodeInPage from ".";
import getConstants from "../../constants";
import getWebComponentsList from "../get-web-components-list";

const src = path.join(import.meta.dir, "..", "..", "__fixtures__");
const build = path.join(src, `out-${crypto.randomUUID()}}`);
const brisaInternals = path.join(build, "_brisa");
const pages = path.join(src, "pages");
const transpiler = new Bun.Transpiler({ loader: "js" });
const allWebComponents = await getWebComponentsList(src);
let mockCompiledFile: Mock<typeof Bun.file>;

describe("utils", () => {
  beforeEach(async () => {
    fs.mkdirSync(build, { recursive: true });
    fs.mkdirSync(brisaInternals, { recursive: true });
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      SRC_DIR: src,
      BUILD_DIR: build,
    };
    mockCompiledFile = spyOn(Bun, "file").mockImplementation(
      (filepath) =>
        ({
          async text() {
            return transpiler.transform(fs.readFileSync(filepath), "tsx");
          },
        }) as BunFile,
    );
  });

  afterEach(() => {
    fs.rmSync(build, { recursive: true });
    mockCompiledFile.mockRestore();
    globalThis.mockConstants = undefined;
  });

  describe("getClientCodeInPage", () => {
    it("should not return client code in page without web components, without suspense, without server actions", async () => {
      const input = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage(input, allWebComponents);
      const expected = { code: "", size: 0 };
      expect(output).toEqual(expected);
    });

    // TODO: there is a bug in Bun compiling multiple-times the same files.
    // This test pass in isolation but not running the whole tests
    it.skip("should return client code in page with web components", async () => {
      const input = path.join(pages, "page-with-web-component.tsx");
      const output = await getClientCodeInPage(input, allWebComponents);
      const expected = {
        code: 'var h=(d)=>d.children;h.__isFragment=!0;class c extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"})}render(d="World"){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="<h2>NATIVE WEB COMPONENT "+this.getAttribute("name")+"</h2>"+d}connectedCallback(){console.log("connected",this.getAttribute("name"))}disconnectedCallback(){console.log("disconnected")}attributeChangedCallback(){this.render()}adoptedCallback(){console.log("adopted")}static get observedAttributes(){return["name"]}}customElements.define("native-some-example",c);\n',
        size: 558,
      };
      expect(output).toEqual(expected);
    });

    it("should return client code in page with suspense", async () => {
      const input = path.join(pages, "index.tsx");

      const output = await getClientCodeInPage(input, allWebComponents);
      const expected = {
        code: "l$=new Set([]);u$=(b)=>{l$.add(b);for(let v of l$){const $=document.getElementById(`S:${v}`),r=document.getElementById(`U:${v}`);if(!$||!r)continue;l$.delete(v),$.replaceWith(r.content.cloneNode(!0)),r.remove(),document.getElementById(`R:${v}`)?.remove()}};\n",
        size: 258,
      };
      expect(output).toEqual(expected);
    });
  });
});
