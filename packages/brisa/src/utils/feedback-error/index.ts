import type { RequestContext } from "@/types";
import { logError } from "../log/log-build";

export default function feedbackError(error: Error, req?: RequestContext) {
  if (error.name === "ERR_DLOPEN_FAILED") {
    logError({
      messages: [
        "ERR_DLOPEN_FAILED",
        "",
        "If you use FFI you must create a prebuild folder with the compiled files in there.",
        "All these prebuild files will be accessible from the build itself (build/prebuild).",
        "",
        "Example:",
        "",
        `path.join(Bun.env.BRISA_BUILD_FOLDER, 'prebuild', \`libadd.\${suffix}\`)`,
        "",
        "Docs:",
        "",
        "https://brisa.build/building-your-application/configuring/zig-rust-c-files",
        "",
      ],
      req,
    });
    return;
  }

  logError({ messages: [error.stack?.toString?.() ?? error.message, ""], req });
}
