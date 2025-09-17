export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  units: string;
  description: string;
  image: string;
  inStock: boolean;
  discount?: number;
  featured?: boolean;
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