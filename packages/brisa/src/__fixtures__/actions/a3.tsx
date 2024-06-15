export async function a3_1({ onAction2 }: any, req: any) {
  console.log("a3_1 init", req._getCurrentActionId("a3_1"));
  await onAction2?.("foo");
  console.log("a3_1 end", req._getCurrentActionId("a3_1"));
  await req._waitActionCallPromises("a3_1");
  console.log("finish a3_1", req._getCurrentActionId("a3_1"));
}

export async function a3_2({ onAction3 }: any, req: any) {
  console.log("a3_2 init", req._getCurrentActionId("a3_2"));
  await onAction3?.("foo");
  console.log("a3_2 end", req._getCurrentActionId("a3_2"));
  await req._waitActionCallPromises("a3_2");
  console.log("finish a3_2", req._getCurrentActionId("a3_2"));
}

export async function a3_3({}: any, req: any) {
  console.log("a3_3", req._getCurrentActionId("a3_3"));
  await req._waitActionCallPromises("a3_3");
  console.log("finish a3_3", req._getCurrentActionId("a3_3"));
}
