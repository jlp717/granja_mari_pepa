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
      // Add more sample images
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    rating: 4.7,
    reviewCount: 156,
    features: [
      'Calidad premium garantizada',
      'Producto fresco congelado',
      'Empaquetado al vacío',
      'Sin conservantes artificiales',
      'Trazabilidad completa'
    ],
    ingredients: 'Ingredientes principales de alta calidad seleccionados por nuestros expertos.',
    allergens: ['Gluten', 'Lácteos'],
    preparation: 'Descongelar en refrigerador 2-3 horas antes del consumo.',
    storage: 'Conservar a -18°C. No recongelar.',
    origin: 'España',
    weight: '500g',
    tags: ['premium', 'congelado', 'calidad']
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