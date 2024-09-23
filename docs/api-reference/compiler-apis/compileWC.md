---
description: The `compileWC` API is used to transpile a web component.
---

# `compileWC`

## Reference

### `compileWC(code: string): string`

The `compileWC` function transpiles a JSX web component to be compatible with the browser.

> [!WARNING]
>
> It is very likely that in your **day to day** with Brisa you will **not need to use this function**, but if you need to do something more advanced, such as a Bundler plugin, or a Playground, this function can be useful.

> [!IMPORTANT]
>
> The Web Component is expected to be defined in the same way as it is defined inside `src/web-components`, that is, with an `export default`.

#### Parameters

- `code`: The code of the web component.

#### Returns

- The transpiled code of the web component. 

## Example

```tsx
import { compileWC } from "brisa/compiler";

const code = `
	export default function MyComponent() { 
		return <div>Hello World</div>;
	}
`;
const finalCode = compileWC(code);
console.log(finalCode);
/*
	import {brisaElement} from "brisa/client";
			
	function MyComponent() {
		return ["div", {}, "Hello World"];
	}
			
	export default brisaElement(MyComponent);
*/
```

## Outside Bun.js

This function is intended to be used within the [Bun](https://bun.sh/) runtime, as it uses the [Bun transpiler](https://bun.sh/docs/api/transpiler) to convert TSX to JS. However, if you want to use it in other environments, such as Node.js or in the browser, you can do so, but you will need to transpile the TSX to JS beforehand, for example with [`@swc/wasm-web`](https://swc.rs/docs/usage/wasm).

> [!IMPORTANT]
>
> [`Bun.Transpiler`](https://bun.sh/docs/api/transpiler) is not applied when the environment is not Bun.js, so you will need to transpile the code before using `compileWC` to convert it to `js`.

### Example with `@swc/wasm-web`

```tsx
import { compileWC } from "brisa/compiler";
import initSwc, { transformSync } from "@swc/wasm-web";

async function main() {
	await initSwc();
	const code = `
		export default function MyComponent() { 
			return <div>Hello World</div>;
		}
	`;
	const transpiledCode = transformSync(code, {
		jsc: {
			parser: {
				syntax: "typescript",
				tsx: true,
			},
		},
	});
	const finalCode = compileWC(transpiledCode.code);
	console.log(finalCode);
}
```
