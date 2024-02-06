import { join } from "node:path";
import { getConstants } from "@/constants";
import type { RequestContext } from "@/types";

export default async function responseAction(req: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const action = req.url.split("/").at(-1)!;
  const actionFile = action.split("_").at(0);
  const actionModule = await import(join(BUILD_DIR, "actions", actionFile!));

  req.store.set("_action_params", await req.json());

  return actionModule[action]({}, req);
}
