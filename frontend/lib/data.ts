import { Product, Order, Invoice } from './types';

// Estructura jerárquica de marcas y categorías
export const brands = [
  {
    id: 'grupo-topgel',
    name: 'Grupo Topgel',
    description: 'Distribuidor líder en productos congelados de alta calidad',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600',
    color: 'blue',
    subcategories: [
      {
        id: 'mar',
        name: 'Productos del mar',
        description: 'Pescados y mariscos frescos congelados de la más alta calidad',
        image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🐟'
      },
      {
        id: 'carne',
        name: 'Carne',
        description: 'Carnes selectas y productos cárnicos premium congelados',
        image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🥩'
      },
      {
        id: 'precocinados',
        name: 'Precocinados',
        description: 'Platos preparados congelados listos para consumir',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🍽️'
      },
      {
        id: 'reposteria',
        name: 'Repostería',
        description: 'Dulces y postres artesanales congelados',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🧁'
      }
    ]
  },
  {
    id: 'nestle',
    name: 'Nestlé',
    description: 'Productos de alimentación de calidad mundial y confianza familiar',
    image: 'https://images.pexels.com/photos/4109942/pexels-photo-4109942.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'red',
    subcategories: [
      {
        id: 'lacteos',
        name: 'Lácteos',
        description: 'Leches, yogures y productos lácteos premium',
        image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🥛'
      },
      {
        id: 'cereales',
        name: 'Cereales',
        description: 'Cereales nutritivos para toda la familia',
        image: 'https://images.pexels.com/photos/5644860/pexels-photo-5644860.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🥣'
      },
      {
        id: 'chocolate',
        name: 'Chocolate',
        description: 'Chocolates y productos de cacao de primera calidad',
        image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🍫'
      }
    ]
  },
  {
    id: 'panamar',
    name: 'Panamar',
    description: 'Especialistas en productos del mar frescos y de temporada',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'cyan',
    subcategories: [
      {
        id: 'pescado-fresco',
        name: 'Pescado Fresco',
        description: 'Pescados frescos del día, captura sostenible',
        image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🐠'
      },
      {
        id: 'mariscos',
        name: 'Mariscos',
        description: 'Mariscos selectos y crustáceos de primera',
        image: 'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🦐'
      }
    ]
  },
  {
    id: 'okin',
    name: 'Okin',
    description: 'Productos cárnicos de primera calidad y tradición familiar',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=600',
    color: 'amber',
    subcategories: [
      {
        id: 'carne-fresca',
        name: 'Carne Fresca',
        description: 'Carnes frescas de alta calidad y trazabilidad',
        image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🥩'
      },
      {
        id: 'embutidos',
        name: 'Embutidos',
        description: 'Embutidos artesanales y chacinas tradicionales',
        image: 'https://images.pexels.com/photos/4202479/pexels-photo-4202479.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🌭'
      }
    ]
  },
  {
    id: 'amparin',
    name: 'Pastelería Amparín',
    description: 'Repostería tradicional y moderna, elaboración artesanal',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
    color: 'pink',
    subcategories: [
      {
        id: 'tartas',
        name: 'Tartas',
        description: 'Tartas artesanales para toda ocasión',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🎂'
      },
      {
        id: 'bolleria',
        name: 'Bollería',
        description: 'Pan dulce y bollería tradicional',
        image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
        icon: '🥐'
      }
    ]
  }
];

// Compatibilidad con estructura anterior
export const productCategories = brands.flatMap(brand => 
  brand.subcategories.map(subcat => ({
    ...subcat,
    brandId: brand.id,
    brandName: brand.name
  }))
);

export const distributors = brands.map(brand => ({
  id: brand.id,
  name: brand.name,
  description: brand.description,
  image: brand.image,
  size: brand.id === 'nestle' || brand.id === 'panamar' ? 'large' : 'normal'
}));

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
    brand: 'grupo-topgel',
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
    category: 'carne-fresca',
    brand: 'okin',
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
    brand: 'grupo-topgel',
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
    category: 'tartas',
    brand: 'amparin',
    price: 18.50,
    units: '8 porciones',
    description: 'Deliciosa tarta de chocolate belga con crema de mantequilla y cobertura de cacao.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '5',
    name: 'Pulpo Gallego Cocido',
    category: 'mariscos',
    brand: 'panamar',
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
    brand: 'grupo-topgel',
    price: 28.75,
    units: 'kg',
    description: 'Entrecot de buey madurado 21 días, con un sabor intenso y textura excepcional.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '7',
    name: 'Cereales Fitness Nestlé',
    category: 'cereales',
    brand: 'nestle',
    price: 4.50,
    units: '500g',
    description: 'Cereales integrales con fibra y vitaminas, perfectos para un desayuno saludable.',
    image: 'https://images.pexels.com/photos/5644860/pexels-photo-5644860.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    featured: true
  },
  {
    id: '8',
    name: 'Chorizo Ibérico Artesano',
    category: 'embutidos',
    brand: 'okin',
    price: 12.90,
    units: '200g',
    description: 'Chorizo ibérico curado de forma tradicional, elaborado con las mejores carnes.',
    image: 'https://images.pexels.com/photos/4202479/pexels-photo-4202479.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '9',
    name: 'Croissant Artesanal',
    category: 'bolleria',
    brand: 'amparin',
    price: 2.50,
    units: 'unidad',
    description: 'Croissant de mantequilla elaborado artesanalmente cada mañana.',
    image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '10',
    name: 'Chocolate Negro 70% Cacao',
    category: 'chocolate',
    brand: 'nestle',
    price: 3.20,
    originalPrice: 3.80,
    units: '100g',
    description: 'Chocolate negro premium con 70% de cacao, intenso sabor y textura sedosa.',
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 16
  },
  {
    id: '11',
    name: 'Gambas Rojas Premium',
    category: 'mar',
    brand: 'grupo-topgel',
    price: 34.99,
    units: 'kg',
    description: 'Gambas rojas de Huelva, frescas y de gran tamaño.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    featured: true
  },
  {
    id: '12',
    name: 'Filetes de Merluza',
    category: 'mar',
    brand: 'panamar',
    price: 16.50,
    originalPrice: 19.90,
    units: 'kg',
    description: 'Filetes de merluza fresca, sin piel ni espinas.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 17
  },
  {
    id: '13',
    name: 'Chuletas de Cordero',
    category: 'carne',
    brand: 'okin',
    price: 22.80,
    units: 'kg',
    description: 'Chuletas de cordero lechal, tiernas y sabrosas.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '14',
    name: 'Tarta de Fresas',
    category: 'tartas',
    brand: 'amparin',
    price: 21.00,
    units: '10 porciones',
    description: 'Tarta de bizcocho con crema pastelera y fresas naturales.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '15',
    name: 'Cereales Chocapic',
    category: 'cereales',
    brand: 'nestle',
    price: 3.90,
    originalPrice: 4.50,
    units: '375g',
    description: 'Cereales de trigo y maíz con chocolate, el favorito de los niños.',
    image: 'https://images.pexels.com/photos/5644860/pexels-photo-5644860.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 13
  },
  {
    id: '16',
    name: 'Almejas Gallegas',
    category: 'mariscos',
    brand: 'panamar',
    price: 8.90,
    units: 'kg',
    description: 'Almejas gallegas frescas, perfectas para arroz o pasta.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: false
  },
  {
    id: '17',
    name: 'Pizza Congelada 4 Quesos',
    category: 'precocinados',
    brand: 'grupo-topgel',
    price: 5.99,
    units: '400g',
    description: 'Pizza artesanal congelada con mozzarella, gorgonzola, parmesano y gouda.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '18',
    name: 'Jamón Serrano Reserva',
    category: 'embutidos',
    brand: 'okin',
    price: 28.50,
    units: 'kg',
    description: 'Jamón serrano curado 18 meses, sabor intenso y textura perfecta.',
    image: 'https://images.pexels.com/photos/4202479/pexels-photo-4202479.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    featured: true
  },
  {
    id: '19',
    name: 'Croissants de Chocolate',
    category: 'bolleria',
    brand: 'amparin',
    price: 3.20,
    units: '2 unidades',
    description: 'Croissants rellenos de chocolate belga, horneados diariamente.',
    image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '20',
    name: 'KitKat Original',
    category: 'chocolate',
    brand: 'nestle',
    price: 1.50,
    units: '45g',
    description: 'El clásico KitKat de barquillos crujientes cubiertos de chocolate con leche.',
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '21',
    name: 'Bacalao Salado Premium',
    category: 'mar',
    brand: 'panamar',
    price: 26.90,
    originalPrice: 32.00,
    units: 'kg',
    description: 'Bacalao salado tradicional, desalado listo para cocinar.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 16
  },
  {
    id: '22',
    name: 'Salmón Ahumado',
    category: 'mar',
    brand: 'grupo-topgel',
    price: 18.99,
    units: '200g',
    description: 'Salmón noruego ahumado en frío, loncheado fino.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '23',
    name: 'Pollo de Corral Entero',
    category: 'carne',
    brand: 'okin',
    price: 12.50,
    units: '1.5 kg aprox.',
    description: 'Pollo de corral criado en libertad, alimentado con cereales naturales.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '24',
    name: 'Tarta de Zanahoria',
    category: 'tartas',
    brand: 'amparin',
    price: 19.50,
    units: '8 porciones',
    description: 'Tarta de zanahoria con especias y cobertura de queso crema.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '25',
    name: 'Yogur Natural Griego',
    category: 'lacteos',
    brand: 'nestle',
    price: 4.20,
    units: '1kg',
    description: 'Yogur griego cremoso y natural, rico en proteínas.',
    image: 'https://images.pexels.com/photos/5644860/pexels-photo-5644860.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '26',
    name: 'Mejillones en Escabeche',
    category: 'mariscos',
    brand: 'panamar',
    price: 6.50,
    originalPrice: 7.80,
    units: '500g',
    description: 'Mejillones gallegos en escabeche artesanal.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 17
  },
  {
    id: '27',
    name: 'Lasaña Boloñesa',
    category: 'precocinados',
    brand: 'grupo-topgel',
    price: 7.99,
    units: '600g',
    description: 'Lasaña casera con carne de ternera y salsa boloñesa.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '28',
    name: 'Lomo Embuchado Ibérico',
    category: 'embutidos',
    brand: 'okin',
    price: 24.90,
    units: '500g',
    description: 'Lomo embuchado de cerdo ibérico, curado al aire libre.',
    image: 'https://images.pexels.com/photos/4202479/pexels-photo-4202479.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '29',
    name: 'Magdalenas Caseras',
    category: 'bolleria',
    brand: 'amparin',
    price: 4.50,
    units: '6 unidades',
    description: 'Magdalenas esponjosas hechas con aceite de oliva.',
    image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '30',
    name: 'Smarties Tubo',
    category: 'chocolate',
    brand: 'nestle',
    price: 2.10,
    units: '130g',
    description: 'Chocolates Smarties de colores en su clásico tubo.',
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '31',
    name: 'Rodaballo Fresco',
    category: 'mar',
    brand: 'panamar',
    price: 29.50,
    units: 'kg',
    description: 'Rodaballo fresco de las rías gallegas, pescado del día.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    featured: true
  },
  {
    id: '32',
    name: 'Costillas de Cerdo BBQ',
    category: 'carne',
    brand: 'grupo-topgel',
    price: 15.99,
    originalPrice: 18.99,
    units: 'kg',
    description: 'Costillas de cerdo marinadas con salsa BBQ.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 16
  },
  {
    id: '33',
    name: 'Secreto Ibérico',
    category: 'carne',
    brand: 'okin',
    price: 19.80,
    units: 'kg',
    description: 'Secreto de cerdo ibérico, jugoso y con gran sabor.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '34',
    name: 'Tarta Red Velvet',
    category: 'tartas',
    brand: 'amparin',
    price: 23.50,
    units: '12 porciones',
    description: 'Tarta Red Velvet con frosting de queso crema.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '35',
    name: 'Leche Entera',
    category: 'lacteos',
    brand: 'nestle',
    price: 1.20,
    units: '1L',
    description: 'Leche entera pasteurizada, rica en calcio y vitaminas.',
    image: 'https://images.pexels.com/photos/5644860/pexels-photo-5644860.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '36',
    name: 'Percebes Gallegos',
    category: 'mariscos',
    brand: 'panamar',
    price: 45.00,
    units: 'kg',
    description: 'Percebes de la Costa da Morte, manjar gallego por excelencia.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: false
  },
  {
    id: '37',
    name: 'Empanada Gallega',
    category: 'precocinados',
    brand: 'grupo-topgel',
    price: 12.50,
    units: '1.2 kg',
    description: 'Empanada gallega tradicional de atún y pimientos.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '38',
    name: 'Salchichón Extra',
    category: 'embutidos',
    brand: 'okin',
    price: 16.90,
    originalPrice: 19.90,
    units: '400g',
    description: 'Salchichón extra de primera calidad, curado lentamente.',
    image: 'https://images.pexels.com/photos/4202479/pexels-photo-4202479.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    discount: 15
  },
  {
    id: '39',
    name: 'Pan Integral Artesano',
    category: 'bolleria',
    brand: 'amparin',
    price: 2.80,
    units: '500g',
    description: 'Pan integral con semillas, horneado con masa madre.',
    image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true
  },
  {
    id: '40',
    name: 'Lion Bar',
    category: 'chocolate',
    brand: 'nestle',
    price: 1.80,
    units: '50g',
    description: 'Barrita de chocolate con leche, caramelo y cereales crujientes.',
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=800',
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