'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Truck, 
  Shield, 
  Award,
  Info,
  Clock,
  Thermometer,
  Package,
  Users,
  ArrowLeft,
  Plus,
  Minus,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore, useFavoritesStore } from '@/lib/store';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Mock reviews data
const mockReviews = [
  {
    id: '1',
    productId: '1',
    userName: 'María García',
    rating: 5,
    comment: 'Producto excelente, fresco y de muy buena calidad. Lo recomiendo totalmente.',
    date: '2024-01-15',
    verified: true
  },
  {
    id: '2',
    productId: '1',
    userName: 'José Martínez',
    rating: 4,
    comment: 'Muy buena calidad precio. El sabor es excepcional.',
    date: '2024-01-10',
    verified: true
  },
  {
    id: '3',
    productId: '1',
    userName: 'Ana López',
    rating: 5,
    comment: 'Llevo años comprando este producto y nunca decepciona. Perfecto para la familia.',
    date: '2024-01-05',
    verified: false
  }
];

gsap.registerPlugin(ScrollTrigger);

interface ProductDetailClientProps {
  product: Product;
  currentBrand?: any;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, currentBrand, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  
  // Debug: Log the received product
  console.log('ProductDetailClient received product:', product);
  
  // Cart store
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite: isProductFavorite } = useFavoritesStore();
  
  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedTab, setSelectedTab] = useState('description');
  
  const imageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(heroRef.current, {
        opacity: 0,
        y: 50
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      });

      // Details animation
      gsap.fromTo(detailsRef.current?.children || [], {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.3,
        ease: 'power2.out'
      });

      // Reviews animation on scroll
      gsap.fromTo(reviewsRef.current, {
        opacity: 0,
        y: 40
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: reviewsRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantityInput(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setQuantity(numValue);
    }
  };

  const handleQuantityInputBlur = () => {
    const numValue = parseInt(quantityInput);
    if (isNaN(numValue) || numValue <= 0) {
      setQuantity(1);
      setQuantityInput('1');
    }
  };

  // Helper function to create a clean product object without circular references
  const createCleanProduct = (prod: Product): Product => {
    console.log('Creating clean product from:', prod.name, 'Price:', prod.price);
    return {
      id: prod.id || '',
      name: prod.name || '',
      category: prod.category || '',
      brand: prod.brand,
      price: typeof prod.price === 'number' ? prod.price : 0,
      originalPrice: prod.originalPrice,
      units: prod.units || '',
      description: prod.description || '',
      image: prod.image || '',
      images: prod.images,
      inStock: prod.inStock !== false, // Default to true if undefined
      discount: prod.discount,
      featured: prod.featured,
      rating: prod.rating,
      reviewCount: prod.reviewCount,
      features: prod.features,
      nutritionalInfo: prod.nutritionalInfo,
      ingredients: prod.ingredients,
      allergens: prod.allergens,
      preparation: prod.preparation,
      storage: prod.storage,
      origin: prod.origin,
      weight: prod.weight,
      dimensions: prod.dimensions,
      tags: prod.tags
    };
  };

  const addToCart = (productToAdd = product, quantityToAdd = quantity) => {
    try {
      if (!productToAdd) {
        console.error('Product is undefined');
        toast.error('Error al añadir producto', {
          description: 'No se pudo añadir el producto al carrito',
          duration: 3000,
        });
        return;
      }

      console.log('Original product:', productToAdd);
      console.log('Product name:', productToAdd.name);
      console.log('Product price:', productToAdd.price);
      console.log('Adding to cart:', productToAdd.name, 'Quantity:', quantityToAdd);
      
      // Create clean product object to avoid circular references
      const cleanProduct = createCleanProduct(productToAdd);
      console.log('Clean product created:', cleanProduct);
      console.log('Clean product name:', cleanProduct.name);
      console.log('Clean product price:', cleanProduct.price);
      
      // Add to cart store
      addItem(cleanProduct, quantityToAdd);
      console.log('Added to store successfully');
      
      // Modern and beautiful toast notification - top right
      toast.success(`¡${productToAdd.name || 'Producto'} añadido al carrito! ✅`, {
        description: `${quantityToAdd} unidad${quantityToAdd > 1 ? 'es' : ''} añadida${quantityToAdd > 1 ? 's' : ''} con éxito`,
        duration: 4000,
        position: 'top-right',
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
        },
        action: {
          label: "Ver carrito 🛒",
          onClick: () => {
            const { toggleCart } = useCartStore.getState();
            toggleCart();
          }
        }
      });
      console.log('Toast triggered');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al añadir producto al carrito');
    }
  };

  const handleToggleFavorite = () => {
    try {
      toggleFavorite(product.id);
      const isFavorite = isProductFavorite(product.id);
      
      toast.success(
        !isFavorite 
          ? `${product.name} eliminado de favoritos` 
          : `¡${product.name} añadido a favoritos!`, 
        {
          duration: 2000,
        }
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favoritos', {
        duration: 2000,
      });
    }
  };

  const productImages = product.images || [product.image];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
      
      <div className="relative z-10 pt-56 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-white hover:text-white transition-all duration-300 group shadow-lg"
            whileHover={{ x: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Volver a productos</span>
          </motion.button>

          <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative group">
                <motion.div
                  ref={imageRef}
                  className="relative aspect-square rounded-3xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10"
                  onMouseMove={handleImageZoom}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-500",
                      isZoomed && "scale-150 cursor-move"
                    )}
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                          }
                        : {}
                    }
                  />
                  
                  {/* Zoom Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/95 hover:bg-white border-gray-200 text-gray-800 hover:text-gray-900 shadow-lg backdrop-blur-sm w-10 h-10 p-0"
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? "Zoom Out" : "Zoom In"}
                    >
                      {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                    </Button>
                    {isZoomed && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-700 shadow-lg border border-gray-200"
                      >
                        Mueve el ratón para explorar
                      </motion.div>
                    )}
                  </div>

                  {/* Image Navigation */}
                  {productImages.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-gray-200 text-gray-800 hover:text-gray-900 shadow-lg backdrop-blur-sm w-10 h-10 p-0 rounded-full"
                        onClick={() => setSelectedImageIndex(selectedImageIndex === 0 ? productImages.length - 1 : selectedImageIndex - 1)}
                        title="Imagen anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-gray-200 text-gray-800 hover:text-gray-900 shadow-lg backdrop-blur-sm w-10 h-10 p-0 rounded-full"
                        onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % productImages.length)}
                        title="Imagen siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-gray-800 font-medium shadow-lg border border-gray-200">
                        {selectedImageIndex + 1} / {productImages.length}
                      </div>
                    </>
                  )}

                  {/* Discount Badge */}
                  {product.discount && (
                    <motion.div
                      className="absolute top-4 left-4"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-lg font-bold">
                        -{product.discount}%
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>

                {/* Thumbnail Gallery */}
                {productImages.length > 1 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto">
                    {productImages.map((image, index) => (
                      <motion.button
                        key={index}
                        className={cn(
                          "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                          selectedImageIndex === index 
                            ? "border-purple-400 ring-2 ring-purple-400/50" 
                            : "border-white/20 hover:border-white/40"
                        )}
                        onClick={() => setSelectedImageIndex(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div ref={detailsRef} className="space-y-6">
              {/* Brand and Category */}
              <div className="flex items-center gap-3 flex-wrap">
                {currentBrand && (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {currentBrand.name}
                  </Badge>
                )}
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {product.category}
                </Badge>
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-400/30">
                    <Award className="w-3 h-3 mr-1" />
                    Destacado
                  </Badge>
                )}
              </div>

              {/* Title and Rating */}
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">{product.name}</h1>
                {product.rating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-5 h-5",
                            i < Math.floor(product.rating!) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-400"
                          )}
                        />
                      ))}
                      <span className="text-white font-semibold ml-2">{product.rating}</span>
                    </div>
                    <span className="text-blue-300">
                      ({product.reviewCount} reseñas)
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    €{product.price.toFixed(2)}
                  </span>
                  <span className="text-lg text-blue-300">/ {product.units}</span>
                </div>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    €{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  product.inStock ? "bg-green-400" : "bg-red-400"
                )} />
                <span className={cn(
                  "font-medium",
                  product.inStock ? "text-green-400" : "text-red-400"
                )}>
                  {product.inStock ? 'En stock' : 'Agotado'}
                </span>
              </div>

              {/* Description */}
              <p className="text-blue-100/80 text-lg leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              {product.features && (
                <div className="space-y-2">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Características
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-blue-200">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <label className="text-white font-medium">Cantidad:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/95 border-gray-300 text-gray-800 hover:bg-white hover:text-gray-900 shadow-md w-10 h-10 p-0 rounded-lg"
                      onClick={() => {
                        const newQuantity = Math.max(1, quantity - 1);
                        setQuantity(newQuantity);
                        setQuantityInput(newQuantity.toString());
                      }}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={quantityInput}
                      onChange={handleQuantityInputChange}
                      onBlur={handleQuantityInputBlur}
                      className="w-20 text-center bg-white/95 border-gray-300 text-gray-800 font-semibold rounded-lg"
                      min="1"
                    />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/95 border-gray-300 text-gray-800 hover:bg-white hover:text-gray-900 shadow-md w-10 h-10 p-0 rounded-lg"
                      onClick={() => {
                        const newQuantity = quantity + 1;
                        setQuantity(newQuantity);
                        setQuantityInput(newQuantity.toString());
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                    onClick={() => addToCart()}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Añadir al carrito
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/95 border-gray-300 text-gray-800 hover:bg-white hover:text-gray-900 shadow-md px-4 py-6 rounded-xl"
                      onClick={handleToggleFavorite}
                    >
                      <Heart className={cn("w-5 h-5", isProductFavorite(product.id) && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/95 border-gray-300 text-gray-800 hover:bg-white hover:text-gray-900 shadow-md px-4 py-6 rounded-xl"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 pt-6">
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <Truck className="w-4 h-4 text-green-400" />
                  Envío gratuito
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Garantía de calidad
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <Award className="w-4 h-4 text-purple-400" />
                  Producto premium
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-16"
          >
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
                <TabsTrigger value="description" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-blue-200">
                  Descripción
                </TabsTrigger>
                <TabsTrigger value="ingredients" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-blue-200">
                  Ingredientes
                </TabsTrigger>
                <TabsTrigger value="preparation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-blue-200">
                  Preparación
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-blue-200">
                  Reseñas
                </TabsTrigger>
              </TabsList>

              <div className="mt-8">
                <TabsContent value="description" className="space-y-6">
                  <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-400" />
                        Información del producto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-blue-100/80 text-lg leading-relaxed">
                        {product.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.origin && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Package className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm text-blue-300">Origen</div>
                              <div className="text-white font-medium">{product.origin}</div>
                            </div>
                          </div>
                        )}
                        
                        {product.weight && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Package className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm text-blue-300">Peso</div>
                              <div className="text-white font-medium">{product.weight}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-6">
                  <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-400" />
                        Ingredientes y alérgenos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Ingredientes:</h4>
                        <p className="text-blue-100/80">{product.ingredients}</p>
                      </div>
                      
                      {product.allergens && product.allergens.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Alérgenos:</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.allergens.map((allergen, index) => (
                              <Badge key={index} variant="destructive" className="bg-red-500/20 text-red-300 border border-red-400/30">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preparation" className="space-y-6">
                  <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-400" />
                        Preparación y conservación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.preparation && (
                        <div>
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            Preparación:
                          </h4>
                          <p className="text-blue-100/80">{product.preparation}</p>
                        </div>
                      )}
                      
                      {product.storage && (
                        <div>
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-blue-400" />
                            Conservación:
                          </h4>
                          <p className="text-blue-100/80">{product.storage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <div ref={reviewsRef}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-6 h-6 text-yellow-400" />
                        Reseñas de clientes
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-5 h-5",
                                i < Math.floor(product.rating || 0) 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-gray-400"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-white font-semibold">{product.rating}</span>
                        <span className="text-blue-300">({product.reviewCount} reseñas)</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {mockReviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {review.userName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-semibold">{review.userName}</span>
                                      {review.verified && (
                                        <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs">
                                          <Shield className="w-3 h-3 mr-1" />
                                          Verificado
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={cn(
                                              "w-4 h-4",
                                              i < review.rating 
                                                ? "fill-yellow-400 text-yellow-400" 
                                                : "text-gray-400"
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-blue-300">{review.date}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-blue-100/80">{review.comment}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-8"
            >
              <h3 className="text-3xl font-bold text-white text-center">
                Productos que también te pueden interesar
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct, index) => (
                  <motion.div
                    key={relatedProduct.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-400/30 transition-all duration-300 overflow-hidden relative h-full flex flex-col">
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={relatedProduct.image}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
                        {/* Quick Action Buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button
                            size="sm"
                            className="bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 shadow-lg border border-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/productos/${relatedProduct.id}`);
                            }}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(relatedProduct, 1);
                            }}
                            title="Añadir al carrito"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Discount Badge */}
                        {relatedProduct.discount && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 text-xs font-bold">
                              -{relatedProduct.discount}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-white font-semibold mb-2 line-clamp-2 cursor-pointer" onClick={() => router.push(`/productos/${relatedProduct.id}`)}>
                            {relatedProduct.name}
                          </h4>
                        </div>
                        
                        <div className="mt-auto space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-green-400 font-bold text-lg">
                                €{relatedProduct.price.toFixed(2)}
                              </span>
                              {relatedProduct.originalPrice && (
                                <span className="text-gray-400 line-through text-sm">
                                  €{relatedProduct.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {relatedProduct.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-blue-200">{relatedProduct.rating}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Stock indicator */}
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              relatedProduct.inStock ? "bg-green-400" : "bg-red-400"
                            )} />
                            <span className={cn(
                              "text-xs font-medium",
                              relatedProduct.inStock ? "text-green-400" : "text-red-400"
                            )}>
                              {relatedProduct.inStock ? 'En stock' : 'Agotado'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}