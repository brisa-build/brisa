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
import { getConstants } from "../../constants";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "public");
const OUT_DIR = path.join(ROOT_DIR, "out");

describe("compileAll", () => {
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
    const { success } = await compileAll();
    expect(success).toEqual(true);
    const files = fs.readdirSync(OUT_DIR).toSorted();
    expect(files).toHaveLength(13);
    expect(files[0]).toBe("_brisa");
    expect(files[1]).toBe("actions");
    expect(files[2]).toBe("api");
    expect(files[3]).toContain("chunk-");
    expect(files[4]).toContain("chunk-");
    expect(files[5]).toBe("i18n.js");
    expect(files[6]).toBe("layout.js");
    expect(files[7]).toBe("middleware.js");
    expect(files[8]).toBe("pages");
    expect(files[9]).toBe("pages-client");
    expect(files[10]).toBe("public");
    expect(files[11]).toBe("web-components");
    expect(files[12]).toBe("websocket.js");
    expect(fs.readdirSync(path.join(OUT_DIR, "pages")).toSorted()).toEqual(
      [
        "somepage.js",
        "index.js",
        "user",
        "_404.js",
        "_500.js",
        "page-with-web-component.js",
        "somepage-with-context.js",
      ].toSorted(),
    );
    expect(fs.readdirSync(path.join(OUT_DIR, "api"))).toEqual(["example.js"]);
    expect(fs.readdirSync(path.join(OUT_DIR, "public")).toSorted()).toEqual(
      ["favicon.ico", "favicon.ico.gz", "some-dir"].toSorted(),
    );
    expect(
      fs.readdirSync(path.join(OUT_DIR, "public", "some-dir")).toSorted(),
    ).toEqual(
      [
        "some-text.txt.gz",
        "some-img.png.gz",
        "some-img.png",
        "some-text.txt",
      ].toSorted(),
    );
  });
});
