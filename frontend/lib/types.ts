export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  units: string;
  description: string;
  image: string;
  images?: string[]; // Multiple images for carousel
  inStock: boolean;
  discount?: number;
  featured?: boolean;
  rating?: number; // Average rating (1-5)
  reviewCount?: number; // Number of reviews
  features?: string[]; // Product features list
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    sodium?: number;
  };
  ingredients?: string;
  allergens?: string[];
  preparation?: string;
  storage?: string;
  origin?: string;
  weight?: string;
  dimensions?: string;
  tags?: string[]; // For filtering and related products
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total: number;
  items: CartItem[];
}

export interface Invoice {
  id: string;
  orderId: string;
  date: string;
  total: number;
  status: 'pending' | 'paid';
  downloadUrl: string;
}

export interface ContactForm {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mensaje: string;
  privacidad: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
}