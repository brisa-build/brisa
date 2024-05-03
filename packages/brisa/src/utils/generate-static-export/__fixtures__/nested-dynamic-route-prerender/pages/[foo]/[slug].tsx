export default function User() {
  return <div>user</div>;
}

export function prerender() {
  return [
    { foo: "foo", slug: "user" },
    { foo: "bar", slug: "user" },
    { foo: "baz", slug: "user" },
    { foo: "foo", slug: "user2" },
    { foo: "bar", slug: "user2" },
    { foo: "baz", slug: "user2" },
  ];
}
