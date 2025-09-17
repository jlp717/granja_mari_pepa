'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Navigation } from 'lucide-react';
import { delegations } from '@/lib/data';
import { Button } from '@/components/ui/button';

export function DelegationsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nuestras Delegaciones
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Contamos con dos centros de distribución estratégicamente ubicados
            para ofrecer el mejor servicio en el sureste español.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {delegations.map((delegation, index) => (
            <motion.div
              key={delegation.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2 
              }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500">
                {/* Map placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/30 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-primary opacity-20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-semibold text-gray-900">
                      {delegation.city}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-6 h-6 text-primary mr-2" />
                    Delegación {delegation.city}
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {delegation.address}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a 
                        href={`tel:${delegation.phone}`}
                        className="text-primary font-semibold hover:text-accent transition-colors duration-200"
                      >
                        {delegation.phone}
                      </a>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Ver en mapa
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas más información?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo está disponible de lunes a viernes de 8:00 a 18:00
              y sábados de 9:00 a 14:00 para atenderte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="tel:+34968123456" className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar ahora
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/contacto">
                  Formulario de contacto
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}