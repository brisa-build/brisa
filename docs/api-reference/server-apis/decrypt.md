---
description: The `encrypt` function allows you to securely send sensitive data from the client to the server
---

# `decrypt`

## Reference

### `decrypt(encryptedString: string): unknown`

The `decrypt` function allows you to securely retrieve sensitive data sent from the client to the server. It works in conjunction with the [`encrypt`](/api-reference/server-apis/encrypt) function to ensure safe handling of sensitive information.

Converts an encrypted string back into its original text or object, enabling secure client-server communication.

## Example usage:

```tsx 8
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

In this example, the [`encrypt`](/api-reference/server-apis/encrypt) function secures the data before it is stored in a `data-encrypted` attribute. The `decrypt` function is then used on the server to recover the original value.
