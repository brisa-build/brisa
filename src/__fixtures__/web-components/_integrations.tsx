import { join } from "node:path";

export default {
  // This is a hack to test the integration with some library
  "foo-component": join(import.meta.dir, "..", "lib", "foo"),
};
