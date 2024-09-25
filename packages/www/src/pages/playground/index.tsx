export default function Playground() {
  return (
    <main>
      <play-ground skipSSR>
        <div
          slot="code-editor"
          style={{ height: '500px', width: '100%' }}
          id="code-editor"
        ></div>
        <iframe
          slot="preview-iframe"
          id="preview-iframe"
          src="/playground/preview"
        />
      </play-ground>
    </main>
  );
}
