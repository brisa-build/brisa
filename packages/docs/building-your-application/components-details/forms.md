---
description: How to use forms in Brisa
---

# Forms

Forms play a crucial role in user interaction. When dealing with forms, developers often come across the concepts of controlled and uncontrolled components.

## Uncontrolled Forms _(recommended 👌)_

### Server Component _(recommended 👌)_

An uncontrolled form is a `form` where the values are not bound to the component's state, allowing for a more straightforward and less verbose approach. Uncontrolled forms are useful in scenarios where the form is relatively simple, and the overhead of managing form state through the component is unnecessary.

Uncontrolled forms can be created in both **web components** and **server components**. The [browser events](https://developer.mozilla.org/en-US/docs/Web/Events) in Brisa can be handled in the server.

In fact, we recommend that if you use uncontrolled forms, use a server component. This way:

- You make the app lighter, less JS code to the client.
- You can handle directly the form on the server.

```tsx
export default function UncontrolledFormServer() {
  return (
    <form
      onSubmit={(e) => {
        // This code runs on the server in server components!
        console.log("Username:", e.formData.get("username"));
      }}
    >
      <label>
        Username:
        <input type="text" name="username" />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

> [!IMPORTANT]
>
> The `onSubmit` on the server works like the [submit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) event _(triggered by the client)_ merged with the [formdata](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event) event _(is fired after the `FormData` invocation)_.

The difference with the client `onSubmit` are:

- The `e.preventDefault()` is always done automatically in the server actions.
- The [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) is built to send and process it from the server, modifying the event from [`onSubmitEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) to [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event).
- Since the event is [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event), you can access the form data directly through `e.formData`.
- `e.target.reset()` and `e.currentTarget.reset()` instead of being executed right away, they are executed when the server action ends.

In fact, it is now even **easier to deal** with **form server interactions** from the **server** than with the client.

### Reset form

Using the events from the server makes the event serialized. However, `e.target.reset()` still works in the server. The only difference is that it is not executed at the right time, but is marked to reset it when the server action is finished and returns the response to the client.

```tsx
export default function UncontrolledFormServer() {
  return (
    <form
      onSubmit={(e) => {
        // This code runs on the server
        e.target.reset(); // Reset the form
        console.log("Username:", e.formData.get("username"));
      }}
    >
      <label>
        Username:
        <input type="text" name="username" />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Web component _(not recomended 👎)_

The client code of a uncontrolled form would be as follows:

```tsx
export default function UncontrolledFormClient() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        console.log("Username:", formData.get("username"));
      }}
    >
      <label>
        Username:
        <input type="text" name="username" />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

If you are making an uncontrolled form in a web component it is a sign that you are writing code on the client that could be written on the server.

> [!IMPORTANT]
>
> Use only uncontrolled form in web components only if you don't need to make a request to the server after the submit. Otherwise use a server component.

> [!CAUTION]
>
> Using uncontrolled form in web components adds client JS code, not only the event JS, but also the JS of the web component itself.

## Controlled Forms _(not recomended 👎)_

A controlled form in Brisa is a `form` whose state is controlled by the Brisa web component. In other words, the form elements such as `input` fields, `checkbox`, `radio` buttons, etc have their values bound to the component's state. This allows to manage and control the form's behavior and be able to give **instant feedback** to the user about errors.

Despite the benefits of controlled forms, it's important to note that Brisa **doesn't necessarily recommend** their use in all scenarios. The decision to opt for controlled or uncontrolled forms should be driven by specific requirements and architectural considerations. In certain cases, controlled forms may introduce unnecessary complexity, especially when dealing with large forms or integrating with external libraries. Developers should carefully assess the trade-offs and choose the approach that aligns best with their application's needs.

```tsx
import { type WebContext } from "brisa";

export default function ControlledFormExample({}, { state }: WebContext) {
  const username = state<string>("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log("Username:", username.value);
      }}
    >
      <label>
        Username:
        <input
          type="text"
          name="username"
          value={username.value}
          onInput={(e) => {
            username.value = e.currentTarget.value;
          }}
        />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

If you want to use controlled forms, we recommend that you use it in the web components and not in the server components. If you want to manage the `onSubmit` for the server, you can manage it through a `prop` and the parent server component capture and handle the event.

```tsx
import { type WebContext } from "brisa";

// Web component:
export default function ControlledFormExample(
  { onFormSubmit }, // Event captured and handled by server component
  { state }: WebContext,
) {
  const username = state<string>("");

  return (
    <form onSubmit={() => onFormSubmit({ username })}>
      <label>
        Username:
        <input
          type="text"
          name="username"
          value={username.value}
          onInput={(e) => {
            username.value = e.currentTarget.value;
          }}
        />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

And:

```tsx
// Server component:
export default function Page() {
  const onFormSubmit = ({ username }) => {
    // This event is handled in the server, we can save it to the DB.
  };

  return <controlled-form-example onFormSubmit={onFormSubmit} />;
}
```

> [!CAUTION]
>
> Controlled forms introduce additional complexity and more client-side JavaScript code. Developers should carefully weigh these factors when choosing between controlled and uncontrolled forms. The Brisa team recommends using controlled forms primarily when providing instant feedback to users for each modification during form interactions. Otherwise, it is advisable to opt for uncontrolled forms with a server component.
