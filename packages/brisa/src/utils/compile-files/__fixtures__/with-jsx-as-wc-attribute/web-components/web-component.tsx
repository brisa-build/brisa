// @ts-nocheck
export default function WebComponent({ foo }, { onMount }) {
  onMount(() => {
    window.log("I'm a web component");
  });
  return <div id="web-component">{foo}</div>;
}
