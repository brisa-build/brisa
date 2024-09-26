import type { RequestContext } from 'brisa';

export function Head({}, { i18n }: RequestContext) {
  return <title id="title">{i18n.t('about.title')}</title>;
}

export default function About({}, { i18n: { t } }: RequestContext) {
  const parrafs: string[] = t(
    'about.content.parraphs',
    {},
    { returnObjects: true },
  );
  return (
    <>
      <div class="hero">
        <h1>
          {t('about.heading', {}, { elements: [<span class="h1_addition" />] })}
        </h1>
        <p class="edit-note">✏️ {t('change-page')}</p>
        <code>src/pages/about/index.tsx</code>
      </div>
      <div class="about-sections">
        <section>
          <h2>{t('about.content.title')}</h2>
          {parrafs.map((p) => (
            <p>{p}</p>
          ))}

          <p class="CTA-text">
            {t('about.ready')}{' '}
            <a
              class="CTA"
              href="https://brisa.build"
              target="_blank"
              data-replace={t('about.more')}
            >
              <span>{t('about.more')}</span>
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
