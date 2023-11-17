import path from "node:path";
import fs from "node:fs";
import {
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  expect,
} from "bun:test";
import compileAll from ".";
import getConstants from "../../constants";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "public");
const OUT_DIR = path.join(ROOT_DIR, "out");

describe.skip("compileAll", () => {
  beforeAll(() => {
    fs.mkdirSync(OUT_DIR);
  });

  afterAll(() => {
    fs.rmSync(OUT_DIR, { recursive: true });
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      ROOT_DIR,
      SRC_DIR: ROOT_DIR,
      ASSETS_DIR,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  // TODO: there is a bug in Bun compiling multiple-times the same entrypoints.
  // This test pass in isolation but not running the whole tests
  it("should compile everything in fixtures correctly", async () => {
    const succes = await compileAll();
    expect(succes).toEqual(true);
    expect(fs.readdirSync(OUT_DIR).toSorted()).toEqual(
      [
        "pages-client",
        "layout.js",
        "public",
        "middleware.js",
        "api",
        "pages",
        "i18n.js",
        "chunk-e209715fdb13aa54.js",
      ].toSorted()
    );
    expect(fs.readdirSync(path.join(OUT_DIR, "pages")).toSorted()).toEqual(
      [
        "somepage.js",
        "index.js",
        "user",
        "_404.js",
        "page-with-web-component.js",
      ].toSorted()
    );
    expect(fs.readdirSync(path.join(OUT_DIR, "api"))).toEqual(["example.js"]);
    expect(fs.readdirSync(path.join(OUT_DIR, "public")).toSorted()).toEqual(
      ["favicon.ico", "favicon.ico.gz", "some-dir"].toSorted()
    );
    expect(
      fs.readdirSync(path.join(OUT_DIR, "public", "some-dir")).toSorted()
    ).toEqual(
      [
        "some-text.txt.gz",
        "some-img.png.gz",
        "some-img.png",
        "some-text.txt",
      ].toSorted()
    );
  });
});
