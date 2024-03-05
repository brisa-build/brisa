import { join } from "node:path";
import { getConstants } from "@/constants";
import type { RequestContext } from "@/types";
import getClientStoreEntries from "../get-client-store-entries";

export default async function responseAction(req: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const action = req.headers.get("x-action")!;
  const storeRaw = req.headers.get("x-s")!;
  const actionFile = action.split("_").at(0);
  const actionModule = await import(join(BUILD_DIR, "actions", actionFile!));
  const contentType = req.headers.get("content-type");
  const isFormData = contentType?.includes("multipart/form-data");
  const target = {
    action: req.url,
    autocomplete: "on",
    enctype: "multipart/form-data",
    encoding: "multipart/form-data",
    method: "post",
    elements: {},
  };

  const params = isFormData
    ? [
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: target,
          defaultPrevented: true,
          eventPhase: 0,
          formData: await req.formData(),
          returnValue: true,
          srcElement: null,
          target,
          timeStamp: 0,
          type: "formdata",
        },
      ]
    : await req.json();

  const isWebComponentEvent =
    typeof params[0] === "object" &&
    "isTrusted" in params[0] &&
    "detail" in params[0] &&
    params[0]._wc;

  if (isWebComponentEvent) params[0] = params[0].detail;

  // Transfer client store to server store
  if (storeRaw) {
    const entries = JSON.parse(storeRaw);
    for (const [key, value] of entries) {
      req.store.set(key, value);
    }
  }

  req.store.set("_action_params", params);

  let response = await actionModule[action]({}, req);

  if (!(response instanceof Response)) response = new Response(null);

  // Transfer server store to client store
  response.headers.set("X-S", JSON.stringify(getClientStoreEntries(req)));

  return response;
}
