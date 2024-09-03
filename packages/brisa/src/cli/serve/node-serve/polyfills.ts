// This is for Node versions prior to 22.x. Right now 20.x is the LTS,
// so it's necessary to have it.
if (!Promise.withResolvers) {
  // @ts-ignore
  Promise.withResolvers = () => {
    let resolve, reject;

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  };
}
