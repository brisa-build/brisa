(() => {
  function Component(props, { state }) {
    const inputs = state(props.value.value ?? ["foo"]);
    const signal = { foo: { bar: inputs } };
    return [
      null,
      {},
      () =>
        signal.foo.bar.inputs.value.map((input) => [
          "div",
          { key: input },
          input,
        ]),
    ];
  }
  const _Test = brisaElement(Component, ["value"]);
  return _Test;
})();
