import CounterServer from '@/components/counter-server';
import type { RequestContext } from 'brisa';

export default function Homepage({}, { i18n: { t, locale } }: RequestContext) {
  const navTo = locale === 'en' ? 'es' : 'en';
  const langKey = `languages.${navTo}` as const;

  return (
    <>
      <div className="hero">
        <h1>
          {t(
            'home.welcome',
            { name: 'i18n' },
            { elements: [<span className="h1_addition" />] },
          )}
        </h1>
        <p className="edit-note">✏️ {t('change-page')}</p>
        <code>src/pages/index.tsx</code>
      </div>

      <section className="counter-section">
        <h2>{t('home.counters')}</h2>
        <div className="counters" style={{ marginBottom: '20px' }}>
          <counter-client initialValue={42} />
          <CounterServer initialValue={37} />
        </div>
        <a
          alt={t(langKey)}
          style={{
            fontSize: '18px',
            textDecoration: 'none',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: 'rgb(4 14 113)',
          }}
          renderMode="native"
          href={`/${navTo}`}
        >
          {t(langKey)}
        </a>
      </section>
    </>
  );
}
