'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations('products_page');
  const router = useRouter();

  return (
    <section className="px-6 py-24 md:px-10 md:py-32" style={{ backgroundColor: 'var(--color-beige)' }}>
      <div className="mx-auto max-w-4xl text-center">
        <p
          style={{
            fontFamily: 'var(--font-text)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(14,22,32,0.58)',
            marginBottom: '0.8rem',
          }}
        >
          {t('badge')}
        </p>

        <h1 style={{ color: 'var(--color-black)' }}>{t('title')}</h1>

        <p
          className="mx-auto mt-6 max-w-2xl"
          style={{
            fontFamily: 'var(--font-text)',
            fontSize: '1.2rem',
            lineHeight: 1.45,
            color: 'rgba(14,22,32,0.82)',
          }}
        >
          {t('subtitle_1')}
        </p>
        <p
          className="mx-auto mt-3 max-w-2xl"
          style={{
            fontFamily: 'var(--font-text)',
            fontSize: '1rem',
            lineHeight: 1.45,
            color: 'rgba(14,22,32,0.68)',
          }}
        >
          {t('subtitle_2')}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="joby-button blue px-8 py-4"
            style={{ fontFamily: 'var(--font-text)', fontSize: '0.95rem' }}
          >
            <span>{t('cta_home')}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/area-clientes')}
            className="joby-button px-8 py-4"
            style={{ fontFamily: 'var(--font-text)', fontSize: '0.95rem' }}
          >
            <span>{t('cta_clients')}</span>
          </button>
        </div>

        <div className="mt-10 inline-flex items-center gap-2 text-sm" style={{ color: 'rgba(14,22,32,0.62)' }}>
          <Clock className="h-4 w-4" />
          <span>{t('badge')}</span>
        </div>
      </div>
    </section>
  );
}
