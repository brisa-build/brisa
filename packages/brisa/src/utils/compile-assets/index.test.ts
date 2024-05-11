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
import { getConstants } from "@/constants";

const SRC_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const BUILD_DIR = path.join(SRC_DIR, "build");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");
const CLIENT_PAGES = path.join(BUILD_DIR, "pages-client");

describe("compileAssets", () => {
  beforeEach(() => {
    fs.mkdirSync(BUILD_DIR);
    fs.mkdirSync(CLIENT_PAGES);
    fs.writeFileSync(path.join(CLIENT_PAGES, "index.js"), "");
  });

  afterEach(() => {
    fs.rmSync(BUILD_DIR, { recursive: true });
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR,
      SRC_DIR,
      ASSETS_DIR,
      IS_PRODUCTION: true,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should compile fixtures assets correctly", async () => {
    await compileAssets();
    expect(fs.readdirSync(BUILD_DIR).toSorted()).toEqual(
      ["public", "pages-client"].toSorted(),
    );
    expect(fs.readdirSync(path.join(BUILD_DIR, "public")).toSorted()).toEqual(
      [
        "favicon.ico",
        "favicon.ico.br",
        "favicon.ico.gz",
        "some-dir",
      ].toSorted(),
    );
    expect(
      fs.readdirSync(path.join(BUILD_DIR, "public", "some-dir")).toSorted(),
    ).toEqual(
      [
        "some-text.txt.br",
        "some-img.png.br",
        "some-text.txt.gz",
        "some-img.png.gz",
        "some-img.png",
        "some-text.txt",
      ].toSorted(),
    );
  });

  it("should not compress fixtures assets in development", async () => {
    globalThis.mockConstants!.IS_PRODUCTION = false;
    await compileAssets();
    expect(fs.readdirSync(path.join(BUILD_DIR, "public")).toSorted()).toEqual(
      ["favicon.ico", "some-dir"].toSorted(),
    );
  });
});
