import { jsx } from 'brisa/jsx-runtime';

export default function SlowStreaming() {
  return jsx('ul', {
    children: jsx(SlowList, {}),
  });
}

async function* SlowList() {
  yield jsx('li', { children: await loadItem('first ', 0) });
  yield jsx('li', { children: await loadItem('second ') });
  yield jsx('li', { children: await loadItem('third ') });
  yield jsx('li', { children: await loadItem('fourth ') });
  yield jsx('li', { children: await loadItem('fifth ') });
  yield jsx('li', { children: await loadItem('sixth') });
}

async function loadItem(value, ms = 100) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}
