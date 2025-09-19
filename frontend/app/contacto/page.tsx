'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, Star, Building2, Users, Globe as GlobeIcon, ArrowRight, ExternalLink, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { delegations } from '@/lib/data';
import Globe from '@/components/ui/globe';

// Definir la interfaz Location localmente para coincidir con el Globe component
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

const contactFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  empresa: z.string().min(2, 'La empresa debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  privacidad: z.boolean().refine(val => val === true, 'Debes aceptar la política de privacidad')
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showGlobeDetails, setShowGlobeDetails] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Funciones para manejar contactos (sin notificaciones molestas)
  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleWhatsAppClick = (phone: string, message?: string) => {
    const encodedMessage = encodeURIComponent(message || '¡Hola! Me gustaría obtener más información sobre sus productos.');
    window.open(`https://wa.me/${phone.replace(/\s+/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location.id);
    setSelectedLocationData({
      id: location.id,
      name: location.name,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      description: location.id === 'lorca' 
        ? 'Sede central de operaciones en Murcia' 
        : 'Delegación comercial en Andalucía'
    });
    setShowGlobeDetails(true);
    
    // Auto-hide details after 6 seconds
    setTimeout(() => {
      setShowGlobeDetails(false);
    }, 6000);
  };

  const handleViewOnMap = (delegationCity: string) => {
    const locationId = delegationCity.toLowerCase() === 'lorca' ? 'lorca' : 'almeria';
    
    setSelectedLocation(locationId);
    setSelectedLocationData({
      id: locationId,
      name: delegationCity,
      lat: locationId === 'lorca' ? 37.6756 : 36.8344,
      lng: locationId === 'lorca' ? -1.7003 : -2.4637,
      description: locationId === 'lorca' 
        ? 'Sede central de operaciones en Murcia' 
        : 'Delegación comercial en Andalucía'
    });
    setShowGlobeDetails(true);
    
    // Scroll to globe
    setTimeout(() => {
      const globeSection = document.querySelector('#interactive-globe');
      globeSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      mensaje: '',
      privacidad: false
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('¡Mensaje enviado correctamente! Te contactaremos pronto.');
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-900 overflow-x-hidden">
      {/* Hero Section Cinematográfico */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background con gradientes animados */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/30 to-purple-900/30" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          {/* Elementos flotantes animados */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1.2, 1, 1.2],
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.320, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="mb-8"
            >
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 text-lg font-semibold mb-8">
                📞 Contacto Directo
              </Badge>
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-8">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Hablemos
                </span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-2xl md:text-4xl text-white/90 font-light mb-6">
                Estamos aquí para <span className="text-blue-400 font-semibold">escucharte</span> y ayudarte
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Nuestro equipo de expertos está disponible para resolver tus dudas, 
                personalizar soluciones y acompañarte en cada paso hacia el éxito.
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
                onClick={() => {
                  const formSection = document.querySelector('#contact-form');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl"
              >
                <Send className="w-6 h-6 mr-2" />
                Enviar mensaje
              </Button>
              <Button 
                size="lg"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                onClick={() => handlePhoneCall("+34968123456")}
              >
                <Phone className="w-6 h-6 mr-2" />
                Llamar ahora
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

      {/* Información de Contacto - Diseño Espectacular */}
      <section className="py-32 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-circuit-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Conecta</span> con Nosotros
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Múltiples canales de comunicación para que elijas el que mejor se adapte a ti
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Phone,
                title: "Llamada Directa",
                description: "Habla directamente con nuestro equipo comercial",
                info: "+34 968 123 456",
                action: () => handlePhoneCall("+34968123456"),
                color: "from-green-500 to-emerald-600",
                bgColor: "from-green-500/20 to-emerald-600/20"
              },
              {
                icon: Mail,
                title: "Email Corporativo",
                description: "Envíanos tu consulta y te responderemos en 24h",
                info: "info@granjamaripepa.com",
                action: () => handleEmailClick("info@granjamaripepa.com"),
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-500/20 to-blue-600/20"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Business",
                description: "Chat directo para consultas rápidas",
                info: "Enviar mensaje",
                action: () => handleWhatsAppClick("+34968123456"),
                color: "from-green-400 to-green-500",
                bgColor: "from-green-400/20 to-green-500/20"
              }
            ].map((contact, index) => {
              const IconComponent = contact.icon;
              
              return (
                <motion.div
                  key={contact.title}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="group cursor-pointer"
                  onClick={contact.action}
                >
                  <div className={`bg-gradient-to-br ${contact.bgColor} backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:border-white/40 transition-all duration-500 h-full text-center`}>
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center shadow-2xl`}
                    >
                      <IconComponent className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{contact.title}</h3>
                    <p className="text-white/70 leading-relaxed mb-4">{contact.description}</p>
                    
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${contact.color} text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-shadow`}>
                      {contact.info}
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Horarios de Atención */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12">
              <Clock className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-8">Horarios de Atención</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400 mb-2">Lunes - Viernes</div>
                  <div className="text-white/70">8:00 - 18:00</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400 mb-2">Sábados</div>
                  <div className="text-white/70">9:00 - 14:00</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-400 mb-2">Domingos</div>
                  <div className="text-white/70">Cerrado</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Formulario de Contacto Espectacular */}
      <section id="contact-form" className="py-32 bg-gradient-to-br from-slate-800 to-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-hexagon-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Información Lateral */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                    Cuéntanos
                  </span>
                  <br />
                  tu proyecto
                </h2>
                <p className="text-xl text-white/70 leading-relaxed mb-8">
                  Cada negocio es único. Comparte tus necesidades y crearemos una solución 
                  personalizada que impulse tu crecimiento.
                </p>
              </div>

              {/* Estadísticas de Respuesta */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: "< 24h", label: "Tiempo de respuesta", icon: Clock },
                  { number: "98%", label: "Satisfacción cliente", icon: Star },
                  { number: "500+", label: "Clientes activos", icon: Users },
                  { number: "35+", label: "Años experiencia", icon: Building2 }
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                        <IconComponent className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                        <div className="text-white/70 text-sm">{stat.label}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Formulario Moderno */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                  <Send className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Envíanos tu mensaje</h3>
                  <p className="text-white/70">Te responderemos lo antes posible</p>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Nombre completo *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu nombre" 
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="empresa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Empresa *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre de tu empresa" 
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="tu@email.com" 
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Teléfono *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+34 XXX XXX XXX" 
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="mensaje"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Mensaje *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuéntanos en qué podemos ayudarte..."
                              rows={5}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400 resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacidad"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-white/30 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-white text-sm">
                              Acepto la política de privacidad *
                            </FormLabel>
                            <p className="text-xs text-white/60">
                              Al enviar este formulario aceptas que tratemos tus datos 
                              para responder a tu consulta.
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold py-4 rounded-2xl shadow-2xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar mensaje
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Nuestras Ubicaciones */}
      <section className="py-32 bg-gradient-to-br from-slate-700 to-slate-600 relative overflow-hidden">
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
              Nuestras <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Ubicaciones</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Presentes en las principales ciudades del sureste español para estar más cerca de ti
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {delegations.map((delegation, index) => (
              <motion.div
                key={delegation.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all duration-500 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{delegation.city}</h3>
                        <div className="text-emerald-400 font-semibold">Delegación Principal</div>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white px-3 py-1">
                      Activa
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Building2 className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-white font-medium">Dirección</div>
                        <div className="text-white/70">{delegation.address}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <div className="text-white font-medium">Teléfono</div>
                        <a 
                          href={`tel:${delegation.phone}`}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          onClick={() => handlePhoneCall(delegation.phone)}
                        >
                          {delegation.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                      onClick={() => handleViewOnMap(delegation.city)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver en globo
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => handlePhoneCall(delegation.phone)}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Globe Interactivo Mejorado */}
          <motion.div
            id="interactive-globe"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <GlobeIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-4">Globo Interactivo 3D</h3>
              <p className="text-white/70">Haz clic en las ubicaciones para una experiencia inmersiva</p>
            </div>
            
            <div className="relative">
              {/* Globe Component */}
              <div className="h-[500px] w-full flex items-center justify-center">
                <Globe 
                  className="w-full h-full"
                  onLocationClick={handleLocationClick}
                />
              </div>

              {/* Floating Action Buttons - Simplificado */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* <Button
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20"
                  onClick={() => {
                    setSelectedLocation(null);
                    setShowGlobeDetails(false);
                  }}
                >
                  <GlobeIcon className="w-4 h-4 mr-2" />
                  Reset
                </Button> */}
              </div>

              {/* Simplified Location Details Panel */}
              <AnimatePresence>
                {showGlobeDetails && selectedLocationData && (
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="absolute top-4 left-4 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white max-w-xs shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg">{selectedLocationData.name}</h4>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => setShowGlobeDetails(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-3">{selectedLocationData.description}</p>
                    
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                      onClick={() => {
                        const delegation = delegations.find(d => 
                          d.city.toLowerCase() === selectedLocationData.name.toLowerCase()
                        );
                        if (delegation) {
                          handleGoogleMaps(delegation.address, delegation.city);
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Ver en Maps
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instructions - Simplificadas */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm mb-2">
                Haz clic en los puntos para una experiencia inmersiva
              </p>
              <div className="flex justify-center gap-4">
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-32 bg-gradient-to-br from-slate-600 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-stars-pattern opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              ¿Listo para <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">comenzar</span>?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12">
              Nuestro equipo está preparado para ayudarte a encontrar las mejores soluciones 
              para tu negocio. El primer paso es tan simple como una llamada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-xl font-semibold rounded-3xl shadow-2xl"
                onClick={() => handlePhoneCall("+34968123456")}
              >
                <Phone className="w-6 h-6 mr-3" />
                Llamar ahora
              </Button>
              <Button 
                size="lg" 
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-10 py-6 text-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
                onClick={() => handleWhatsAppClick("+34968123456", "¡Hola! Me interesa conocer más sobre sus servicios. ¿Podrían proporcionarme más información?")}
              >
                <MessageSquare className="w-6 h-6 mr-3" />
                Chat en vivo
              </Button>
            </div>
            
            {/* Garantías de Servicio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { icon: Clock, text: "Respuesta en 24h", desc: "Garantizada" },
                { icon: Users, text: "Atención personalizada", desc: "Especialistas dedicados" },
                { icon: Star, text: "Satisfacción 98%", desc: "Clientes satisfechos" }
              ].map((guarantee, index) => {
                const IconComponent = guarantee.icon;
                
                return (
                  <motion.div
                    key={guarantee.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <IconComponent className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-white font-semibold text-lg">{guarantee.text}</div>
                    <div className="text-white/70">{guarantee.desc}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}