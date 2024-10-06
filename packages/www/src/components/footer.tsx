import RSSIcon from '@/icons/rss-icon';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <div class="footer-content">
        <form
          class="nl"
          method="POST"
          action="https://build.us8.list-manage.com/subscribe/post?u=bc31ee7c9223ccdf6cc63f9d8&id=6878b40d47"
        >
          <p>
            <b>Let's keep in touch</b>
          </p>
          <p>
            Enter your email to stay up to date with the latest updates from
            Brisa.
          </p>
          <input
            type="email"
            placeholder="your@email.com"
            name="MERGE0"
            id="MERGE0"
          />
          <button>Subscribe to our newsletter</button>
        </form>
        <div>
          <b>Content</b>
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
            <li style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <a title="Blog" href="/blog">
                Blog
              </a>
              <a
                title="RSS"
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                style={{ border: 'none' }}
              >
                <RSSIcon />
              </a>
            </li>
          </ul>
        </div>
        <div>
          <b>Social</b>
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
            <li>
              <a
                title="Media (YouTube)"
                href="/media"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
            </li>
          </ul>
        </div>
        <div>
          <b>Legal</b>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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
        <p>
          <a
            href="mailto:contact@brisa.build"
            title="Contact us"
            target="_blank"
            rel="noopener noreferrer"
          >
            contact@brisa.build
          </a>
        </p>
      </div>
    </footer>
  );
}
