// @todo F2: Rediseñar home con HeroPinned + CategoryEditorial + BrandsEditorial + HistoryStory
// @see DESIGN.md §9.3, REDESIGN_EXECUTION.md §F2
import { CinematicHero } from '@/components/home/cinematic-hero';
import { ProductCategories } from '@/components/home/product-categories';
import { DistributorsSection } from '@/components/home/distributors-section';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    // @todo F1: bg cambiará a --color-bg-page (#F4EFE6) cuando se apliquen tokens
    <main className="min-h-screen bg-[#0a0a0a]">
      <CinematicHero />
      <div id="productos-section">
        <ProductCategories />
      </div>
      <DistributorsSection />
    </main>
  );
}