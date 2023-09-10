/// <reference lib="dom" />

import path from "node:path";
import { describe, it, expect } from "bun:test";

const filePathname = path.join(import.meta.dir, "index.ts");
const fileToTest = Bun.file(filePathname);
const transpiler = new Bun.Transpiler({
  loader: "tsx",
  target: "browser",
  minifyWhitespace: true,
});
const code = await transpiler.transform(await fileToTest.text());
const runCode = () => eval(code);

function inlineHTML(html: string) {
  return html.replaceAll(/\n\s*/g, "");
}

describe("replacePendingToSuccessNodes", () => {
  it("should replace pending to success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body>
        <div id="P:1">
        Loading...
        </div>
        <div hidden id="S:1">
        <h1>Success!</h1>
        </div>
        <h2>Hello world!</h2>
      </body>
    `);

    await runCode();

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body>
        <h1>Success!</h1>
        <h2>Hello world!</h2>
      </body>
    `),
    );
  });

  it("should work with multiple pending/success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body>
        <div id="P:1">
        Loading...
        </div>
        <div hidden id="S:1">
        <h1>Success!</h1>
        </div>
        <div id="P:2">
        Loading...
        </div>
        <div hidden id="S:2">
        <h2>Success!</h2>
        </div>
        <h3>Hello world!</h3>
      </body>
    `);

    await runCode();

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body>
        <h1>Success!</h1>
        <h2>Success!</h2>
        <h3>Hello world!</h3>
      </body>
    `),
    );
  });

  it("should work with nested pending/success nodes", async () => {
    document.body.innerHTML = inlineHTML(`
      <body>
        <div id="P:1">
        Loading...
        </div>
        <div hidden id="S:1">
          <div id="P:1.1">
          Loading...
          </div>
          <div hidden id="S:1.1">
          <h1>Success!</h1>
          </div>
        </div>
        <h2>Hello world!</h2>
      </body>
    `);

    await runCode();

    expect(document.body.innerHTML).toEqual(
      inlineHTML(`
      <body>
        <h1>Success!</h1>
        <h2>Hello world!</h2>
      </body>
    `),
    );
  });
});
