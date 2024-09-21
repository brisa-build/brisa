import DiscordIcon from '@/icons/discord-icon';
import ExternalArrowIcon from '@/icons/external-arrow-icon';
import GitHubIcon from '@/icons/github-icon';
import XIcon from '@/icons/x-icon';
import type { RequestContext } from 'brisa';
import { version } from '@/../package.json';
import MenuIcon from '@/icons/menu-icon';
import CrossIcon from '@/icons/cross-icon';

export default function Nav({}, { route }: RequestContext) {
  const getActiveClass = (name: string) =>
    route.name === name ? 'active' : '';

  return (
    <nav class="nav">
      <div class="nav-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <a class="logo" href="/">
            <img
              src="/brisa.svg"
              alt="Brisa Framework logo"
              width="30"
              height="30"
            />
            Brisa
          </a>
          <search-engine-wc jsonUrl="/content.json" />
        </div>
        <menu-btn selector="#nav-list" skipSSR>
          <MenuIcon />
          <CrossIcon />
        </menu-btn>
        <div id="nav-list">
          <ul>
            <li>
              <a
                class={getActiveClass('/[...doc]')}
                href="/getting-started/quick-start"
              >
                Docs
              </a>
            </li>
            <li>
              <a class={getActiveClass('/playground')} href="/playground">
                Playground
              </a>
            </li>
            <li>
              <a class={getActiveClass('/examples')} href="/examples">
                Examples
              </a>
            </li>
            <li>
              <a class={getActiveClass('/blog')} href="/blog">
                Blog
              </a>
            </li>
            <li>
              <a
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  marginTop: '2px',
                }}
                href="https://github.com/brisa-build/brisa/releases"
                target="_blank"
              >
                {version} <ExternalArrowIcon size={10} />
              </a>
            </li>
          </ul>
          <ul class="change-theme" style={{ gap: '0.8rem' }}>
            <li>
              <change-theme />
            </li>
          </ul>
          <ul class="social-media">
            <li>
              <a
                href="https://github.com/brisa-build/brisa"
                target="_blank"
                aria-label="GitHub"
              >
                <GitHubIcon size={20} />
              </a>
            </li>
            <li>
              <a
                href="https://x.com/brisadotbuild"
                target="_blank"
                aria-label="Twitter / X"
              >
                <XIcon size={20} />
              </a>
            </li>
            <li>
              <a
                href="https://discord.com/invite/MsE9RN3FU4"
                target="_blank"
                aria-label="Discord"
              >
                <DiscordIcon size={20} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
