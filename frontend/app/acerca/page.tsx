'use client';

import { motion } from 'framer-motion';
import { Users, Target, Zap, Shield, Award, Leaf, Heart, Clock } from 'lucide-react';

const sections = [
  {
    id: 'quienes-somos',
    title: 'Quiénes somos',
    icon: Users,
    content: 'Grupo Topgel, junto con Granja Mari Pepa, es una empresa familiar con más de 35 años de experiencia en la distribución de productos alimentarios de primera calidad. Nacimos en el sureste español con la misión de conectar a los mejores productores con establecimientos que valoran la excelencia gastronómica.'
  },
  {
    id: 'que-ofrecemos',
    title: 'Qué ofrecemos',
    icon: Target,
    content: 'Nuestra amplia gama incluye productos del mar frescos y congelados, carnes selectas, precocinados artesanales y repostería tradicional. Trabajamos exclusivamente con proveedores certificados que comparten nuestro compromiso con la calidad y la sostenibilidad, garantizando productos que superan las expectativas más exigentes.'
  },
  {
    id: 'como-funcionamos',
    title: 'Cómo funcionamos',
    icon: Zap,
    content: 'Nuestro proceso se basa en tres pilares fundamentales: selección rigurosa de proveedores, cadena de frío ininterrumpida y logística especializada. Disponemos de flotas refrigeradas propias y almacenes con tecnología de última generación que mantienen las propiedades organolépticas de cada producto hasta su destino final.'
  },
  {
    id: 'valores',
    title: 'Nuestros valores',
    icon: Heart,
    content: 'La confianza, calidad e innovación guían cada decisión que tomamos. Creemos en las relaciones comerciales a largo plazo, basadas en la transparencia y el servicio personalizado. Cada cliente es único y merece soluciones adaptadas a sus necesidades específicas, desde pequeños restaurantes hasta grandes cadenas de distribución.'
  },
  {
    id: 'estrategia',
    title: 'Estrategia empresarial',
    icon: Shield,
    content: 'Nuestra estrategia se centra en la expansión sostenible y la digitalización de procesos. Invertimos constantemente en tecnología que nos permite ofrecer trazabilidad completa, gestión de inventarios en tiempo real y sistemas de pedidos integrados que simplifican la experiencia de compra de nuestros clientes.'
  },
  {
    id: 'iso',
    title: 'Certificaciones ISO',
    icon: Award,
    content: 'Contamos con certificaciones ISO 9001 para gestión de calidad, ISO 14001 para gestión ambiental e ISO 22000 para seguridad alimentaria. Estas certificaciones no son solo sellos de calidad, sino el reflejo de nuestro compromiso diario con la excelencia operacional y la mejora continua en todos nuestros procesos.'
  },
  {
    id: 'energia-verde',
    title: 'Compromiso con la energía verde',
    icon: Leaf,
    content: 'Hemos implementado un plan integral de sostenibilidad que incluye energía solar en nuestras instalaciones, vehículos híbridos en nuestra flota y packaging biodegradable. Nuestro objetivo es conseguir la neutralidad de carbono para 2030, contribuyendo activamente a la preservación del medio ambiente.'
  },
  {
    id: 'atencion-cliente',
    title: 'Atención al cliente excepcional',
    icon: Clock,
    content: 'Nuestro equipo de atención al cliente está disponible de lunes a viernes de 8:00 a 18:00 y sábados de 9:00 a 14:00. Ofrecemos asesoramiento personalizado, gestión proactiva de pedidos y un servicio post-venta que garantiza la satisfacción total. Porque para nosotros, cada cliente es parte de la familia Topgel.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Quiénes somos
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Más de tres décadas construyendo relaciones de confianza en el sector alimentario,
            conectando la tradición gastronómica con la innovación tecnológica.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.320, 1]
                }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg group-hover:shadow-2xl transition-all duration-500 h-full">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                      {section.title}
                    </h2>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Company Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20"
        >
          <div className="bg-primary text-white rounded-3xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Grupo Topgel en cifras
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Más de tres décadas de crecimiento constante y compromiso con la excelencia
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-accent">35+</div>
                <div className="text-blue-100">Años de experiencia</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-accent">500+</div>
                <div className="text-blue-100">Clientes activos</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-accent">1000+</div>
                <div className="text-blue-100">Productos disponibles</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-accent">2</div>
                <div className="text-blue-100">Delegaciones</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 text-center"
        >
          <div className="bg-white rounded-3xl p-12 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Un equipo comprometido con la excelencia
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Nuestro equipo humano es nuestro mayor activo. Profesionales especializados en logística,
              alimentación y atención al cliente trabajan cada día para garantizar que recibas
              productos de la máxima calidad con el mejor servicio posible.
            </p>
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-gray-600">Empleados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-gray-600">Años experiencia media</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-gray-600">Servicio técnico</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}