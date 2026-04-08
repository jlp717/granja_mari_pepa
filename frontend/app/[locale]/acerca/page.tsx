'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/navigation';
import { Award, Clock, Heart, Leaf, MapPin, Shield, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { delegations } from '@/lib/data';

export default function AboutPage() {
  const t = useTranslations('about_page');
  const locale = useLocale();

  const milestones = [
    {
      year: '1966',
      title: t('history.milestones.1966.title'),
      description: t('history.milestones.1966.desc'),
    },
    {
      year: '1980s',
      title: t('history.milestones.1980s.title'),
      description: t('history.milestones.1980s.desc'),
    },
    {
      year: '2000s',
      title: t('history.milestones.2000s.title'),
      description: t('history.milestones.2000s.desc'),
    },
    {
      year: '2020',
      title: t('history.milestones.2020.title'),
      description: t('history.milestones.2020.desc'),
    },
    {
      year: locale === 'es' ? 'Actualidad' : 'Today',
      title: t('history.milestones.today.title'),
      description: t('history.milestones.today.desc'),
    },
  ];

  const values = [
    {
      icon: Award,
      title: t('values.items.quality.title'),
      description: t('values.items.quality.desc'),
      stat: 'ISO 9001',
      label: t('values.items.quality.label'),
    },
    {
      icon: Clock,
      title: t('values.items.service.title'),
      description: t('values.items.service.desc'),
      stat: '24-48h',
      label: t('values.items.service.label'),
    },
    {
      icon: MapPin,
      title: t('values.items.coverage.title'),
      description: t('values.items.coverage.desc'),
      stat: '2',
      label: t('values.items.coverage.label'),
    },
    {
      icon: Heart,
      title: t('values.items.attention.title'),
      description: t('values.items.attention.desc'),
      stat: '+55',
      label: t('values.items.attention.label'),
    },
  ];

  const certs = [
    {
      icon: Award,
      name: t('certifications.items.iso.name'),
      description: t('certifications.items.iso.desc'),
      label: t('certifications.items.iso.label'),
    },
    {
      icon: Leaf,
      name: t('certifications.items.green.name'),
      description: t('certifications.items.green.desc'),
      label: t('certifications.items.green.label'),
    },
    {
      icon: Shield,
      name: t('certifications.items.traceability.name'),
      description: t('certifications.items.traceability.desc'),
      label: t('certifications.items.traceability.label'),
    },
    {
      icon: Truck,
      name: t('certifications.items.cold_chain.name'),
      description: t('certifications.items.cold_chain.desc'),
      label: t('certifications.items.cold_chain.label'),
    },
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-beige)' }}>
      <section className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: 'var(--color-navy)' }}>
        <div className="mx-auto max-w-5xl text-center">
          <h1 style={{ color: 'var(--color-beige)' }}>{t('hero.title')}</h1>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.15rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.9)',
            }}
          >
            {t('hero.subtitle_1')} {t('hero.subtitle_highlight')} {t('hero.subtitle_2')}
          </p>
          <p
            className="mx-auto mt-4 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.74)',
            }}
          >
            {t('hero.description')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#history" className="joby-button blue px-8 py-4" style={{ fontFamily: 'var(--font-text)' }}>
              <span>{t('hero.cta_history')}</span>
            </a>
            <Link href="/contacto" className="joby-button px-8 py-4" style={{ fontFamily: 'var(--font-text)' }}>
              <span>{t('hero.cta_contact')}</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="history" className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 style={{ color: 'var(--color-black)' }}>
              {t('history.title_1')} {t('history.title_2')}
            </h2>
            <p
              className="mx-auto mt-4 max-w-3xl"
              style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)', lineHeight: 1.45 }}
            >
              {t('history.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {milestones.map((item) => (
              <article key={item.year} className="rounded-[24px] border bg-white p-6" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-text)',
                    fontSize: '0.82rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-blue)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {item.year}
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--color-black)', marginBottom: '0.45rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)', lineHeight: 1.45 }}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24" style={{ backgroundColor: 'var(--color-navy)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 style={{ color: 'var(--color-beige)' }}>
              {t('values.title_1')} {t('values.title_2')}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl" style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.78)' }}>
              {t('values.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className="rounded-[24px] border p-6" style={{ borderColor: 'rgba(245,244,223,0.2)', backgroundColor: 'rgba(245,244,223,0.04)' }}>
                  <Icon className="mb-4 h-6 w-6" style={{ color: 'var(--color-beige)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-beige)', marginBottom: '0.45rem' }}>
                    {value.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.74)', marginBottom: '0.8rem' }}>{value.description}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', color: 'var(--color-beige)' }}>{value.stat}</p>
                  <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.58)' }}>{value.label}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 style={{ color: 'var(--color-black)' }}>
              {t('certifications.title_1')} {t('certifications.title_2')}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl" style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)' }}>
              {t('certifications.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {certs.map((cert) => {
              const Icon = cert.icon;
              return (
                <article key={cert.name} className="rounded-[24px] border bg-white p-6" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
                  <Icon className="mb-4 h-6 w-6" style={{ color: 'var(--color-blue)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-black)', marginBottom: '0.45rem' }}>{cert.name}</h3>
                  <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.7)', marginBottom: '0.65rem' }}>{cert.description}</p>
                  <p style={{ fontFamily: 'var(--font-text)', color: 'var(--color-blue)', fontWeight: 500 }}>{cert.label}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto max-w-6xl rounded-[28px] p-8" style={{ backgroundColor: 'var(--color-navy)' }}>
          <h2 className="text-center" style={{ color: 'var(--color-beige)' }}>{t('delegations.title')}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center" style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.8)' }}>
            {t('delegations.description')}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {delegations.map((delegation) => (
              <a
                key={delegation.id}
                href={delegation.mapUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[24px] border p-5"
                style={{ borderColor: 'rgba(245,244,223,0.2)' }}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-beige)', marginBottom: '0.35rem' }}>{delegation.city}</h3>
                <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.74)' }}>{delegation.address}</p>
                <p className="mt-2" style={{ fontFamily: 'var(--font-text)', color: 'var(--color-beige)' }}>{delegation.phone}</p>
              </a>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild className="joby-button blue px-8 py-6">
              <Link href="/contacto">
                {t('hero.cta_contact')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
