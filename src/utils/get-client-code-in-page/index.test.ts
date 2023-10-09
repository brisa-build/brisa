import path from "node:path";
import fs from "node:fs";
import {
  describe,
  it,
  expect,
  spyOn,
  beforeEach,
  Mock,
  afterEach,
} from "bun:test";
import getClientCodeInPage from ".";
import { BunFile } from "bun";
import getConstants from "../../constants";

const src = path.join(import.meta.dir, "..", "..", "__fixtures__");
const pages = path.join(src, "pages");
const transpiler = new Bun.Transpiler({ loader: "js" });

let mockCompiledFile: Mock<typeof Bun.file>;

describe("utils", () => {
  beforeEach(() => {
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
    mockCompiledFile.mockRestore();
    globalThis.mockConstants = undefined;
  });

  describe("getClientCodeInPage", () => {
    it("should not return client code in page without web components, without suspense, without server actions", async () => {
      const input = path.join(pages, "somepage.tsx");

      const output = await getClientCodeInPage(input);
      const expected = { code: "", size: 0 };
      expect(output).toEqual(expected);
    });

    it("should return client code in page with web components", async () => {
      const input = path.join(pages, "page-with-web-component.tsx");

      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        SRC_DIR: src,
      };

      const output = await getClientCodeInPage(input);
      const expected = {
        code: 'function r(d){return jsxDEV("h1",{children:["Hello ",d]},void 0,!0,void 0,this)}customElements.define("native-some-example",class d extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"})}render(u="World"){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="<h2>NATIVE WEB COMPONENT "+this.getAttribute("name")+"</h2>"+u}connectedCallback(){console.log("connected",this.getAttribute("name"))}disconnectedCallback(){console.log("disconnected")}attributeChangedCallback(){this.render()}adoptedCallback(){console.log("adopted")}static get observedAttributes(){return["name"]}});export{r as HelloWorld};\n',
        size: 621,
      };
      expect(output).toEqual(expected);
    });

    it("should return client code in page with suspense", async () => {
      const input = path.join(pages, "index.tsx");

      const output = await getClientCodeInPage(input);
      const expected = {
        code: "l$=new Set([]);u$=(b)=>{l$.add(b);for(let v of l$){const $=document.getElementById(`S:${v}`),r=document.getElementById(`U:${v}`);if(!$||!r)continue;l$.delete(v),$.replaceWith(r.content.cloneNode(!0)),r.remove(),document.getElementById(`R:${v}`)?.remove()}};\n",
        size: 258,
      };
      expect(output).toEqual(expected);
    });
  });
});
