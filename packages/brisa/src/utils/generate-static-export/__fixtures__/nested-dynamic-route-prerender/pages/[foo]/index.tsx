export default function Foo() {
  return <div>foo</div>;
}

export const prerender = async () => {
  return [{ foo: "foo" }, { foo: "bar" }, { foo: "baz" }];
};
