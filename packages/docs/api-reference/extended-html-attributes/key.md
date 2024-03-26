---
description: Use `key` attribute to add the `brisa-request` class to the element only during the action time
---

# key

## Reference

### `key={string}`

The `key` is a special `string` attribute you need to include when creating lists of elements. Keys help Brisa identify which items have changed, are added, or are removed. Keys should be given to the elements inside the array to give the elements a stable identity:

```tsx 3
const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((number) => (
  <li key={number.toString()}>{number}</li>
));
```

The best way to pick a key is to use a string that uniquely identifies a list item among its siblings. Most often you would use IDs from your data as keys:

```tsx 2
const todoItems = todos.map((todo) => <li key={todo.id}>{todo.text}</li>);
```

When you don’t have stable IDs for rendered items, you may use the item index as a key as a last resort.

> [!WARNING]
>
> We don’t recommend using indexes for keys if the order of items may change. This can negatively impact performance and may cause issues with component state.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
