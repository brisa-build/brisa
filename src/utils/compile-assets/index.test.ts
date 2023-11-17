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

const SRC_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const BUILD_DIR = path.join(SRC_DIR, "build");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");

describe("compileAssets", () => {
  beforeAll(() => {
    fs.mkdirSync(BUILD_DIR);
  });

  afterAll(() => {
    fs.rmSync(BUILD_DIR, { recursive: true });
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR,
      SRC_DIR,
      ASSETS_DIR,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should compile fixtures assets correctly", async () => {
    await compileAssets();
    expect(fs.readdirSync(BUILD_DIR)).toEqual(["public"]);
    expect(fs.readdirSync(path.join(BUILD_DIR, "public")).toSorted()).toEqual(
      ["favicon.ico", "favicon.ico.gz", "some-dir"].toSorted()
    );
    expect(
      fs.readdirSync(path.join(BUILD_DIR, "public", "some-dir")).toSorted()
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
