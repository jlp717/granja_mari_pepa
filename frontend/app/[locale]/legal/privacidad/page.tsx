'use client';

import { useTranslations } from 'next-intl';

export default function PrivacidadPage() {
  const t = useTranslations('legal.privacy');

  return (
    <section className="px-6 py-20 md:px-10 md:py-24" style={{ backgroundColor: 'var(--color-beige)' }}>
      <div className="mx-auto max-w-4xl rounded-[28px] border bg-white p-8 md:p-12" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
        <h1 style={{ color: 'var(--color-black)' }}>{t('title')}</h1>
        <p className="mt-6" style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.74)', lineHeight: 1.6 }}>
          {t('intro')}
        </p>

        {['s1', 's2', 's3', 's4', 's5', 's6'].map((section) => (
          <article key={section} className="mt-10">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--color-black)', marginBottom: '0.6rem' }}>
              {t(`sections.${section}.title`)}
            </h3>
            <p
              style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.74)', lineHeight: 1.65 }}
              dangerouslySetInnerHTML={{ __html: t(`sections.${section}.content`) }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
