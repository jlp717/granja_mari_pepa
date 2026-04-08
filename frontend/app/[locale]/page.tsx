import { CinematicHero } from '@/components/home/cinematic-hero';
import { ProductCategories } from '@/components/home/product-categories';
import { DistributorsSection } from '@/components/home/distributors-section';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <CinematicHero />
      <div id="productos-section">
        <ProductCategories />
      </div>
      <DistributorsSection />
    </main>
  );
}
