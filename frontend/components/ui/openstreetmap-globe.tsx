'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Building2, Phone, ExternalLink, Zap, Satellite, Globe2, Map, ArrowUpRight } from 'lucide-react';

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
  address?: string;
  mapUrl?: string;
  phone?: string;
}

const locations: Location[] = [
  {
    id: 'lorca',
    name: 'Lorca',
    region: 'Murcia',
    coordinates: { lat: 37.6756, lng: -1.7003 },
    color: '#10b981',
    description: 'Sede Central',
    address: 'Pol Ind Saprelorca Parcela D3 Jimeno Sola, 3, 30817, Murcia',
    mapUrl: 'https://maps.app.goo.gl/qfHqTqVhJeGezwRm9',
    phone: '968 46 75 14'
  }
];

const OpenStreetMapGlobe: React.FC<LocationMapProps> = ({ 
  className = "", 
  onLocationClick
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location>(locations[0]);
  const [isClient, setIsClient] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  const openInGoogleMaps = (location: Location) => {
    // Prefer an explicit map URL if provided
    if (location.mapUrl) {
      window.open(location.mapUrl, '_blank');
      return;
    }

    // Otherwise prefer an address-based search
    if (location.address) {
      const q = encodeURIComponent(`${location.address}${location.name ? `, ${location.name}` : ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
      return;
    }

    // Fallback to coordinates
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`,
      '_blank'
    );
  };

  // Generar URL del mapa centrado en la ubicación seleccionada
  const getMapUrl = (location: Location) => {
    const { lat, lng } = location.coordinates;
    // Bbox centrado en la ubicación con zoom adecuado
    const delta = 0.15;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-delta},${lat-delta},${lng+delta},${lat+delta}&layer=mapnik&marker=${lat},${lng}`;
  };

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center w-full min-h-[500px] bg-slate-950 ${className}`}>
        <div className="flex items-center gap-3 text-cyan-400">
          <Satellite className="w-6 h-6 animate-pulse" />
          <span className="font-mono text-sm">Conectando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className={`relative w-full bg-slate-950 ${className}`}>
      {/* Fondo futurista con grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wide">RED DE DISTRIBUCIÓN</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Nuestra </span>
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Presencia
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Cobertura estratégica en el sureste peninsular
          </p>
        </motion.div>

        {/* Contenedor principal - Layout invertido en móvil */}
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          
          {/* Panel de sedes - Primero en móvil, 2 columnas en desktop */}
          <motion.div 
            className="lg:col-span-2 space-y-4 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Título del panel */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Centros Operativos</h3>
                <p className="text-xs text-slate-500 font-mono">Selecciona para ver en el mapa</p>
              </div>
            </div>

            {/* Cards de ubicaciones */}
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                onMouseEnter={() => setHoveredCard(location.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleLocationClick(location)}
                className="group relative cursor-pointer"
              >
                {/* Glow effect */}
                <div 
                  className={`absolute -inset-0.5 rounded-xl blur transition-opacity duration-500 ${
                    selectedLocation?.id === location.id || hoveredCard === location.id ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${location.color}40, transparent)` }}
                />
                
                <div className={`relative rounded-xl border transition-all duration-300 ${
                  selectedLocation?.id === location.id
                    ? 'bg-slate-800/90 border-cyan-500/60 ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}>
                  {/* Header de la card */}
                  <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            selectedLocation?.id === location.id ? 'scale-110' : 'group-hover:scale-105'
                          }`}
                          style={{ 
                            background: `linear-gradient(135deg, ${location.color}25, ${location.color}10)`,
                            border: `1px solid ${location.color}40`
                          }}
                        >
                          <MapPin className="w-6 h-6" style={{ color: location.color }} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{location.name}</h4>
                          <span 
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${location.color}20`,
                              color: location.color,
                              border: `1px solid ${location.color}40`
                            }}
                          >
                            {location.description}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: location.color }}
                          />
                          <span className="text-xs font-mono text-slate-500">ONLINE</span>
                        </div>
                        {selectedLocation?.id === location.id && (
                          <span className="text-[10px] text-cyan-400 font-mono">VIEWING</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body de la card */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{location.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{location.phone}</span>
                    </div>
                    
                    {/* Acciones */}
                    <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">{location.region.toUpperCase()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGoogleMaps(location);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-cyan-500/20"
                      >
                        <span>Google Maps</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="relative mt-6 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Cobertura Regional</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Servicio de distribución en Murcia y Alicante. Entregas en 24-48h.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Mapa - 3 columnas */}
          <motion.div 
            className="lg:col-span-3 relative order-1 lg:order-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              {/* Barra superior - Responsive */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400">
                    <span className="text-white">{selectedLocation.name.toUpperCase()}</span>
                  </span>
                </div>
                
                {/* Tabs de ubicación */}
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationClick(loc)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                        selectedLocation.id === loc.id 
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: loc.color }}
                      />
                      <span>{loc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mapa - Altura responsive */}
              <div className="relative h-[280px] sm:h-[350px] lg:h-[400px]">
                <iframe
                  key={selectedLocation.id}
                  src={getMapUrl(selectedLocation)}
                  className="w-full h-full border-0"
                  style={{ 
                    filter: 'saturate(0.9) brightness(0.95)',
                  }}
                  loading="lazy"
                  title={`Mapa de ${selectedLocation.name}`}
                />
                
                {/* Overlay esquinas - Solo en pantallas grandes */}
                <div className="hidden sm:block absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-500/50 pointer-events-none" />
                <div className="hidden sm:block absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-500/50 pointer-events-none" />
                <div className="hidden sm:block absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-500/50 pointer-events-none" />
                <div className="hidden sm:block absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-500/50 pointer-events-none" />
              </div>
              
              {/* Footer del mapa - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-500">© OpenStreetMap</span>
                  <span className="hidden sm:inline text-slate-600">|</span>
                  <span className="hidden sm:inline text-slate-400">
                    {selectedLocation.coordinates.lat.toFixed(4)}°N, {Math.abs(selectedLocation.coordinates.lng).toFixed(4)}°W
                  </span>
                </div>
                <button
                  onClick={() => openInGoogleMaps(selectedLocation)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MapPin className="w-4 h-4" />
                  Ir a {selectedLocation.name}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OpenStreetMapGlobe;
