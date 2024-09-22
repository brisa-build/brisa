---
description: The `transpileWebComponent` API is used to transpile a web component.
---

# `transpileWebComponent`

## Reference

### `transpileWebComponent(code: string): string`

The `transpileWebComponent` function transpiles a JSX web component to be compatible with the browser.

> [!NOTE]
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
const code = `
	export default function MyComponent() { 
		return <div>Hello World</div>;
	}
`;
const transpiledCode = transpileWebComponent(code);
console.log(transpiledCode);
/*
	import {brisaElement} from "brisa/client";
			
	function MyComponent() {
		return ["div", {}, "Hello World"];
	}
			
	export default brisaElement(MyComponent);
*/
```
