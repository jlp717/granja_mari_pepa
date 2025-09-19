'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationMapProps {
  className?: string;
  onLocationClick?: (location: Location) => void;
}

interface Location {
  id: string;
  name: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  color: string;
  description: string;
}

const locations: Location[] = [
  {
    id: 'lorca',
    name: 'Lorca',
    region: 'Murcia',
    coordinates: { lat: 37.6756, lng: -1.7003 },
    color: '#10b981',
    description: 'Sede Central'
  },
  {
    id: 'almeria', 
    name: 'Almería',
    region: 'Andalucía',
    coordinates: { lat: 36.8381, lng: -2.4597 },
    color: '#06b6d4',
    description: 'Delegación Sur'
  }
];

export default function LocationMapFree({ className = '', onLocationClick }: LocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isShowingDetails, setIsShowingDetails] = useState(false);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setIsShowingDetails(true);
    
    // Callback externo si existe
    if (onLocationClick) {
      onLocationClick(location);
    }

    // Auto-reset después de 4 segundos
    setTimeout(() => {
      setIsShowingDetails(false);
      setSelectedLocation(null);
    }, 4000);
  }, [onLocationClick]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      {/* Título elegante */}
      <div className="text-center mb-12">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Nuestras Ubicaciones
        </motion.h2>
        <motion.p 
          className="text-slate-300 max-w-lg text-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Descubre dónde nos encontramos en España. 
          <span className="text-emerald-400 font-medium"> Haz clic</span> en cualquier ubicación.
        </motion.p>
      </div>

      {/* Mapa estilizado de España */}
      <motion.div 
        className="relative w-full max-w-4xl h-[500px] mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
          {/* Efecto de brillo en el borde */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-transparent to-cyan-500/20 pointer-events-none z-10"></div>
          
          {/* SVG Map de España simplificado */}
          <div className="flex items-center justify-center h-full p-8">
            <svg 
              viewBox="0 0 800 600" 
              className="w-full h-full max-w-2xl"
              style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
            >
              {/* Contorno de España simplificado */}
              <path
                d="M100 300 Q120 250 180 240 Q250 230 350 250 Q450 260 550 280 Q650 300 700 350 Q720 400 700 450 Q650 500 550 510 Q450 520 350 510 Q250 500 150 480 Q100 450 80 400 Q80 350 100 300 Z"
                fill="url(#spainGradient)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                className="transition-all duration-500 hover:brightness-110"
              />
              
              {/* Gradiente para España */}
              <defs>
                <linearGradient id="spainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                  <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
                </linearGradient>
              </defs>
              
              {/* Marcadores de ubicaciones */}
              {locations.map((location, index) => {
                const isSelected = selectedLocation?.id === location.id;
                const x = location.id === 'lorca' ? 420 : 350; // Posiciones aproximadas
                const y = location.id === 'lorca' ? 380 : 420;
                
                return (
                  <motion.g
                    key={location.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 + index * 0.2, duration: 0.6 }}
                  >
                    {/* Círculo pulsante */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 25 : 18}
                      fill={location.color}
                      stroke="white"
                      strokeWidth="3"
                      className="cursor-pointer"
                      onClick={() => handleLocationClick(location)}
                      animate={{
                        scale: isSelected ? [1, 1.2, 1] : 1,
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{
                        scale: { duration: 2, repeat: Infinity },
                        opacity: { duration: 2, repeat: Infinity }
                      }}
                      whileHover={{ scale: 1.2 }}
                      style={{
                        filter: `drop-shadow(0 0 20px ${location.color}60)`
                      }}
                    />
                    
                    {/* Icono de ubicación */}
                    <motion.g
                      className="cursor-pointer pointer-events-none"
                      animate={{ scale: isSelected ? 1.3 : 1 }}
                    >
                      <path
                        d={`M${x-6} ${y-8} L${x+6} ${y-8} L${x} ${y+6} Z`}
                        fill="white"
                        stroke="none"
                      />
                      <circle
                        cx={x}
                        cy={y-4}
                        r="3"
                        fill={location.color}
                      />
                    </motion.g>
                    
                    {/* Etiqueta de ubicación */}
                    <motion.text
                      x={x}
                      y={y + 40}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      className="pointer-events-none"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5 + index * 0.2 }}
                    >
                      {location.name}
                    </motion.text>
                    <motion.text
                      x={x}
                      y={y + 55}
                      textAnchor="middle"
                      fill={location.color}
                      fontSize="11"
                      className="pointer-events-none"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.7 + index * 0.2 }}
                    >
                      {location.region}
                    </motion.text>
                  </motion.g>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Botones de ubicación modernos */}
      <div className="flex flex-wrap justify-center gap-8 max-w-2xl">
        {locations.map((location, index) => (
          <motion.button
            key={location.id}
            onClick={() => handleLocationClick(location)}
            className={`group relative flex flex-col items-center p-6 rounded-2xl backdrop-blur-xl transition-all duration-500 ${
              selectedLocation?.id === location.id 
                ? 'bg-white/20 border-2 border-white/60 scale-110 shadow-2xl' 
                : 'bg-white/5 border-2 border-white/20 hover:border-white/40 hover:scale-105'
            }`}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${location.color}20, transparent 70%)`,
              boxShadow: selectedLocation?.id === location.id 
                ? `0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px ${location.color}60, 0 0 40px ${location.color}40` 
                : `0 15px 35px rgba(0,0,0,0.2), 0 0 0 1px ${location.color}30`
            }}
          >
            {/* Icono de ubicación */}
            <div
              className="relative w-12 h-12 rounded-full mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{
                backgroundColor: location.color,
                boxShadow: `0 0 30px ${location.color}60`
              }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-lg mb-1">{location.name}</div>
              <div 
                className="text-sm font-medium"
                style={{ color: location.color }}
              >
                {location.region}
              </div>
              <div className="text-slate-300 text-xs mt-1 opacity-80">
                {location.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Información durante la selección */}
      <AnimatePresence>
        {isShowingDetails && selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              delay: 0.3
            }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center px-4 z-50"
          >
            <div 
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 max-w-md shadow-2xl"
              style={{
                boxShadow: `0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px ${selectedLocation.color}50, 0 0 50px ${selectedLocation.color}20`
              }}
            >
              <div className="flex items-center justify-center mb-6">
                <motion.div 
                  className="w-8 h-8 rounded-full mr-3 flex items-center justify-center"
                  style={{ backgroundColor: selectedLocation.color }}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedLocation.name}
                </h3>
              </div>
              
              <p className="text-slate-300 mb-6 text-lg">
                📍 <span style={{ color: selectedLocation.color }} className="font-semibold">{selectedLocation.description}</span> en la región de <span style={{ color: selectedLocation.color }} className="font-semibold">{selectedLocation.region}</span>
              </p>
              
              <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700/50">
                <div className="text-sm text-slate-400 mb-2 font-medium">📍 Coordenadas GPS</div>
                <div className="font-mono text-white text-lg">
                  {selectedLocation.coordinates.lat.toFixed(4)}°N, {Math.abs(selectedLocation.coordinates.lng).toFixed(4)}°W
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-slate-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.div>
                <span className="text-sm">Volviendo a vista general...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota de alternativa gratuita */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <p className="text-slate-400 text-sm">
          🆓 <span className="text-emerald-400">Versión 100% gratuita</span> - Sin APIs externas ni costos
        </p>
      </motion.div>
    </div>
  );
}