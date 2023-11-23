import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import fs from "node:fs";
import path from "node:path";
import compileAll from ".";
import getConstants from "../../constants";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "public");
const OUT_DIR = path.join(ROOT_DIR, "out");

describe.skip("compileAll", () => {
  beforeAll(() => {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
  });

  afterAll(() => {
    fs.rmSync(OUT_DIR, { recursive: true });
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR: OUT_DIR,
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
    const files = fs.readdirSync(OUT_DIR).toSorted();
    expect(files).toHaveLength(10);
    expect(files[0]).toBe('_brisa');
    expect(files[1]).toBe('api');
    expect(files[2]).toContain('chunk-');
    expect(files[3]).toBe('i18n.js');
    expect(files[4]).toBe('layout.js');
    expect(files[5]).toBe('middleware.js');
    expect(files[6]).toBe('pages');
    expect(files[7]).toBe('pages-client');
    expect(files[8]).toBe('public');
    expect(files[9]).toBe('websocket.js');
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
