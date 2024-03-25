import * as module from "../../cli/serve/serve-options";

// TODO: It is a workaround to avoid flaky tests, since it
// does not work well to mock modules. This will not be
// needed when this Bun issue is fixed:
// https://github.com/oven-sh/bun/issues/6040
export const getServeOptions = () => module.getServeOptions();
