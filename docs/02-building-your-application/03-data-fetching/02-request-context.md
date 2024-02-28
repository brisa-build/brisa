TODO

## `route`

TODO

## `indicate`

`indicate(actionName: string): IndicatorSignal`

The `indicate` method is used to add it in the `indicator` HTML extended attribute. This `indicator` automatically set the `brisa-request` class while the indicated server action is pending.

```tsx
const pending = indicate('some-server-action-name');
// ...
css`
 span { display: none }
 span.brisa-request { display: inline }
`
// ...
<>
  <button onClick={someAction} indicateClick={pending}>
    Run some action
  </button>
  <span indicator={pending}>Pending...</span>
</>
```

### Parameters:

- `string` - Indicator name. It can refer to the server action. The idea is that you can use the same indicator in other components (both server and web) using the same name to relate it to the same server action.

For more details, take a look to:

- [`indicate`](/docs/building-your-application/data-fetching/web-context#indicate) in web components, similar method but from [`WebContext`](/docs/building-your-application/data-fetching/web-context).
- [`indicate[Event]`](/docs/api-reference/extended-html-attributes/indicateEvent) HTML extended attribute to use it in server components to register the server action indicator.
- [`indicator`](/docs/api-reference/extended-html-attributes/indicator) HTML extended attribute to use it in any element of server/web components.
