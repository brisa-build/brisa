export default function ListInStreaming() {
  return (
    <ul>
      <ListItems />
    </ul>
  );
}

async function* ListItems() {
  yield <li>{await loadItem(0)}</li>;
  yield <li>{await loadItem()}</li>;
  yield <li>{await loadItem()}</li>;
  yield <li>{await loadItem()}</li>;
  yield <li>{await loadItem()}</li>;
  yield <li>{await loadItem()}</li>;
}

async function loadItem(ms = 500) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return crypto.randomUUID();
}
