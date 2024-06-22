import { describe, it, expect, afterEach } from "bun:test";
import { $ } from "bun";
import { join } from "node:path";
import fs from "node:fs";

const CREATE_BRISA_PATH = join(import.meta.dir, "create-brisa.cjs");
const EXPECTED_INNER_FILES = [
  "bun.lockb",
  "node_modules",
  "bunfig.toml",
  "README.md",
  "package.json",
  "tsconfig.json",
  "src",
];

describe("create-brisa", () => {
  afterEach(async () => {
    await $`rm -rf out`;
  });

  it("should create brisa correctly with the name of the project as 'out'", async () => {
    const projectName = "out";
    await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;
    expect(await $`ls ${projectName}`.text()).toBe(
      EXPECTED_INNER_FILES.join("\n") + "\n",
    );
  });

  it("should exit and display an error if the folder exists", async () => {
    fs.mkdirSync("out");
    const projectName = "out/foo";
    const res = await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;

    expect(res.stderr.toString()).toBe("Error: out folder already exists\n");
  });

  it("should create brisa correctly with multi-folder with the name 'out/@foo/bar/baz'", async () => {
    const projectName = join("out", "@foo", "bar", "baz");
    await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;
    expect(await $`ls ${projectName}`.text()).toBe(
      EXPECTED_INNER_FILES.join("\n") + "\n",
    );
  });
});
