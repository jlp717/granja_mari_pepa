'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
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

// Configurar tu API key de Google Maps aquí
// Por ahora usamos un placeholder, necesitarás obtener una API key real
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC8_PLACEHOLDER_KEY';

interface MapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  locations: Location[];
  onLocationClick: (location: Location) => void;
  focusedLocation: Location | null;
  isAutoZooming: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  zoom, 
  locations, 
  onLocationClick, 
  focusedLocation,
  isAutoZooming
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Crear el mapa con estilos modernos
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: 'hybrid', // Vista satelital con etiquetas
      disableDefaultUI: true,
      gestureHandling: 'auto',
      styles: [
        {
          featureType: 'administrative',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'administrative.country',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'administrative.locality',
          elementType: 'labels',
          stylers: [{ visibility: isAutoZooming ? 'on' : 'off' }]
        }
      ]
    });

    // Limpiar markers existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Crear markers personalizados para cada ubicación
    locations.forEach(location => {
      const marker = new google.maps.Marker({
        position: location.coordinates,
        map: googleMapRef.current,
        title: `${location.name}, ${location.region}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: focusedLocation?.id === location.id ? 15 : 10,
          fillColor: location.color,
          fillOpacity: focusedLocation?.id === location.id ? 1 : 0.8,
          strokeWeight: 3,
          strokeColor: '#ffffff'
        },
        animation: focusedLocation?.id === location.id ? google.maps.Animation.BOUNCE : undefined
      });

      // Info window para cada marker
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; text-align: center;">
            <h3 style="margin: 0 0 5px 0; color: ${location.color};">${location.name}</h3>
            <p style="margin: 0; color: #666;">${location.region}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">${location.description}</p>
          </div>
        `
      });

      // Añadir evento de clic
      marker.addListener('click', () => {
        onLocationClick(location);
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

  }, [center, zoom, locations, onLocationClick, focusedLocation, isAutoZooming]);

  // Animar el mapa cuando cambie el centro y zoom
  useEffect(() => {
    if (googleMapRef.current && isAutoZooming) {
      googleMapRef.current.panTo(center);
      googleMapRef.current.setZoom(zoom);
    }
  }, [center, zoom, isAutoZooming]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ minHeight: '400px' }}
    />
  );
};

const MapWrapper: React.FC<MapComponentProps> = (props) => {
  return (
    <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <MapComponent {...props} />
    </Wrapper>
  );
};

const Globe: React.FC<LocationMapProps> = ({ 
  className = "", 
  onLocationClick
}) => {

  const [currentView, setCurrentView] = useState<{
    center: { lat: number; lng: number };
    zoom: number;
  }>({
    // Vista inicial: Mundo completo
    center: { lat: 20, lng: 0 }, 
    zoom: 2
  });
  
  const [focusedLocation, setFocusedLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAutoZooming, setIsAutoZooming] = useState(false);
  const [zoomPhase, setZoomPhase] = useState<'world' | 'europe' | 'spain' | 'location'>('world');

  // Efecto de zoom progresivo inicial
  useEffect(() => {
    const startProgressiveZoom = async () => {
      // Pausa inicial
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fase 1: Zoom a Europa
      setZoomPhase('europe');
      setCurrentView({
        center: { lat: 54, lng: 15 }, 
        zoom: 4
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fase 2: Zoom a España
      setZoomPhase('spain');
      setCurrentView({
        center: { lat: 37.2, lng: -1.85 }, 
        zoom: 8
      });
    };

    startProgressiveZoom();
  }, []);

  // Función para manejar clic en ubicación
  const handleLocationClick = useCallback((location: Location) => {
    setFocusedLocation(location);
    setSelectedLocation(location);
    setIsAutoZooming(true);
    setZoomPhase('location');
    
    // Zoom a la ubicación específica con transición suave
    setCurrentView({
      center: location.coordinates,
      zoom: 16
    });

    // Callback externo si existe
    if (onLocationClick) {
      onLocationClick(location);
    }

    // Auto-reset después de 5 segundos - regresa a vista España
    setTimeout(() => {
      setCurrentView({
        center: { lat: 37.2, lng: -1.85 }, 
        zoom: 8
      });
      setFocusedLocation(null);
      setSelectedLocation(null);
      setIsAutoZooming(false);
      setZoomPhase('spain');
    }, 5000);
  }, [onLocationClick]);

  // Función para cambiar tipo de vista
  const handleViewChange = useCallback((view: 'world' | 'europe' | 'spain') => {
    setZoomPhase(view);
    setFocusedLocation(null);
    setSelectedLocation(null);
    setIsAutoZooming(false);
    
    switch(view) {
      case 'world':
        setCurrentView({ center: { lat: 20, lng: 0 }, zoom: 2 });
        break;
      case 'europe':
        setCurrentView({ center: { lat: 54, lng: 15 }, zoom: 4 });
        break;
      case 'spain':
        setCurrentView({ center: { lat: 37.2, lng: -1.85 }, zoom: 8 });
        break;
    }
  }, []);

  // Función para resetear vista
  const handleResetView = useCallback(() => {
    handleViewChange('world');
  }, [handleViewChange]);

  return (
    <div className={`flex flex-col items-center justify-start w-full min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-2 sm:px-4 lg:px-6 py-20 sm:py-24 ${className}`}>
      {/* Estilos para ocultar el texto "For development purposes only" */}
      <style jsx global>{`
        .gm-style-cc,
        .gmnoprint,
        [title="Report errors in the road map or imagery to Google"] {
          display: none !important;
        }
        .gm-bundled-control {
          display: none !important;
        }
        .gm-style .gm-style-cc {
          display: none !important;
        }
        .gm-style-cc + div {
          display: none !important;
        }
        .gm-style > div:last-child {
          display: none !important;
        }
        .gm-style-cc,
        .gm-style-cc span,
        .gm-style-cc div,
        .gm-style > div > div:last-child {
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          left: -9999px !important;
        }
      `}</style>

      {/* Título principal - Más compacto */}
      <div className="text-center mb-8 w-full max-w-6xl mx-auto">
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
        </motion.h2>
        <motion.p 
          className="text-slate-300 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-emerald-400 font-medium"></span>
        </motion.p>
      </div>

      {/* Container del mapa - MÁS GRANDE Y PROTAGONISTA */}
      <motion.div 
        className="w-full max-w-7xl h-[70vh] sm:h-[75vh] md:h-[80vh] relative mb-8 sm:mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        {/* Selector de tipo de vista - Arriba Izquierda - Más compacto para móvil */}
        <motion.div
          className="absolute -top-16 sm:-top-14 left-0 z-30 bg-slate-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-3 border border-slate-600/50 shadow-xl"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span className="text-white text-xs font-semibold hidden sm:inline">Vista:</span>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => handleViewChange('world')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  zoomPhase === 'world' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🌍
                <span className="hidden sm:inline ml-1">Mundo</span>
              </button>
              <button
                onClick={() => handleViewChange('europe')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  zoomPhase === 'europe' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🇪🇺
                <span className="hidden sm:inline ml-1">Europa</span>
              </button>
              <button
                onClick={() => handleViewChange('spain')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  zoomPhase === 'spain' 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🇪🇸
                <span className="hidden sm:inline ml-1">España</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Botón Resetear Vista - Arriba Derecha - Más compacto para móvil */}
        <motion.button
          onClick={handleResetView}
          className="absolute -top-16 sm:-top-14 right-0 z-30 bg-slate-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-3 border border-slate-600/50 text-white hover:bg-slate-700/95 transition-all duration-300 shadow-xl"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-1 sm:space-x-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs font-semibold hidden sm:inline">Resetear Vista</span>
            <span className="text-xs font-semibold sm:hidden">Reset</span>
          </div>
        </motion.button>

        {/* Contenedor del mapa */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50">
          <MapWrapper 
            center={currentView.center}
            zoom={currentView.zoom}
            locations={locations}
            onLocationClick={handleLocationClick}
            focusedLocation={focusedLocation}
            isAutoZooming={isAutoZooming}
          />

          {/* Modal de información dentro del mapa - Optimizado para móvil */}
          <AnimatePresence>
            {isAutoZooming && selectedLocation && (
              <motion.div
                className="absolute top-4 sm:top-6 left-4 sm:left-6 z-40 bg-slate-900/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl max-w-[280px] sm:max-w-xs"
                initial={{ opacity: 0, x: -100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1"
                    style={{ backgroundColor: selectedLocation.color }}
                  />
                  <button 
                    onClick={() => {
                      setSelectedLocation(null);
                      setFocusedLocation(null);
                      setIsAutoZooming(false);
                      handleViewChange('spain');
                    }}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-white">
                  <h3 className="text-base sm:text-xl font-bold mb-2" style={{ color: selectedLocation.color }}>
                    {selectedLocation.name}
                  </h3>
                  <p className="text-slate-300 mb-2 text-xs sm:text-sm">
                    📍 {selectedLocation.description} en <span className="font-semibold">{selectedLocation.region}</span>
                  </p>
                  <div className="text-xs text-slate-400 mb-3">
                    GPS: {selectedLocation.coordinates.lat.toFixed(4)}°N, {Math.abs(selectedLocation.coordinates.lng).toFixed(4)}°W
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Auto-regreso...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Información durante el zoom - Mejorada */}
      <AnimatePresence>
        {isAutoZooming && selectedLocation && (
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
              {/* Header con icono animado */}
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
                  Explorando {selectedLocation.name}
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
                <span className="text-sm">Regresando a vista general automáticamente...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback mejorado para API key */}
      {GOOGLE_MAPS_API_KEY === 'AIzaSyC8_PLACEHOLDER_KEY' && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm flex items-center justify-center z-40">
          <motion.div 
            className="text-center p-10 bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-3xl border border-red-500/30 max-w-lg shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-white text-2xl font-bold mb-4">API Key Requerida</h3>
            <p className="text-red-200 text-sm leading-relaxed">
              Para usar Google Maps, configura <code className="bg-red-800/50 px-2 py-1 rounded text-red-100">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> en tu archivo <code className="bg-red-800/50 px-2 py-1 rounded text-red-100">.env.local</code>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Globe;