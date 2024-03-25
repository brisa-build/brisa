/// <reference lib="dom" />

import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const filePathname = path.join(import.meta.dir, "unsuspense.ts");
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  target: "browser",
  minifyWhitespace: true,
});

const code = (await transpiler.transform(await Bun.file(filePathname).text()))
  .replaceAll("u$", "window.u$")
  .replaceAll("l$", "window.l$");

const runCode = (ids: string[]) => {
  eval(code + ids.map((id) => `u$(${id});`).join("") + "u$('0')");
};

function inlineHTML(html: string) {
  return html.replaceAll(/\n\s*/g, "");
}

describe("unsuspense window.u$", () => {
  beforeAll(() => {
    GlobalRegistrator.register();
  });
  afterAll(() => {
    GlobalRegistrator.unregister();
  });

  it("should replace pending to success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body id="test_1">
        <div id="S:1">
        Loading...
        </div>
        <template id="U:1">
        <h1>Success!</h1>
        </template>
        <script id="R:1"></script>
        <h2>Hello world!</h2>
      </body>
    `);

    await runCode(["1"]);

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body id="test_1">
        <h1>Success!</h1>
        <h2>Hello world!</h2>
      </body>
    `),
    );
  });

  it("should work with multiple pending/success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body id="test_2">
        <div id="S:1">
        Loading...
        </div>
        <template id="U:1">
        <h1>Success!</h1>
        </template>
        <script id="R:1"></script>
        <div id="S:2">
        Loading...
        </div>
        <template id="U:2">
        <h2>Success!</h2>
        </template>
        <script id="R:2"></script>
        <h3>Hello world!</h3>
      </body>
    `);

    await runCode(["1", "2"]);

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body id="test_2">
        <h1>Success!</h1>
        <h2>Success!</h2>
        <h3>Hello world!</h3>
      </body>
    `),
    );
  });

  it("should work with nested success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body id="test_3">
        <div id="S:1">
        Loading...
        </div>
        <template id="U:1">
          <div id="S:1.1">
          Loading...
          </div>
          <template id="U:1.1">
          <h1>Success!</h1>
          </template>
          <script id="R:1.1"></script>
        </template>
        <script id="R:1"></script>
        <h2>Hello world!</h2>
      </body>
    `);

    await runCode(["1", "1.1"]);

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body id="test_3">
        <h1>Success!</h1>
        <h2>Hello world!</h2>
      </body>
    `),
    );
  });

  it("should work with nested pending nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body id="test_4">
        <div id="S:1">
        Loading parent...
        </div>
        <template id="U:1">
          <div id="S:1.1">
          Loading child...
          </div>
          <template id="U:1.1">
            <h1>Success!</h1>
          </template>
          <script id="R:1.1"></script>
        </template>
        <script id="R:1"></script>
        <h2>Hello world!</h2>
      </body>
    `);

    await runCode(["1"]);

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body id="test_4">
        <div id="S:1.1">
          Loading child...
        </div>
        <template id="U:1.1">
          <h1>Success!</h1>
        </template>
        <script id="R:1.1"></script>
        <h2>Hello world!</h2>
      </body>
    `),
    );
  });
});
