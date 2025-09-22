import { notFound } from 'next/navigation';
import { products, brands } from '@/lib/data';
import { Product } from '@/lib/types';
import ProductDetailClient from './ProductDetailClient';

// Generate static params for static export
export function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const foundProduct = products.find(p => p.id === params.id);
  
  if (!foundProduct) {
    notFound();
  }

  // Enhance product with additional data for demo
  const enhancedProduct: Product = {
    ...foundProduct,
    images: [
      foundProduct.image,
      // Add more realistic product images
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    rating: 4.7,
    reviewCount: 156,
    features: [
      'Calidad premium garantizada',
      'Producto fresco congelado',
      'Empaquetado al vacío',
      'Sin conservantes artificiales',
      'Trazabilidad completa',
      'Proceso de congelación IQF',
      'Certificación ISO 22000',
      'Pesca sostenible'
    ],
    ingredients: 'Ingredientes principales de alta calidad seleccionados por nuestros expertos. Producto marino fresco, agua, sal marina, sin aditivos químicos.',
    allergens: ['Pescado', 'Puede contener trazas de crustáceos'],
    preparation: 'Descongelar en refrigerador 2-3 horas antes del consumo. Cocinar hasta alcanzar 75°C en el centro.',
    storage: 'Conservar a -18°C. No recongelar. Una vez descongelado, consumir en 24 horas.',
    origin: 'Océano Atlántico - España',
    weight: '500g',
    nutritionalInfo: {
      calories: 95,
      protein: 20.1,
      fat: 1.2,
      carbohydrates: 0,
      sodium: 146
    },
    certifications: ['MSC', 'ISO 22000', 'BRC', 'Certificado Ecológico'],
    tags: ['premium', 'congelado', 'calidad', 'sostenible', 'sin-gluten']
  };

  const currentBrand = brands.find(b => b.id === enhancedProduct.brand);
  const relatedProducts = products
    .filter(p => 
      p.id !== enhancedProduct.id && 
      (p.category === enhancedProduct.category || p.brand === enhancedProduct.brand)
    )
    .slice(0, 4);

  return (
    <ProductDetailClient 
      product={enhancedProduct} 
      currentBrand={currentBrand}
      relatedProducts={relatedProducts}
    />
  );
}