import { join } from "node:path";
import { getConstants } from "@/constants";
import type { RequestContext } from "@/types";

export default async function responseAction(req: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const action = req.url.split("/").at(-1)!;
  const actionFile = action.split("_").at(0);
  const actionModule = await import(join(BUILD_DIR, "actions", actionFile!));
  const contentType = req.headers.get("content-type");
  const isFormData = contentType?.includes("multipart/form-data");
  const params = isFormData
    ? [
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: null,
          defaultPrevented: true,
          eventPhase: 0,
          formData: await req.formData(),
          returnValue: true,
          srcElement: null,
          target: {
            action: req.url,
            autocomplete: "on",
            enctype: "multipart/form-data",
            encoding: "multipart/form-data",
            method: "post",
            elements: {},
          },
          timeStamp: 0,
          type: "formdata",
        },
      ]
    : await req.json();

  req.store.set("_action_params", params);

  return actionModule[action]({}, req);
}
