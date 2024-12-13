---
description: The `encrypt` function allows you to securely send sensitive data from the client to the server
---

# `encrypt`

## Reference

### `encrypt(textOrObject: unknown): string`

The `encrypt` function allows you to securely send sensitive data from the client to the server. It is typically used in conjunction with the [`decrypt`](/api-reference/server-apis/decrypt) function to safely handle data transmission.

Converts a given text or object into an encrypted string for secure client-server communication.

## Example usage:

```tsx 11
import { encrypt, decrypt } from "brisa/server";

// ...
<button
  onClick={(e: Event) => {
    // Decrypt on the server action:
    console.log(
      decrypt((e.target as HTMLButtonElement).dataset.encrypted!)
    )
  }}
  data-encrypted={encrypt("some sensible data")}
>
  Click to recover sensible data on the server
</button>
```

In this example, the `encrypt` function secures the data before it is stored in a `data-encrypted` attribute. The [`decrypt`](/api-reference/server-apis/decrypt) function is then used on the server to recover the original value.
