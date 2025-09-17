'use client';

import { motion } from 'framer-motion';
import { distributors } from '@/lib/data';

export function DistributorsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nuestros Distribuidores
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trabajamos con las mejores marcas y proveedores para garantizar
            la máxima calidad en todos nuestros productos.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {distributors.map((distributor, index) => {
            const isLarge = distributor.size === 'large';
            const gridClass = isLarge ? 'md:col-span-1 lg:col-span-1' : 'col-span-1';
            
            return (
              <motion.div
                key={distributor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1 
                }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className={`${gridClass} group`}
              >
                <div className={`bg-white rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ${
                  isLarge ? 'h-64' : 'h-48'
                }`}>
                  <div className="relative h-full">
                    <img
                      src={distributor.image}
                      alt={distributor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className={`font-bold mb-2 ${isLarge ? 'text-xl' : 'text-lg'}`}>
                        {distributor.name}
                      </h3>
                      <p className={`text-gray-200 ${isLarge ? 'text-sm' : 'text-xs'} line-clamp-2`}>
                        {distributor.description}
                      </p>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <h3 className="text-xl font-bold mb-2">{distributor.name}</h3>
                        <p className="text-sm">{distributor.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}