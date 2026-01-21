import { unstable_setRequestLocale } from 'next-intl/server';
import { CinematicHero } from '@/components/home/cinematic-hero';
import { ProductCategories } from '@/components/home/product-categories';
import { DistributorsSection } from '@/components/home/distributors-section';

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <CinematicHero />
      <div id="productos-section">
        <ProductCategories />
      </div>
      <DistributorsSection />
    </main>
  );
}