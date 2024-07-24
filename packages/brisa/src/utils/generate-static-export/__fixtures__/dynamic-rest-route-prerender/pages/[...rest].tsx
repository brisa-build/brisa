export default function User() {
  return <div>user</div>;
}

export function prerender() {
  return [{ rest: 'foo/bar/baz' }, { rest: 'foo/bar/baz/qux' }];
}
