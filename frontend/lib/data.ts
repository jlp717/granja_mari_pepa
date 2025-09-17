import { Product, Order, Invoice } from './types';

export const productCategories = [
  {
    id: 'mar',
    name: 'Productos del mar',
    description: 'Pescados y mariscos frescos de la más alta calidad',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: '🐟'
  },
  {
    id: 'carne',
    name: 'Carne',
    description: 'Carnes selectas y productos cárnicos premium',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: '🥩'
  },
  {
    id: 'precocinados',
    name: 'Precocinados',
    description: 'Platos preparados listos para consumir',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: '🍽️'
  },
  {
    id: 'reposteria',
    name: 'Repostería',
    description: 'Dulces y postres artesanales',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: '🧁'
  }
];

export const distributors = [
  {
    id: 'grupo-topgel',
    name: 'Grupo Topgel',
    description: 'Distribuidor líder en productos congelados',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600',
    size: 'normal'
  },
  {
    id: 'nestle',
    name: 'Nestlé',
    description: 'Productos de alimentación de calidad mundial',
    image: 'https://images.pexels.com/photos/4109942/pexels-photo-4109942.jpeg?auto=compress&cs=tinysrgb&w=800',
    size: 'large'
  },
  {
    id: 'panamar',
    name: 'Panamar',
    description: 'Especialistas en productos del mar',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    size: 'large'
  },
  {
    id: 'okin',
    name: 'Okin',
    description: 'Productos cárnicos de primera calidad',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=600',
    size: 'normal'
  },
  {
    id: 'amparin',
    name: 'Pastelería Amparín',
    description: 'Repostería tradicional y moderna',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
    size: 'normal'
  }
];

export const delegations = [
  {
    id: 'murcia',
    city: 'Murcia',
    address: 'Polígono Industrial Oeste, Calle 15, Nave 8, 30169 San Ginés, Murcia',
    phone: '+34 968 123 456',
    coordinates: { lat: 37.9922, lng: -1.1307 }
  },
  {
    id: 'almeria',
    city: 'Almería',
    address: 'Carretera de Níjar km 15, Polígono La Redonda, 04120 Almería',
    phone: '+34 950 987 654',
    coordinates: { lat: 36.8381, lng: -2.4597 }
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Langostinos Congelados Premium',
    category: 'mar',
    price: 24.99,
    originalPrice: 29.99,
    units: 'kg',
    description: 'Langostinos de primera calidad, congelados IQF para mantener toda su frescura y sabor.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 17,
    featured: true
  },
  {
    id: '2',
    name: 'Solomillo de Ternera',
    category: 'carne',
    price: 32.50,
    units: 'kg',
    description: 'Solomillo de ternera lechal, tierno y jugoso, perfecto para ocasiones especiales.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    featured: true
  },
  {
    id: '3',
    name: 'Croquetas de Jamón Caseras',
    category: 'precocinados',
    price: 8.99,
    originalPrice: 10.99,
    units: '12 unidades',
    description: 'Croquetas artesanales de jamón ibérico, elaboradas según receta tradicional.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 18
  },
  {
    id: '4',
    name: 'Tarta de Chocolate Artesanal',
    category: 'reposteria',
    price: 18.50,
    units: '8 porciones',
    description: 'Deliciosa tarta de chocolate belga con crema de mantequilla y cobertura de cacao.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '5',
    name: 'Pulpo Gallego Cocido',
    category: 'mar',
    price: 19.99,
    units: 'kg',
    description: 'Pulpo gallego cocido al punto perfecto, listo para servir con aceite de oliva y pimentón.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: false
  },
  {
    id: '6',
    name: 'Entrecot de Buey Madurado',
    category: 'carne',
    price: 28.75,
    units: 'kg',
    description: 'Entrecot de buey madurado 21 días, con un sabor intenso y textura excepcional.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  }
];

export const sampleOrders: Order[] = [
  {
    id: 'PED-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 127.48,
    items: [
      { product: products[0], quantity: 2 },
      { product: products[1], quantity: 1 }
    ]
  },
  {
    id: 'PED-2024-002',
    date: '2024-01-20',
    status: 'processing',
    total: 89.99,
    items: [
      { product: products[2], quantity: 3 },
      { product: products[3], quantity: 2 }
    ]
  }
];

export const sampleInvoices: Invoice[] = [
  {
    id: 'FAC-2024-001',
    orderId: 'PED-2024-001',
    date: '2024-01-15',
    total: 127.48,
    status: 'paid',
    downloadUrl: '/facturas/FAC-2024-001.pdf'
  },
  {
    id: 'FAC-2024-002',
    orderId: 'PED-2024-002',
    date: '2024-01-20',
    total: 89.99,
    status: 'pending',
    downloadUrl: '/facturas/FAC-2024-002.pdf'
  }
];