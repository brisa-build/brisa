export default function User() {
  return <div>user</div>;
}

export function prerender() {
  return [
    { catchall: ["a", "b", "c"] },
    { catchall: ["a", "b"] },
    { catchall: ["a"] },
  ];
}
