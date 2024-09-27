export default function Homepage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">Middleware </span>Example
        </h1>
        <p class="edit-note">✏️ Change the middleware on </p>
        <code>src/middleware.ts</code>
      </div>

      <section class="example-section">
        <h1>Middleware Example: How to Use It</h1>

        <p>
          This middleware example allows you to handle specific URL search
          parameters and respond accordingly. Below is a breakdown of its
          functionality and how to test it.
        </p>

        <h2>Usage</h2>
        <p>
          To use the middleware, simply include it in your Brisa project and
          configure the URL search parameters as described below:
        </p>

        <h3>1. Trigger an Error</h3>
        <p>
          If the URL contains the parameter <code>?throws-error=true</code>, the
          middleware will throw an internal error.
        </p>
        <p>
          Example:{' '}
          <a href="?throws-error=true" target="_blank" rel="noreferrer">
            Test internal error
          </a>
        </p>

        <h3>2. Trigger a 404 Not Found</h3>
        <p>
          To simulate a "Not Found" response, include the parameter{' '}
          <code>?throws-not-found=true</code> in the URL. This will
          automatically trigger a 404 response.
        </p>
        <p>
          Example:{' '}
          <a href="?throws-not-found=true" target="_blank" rel="noreferrer">
            Test 404 Not Found
          </a>
        </p>

        <h3>3. Redirect to /about</h3>
        <p>
          If the URL contains <code>?redirect-to-about=true</code>, the
          middleware will redirect to the <code>/about</code> page with a 301
          status code.
        </p>
        <p>
          Example:{' '}
          <a href="?redirect-to-about=true" target="_blank" rel="noreferrer">
            Redirect to /about
          </a>
        </p>

        <h3>4. Navigate to Another URL</h3>
        <p>
          In this scenario it does exactly the <b>same as a redirect</b>. The
          difference is that “navigate” function can be used on both the server
          and the client.
        </p>

        <p>
          By using the parameter <code>?navigate=</code> followed by the desired
          URL, the middleware will navigate to the provided destination. For
          example, if you want to navigate to <code>/about</code>, you can use:
        </p>
        <p>
          <code>?navigate=/about</code>
        </p>
        <p>
          Example:{' '}
          <a href="?navigate=/about" target="_blank" rel="noreferrer">
            Navigate to /about
          </a>
        </p>

        <h2>How It Works</h2>
        <p>
          The middleware processes the incoming request based on the final URL
          of the request context, checking for specific query parameters in the
          URL. It uses Brisa's <code>navigate</code> and <code>notFound</code>{' '}
          functions to handle navigation and 404 errors, and it uses the
          standard <code>Response</code> object to handle redirects.
        </p>

        <p>
          Feel free to modify the URL parameters to test the middleware's
          behavior in your environment.
        </p>
      </section>
    </>
  );
}
