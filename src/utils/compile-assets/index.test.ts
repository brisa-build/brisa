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
import compileAssets from ".";
import getConstants from "../../constants";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");
const OUT_DIR = path.join(BUILD_DIR, "out");

describe("compileAssets", () => {
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
      BUILD_DIR,
      SRC_DIR: BUILD_DIR,
      ASSETS_DIR,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should compile fixtures assets correctly", async () => {
    await compileAssets(OUT_DIR);
    expect(fs.readdirSync(OUT_DIR)).toEqual(["public"]);
    expect(fs.readdirSync(path.join(OUT_DIR, "public"))).toEqual([
      "favicon.ico",
      "favicon.ico.gz",
      "some-dir",
    ]);
    expect(fs.readdirSync(path.join(OUT_DIR, "public", "some-dir"))).toEqual([
      "some-text.txt.gz",
      "some-img.png.gz",
      "some-img.png",
      "some-text.txt",
    ]);
  });
});
