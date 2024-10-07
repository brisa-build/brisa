import { getBrisaPandaCSSDependencies } from './dependencies' with {
  type: 'macro',
};
import cp from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';
import getImportableFilepath from '@/utils/get-importable-filepath';
import { boldLog } from '@/utils/log/log-color';

const defaultPandaCSSConfig = `import type { Configuration } from "brisa";
import PandaCSS from 'brisa-PandaCSS';

export default {
  integrations: [PandaCSS()],
} as Configuration;

`;

export default async function integratePandaCSS() {
  const { ROOT_DIR, LOG_PREFIX } = getConstants();
  const brisaConfig = getImportableFilepath("brisa.config", ROOT_DIR);
  const dependencies = Object.entries(getBrisaPandaCSSDependencies());
  console.log(LOG_PREFIX.WAIT, "Adding PandaCSS dependencies...");
  cp.spawnSync(
    "bun",
    ["add", ...dependencies.map(([name, version]) => `${name}@${version}`)],
    {
      stdio: "inherit",
    },
  );

  console.log(LOG_PREFIX.INFO, LOG_PREFIX.TICK, "PandaCSS dependencies added!");

  cp.spawnSync("bun", ["panda", "init", "-p"]);
  cp.spawnSync("bun", ["pkg", "set", "scripts.prepare=\"panda codegen\""])

  console.log(LOG_PREFIX.INFO, LOG_PREFIX.TICK, "PandaCSS initialized!"); 

  if (!brisaConfig) {
    fs.writeFileSync(
      path.join(ROOT_DIR, "brisa.config.ts"),
      defaultPandaCSSConfig,
    );
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      "PandaCSS configuration added!",
    );
  } else {
    console.log(
      LOG_PREFIX.WARN,
      `Almost there! We detected an existing ${boldLog("brisa.config.ts")} file.`,
    );
    console.log(
      LOG_PREFIX.WARN,
      "Please add the following configuration to integrate PandaCSS:",
    );
    console.log(LOG_PREFIX.WARN);
    defaultPandaCSSConfig
      .split("\n")
      .forEach((line) => console.log(LOG_PREFIX.WARN, boldLog(line)));
  }
}

if (import.meta.main) {
  await integratePandaCSS();
  process.exit(0);
}
