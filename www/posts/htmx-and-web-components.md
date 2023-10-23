---
title: "Brisa: HTMX & Web Components"
description: Algorithm to transform Brisa components to similar behavior of HTMX and to Web Components
---

Este post es para contar un poco el enfoque que se ha sacado para hacer los algoritmos para poder trabajar con componentes parecidos a React y con un framework parecido a Next.js (Brisa), pero a la vez tenga un comportamiento más inspirado por librerias como HTMX y Lit Element.

Digamos que Brisa framework ha estado fuertamente inspirado por: Next.js (React), HTMX y Lit Element.

En Brisa, los componentes por defecto son server-components. Y es posible que puedas tener más server-components ya que el enfoque es que puedas usar estado y eventos dentro de ellos! Si, lo has escuchado bien, en principio podrias usar una SPA interactiva solo usando server-components.

No obstante, no siempre es recomendado usar server-components y va bien tener tambien client-components.

## Cuando usar client-components (web-components)

Hay dos puntos importantes que harán que tengas que usar los client-components:

- Cuando necesites interactuar con la Web API
- Por interacciones que no requieran hacer peticiones al servidor. Por ejemplo no tendria sentido usar un server-component para una celda de un spreadsheet.

## Cuando usar server-components

Siempre que no se necesite interactuar con la Web API, y cuando las interacciones requieran interacción con el servidor.

## Next.js (React) inspiración

React cuando salió y cuando el concepto de "componentes" salió hizo una revolución a como se construye la web. El concepto de trabajar con componentes permite que puedas reusar código facilmente y cada componente tenga una sola resposabilidad y la puedas testear bien. El hecho de usar JSX permitió tener en un solo sitio pequeño (componente) tanto el JS, HTML y CSS para realizar la funcionalidad del componente. Así que Brisa una de sus motivaciones es de que los desarroyadores sigan haciendo sus proyectos usado componentes funcionales con JSX.

Next.js inspiró mucho su forma de gestionar el SSR con React y como tener ficheros isomorphicos que se puedan usar tanto en el lado del servidor como el del cliente.

Brisa se ha inspirado con el enrutado estilo Next.js (pages router) para definir las paginas pero con un enfoque parecido a app router, ya que por defecto todos los componentes son server-components.

## HTMX inspiración

Pensando en los server-components, nos preguntamos porqué no podria tener estado y eventos, y que esta interacción se hiciera parecida a como lo hace HTMX. HTMX extende los controles hypermedia para que sean más de 2 (`a` y `form`) y la comunicación servidor-cliente es via `text/html`.

Para facilitar la integración de la idea HTMX pero usando un comportamiento parecido a los componentes de React sin tener que manualmente añadir estos hypermedia controles y llevar el mínimo código posible en el cliente, Brisa lo que hace es cambiar el enfoque de implementación.

Comunicarse con HTML de hecho es uno de los principios por los que se crearon protocolos como HTTP (Hypertext Transfer Protocol). Más adelante se añadió soporte para transmitir JSON y con los últimos años y la revolución de React se tendió mucho a hacer lo siguiente:

1. Hacer una acción desde el lado del cliente
2. Capturar el evento y procesar datos
3. Hacer una petición al servidor
4. Recibir un JSON del servidor
5. Procesar el JSON
6. Renderizar nuevo HTML

HTMX propone solucionar estas peticiones por controles de hypermedia y simplificarlo a:

1. Hacer una acción desde el lado del cliente
2. Automaticamente se haga la petición al servidor por el hypermedia control
3. El servidor devuelve el HTML y el hypermedia control reemplaze la parte de la web que toca por el HTML recibido

Por parte de los desarroyadores para implementar una acción solo se necesita definir en los atributos de HTML su comportamiento y el hypermedia-control lo hace solo sin tener que implementar todo esto. Cosa que es un beneficio porque reduce mucho el código del cliente, lo único que se necesita es la libreria de HTMX para que haga el manejo de estos controles. Si algún dia esto se establece como especificación de HTML entonces no habrá nada de código de cliente, pero ahora mismo si se necesita una libreria que lo gestione por ti.

Con Brisa, queremos hacer algo parecido, aunque no igual. Queremos mantener el concepto de reducir el trabajo de los desarroyadores de una forma parecida a HTMX para que no tengan que implementar estas acciones desde el cliente y ya que estamos trabajando con server-components que se haga allí y asi no haga falta comunicarse con ningún servidor porque todo se hará desde el servidor. Con esto quiero decir que en los server-componentes tenemos un estado y podemos modificarlo desde un handler, entonces se hace un rerender del componente desde el servidor y se manda este codigo al cliente. Naturalmente la acción inicial se hará desde el cliente porque se necesita interactividad del usuario, pero se traslada la implementación en el servidor.

De esta forma, quedaria así:

1. Hacer acción desde el lado del cliente
2. Automaticamente se haga la petición al servidor y Brisa ejecuta la acción y rerender el componente
3. El servidor devuelve el HTML y Brisa-cliente lo reemplaza por la parte de la web que toca por el HTML recibido

```js
import { Database } from "bun:sqlite";

const db = new Database(":memory:");

const userQuery = db.query(
  "SELECT firstName, lastName, ranking FROM users WHERE id = ?;",
);

const updateRanking = db.prepare("UPDATE users SET ranking = ? WHERE id = ?");

export default function UserInfo({ id }, { rerender, i18n: { t } }) {
  const { firstName, lastName, ranking } = userQuery.get(id);

  const increaseRanking = () => {
    updateRanking.run(ranking + 1, id);
    rerender();
  };

  return (
    <>
      <h1>{t("hello", { firstName, lastName })}</h1>
      <client-component ranking={ranking} />
      <button onClick={increaseRanking}>{t("increase-ranking")}</button>
    </>
  );
}

UserInfo.error = ({ error }, { i18n: { t } }) => {
  if (error instanceof Database.SqliteError) {
    return <div>{t("error-updating-user-ranking")}</div>;
  }

  return <div>{t("error-generic")}</div>;
};
```

Aquí lo que cambia, es que el hypermedia-control no existe a nivel de atributo de HTML. Es más, el cliente recibe el HTML nuevo y lo reemplaza automaticamente, pero realmente no recibe el HTML en formato texto, sino que el cliente recibe las operaciones del DOM que debe de realizar para alterar lo mínimo posible el HTML y de esta forma parte del analisis se haga desde el servidor.

Por lo tanto, no podemos decir que Brisa usa el hypermedia para enviar HTML en formato texto, sino que enviamos texto en streaming de las operaciones de DOM junto los selectores de HTML al cual aplicar estas operaciones.

Un ejemplo de chunks que puede recibir durante el streaming de la respuesta:

Chunk 1:

```json
{
  "selector": "div > a",
  "action": "setAttribute",
  "params": ["style", "color:red;"]
}
```

Chunk 2:

```json
{
  "selector": "div a:last-child",
  "action": "removeAttribute",
  "params": ["style"]
}
```

Chunk 3:

```json
{ "selector": "div span:last-child", "action": "remove", "params": [] }
```

Chunk 3:

```json
{
  "selector": "main > div",
  "action": "insertAdjacentHTML",
  "params": ["afterend", "<b>Example</b>"]
}
```

Chunk 3:

```json
{
  "selector": "main > div > b",
  "action": "innerHTML",
  "params": ["Hello world"]
}
```

Sólo 4 operaciones soportadas por todos los navegadores: `setAttribute`, `removeAttribute`, `remove`, `insertAdjacentHTML`, `innerHTML`. Con estas 4 operaciones se puede modificar el DOM de forma delicada sin alterar estados ni eventos registrados por la parte de cliente.

Los motivos de elegir JSON otra vez en vez de HTML (me refiero a otra vez porque la web se inventó para transferir HTML, añadimos soporte a transferir JSON para hacer cosas más complejas desde el cliente y luego recapacitamos con HTMX para ampliar el uso de HTML para evitar complejidades innecesarias):

- Procesar de una forma más simple desde el cliente, haciendo que no haga falta casi llevar Bytes en el cliente para gestionar esto.
- Operar directamente con el DOM para actualizar solo la parte del HTML que cambia y mantener la que tenemos exactamente igual, evitando que se pierdan estados y eventos de web-components.

## Eventos y estado en el servidor

### 1. Build process

Durante el build se detectan todos los eventos que hay en JSX y se hace lo siguiente:

#### Transformar componente original

Se crea un index en hexadecimal del componente que tiene >= 1 evento, por ejemplo si ya hay 1003 componentes con eventos en todo el proyecto, tendria el id `3eb`:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick={() => {
        console.log(name);
      }}
    >
      Click
    </button>
  );
}
```

Se pone el id en el componente original y se sustituye el evento por la ejecución de la action `$a(idComp, idAction)` mientras se conserva el evento original añadiendo `$` al final:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick$={() => {
        console.log(name);
      }}
      onClick="$a('3eb', 1)"
    >
      Click
    </button>
  );
}

SomeComponent._id = "3eb";
```

De esta forma quedaria solventado tambien si tenemos el evento en forma prop drilling:

```jsx
function SomeComponent({ name }) {
  return (
    <ButtonComponent
      onClick$={() => console.log("Hello world")}
      onClick="$a('3eb', 1)"
    >
      Click
    </ButtonComponent>
  );
}

SomeComponent._id = "3eb";
```

Ya que se pasaria la ejecución del valor estàtico `$a('3eb', 1)` a donde se tiene que ejecutar.

No obstante, este componente no recibe ninguna transformación:

```jsx
function ButtonComponent({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}
```

De igual forma que si tenemos un evento de cliente (string) desde un server-component tampoco se transforma:

```js
function Example() {
  return (
    <img src="/images/image.jpg" onError="this.src='/images/fallback.jpg'" />
  );
}
```

#### Crear la action (post build)

Basado en el original:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick={() => {
        console.log(name);
      }}
    >
      Click
    </button>
  );
}
```

Creamos una version nueva dentro de `/_actions/3eb.js`, transformando el fichero original a esto:

```jsx
export default function ({ name }) {
  const _events = new Set();
  const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };

  return {
    render: () => (
      <button
        onClick={_action(() => {
          console.log(name);
        })}
      >
        Click
      </button>
    ),
    events: () => _events,
  };
}
```

En caso de consumir signals y tener más logica en el componente:

```jsx
function SomeComponent({ name }, { i18n, useSignal }) {
  const count = useSignal(0);
  const [firstName] = name.split(" ");
  const incEl = (
    <button onClick={inc}>{i18n.t("increment", { firstName })}</button>
  );
  const decEl = (
    <button onClick={() => count.value--}>{i18n.t("decrement")}</button>
  );

  const inc = () => {
    console.log(firstName);
    count.value++;
  };

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}
```

Se moveria a `/_actions/3eb.js` transformandolo por:

```jsx
export default function ({ name }, { i18n, useSignal }) {
  const _events = new Set();
  const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };

  return {
    render: () => {
      _events.clear();

      const count = useSignal(0);
      const [firstName] = name.split(" ");
      const incEl = (
        <button onClick={_action(inc)}>
          {i18n.t("increment", { firstName })}
        </button>
      );
      const decEl = (
        <button onClick={_action(() => count.value--)}>
          {i18n.t("decrement")}
        </button>
      );

      const inc = () => {
        console.log(firstName);
        count.value++;
      };

      return (
        <>
          {incEl}
          {count.value}
          {decEl}
        </>
      );
    },
    events: () => _events,
  };
}
```

En el caso de tener cosas raras como:

```jsx
const btnFn = (name) =>
  name && (
    <button onClick={() => console.log("Hello from server")}>Hello</button>
  );

function SomeComponent({ name }) {
  return btnFn(name);
}
```

Como se hace esta transformación durante el post-build, ya primero se habrá hecho una optimización al componente de la pagina así que tendriamos algo parecido a esto:

```jsx
function SomeComponent({ name }) {
  return (
    name && (
      <button onClick={() => console.log("Hello from server")}>Hello</button>
    )
  );
}
```

Y por lo tanto podemos aplicar la misma regla de transformación post-build:

```jsx
export default function ({ name }) {
   const _events = new Set();
   const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };


  return {
    render: () => name && <button onClick={_action(() => console.log("Hello from server"))}>Hello</button>,
    events: () => _events,
}
```

### 2. Runtime process

Durante el método `renderToReadableStream` la idea es ver que componentes tienen el `._id`, y entonces esto significa que hay que wrapear el HTML que devuelva el componente con un comentario que tenga los valores de las props y de los signals (al pasar la request en cada componente podemos acceder para obtener los valores de las signals).

Este componente sin signals:

```jsx
function SomeComponent({ name }) {
  return <button onClick="$a('3eb', 1)">Click</button>;
}

SomeComponent._id = "3eb";
```

Se printaria en html como:

```html
<!--BC-3eb name="Aral"--><button onClick="$a('3eb', 1)">Click</button
><!--/BC-3eb-->
```

La idea de hacerlo así es de no introducir nodos nuevos para no sobrecargar el DOM y a parte que luego al llamar a la acción, se pasa el trozo de HTML que hay entre este comentario ya que es el HTML actual del componente y luego durante la acción del servidor analizará los cambios con el nuevo HTML para devolver las operaciones de DOM necesarias.

Y con signals:

```jsx
function SomeComponent({ name }, { i18n, useSignal }) {
  const count = useSignal(0);
  const [firstName] = name.split(" ");
  const incEl = (
    <button onClick="$a('3eb', 1)">{i18n.t("increment", { firstName })}</button>
  );
  const decEl = <button onClick="$a('3eb', 2)">{i18n.t("decrement")}</button>;

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}

SomeComponent._id = "3eb";
```

Se printaria en html como:

```html
<!--BC-3eb name="Aral" _signals=[0]-->
<button onClick="$a('3eb', 1)">Increment</button>
0
<button onClick="$a('3eb', 2)">Decrement</button>
<!--/BC-3eb-->
```

Los valores de las `props` SÓLO cuando un componente usa eventos pasan a ser visibles en el HTML, y los valores de los signals SIEMPRE. Esto es muy importante tener-lo en cuenta para no exponer datos delicados. Si un componente necesita dados delicados se puede pasar a través del request context y exponer dentro de un signal solo la parte no delicada que se quiere como estado:

```jsx
function SomeComponent({}, { i18n, useSignal, context, rerender }) {
  const user = context.get("user"); // Some user data is delicated
  const firstName = useSignal(user.firstName); // add this signal to HTML to use it in events
  const incEl = (
    <button onClick={inc}>{i18n.t("increment", { firstName })}</button>
  );
  const decEl = (
    <button onClick={() => count.value--}>{i18n.t("decrement")}</button>
  );

  const inc = () => {
    console.log(firstName);
    count.value++;
    rerender();
  };

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}
```

### 3. Consumir la action

Se hace de esta forma porque la idea para consumir esta action seria:

1. Se recibiria en la petición el HTML actual junto con las props y los signals
2. Montar la request context primero inicializando los signals a los últimos valores. Los signals se guardan dentro del HTML, así que la al llamar a `$a(idComp, idAction)` esta función se encarga de hacer la petición pasando los ultimos valores de los signals para que el server pueda tener el contexto.
3. Se llamaria al `events` y se ejecutaria el evento de la action.
4. Se llamaria al `render` y se obtendria el HTML

De esta parte, la más importante es cómo obtener las operacions del DOM tras comparar ambos HTMLs. Aquí es donde entra en juego el algoritmo
