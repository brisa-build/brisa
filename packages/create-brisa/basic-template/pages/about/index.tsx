export function Head() {
  return <title id="title">About Brisa</title>;
}

export default function Aboutpage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">About </span>Brisa
        </h1>
        <p class="edit-note">✏️ Change this page on </p>
        <code>src/pages/about/index.tsx</code>
      </div>
      <div class="about-sections">
        <section>
          <h2>Curious for more details? Let's dive in!</h2>
          <p>
            Brisa makes it easy to build web applications by combining server
            components with server actions, web components with JSX, signals,
            and server-side rendering.
          </p>
          <p>
            We leverage "action signals," inspired by HTMX, to enhance
            communication between server and client.
          </p>
          <p>
            Brisa also empowers the community to create and share new web
            component libraries.
          </p>
          <p>
            It's the only framework offering full internationalization support.
            Also it comes with an integrated test runner.
          </p>
          <p>
            With Brisa, you can run your project in various JavaScript runtimes,
            export static files, combine static and dynamic pages, or even build
            desktop, Android, or iOS apps.
          </p>

          <p class="CTA-text">
            Ready to start?{' '}
            <a
              class="CTA"
              href="https://brisa.build"
              target="_blank"
              data-replace="Read the docs"
            >
              <span>Read the docs</span>
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
