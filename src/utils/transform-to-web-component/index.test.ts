import path from "node:path";
import { describe, it, expect, beforeAll } from "bun:test";
import transformToWebComponent from ".";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");

describe("utils", () => {
  describe("compileWebComponent", () => {
    it("should compile a native web component", async () => {
      globalThis.mockConstants = {
        SRC_DIR: fixturesDir,
      };
      const result = await transformToWebComponent(
        "native-some-example",
        path.join(fixturesDir, "web-components", "@native", "some-example.tsx"),
      );

      // TODO: Change to IIFE when Bun support it
      expect(result).toBeDefined();
      expect(result?.size).toEqual(621);
      expect(result?.code).toEqual(
        'function r(d){return jsxDEV("h1",{children:["Hello ",d]},void 0,!0,void 0,this)}customElements.define("native-some-example",class d extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"})}render(u="World"){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="<h2>NATIVE WEB COMPONENT "+this.getAttribute("name")+"</h2>"+u}connectedCallback(){console.log("connected",this.getAttribute("name"))}disconnectedCallback(){console.log("disconnected")}attributeChangedCallback(){this.render()}adoptedCallback(){console.log("adopted")}static get observedAttributes(){return["name"]}});export{r as HelloWorld};\n',
      );
    });
  });
});
