'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { brands } from '@/lib/data';
import { Product } from '@/lib/types';
import ProductDetailClient from './ProductDetailClient';
import { useAuthStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      // 🔐 SECURITY: Ya no verificamos localStorage, usamos estado de auth store
      if (!isAuthenticated) {
        toast.error('Debes iniciar sesión para ver los productos', {
          duration: 4000,
        });
        router.push('/area-clientes');
        return;
      }
      
      setAuthChecked(true);
    };

    checkAuth();
  }, [isAuthenticated, router]);

  // Cargar producto y relacionados desde el backend
  useEffect(() => {
    const fetchProduct = async () => {
      if (!authChecked) return;
      
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // 🔐 SECURITY: Usar fetch con credentials para enviar cookies HttpOnly
        const response = await fetch(`${API_URL}/api/productos`, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // 🔐 Envía cookies HttpOnly automáticamente
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.productos) {
            // Buscar el producto específico
            const foundProduct = data.productos.find((p: any) => 
              p.codigo === params.id
            );
            
            if (!foundProduct) {
              notFound();
              return;
            }

            // El producto ya viene con precio y descuento calculados
            const transformedProduct: Product = {
              id: foundProduct.codigo || '',
              name: foundProduct.nombre || '',
              category: foundProduct.categoria || 'general',
              brand: foundProduct.marca || 'general',
              price: parseFloat(foundProduct.precio) || 0,
              originalPrice: foundProduct.precioOriginal ? parseFloat(foundProduct.precioOriginal) : undefined,
              units: foundProduct.unidades || 'unidad',
              description: foundProduct.descripcion || '',
              image: foundProduct.imagen || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
              images: [
                'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800'
              ],
              inStock: true,
              discount: foundProduct.descuento || 0,
              featured: foundProduct.destacado || false,
              rating: 4.7,
              reviewCount: 156,
              features: [
                'Calidad premium garantizada',
                'Producto fresco',
                'Empaquetado al vacío',
                'Sin conservantes artificiales',
                'Trazabilidad completa'
              ],
              ingredients: 'Ingredientes principales de alta calidad seleccionados por nuestros expertos.',
              allergens: ['Consultar con el fabricante'],
              preparation: 'Preparar según instrucciones del envase.',
              storage: 'Conservar en lugar fresco y seco.',
              origin: 'España',
              weight: `${foundProduct.peso || 500}g`,
              nutritionalInfo: {
                calories: 95,
                protein: 20.1,
                fat: 1.2,
                carbohydrates: 0,
                sodium: 146
              },
              certifications: ['Certificado de Calidad'],
              tags: ['premium', 'calidad']
            };

            setProduct(transformedProduct);

            // Productos relacionados
            const related = data.productos
              .filter((p: any) => 
                p.codigo !== params.id && 
                (p.categoria === foundProduct.categoria || p.familia?.codigo === foundProduct.familia?.codigo)
              )
              .slice(0, 4)
              .map((p: any) => ({
                id: p.codigo || '',
                name: p.nombre || '',
                category: p.categoria || 'general',
                brand: p.marca || 'general',
                price: parseFloat(p.precio) || 0,
                originalPrice: p.precioOriginal ? parseFloat(p.precioOriginal) : undefined,
                units: p.unidades || 'unidad',
                description: p.descripcion || '',
                image: p.imagen || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
                inStock: true,
                discount: p.descuento || 0,
                featured: p.destacado || false
              }));

            setRelatedProducts(related);
          }
        } else if (response.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
          router.push('/area-clientes');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Error al cargar el producto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [authChecked, params.id, router]);

  // Pantalla de carga
  if (!authChecked || isLoading) {
    return (
      <div className="pds-page pds-cream min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-28">
        <div className="pds-form-surface max-w-md text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{ background: 'var(--pds-blue)', color: 'var(--pds-white)' }}
          >
            {!authChecked ? (
              <Lock className="w-10 h-10" />
            ) : (
              <LoadingSpinner size="lg" />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="pds-title mb-2" style={{ fontSize: '2.75rem', color: 'var(--pds-black)' }}>
              {!authChecked ? 'Verificando acceso...' : 'Cargando producto...'}
            </h2>
            <p className="pds-copy" style={{ color: 'rgb(14 22 32 / .72)' }}>
              {!authChecked ? 'Comprobando autenticación' : 'Obteniendo detalles del producto'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
    return null;
  }

  const currentBrand = brands.find(b => b.id === product.brand);

  return (
    <ProductDetailClient 
      product={product} 
      currentBrand={currentBrand}
      relatedProducts={relatedProducts}
    />
  );
}
