export default {
  languages: {
    en: '🌐 Cambia a Inglés',
    es: '🌐 Cambia a Español',
  },
  home: {
    title: 'Página de inicio',
    welcome: '¡Bienvenido a <0>{{name}}!</0>',
    counters: 'Contadores',
    'client-counter': 'Contador de cliente',
    'server-counter': 'Contador de servidor',
  },
  about: {
    title: 'Acerca de Brisa',
    heading: '<0>Acerca de</0> Brisa',
    ready: '¿Listo para empezar?',
    more: 'Leer la documentación',
    content: {
      title: '¿Curioso por más detalles? ¡Vamos a profundizar!',
      parraphs: [
        'Brisa es el Framework de la Plataforma Web. Sus páginas son componentes JSX renderizados dinámicamente en el servidor, por lo que no se envía JavaScript al navegador por defecto.',
        'Todo se ejecuta exclusivamente en el servidor por defecto, excepto la carpeta de Web Components, que por supuesto también se ejecuta en el cliente.',
        'Hemos resuelto la carga de escribir y procesar Web Components. Es fácil de escribir con Signals, renderizado en el lado del servidor, y optimizado en tiempo de compilación para ser rápido y pequeño; si usas Web Components, añade +3KB.',
        'También puedes usar el compilador de Brisa para crear librerias de Web Components que funcionan en cualquier framework, o incluso sin framework, y son compatibles con el renderizado en el lado del servidor.',
        'También hemos resuelto las Server Actions. Con Brisa, los componentes del servidor pueden capturar cualquier evento del navegador: onSubmit, onInput, onFocus, onClick, y todos los eventos de los Web Components, como onClickOnMyComponent. Todos estos son ahora Server-Actions, por lo que ya no necesitas poner "use client" ni "use server". En el servidor, simplemente son Server-Actions, y en el cliente son simplemente eventos del navegador.',
        'Para hacer esto posible, hemos mejorado la comunicación entre ambos mundos, creando nuevos conceptos como "Action Signals". Con estos, el servidor puede reaccionar a los Web Components sin necesidad de rerenders. También hemos añadido ideas de HTMX; tienes atributos extra en el HTML para hacer debounce o gestionar errores y estados pendientes.',
        'Brisa no solo usa Hypermedia, sino que la transmite por la red.',
        'Brisa también es el único framework con soporte completo de Internacionalización. No solo en el enrutamiento, sino que también puedes traducir tus páginas y los nombres de las rutas si lo necesitas. Si usas i18n, los componentes del servidor ocupan 0 Bytes, pero en los Web Components son 800 B. Al final, usamos la Plataforma Web; hacemos un puente con la API Intl de ECMAScript para facilitar la traducción de tus Web Components.',
        'En Brisa nos gusta la idea de que todas las herramientas estén integradas, por eso Brisa está hecho con Bun. Hemos ampliado los Matchers y añadido una API para que puedas ejecutar con Bun los tests de tus Componentes.',
        'Bun es genial y mejora mucho la experiencia de desarrollo. Aunque recomendamos Bun.js también como runtime, como salida puedes usar Node.js si lo prefieres, generar una salida estática y subirla a un CDN, o generar una app ejecutable para Android (.apk), iOS (.ipa), Windows (.exe), Mac (.dmg), o Linux (.deb). Sí, Brisa es multiplataforma gracias a su integración con Tauri.',
        'Soportamos Pre-renderizado Parcial, puedes pre-renderizar solo una parte de tu página, como el pie de página.',
        'También soportamos muchas más características como middleware, layouts, WebSockets, rutas API, suspense, etc.',
        'Brisa es el futuro de la Web, y el futuro es ahora. Te invitamos a probarlo y a contribuir a la comunidad.',
      ],
    },
  },
  'change-page': 'Cambia esta página en',
};
