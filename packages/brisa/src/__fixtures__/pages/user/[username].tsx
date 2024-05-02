export default function User() {
  return <div>user</div>;
}

export function prerender() {
  return [{ username: "testUserName" }];
}
