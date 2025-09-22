'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Target, Zap, Shield, Award, Leaf, Heart, Clock, 
  MapPin, Star, CheckCircle, Building2, Truck, Factory,
  Globe, TrendingUp, Calendar, Phone, Mail, ArrowRight,
  PlayCircle, PauseCircle, Quote, Eye, Camera
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Datos de la empresa
const companyHistory = [
  {
    year: '1988',
    title: 'Fundación de Granja Mari Pepa',
    description: 'Iniciamos nuestra actividad como una pequeña empresa familiar especializada en productos del mar en Murcia.',
    icon: Factory,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    year: '1995',
    title: 'Primera expansión',
    description: 'Ampliamos nuestra oferta incluyendo carnes selectas y productos precocinados artesanales.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500'
  },
  {
    year: '2003',
    title: 'Certificación ISO',
    description: 'Obtenemos nuestras primeras certificaciones de calidad y seguridad alimentaria.',
    icon: Award,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    year: '2010',
    title: 'Expansión a Almería',
    description: 'Abrimos nuestra segunda delegación, consolidando nuestra presencia en el sureste español.',
    icon: MapPin,
    color: 'from-purple-500 to-pink-500'
  },
  {
    year: '2018',
    title: 'Digitalización completa',
    description: 'Implementamos sistemas digitales avanzados para mejorar la trazabilidad y experiencia del cliente.',
    icon: Zap,
    color: 'from-indigo-500 to-blue-500'
  },
  {
    year: '2023',
    title: 'Compromiso verde',
    description: 'Lanzamos nuestro plan de sostenibilidad con energía renovable y packaging ecológico.',
    icon: Leaf,
    color: 'from-green-600 to-teal-500'
  }
];

const coreValues = [
  {
    title: 'Excelencia en Calidad',
    description: 'Cada producto pasa por rigurosos controles de calidad que garantizan la máxima frescura y sabor.',
    icon: Star,
    stats: '99.8% satisfacción',
    color: 'from-yellow-400 to-orange-500',
    features: ['Control de temperatura 24/7', 'Trazabilidad completa', 'Proveedores certificados']
  },
  {
    title: 'Innovación Constante',
    description: 'Invertimos en tecnología de vanguardia para ofrecer la mejor experiencia de compra y servicio.',
    icon: Zap,
    stats: '€2M invertidos en I+D',
    color: 'from-blue-400 to-purple-500',
    features: ['Sistemas digitales avanzados', 'Logística inteligente', 'Apps móviles']
  },
  {
    title: 'Compromiso Sostenible',
    description: 'Trabajamos por un futuro más verde con prácticas responsables y energía renovable.',
    icon: Leaf,
    stats: '40% menos emisiones CO2',
    color: 'from-green-400 to-emerald-500',
    features: ['Energía solar 100%', 'Packaging biodegradable', 'Flota híbrida']
  },
  {
    title: 'Relaciones de Confianza',
    description: 'Construimos partnerships duraderos basados en la transparencia y el servicio personalizado.',
    icon: Heart,
    stats: '35 años promedio de fidelidad',
    color: 'from-pink-400 to-rose-500',
    features: ['Atención 24/7', 'Servicio personalizado', 'Garantía total']
  }
];

const leadership = [
  {
    name: 'María Pérez Martínez',
    role: 'Directora General y Fundadora',
    bio: 'Con más de 35 años de experiencia en el sector alimentario, María fundó Granja Mari Pepa con la visión de ofrecer productos de máxima calidad.',
    image: '/images/team/maria-perez.jpg', // Placeholder - necesitaremos esta imagen
    linkedin: '#',
    email: 'maria.perez@topgel.es'
  },
  {
    name: 'Carlos Topgel Hernández',
    role: 'Director Comercial',
    bio: 'Responsable de la expansión comercial y las relaciones con distribuidores. Especialista en desarrollo de mercados.',
    image: '/images/team/carlos-topgel.jpg', // Placeholder
    linkedin: '#',
    email: 'carlos.topgel@topgel.es'
  },
  {
    name: 'Ana Rodríguez López',
    role: 'Directora de Operaciones',
    bio: 'Supervisa toda la cadena logística y operacional, garantizando la máxima eficiencia y calidad en nuestros servicios.',
    image: '/images/team/ana-rodriguez.jpg', // Placeholder
    linkedin: '#',
    email: 'ana.rodriguez@topgel.es'
  }
];

const certifications = [
  {
    name: 'ISO 9001:2015',
    description: 'Gestión de Calidad',
    icon: Award,
    year: '2003',
    color: 'bg-blue-500'
  },
  {
    name: 'ISO 14001:2015',
    description: 'Gestión Ambiental',
    icon: Leaf,
    year: '2010',
    color: 'bg-green-500'
  },
  {
    name: 'ISO 22000:2018',
    description: 'Seguridad Alimentaria',
    icon: Shield,
    year: '2005',
    color: 'bg-red-500'
  },
  {
    name: 'HACCP',
    description: 'Análisis de Peligros y Puntos Críticos',
    icon: CheckCircle,
    year: '2008',
    color: 'bg-purple-500'
  }
];

const testimonials = [
  {
    name: 'Restaurante El Celler',
    role: 'Chef Ejecutivo',
    content: 'La calidad de los productos de Topgel es excepcional. Sus mariscos frescos han elevado nuestros platos a otro nivel.',
    rating: 5,
    location: 'Murcia'
  },
  {
    name: 'Cadena Gourmet Plus',
    role: 'Director de Compras',
    content: 'Trabajamos con Topgel desde hace 15 años. Su fiabilidad y servicio personalizado son incomparables.',
    rating: 5,
    location: 'Almería'
  },
  {
    name: 'Hotel Marina Resort',
    role: 'Gerente F&B',
    content: 'La trazabilidad completa y la cadena de frío perfecta nos dan total confianza en cada entrega.',
    rating: 5,
    location: 'Cartagena'
  }
];

// Valores corporativos
const companyValues = [
  {
    title: "Calidad",
    description: "Seleccionamos cuidadosamente cada producto, garantizando los más altos estándares de frescura y calidad en cada entrega.",
    icon: Award,
    color: "from-emerald-500 to-emerald-600",
    stat: "99.8%",
    statLabel: "Satisfacción de calidad"
  },
  {
    title: "Confianza",
    description: "35 años construyendo relaciones duraderas basadas en la transparencia, honestidad y cumplimiento de compromisos.",
    icon: Shield,
    color: "from-blue-500 to-blue-600",
    stat: "500+",
    statLabel: "Clientes activos"
  },
  {
    title: "Innovación",
    description: "Incorporamos constantemente nuevas tecnologías y procesos para mejorar nuestro servicio y eficiencia operativa.",
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    stat: "24/7",
    statLabel: "Disponibilidad"
  },
  {
    title: "Compromiso",
    description: "Nuestro equipo está dedicado a superar expectativas, ofreciendo soluciones personalizadas para cada cliente.",
    icon: Heart,
    color: "from-rose-500 to-rose-600",
    stat: "15+",
    statLabel: "Años experiencia media"
  }
];

// Equipo directivo
const leadershipTeam = [
  {
    name: "María García",
    position: "Directora General",
    description: "Lidera la estrategia corporativa y el crecimiento sostenible de Topgel con más de dos décadas de experiencia en el sector alimentario.",
    experience: "25",
    projects: "50+"
  },
  {
    name: "Carlos Martínez",
    position: "Director Comercial",
    description: "Responsable de las relaciones comerciales y expansión de mercado, especialista en desarrollo de nuevos canales de distribución.",
    experience: "18",
    projects: "35+"
  },
  {
    name: "Ana López",
    position: "Directora de Calidad",
    description: "Supervisa todos los procesos de control de calidad y certificaciones, garantizando el cumplimiento de normativas internacionales.",
    experience: "22",
    projects: "40+"
  }
];

// Testimonios de clientes
const customerTestimonials = [
  {
    name: "José Ramírez",
    business: "Restaurante El Mediterráneo",
    comment: "15 años trabajando con Topgel y nunca nos han fallado. Productos frescos, entrega puntual y un servicio excepcional que marca la diferencia."
  },
  {
    name: "Carmen Ruiz",
    business: "Hotel Costa Blanca",
    comment: "La calidad de sus productos y la profesionalidad de su equipo nos ha permitido mantener los más altos estándares en nuestro hotel durante más de una década."
  },
  {
    name: "Miguel Torres",
    business: "Supermercados Torres",
    comment: "Topgel entiende las necesidades del retail. Su logística impecable y variedad de productos han sido clave para el crecimiento de nuestro negocio."
  }
];

export default function AboutPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  // Funciones de navegación
  const handleScrollToHistory = () => {
    const historySection = document.querySelector('#history-section');
    historySection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactNavigation = () => {
    router.push('/contacto');
  };

  const handleProductsNavigation = () => {
    router.push('/productos');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-900 overflow-x-hidden">
      {/* Hero Section Cinematográfico */}
      <motion.section 
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Video/Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 z-10" />
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/images/gmp.mp4" type="video/mp4" />
            {/* Fallback para navegadores que no soporten el video */}
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-6xl opacity-20">📹</div>
              <span className="text-white/30 ml-4">Video no disponible</span>
            </div>
          </video>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.320, 1] }}
          >
            <motion.h1 
              className="text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Granja Mari Pepa
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-2xl md:text-4xl text-white/90 font-light mb-6">
                35 años conectando la <span className="text-blue-400 font-semibold">excelencia</span> con tu mesa
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Desde 1988, somos líderes en distribución de productos alimentarios de primera calidad 
                en el sureste español, llevando frescura y sabor a más de 500 establecimientos.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button 
                size="lg" 
                onClick={handleScrollToHistory}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl"
              >
                <Eye className="w-6 h-6 mr-2" />
                Descubre nuestra historia
              </Button>
              <Button 
                size="lg" 
                onClick={handleContactNavigation}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Phone className="w-6 h-6 mr-2" />
                Contactar ahora
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/60"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowRight className="w-6 h-6 rotate-90" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Timeline Histórica Interactiva */}
      <section id="history-section" className="py-32 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Nuestra <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Historia</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Un viaje de tres décadas y media construyendo confianza y excelencia en cada entrega
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line - Desktop */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>
            
            {/* Timeline Line - Mobile */}
            <div className="md:hidden absolute left-8 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>

            {companyHistory.map((milestone, index) => {
              const IconComponent = milestone.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: isEven ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`relative flex items-center mb-12 md:mb-20 ${
                    // Mobile: always left-aligned, Desktop: alternating
                    'flex-col md:flex-row' + (isEven ? ' md:flex-row' : ' md:flex-row-reverse')
                  }`}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden w-full pl-20 pr-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 mb-4 justify-start">
                        <Badge className={`bg-gradient-to-r ${milestone.color} text-white px-3 py-1 text-sm font-bold`}>
                          {milestone.year}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{milestone.title}</h3>
                      <p className="text-white/70 leading-relaxed text-sm">{milestone.description}</p>
                    </motion.div>
                  </div>

                  {/* Desktop Layout - Content */}
                  <div className={`hidden md:block w-5/12 ${isEven ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className={`flex items-center gap-4 mb-4 ${isEven ? 'justify-end' : 'justify-start'}`}>
                        <Badge className={`bg-gradient-to-r ${milestone.color} text-white px-4 py-2 text-lg font-bold`}>
                          {milestone.year}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{milestone.title}</h3>
                      <p className="text-white/70 leading-relaxed">{milestone.description}</p>
                    </motion.div>
                  </div>

                  {/* Mobile Icon */}
                  <div className="md:hidden absolute left-4 top-4 z-10">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.3 }}
                      className={`w-10 h-10 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center border-2 border-slate-900 shadow-lg`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Desktop Central Icon */}
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-10">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center border-4 border-slate-900 shadow-2xl`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>

                  {/* Desktop Spacer */}
                  <div className="hidden md:block w-5/12"></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Valores Corporativos - 3D Cards */}
      <section className="py-32 bg-gradient-to-br from-slate-800 to-slate-700 relative">
        <div className="absolute inset-0 bg-pattern-dots opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Nuestros <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Valores</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Los pilares que sostienen nuestra excelencia y definen nuestra manera de trabajar cada día
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => {
              const IconComponent = value.icon;
              
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 100, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    transition: { duration: 0.3 } 
                  }}
                  className="group perspective-1000"
                >
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 h-full hover:bg-white/20 transition-all duration-500 transform-gpu">
                    <div className="text-center">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center shadow-2xl`}
                      >
                        <IconComponent className="w-10 h-10 text-white" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                      <p className="text-white/70 leading-relaxed mb-6">{value.description}</p>
                      
                      <div className="pt-4 border-t border-white/20">
                        <div className="text-3xl font-bold text-white mb-1">{value.stat}</div>
                        <div className="text-white/60 text-sm">{value.statLabel}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipo Directivo */}
      <section className="py-32 bg-gradient-to-br from-slate-700 to-slate-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-hexagon-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Equipo <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Directivo</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Líderes experimentados que guían nuestra empresa hacia la excelencia y la innovación continua
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {leadershipTeam.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all duration-500 h-full">
                  <div className="text-center">
                    {/* Placeholder para foto */}
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-4xl text-white shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      {leader.name.charAt(0)}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{leader.name}</h3>
                    <div className="text-orange-400 font-semibold mb-4">{leader.position}</div>
                    <p className="text-white/70 leading-relaxed mb-6">{leader.description}</p>
                    
                    <div className="flex justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{leader.experience}</div>
                        <div className="text-white/60 text-sm">Años de experiencia</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{leader.projects}</div>
                        <div className="text-white/60 text-sm">Proyectos liderados</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats del equipo completo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12">
              <h3 className="text-3xl font-bold text-white mb-8">Nuestro Equipo Completo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">50+</div>
                  <div className="text-white/70">Profesionales</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">15+</div>
                  <div className="text-white/70">Años experiencia media</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">98%</div>
                  <div className="text-white/70">Satisfacción interna</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">24/7</div>
                  <div className="text-white/70">Disponibilidad</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Certificaciones y Calidad */}
      <section className="py-32 bg-gradient-to-br from-slate-600 to-slate-500 relative">
        <div className="absolute inset-0 bg-circuit-pattern opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Certificaciones</span> & Calidad
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Nuestro compromiso con los más altos estándares de calidad y seguridad alimentaria
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {certifications.map((cert, index) => {
              const IconComponent = cert.icon;
              
              return (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 h-full text-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                      className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${cert.color} flex items-center justify-center shadow-2xl`}
                    >
                      <IconComponent className="w-12 h-12 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{cert.name}</h3>
                    <p className="text-white/70 leading-relaxed mb-4">{cert.description}</p>
                    
                    <Badge className={`bg-gradient-to-r ${cert.color} text-white px-4 py-2`}>
                      {cert.year}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Proceso de Calidad */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Proceso de Control de Calidad</h3>
              <p className="text-white/70 text-lg">Desde la recepción hasta la entrega, cada paso está controlado</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Truck, title: "Recepción", desc: "Control de temperatura y calidad al recibir", color: "from-blue-500 to-blue-600" },
                { icon: Eye, title: "Inspección", desc: "Verificación exhaustiva de todos los productos", color: "from-green-500 to-green-600" },
                { icon: Award, title: "Certificación", desc: "Etiquetado y registro según normativas", color: "from-yellow-500 to-yellow-600" },
                { icon: ArrowRight, title: "Distribución", desc: "Entrega con cadena de frío garantizada", color: "from-purple-500 to-purple-600" }
              ].map((step, index) => {
                const IconComponent = step.icon;
                
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-white/70">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonios de Clientes */}
      <section className="py-32 bg-gradient-to-br from-slate-500 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-wave-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Lo que dicen <span className="bg-gradient-to-r from-pink-400 to-violet-500 bg-clip-text text-transparent">nuestros clientes</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              La satisfacción de nuestros clientes es nuestra mejor carta de presentación
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all duration-500 h-full">
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-white text-lg leading-relaxed mb-6 italic">
                    "{testimonial.comment}"
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{testimonial.name}</div>
                      <div className="text-pink-400">{testimonial.business}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-32 bg-gradient-to-br from-slate-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-stars-pattern opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              ¿Listo para <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">trabajar juntos</span>?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12">
              Únete a más de 500 establecimientos que ya confían en Granja Mari Pepa para llevar 
              productos de calidad excepcional a sus clientes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={handleContactNavigation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-semibold rounded-3xl shadow-2xl"
              >
                <Phone className="w-6 h-6 mr-3" />
                Contactar ahora
              </Button>
              <Button 
                size="lg" 
                onClick={handleProductsNavigation}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-10 py-6 text-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Eye className="w-6 h-6 mr-3" />
                Ver catálogo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}