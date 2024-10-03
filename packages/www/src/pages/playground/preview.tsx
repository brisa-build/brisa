import { dangerHTML as esm } from 'brisa'

export default function Playground() {
  const erudaCode = `import eruda from 'https://esm.sh/eruda'

function __setupEruda() {
  const container = document.getElementById('eruda-container')
  
  if (!container) {
    return
  }
  
  eruda.init({
    container,
    tool: ['console', 'elements'],
    autoScale: true,
    useShadowDom: false,
    defaults: {
      displaySize: 100,
      transparency: 100,
    },
  })
  
  const erudaContainer = document.querySelector('.eruda-container')
  if (erudaContainer) {
    erudaContainer.style.position = 'absolute'
  }
  
  const erudaDevTools = document.querySelector('.eruda-dev-tools')
  if (erudaDevTools) {
    erudaDevTools.style.height = '100%'
  }

  const erudaEntryButton = document.querySelector('.eruda-entry-btn')
  if (erudaEntryButton) {
    erudaEntryButton.style.display = 'none'
  }
  
  eruda.show()
  
  __setupErudaTheme()
}

function __setupErudaTheme() {
  const erudaConfig = eruda?.get('')?.config
  erudaConfig?.set('theme', document.body.classList.contains('dark') ? 'Dark' : 'Light')
}

__setupEruda()`

  return <div style="display: flex; flex: 1; flex-direction: column; width: 100%; height: 100vh;">
    <script type="module">
      {esm(erudaCode)}
    </script>

    <div id="preview-container" style="height: 50%; padding: 0.5rem;">
      <play-ground-preview skipSSR/>
    </div>
    <div id="console-container" style="height: 50%; position: relative;">
      <div id="eruda-container">
      </div>
    </div>
  </div>
}
