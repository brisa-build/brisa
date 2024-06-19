export default function PageWithWebComponent() {
  return (
    <div>
      <h1>Page with web component</h1>
      {/* @ts-ignore */}
      <web-component />
      {/* @ts-ignore */}
      <emoji-picker />
    </div>
  );
}
