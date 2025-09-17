import { HeroSection } from '@/components/home/hero-section';
import { ProductCategories } from '@/components/home/product-categories';
import { DistributorsSection } from '@/components/home/distributors-section';
import { DelegationsSection } from '@/components/home/delegations-section';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <div id="productos-section">
        <ProductCategories />
      </div>
      <DistributorsSection />
      <DelegationsSection />
    </main>
  );
}