export default function User() {
  return <div>user</div>;
}

export function prerender() {
  return [{ slug: "user" }, { slug: "user2" }];
}
