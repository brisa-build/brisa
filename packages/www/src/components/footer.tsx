export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <div class="footer-content">
        <form class="nl">
          <p>
            <b>Let's keep in touch</b>
          </p>
          <p>
            Enter your email to stay up to date with the latest updates from
            Brisa.
          </p>
          <input type="email" placeholder="your@email.com" />
          <button>Subscribe to our newsletter</button>
        </form>
        <div>
          <h2>Content</h2>
          <ul>
            <li>
              <a title="Documentation" href="/getting-started/quick-start">
                Docs
              </a>
            </li>
            <li>
              <a title="Playground" href="/playground">
                Playground
              </a>
            </li>
            <li>
              <a title="Examples" href="/examples">
                Examples
              </a>
            </li>
            <li>
              <a title="Blog" href="/blog">
                Blog
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2>Social</h2>
          <ul>
            <li>
              <a title="x" href="/x" target="_blank" rel="noopener noreferrer">
                Twitter (x)
              </a>
            </li>
            <li>
              <a
                title="Discord"
                href="/discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
            </li>
            <li>
              <a
                title="GitHub"
                href="/github"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2>Legal</h2>
          <ul>
            <li>
              <a title="Privacy Policy" href="/privacy">
                Privacy Policy
              </a>
            </li>
            <li>
              <a title="Terms of Service" href="/terms">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p class="copyright">
        <a
          href="https://github.com/brisa-build/brisa/blob/main/LICENSE"
          target="_blank"
          title="MIT License"
          rel="noopener noreferrer"
        >
          MIT License &copy; {year}
        </a>{' '}
        Brisa Framework
      </p>
    </footer>
  );
}
