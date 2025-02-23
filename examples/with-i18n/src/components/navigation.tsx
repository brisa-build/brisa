import type { RequestContext } from 'brisa';

export default function Nav({}, { i18n: { t } }: RequestContext) {
  return (
    <nav>
      <div className="nav-content">
        <a
          className="logo"
          href="https://brisa.build"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/brisa.svg" alt="Brisa Framework logo" width="30" />
          Brisa
        </a>
        <ul>
          <li>
            <a href="/">{t('home.title')}</a>
          </li>
          <li>
            <a href="/about">{t('about.title')}</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
