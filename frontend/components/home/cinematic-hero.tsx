'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

export function CinematicHero() {
  const t = useTranslations('hero');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(window.innerHeight, 1);
      const value = Math.min(1, Math.max(0, window.scrollY / max));
      setProgress(value);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const titleStyle = useMemo(
    () => ({
      transform: `translateY(${progress * -18}px)`,
      opacity: 1 - progress * 0.35,
    }),
    [progress]
  );

  return (
    <section
      className="section-hero-media relative overflow-hidden"
      style={{ minHeight: '100vh', paddingBottom: '10vh' }}
    >
      <div
        className="media-wrapper absolute inset-0"
        style={{ transform: `translateY(${progress * 140}px)` }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/clone/videos/compressed-home-intro-desktop-r3.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center px-6 text-center">
        <Image
          src="/clone/images/logo-animated-256.webp"
          alt="Granja Mari Pepa"
          width={170}
          height={60}
          priority
          className="mb-8 h-auto w-[170px]"
        />

        <div style={titleStyle}>
          <h1
            style={{
              color: 'var(--color-beige)',
              textShadow: '0 12px 28px rgba(0, 0, 0, 0.4)',
            }}
          >
            {t('title')}
          </h1>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
              color: 'rgba(245, 244, 223, 0.92)',
              lineHeight: 1.45,
            }}
          >
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button asChild className="joby-button blue px-8 py-6 text-base">
            <Link href="/productos">
              {t('viewProducts')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="joby-button px-8 py-6 text-base">
            <Link href="/contacto">{t('contactUs')}</Link>
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
        <span
          style={{
            fontFamily: 'var(--font-text)',
            color: 'rgba(245,244,223,0.7)',
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {t('scroll_down')}
        </span>
      </div>
    </section>
  );
}
