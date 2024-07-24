export async function a3_1({ onAction2 }: any, req: any) {
  const [withAwait] = req.store.get('__params:a3_1');
  console.log('a3_1 before calling nested action');
  withAwait ? await onAction2('foo') : onAction2('foo');
  await req._waitActionCallPromises('a3_1');
  console.log('a3_1 after calling nested action');
}

export async function a3_2({ onAction3 }: any, req: any) {
  console.log('a3_2 before calling nested action');
  onAction3('foo');
  await req._waitActionCallPromises('a3_2');
  console.log('a3_2 after calling nested action');
}

export async function a3_3({}: any, req: any) {
  console.log('processing a3_3');
  await req._waitActionCallPromises('a3_3');
}

export async function a3_4({ onAction5 }: any, req: any) {
  const [withAwait] = req.store.get('__params:a3_4');
  console.log('a3_4 is original action?', req._originalActionId === 'a3_4');
  withAwait ? await onAction5('foo') : onAction5('foo');
  await req._waitActionCallPromises('a3_4');
}

export async function a3_5({}: any, req: any) {
  console.log('a3_5 is original action?', req._originalActionId === 'a3_5');
  await req._waitActionCallPromises('a3_5');
  return new Response('a3_5');
}

export async function a3_6({ onAction7 }: any, req: any) {
  try {
    const [withAwait] = req.store.get('__params:a3_6');
    withAwait ? await onAction7('foo') : onAction7('foo');
    await req._waitActionCallPromises('a3_6');
  } catch (error) {
    return new Response(error.message);
  }
}

export async function a3_7({}: any, req: any) {
  try {
    throw new Error('a3_7 error');
  } catch (error) {
    throw error;
  }
}
