import path from "node:path";
import { describe, it, expect, beforeAll } from "bun:test";
import compileWebComponent from ".";
import getConstants from "../../constants";
import getWebComponentsList from "../get-web-components-list";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");

describe("utils", () => {
  beforeAll(() => {
    globalThis.mockConstants = {
      ...(getConstants ?? {}),
      WEB_COMPONENTS: getWebComponentsList(fixturesDir),
    };
  });
  describe("compileWebComponent", () => {
    it("should compile a native web component", async () => {
      const result = await compileWebComponent("native-some-example");

      // TODO: Change to IIFE when Bun support it
      expect(result).toEqual(
        'function r(d){return jsxDEV("h1",{children:["Hello ",d]},void 0,!0,void 0,this)}customElements.define("native-some-example",class d extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"})}render(u="World"){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="<h2>NATIVE WEB COMPONENT "+this.getAttribute("name")+"</h2>"+u}connectedCallback(){console.log("connected",this.getAttribute("name"))}disconnectedCallback(){console.log("disconnected")}attributeChangedCallback(){this.render()}adoptedCallback(){console.log("adopted")}static get observedAttributes(){return["name"]}});export{r as HelloWorld};\n',
      );
    });
  });
});
