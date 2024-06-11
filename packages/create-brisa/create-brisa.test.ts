import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { $ } from "bun";
import { join } from "node:path";

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
    await $`echo "${projectName}" | bun run ${join(
      import.meta.dir,
      "create-brisa.cjs",
    )}`;
    expect(await $`ls ${projectName}`.text()).toBe(
      EXPECTED_INNER_FILES.join("\n") + "\n",
    );
  });

  it("should create brisa correctly with multi-folder with the name 'out/@foo/bar/baz'", async () => {
    const projectName = "out/@foo/bar/baz";
    await $`echo "${projectName}" | bun run ${join(
      import.meta.dir,
      "create-brisa.cjs",
    )}`;
    expect(await $`ls ${projectName}`.text()).toBe(
      EXPECTED_INNER_FILES.join("\n") + "\n",
    );
  });
});
