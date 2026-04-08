'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

const legalLinks = [
  { key: 'privacy', href: '/legal/privacidad' },
  { key: 'terms', href: '/legal/terminos' },
];

export function Footer() {
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');

  const discoverLinks = [
    { label: tNav('products'), href: '/productos' },
    { label: tNav('about'), href: '/acerca' },
    { label: tNav('contact'), href: '/contacto' },
    { label: tNav('customerArea'), href: '/area-clientes' },
  ];

  return (
    <footer
      className="relative px-6 pt-16 pb-8 md:px-16"
      style={{
        backgroundColor: 'var(--color-blue)',
        color: 'var(--color-beige)',
      }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-14 border-b border-white/20 pb-8">
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3.6vw, 3.6rem)',
              fontWeight: 550,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}
          >
            {tFooter('companyName')}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.1rem',
              opacity: 0.86,
              maxWidth: '680px',
              lineHeight: 1.5,
            }}
          >
            {tFooter('description_long')}
          </p>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-text)',
                fontWeight: 600,
                fontSize: '0.8rem',
                marginBottom: '1rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.65,
              }}
            >
              Discover
            </h4>
            <nav className="flex flex-col gap-3">
              {discoverLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm opacity-80 transition-opacity hover:opacity-100"
                  style={{ fontFamily: 'var(--font-text)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4
              style={{
                fontFamily: 'var(--font-text)',
                fontWeight: 600,
                fontSize: '0.8rem',
                marginBottom: '1rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.65,
              }}
            >
              Contact
            </h4>
            <div className="space-y-3 text-sm opacity-85" style={{ fontFamily: 'var(--font-text)' }}>
              <p>{tFooter('delegation')}: 968 46 75 14 / 639 77 86 55</p>
              <p>pedidos@granjamaripepa.com</p>
              <p>{tFooter('schedule_hours')}</p>
            </div>
          </div>

          <div>
            <h4
              style={{
                fontFamily: 'var(--font-text)',
                fontWeight: 600,
                fontSize: '0.8rem',
                marginBottom: '1rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.65,
              }}
            >
              Legal
            </h4>
            <nav className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm opacity-80 transition-opacity hover:opacity-100"
                  style={{ fontFamily: 'var(--font-text)' }}
                >
                  {tFooter(link.key as 'privacy' | 'terms')}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col gap-2 text-xs opacity-60 md:flex-row md:items-center md:justify-between" style={{ fontFamily: 'var(--font-text)' }}>
            <p>{tFooter('copyright', { year: new Date().getFullYear() })}</p>
            <p>{tFooter('location_lorca')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
