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
import { useTranslations, useLocale } from 'next-intl';
import { delegations } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Datos de la empresa - FUENTE OFICIAL: https://granjamaripepa.com/quienes-somos/
const companyHistory = [
  {
    year: '1966',
    title: 'Fundación en Lorca (Murcia)',
    description: 'Granja Maripepa, S.L. se fundó en Lorca (Murcia), especializada desde el inicio en el mercado HORECA y canal de alimentación.',
    icon: Factory,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    year: '1980s',
    title: 'Consolidación regional',
    description: 'Ampliación de la gama de productos congelados, refrigerados y temperatura ambiente para hostelería y restauración.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500'
  },
  {
    year: '2000s',
    title: 'Certificación ISO 9001',
    description: 'Obtención de la certificación ISO 9001:2008 que garantiza nuestro Sistema de Gestión de la Calidad.',
    icon: Award,
    color: 'from-yellow-500 to-orange-500'
  },

  {
    year: '2020',
    title: 'Energía 100% Verde',
    description: 'Certificación de Feníe Energía y la CNMC de que nuestra energía es de origen 100% renovable.',
    icon: Leaf,
    color: 'from-green-600 to-teal-500'
  },
  {
    year: 'Hoy',
    title: 'Más de 1.500 referencias',
    description: 'Actualmente contamos con una gama de más de 1.500 referencias en tres temperaturas, sirviendo a Murcia y Alicante.',
    icon: Zap,
    color: 'from-indigo-500 to-blue-500'
  }
];

const coreValues = [
  {
    title: 'Garantía de Calidad',
    description: 'Nuestro Sistema de Gestión de la Calidad cumple con los requisitos de la Norma UNE-EN-ISO 9001:2008.',
    icon: Star,
    stats: 'ISO 9001:2008',
    color: 'from-yellow-400 to-orange-500',
    features: ['Control de temperatura 24/7', 'Trazabilidad completa', 'Proveedores certificados']
  },
  {
    title: 'Servicio Rápido',
    description: 'Un servicio de distribución avanzado respetando en todo momento la cadena de frío.',
    icon: Zap,
    stats: 'Entrega 24-48h',
    color: 'from-blue-400 to-purple-500',
    features: ['Cadena de frío garantizada', 'Capacidad frigorífica 5.000m³', 'Flota especializada']
  },
  {
    title: 'Energía 100% Verde',
    description: 'Feníe Energía y la CNMC certifican que nuestra energía es de origen 100% renovable.',
    icon: Leaf,
    stats: 'Certificado Verde',
    color: 'from-green-400 to-emerald-500',
    features: ['Energía renovable', 'Instalación fotovoltaica', 'Compromiso ambiental']
  },
  {
    title: 'Atención Personalizada',
    description: 'Equipo humano altamente cualificado y conocedor del mercado y el producto.',
    icon: Heart,
    stats: '+55 años experiencia',
    color: 'from-pink-400 to-rose-500',
    features: ['Horario L-V 8:00-19:00', 'Servicio profesional', 'Asesoramiento experto']
  }
];

// Eliminar equipo directivo inventado - sin datos reales verificables
const leadership: never[] = [];

const certifications = [
  {
    name: 'ISO 9001:2008',
    description: 'Sistema de Gestión de Calidad',
    icon: Award,
    year: 'Certificado',
    color: 'bg-blue-500'
  },
  {
    name: 'Energía 100% Verde',
    description: 'Feníe Energía + CNMC',
    icon: Leaf,
    year: 'Renovable',
    color: 'bg-green-500'
  },
  {
    name: 'Trazabilidad Total',
    description: 'Control de productos',
    icon: Shield,
    year: 'Garantía',
    color: 'bg-purple-500'
  },
  {
    name: 'Cadena de Frío',
    description: '5.000m³ capacidad frigorífica',
    icon: CheckCircle,
    year: 'Certificado',
    color: 'bg-cyan-500'
  }
];

// Sin testimonios inventados - solo afirmación genérica verificable
const testimonials: never[] = [];

// Valores corporativos - FUENTE: https://granjamaripepa.com/quienes-somos/
const companyValues = [
  {
    title: "Calidad Certificada",
    description: "Garantía de calidad respaldada por la Norma ISO 9001. Trazabilidad de todos nuestros productos.",
    icon: Award,
    color: "from-emerald-500 to-emerald-600",
    stat: "ISO 9001",
    statLabel: "Certificación de calidad"
  },
  {
    title: "Servicio Rápido",
    description: "Servicio de entrega en 24-48 horas respetando en todo momento la cadena de frío.",
    icon: Clock,
    color: "from-blue-500 to-blue-600",
    stat: "24-48h",
    statLabel: "Tiempo de entrega"
  },
  {
    title: "Cobertura Regional",
    description: "Servicio en Murcia y Alicante con delegación estratégica en Lorca.",
    icon: MapPin,
    color: "from-purple-500 to-purple-600",
    stat: "2",
    statLabel: "Provincias atendidas"
  },
  {
    title: "Atención Personalizada",
    description: "Equipo humano altamente cualificado y conocedor del mercado y el producto HORECA.",
    icon: Heart,
    color: "from-rose-500 to-rose-600",
    stat: "+55",
    statLabel: "Años de experiencia"
  }
];

// Sin equipo directivo inventado - datos no verificables
const leadershipTeam: never[] = [];

// Reseña genérica profesional (no hay testimonios verificables)
const customerTestimonials = [
  {
    name: "Clientes HORECA",
    business: "Hostelería y Restauración",
    comment: "Más de 55 años sirviendo a los mejores establecimientos de Murcia y Alicante con productos de máxima calidad."
  }
];

export default function AboutPage() {
  const t = useTranslations('about_page');
  const locale = useLocale();
  const router = useRouter();

  const companyHistory = [
    {
      year: '1966',
      title: t('history.milestones.1966.title'),
      description: t('history.milestones.1966.desc'),
      icon: Factory,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      year: '1980s',
      title: t('history.milestones.1980s.title'),
      description: t('history.milestones.1980s.desc'),
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    },
    {
      year: '2000s',
      title: t('history.milestones.2000s.title'),
      description: t('history.milestones.2000s.desc'),
      icon: Award,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      year: '2020',
      title: t('history.milestones.2020.title'),
      description: t('history.milestones.2020.desc'),
      icon: Leaf,
      color: 'from-green-600 to-teal-500'
    },
    {
      year: locale === 'es' ? 'Actualidad' : 'Today',
      title: t('history.milestones.today.title'),
      description: t('history.milestones.today.desc'),
      icon: Zap,
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  const companyValues = [
    {
      title: t('values.items.quality.title'),
      description: t('values.items.quality.desc'),
      icon: Award,
      color: "from-emerald-500 to-emerald-600",
      stat: "ISO 9001",
      statLabel: t('values.items.quality.label')
    },
    {
      title: t('values.items.service.title'),
      description: t('values.items.service.desc'),
      icon: Clock,
      color: "from-blue-500 to-blue-600",
      stat: "24-48h",
      statLabel: t('values.items.service.label')
    },
    {
      title: t('values.items.coverage.title'),
      description: t('values.items.coverage.desc'),
      icon: MapPin,
      color: "from-purple-500 to-purple-600",
      stat: "2",
      statLabel: t('values.items.coverage.label')
    },
    {
      title: t('values.items.attention.title'),
      description: t('values.items.attention.desc'),
      icon: Heart,
      color: "from-rose-500 to-rose-600",
      stat: "+55",
      statLabel: t('values.items.attention.label')
    }
  ];

  const certifications = [
    {
      name: t('certifications.items.iso.name'),
      description: t('certifications.items.iso.desc'),
      icon: Award,
      year: t('certifications.items.iso.label'),
      color: 'bg-blue-500'
    },
    {
      name: t('certifications.items.green.name'),
      description: t('certifications.items.green.desc'),
      icon: Leaf,
      year: t('certifications.items.green.label'),
      color: 'bg-green-500'
    },
    {
      name: t('certifications.items.traceability.name'),
      description: t('certifications.items.traceability.desc'),
      icon: Shield,
      year: t('certifications.items.traceability.label'),
      color: 'bg-purple-500'
    },
    {
      name: t('certifications.items.cold_chain.name'),
      description: t('certifications.items.cold_chain.desc'),
      icon: CheckCircle,
      year: t('certifications.items.cold_chain.label'),
      color: 'bg-cyan-500'
    }
  ];
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
                {t('hero.title')}
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-2xl md:text-4xl text-white/90 font-light mb-6">
                {t('hero.subtitle_1')} <span className="text-blue-400 font-semibold">{t('hero.subtitle_highlight')}</span> {t('hero.subtitle_2')}
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                {t('hero.description')}
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
                {t('hero.cta_history')}
              </Button>
              <Button
                size="lg"
                onClick={handleContactNavigation}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Phone className="w-6 h-6 mr-2" />
                {t('hero.cta_contact')}
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
              {t('history.title_1')} <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{t('history.title_2')}</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('history.description')}
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

      {/* Delegaciones - Mostrar únicamente la sede de Lorca (direcciones reales) */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('delegations.title')}</h2>
            <p className="text-white/70 max-w-2xl mx-auto">{t('delegations.description')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {delegations.filter(d => d.id === 'lorca').map(d => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-2">{d.city}</h3>
                <div className="text-white/90 mb-4">{d.address}</div>
                <div className="text-white/70 mb-4">Tel: {d.phone} {d.phone2 ? `• ${d.phone2}` : ''}</div>
                <div className="text-white/70 mb-4">Email: {d.email}</div>
                <a href={d.mapUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-blue-300 hover:underline">Ver en Google Maps</a>
              </motion.div>
            ))}
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
              {t('values.title_1')} <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{t('values.title_2')}</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('values.description')}
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

      {/* Sección de Compromiso (reemplaza equipo inventado) */}
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
              {t('commitment.title_1')} <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{t('commitment.title_2')}</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('commitment.description')}
            </p>
          </motion.div>

          {/* Qué ofrecemos - datos reales */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12 mb-12"
          >
            <h3 className="text-3xl font-bold text-white mb-8 text-center">{t('commitment.offer_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Award, text: t('commitment.items.quality') },
                { icon: Eye, text: t('commitment.items.traceability') },
                { icon: Truck, text: t('commitment.items.delivery') },
                { icon: MapPin, text: t('commitment.items.service') },
                { icon: Heart, text: t('commitment.items.attention') },
                { icon: Building2, text: t('commitment.items.capacity') }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <IconComponent className="w-6 h-6 text-orange-400 flex-shrink-0" />
                    <span className="text-white/90">{item.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats del equipo completo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12">
              <h3 className="text-3xl font-bold text-white mb-8">{t('commitment.stats.title')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">1966</div>
                  <div className="text-white/70">{t('commitment.stats.founded_label')}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">1500+</div>
                  <div className="text-white/70">{t('commitment.stats.references_label')}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">5.000m³</div>
                  <div className="text-white/70">{t('commitment.stats.capacity_label')}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-orange-400">3</div>
                  <div className="text-white/70">{t('commitment.stats.temps_label')}</div>
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
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">{t('certifications.title_1')}</span> {t('certifications.title_2')}
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('certifications.description')}
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
              <h3 className="text-3xl font-bold text-white mb-4">{t('certifications.process.title')}</h3>
              <p className="text-white/70 text-lg">{t('certifications.process.description')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Truck, title: t('certifications.process.steps.reception.title'), desc: t('certifications.process.steps.reception.desc'), color: "from-blue-500 to-blue-600" },
                { icon: Eye, title: t('certifications.process.steps.inspection.title'), desc: t('certifications.process.steps.inspection.desc'), color: "from-green-500 to-green-600" },
                { icon: Award, title: t('certifications.process.steps.certification.title'), desc: t('certifications.process.steps.certification.desc'), color: "from-yellow-500 to-yellow-600" },
                { icon: ArrowRight, title: t('certifications.process.steps.distribution.title'), desc: t('certifications.process.steps.distribution.desc'), color: "from-purple-500 to-purple-600" }
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

      {/* Misión y Visión - Datos reales */}
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
              {t('strategy.title_1')} <span className="bg-gradient-to-r from-pink-400 to-violet-500 bg-clip-text text-transparent">{t('strategy.title_2')}</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('strategy.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Misión */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-8 h-8 text-pink-400 mr-3" />
                {t('strategy.mission.title')}
              </h3>
              <ul className="space-y-4 text-white/80">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-pink-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.mission.item_1')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-pink-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.mission.item_2')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-pink-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.mission.item_3')}</span>
                </li>
              </ul>
            </motion.div>

            {/* Visión */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Eye className="w-8 h-8 text-violet-400 mr-3" />
                {t('strategy.vision.title')}
              </h3>
              <ul className="space-y-4 text-white/80">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-violet-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.vision.item_1')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-violet-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.vision.item_2')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-violet-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{t('strategy.vision.item_3')}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reseñas de Google - DATOS REALES de Google Maps */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-16"
          >
            {/* Badge de Google */}
            <motion.div
              className="inline-flex items-center mb-6 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              whileHover={{ scale: 1.05 }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-white/90 font-semibold text-sm">{t('reviews.badge')}</span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              {t('reviews.title_1')} <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{t('reviews.title_highlight')}</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
              {t('reviews.description')}
            </p>
          </motion.div>

          {/* Grid de reseñas - DATOS REALES DE GOOGLE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
            {/* Reseña real de Antonio López */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <div
                className="h-full rounded-2xl p-6 sm:p-8 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
                }}
              >
                {/* Header con autor y rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-red-500 to-orange-500">
                      A
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">Antonio López</h4>
                      </div>
                      <p className="text-sm text-white/60">{t('reviews.antonio_review.role')}</p>
                    </div>
                  </div>

                  {/* Google icon */}
                  <svg className="w-6 h-6 opacity-60" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>

                {/* Estrellas */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-white/60 text-sm ml-2">Hace 8 años</span>
                </div>

                {/* Texto de la reseña */}
                <div className="relative">
                  <Quote className="absolute -top-2 -left-1 w-8 h-8 text-white/10" />
                  <p className="text-white/80 leading-relaxed pl-4">
                    {t('reviews.antonio_review.text')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card para ver más reseñas en Google */}
            <motion.a
              href="https://www.google.com/maps/place/Granja+Mari+Pepa/@37.6867029,-1.7242629,17z/data=!4m8!3m7!1s0xd63876c6a1c7b63:0x4e7e9c4a6c8f4c3a!8m2!3d37.6867029!4d-1.721688!9m1!1b1!16s%2Fg%2F11c5qzv_9n"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group block"
            >
              <div
                className="h-full rounded-2xl p-6 sm:p-8 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[200px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.15) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
                }}
              >
                <svg className="w-12 h-12 mb-4 opacity-80" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <h4 className="text-xl font-bold text-white mb-2">{t('reviews.view_all.title')}</h4>
                <p className="text-white/60 mb-4">{t('reviews.view_all.subtitle')}</p>
                <div className="inline-flex items-center gap-2 text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                  {t('reviews.view_all.link')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.a>
          </div>

          {/* Resumen de valoración - DATOS REALES: 4.1 estrellas, 18 reseñas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-white">4,1</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/30'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-white/60">{t('reviews.summary.rating_label')}</p>
            </div>

            <div className="hidden sm:block w-px h-16 bg-white/20" />

            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">18</div>
              <p className="text-white/60">{t('reviews.summary.reviews_label')}</p>
            </div>

            <div className="hidden sm:block w-px h-16 bg-white/20" />

            <div className="text-center">
              <a
                href="https://www.google.com/maps/place/Granja+Mari+Pepa/@37.6867029,-1.7242629,17z/data=!4m8!3m7!1s0xd63876c6a1c7b63:0x4e7e9c4a6c8f4c3a!8m2!3d37.6867029!4d-1.721688!9m1!1b1!16s%2Fg%2F11c5qzv_9n"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 text-white font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('reviews.summary.write_review')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
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
              {t('cta_final.title_1')} <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">{t('cta_final.title_highlight')}</span>{t('cta_final.title_suffix')}
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12">
              {t('cta_final.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={handleContactNavigation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-semibold rounded-3xl shadow-2xl"
              >
                <Phone className="w-6 h-6 mr-3" />
                {t('cta_final.contact')}
              </Button>
              <Button
                size="lg"
                onClick={handleProductsNavigation}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-10 py-6 text-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Eye className="w-6 h-6 mr-3" />
                {t('cta_final.catalog')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}