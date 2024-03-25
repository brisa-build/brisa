import { join } from "node:path";
import { getConstants } from "../../constants";
import type { RequestContext } from "../../types";
import getClientStoreEntries from "../get-client-store-entries";
import { deserialize } from "../serialization";
import { ENCRYPT_NONTEXT_PREFIX, ENCRYPT_PREFIX, decrypt } from "../crypto";
import { logError } from "../log/log-build";

export default async function responseAction(req: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const url = new URL(req.url);
  const action =
    req.headers.get("x-action") ?? url.searchParams.get("_aid") ?? "";
  const actionsHeaderValue = req.headers.get("x-actions") ?? "[]";
  const storeRaw = req.headers.get("x-s") ?? "[]";
  const actionFile = action.split("_").at(0);
  const actionModule = await import(join(BUILD_DIR, "actions", actionFile!));
  const contentType = req.headers.get("content-type");
  const isFormData = contentType?.includes("multipart/form-data");
  const encryptedKeys = new Set<string>();
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
    let entries = JSON.parse(decodeURIComponent(storeRaw));
    for (const [key, value] of entries) {
      try {
        let storeValue = value;

        if (
          typeof value === "string" &&
          (value.startsWith(ENCRYPT_PREFIX) ||
            value.startsWith(ENCRYPT_NONTEXT_PREFIX))
        ) {
          encryptedKeys.add(key);
          storeValue = decrypt(value);
        }

        req.store.set(key, storeValue);
      } catch (e: any) {
        logError([
          `Error transferring client "${key}" store to server store`,
          e.message,
        ]);
      }
    }
  }

  req.store.set(`__params:${action}`, params);

  const deps = actionsHeaderValue ? deserialize(actionsHeaderValue) : [];
  let props: Record<string, any> = {};

  // This part allows actions to be passed as props to enable nested actions
  // of other components. To make this possible, the HTML stores in the HTML
  // the actions id that are dependencies ordered in an array by parent
  // component, grandparent component, grand-grandparent, etc.
  for (let i = deps.length - 1; i >= 0; i -= 1) {
    props = processActions(deps[i], props);
  }

  function processActions(actions: [string, string], props = {}) {
    const nextProps: Record<string, any> = {};

    for (const [eventName, actionId] of actions) {
      nextProps[eventName] = async (...params: unknown[]) => {
        const file = actionId.split("_").at(0);
        const actionDependency =
          file === actionFile
            ? actionModule[actionId]
            : (await import(join(BUILD_DIR, "actions", file!)))[actionId];

        req.store.set(`__params:${actionId}`, params);

        return actionDependency(props, req);
      };
    }

    return nextProps;
  }

  let response = await actionModule[action](props, req);

  if (!(response instanceof Response)) response = new Response(null);

  const module = req.route ? await import(req.route.filePath) : {};
  const pageResponseHeaders =
    (await module.responseHeaders?.(req, response.status)) ?? {};

  // Transfer page response headers
  for (const [key, value] of Object.entries(pageResponseHeaders)) {
    response.headers.set(key, value);
  }

  // Transfer server store to client store
  response.headers.set(
    "X-S",
    encodeURIComponent(
      JSON.stringify(getClientStoreEntries(req, encryptedKeys)),
    ),
  );

  return response;
}
