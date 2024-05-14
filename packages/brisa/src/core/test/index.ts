import { expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import matchers from "@/core/test/matchers";
import constants from "@/constants";
import runWebComponents from "@/core/test/run-web-components";

GlobalRegistrator.register();
expect.extend(matchers);
globalThis.REGISTERED_ACTIONS = [];
await runWebComponents(constants);

export * from "@/core/test/api";
