export function a1_1(props: any) {
  console.log('a1_1', props);
}

export function a1_2(props: any) {
  return 'a1_2';
}

export function a1_3(props: any, req: any) {
  const [event] = req.store.get('__params:a1_3');
  event.target.reset(); // Simulate a form reset
}
