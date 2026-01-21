import type { Metadata } from 'next'
import { Link } from '@/lib/navigation'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock, Truck, Award, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Distribución Alimentaria en Lorca | Granja Mari Pepa - Polígono Saprelorca',
    description: 'Granja Mari Pepa en Lorca (Murcia). Distribuidores de productos congelados, carnes, pescados y precocinados para hostelería. Polígono Industrial Saprelorca. Teléfono 968 46 75 14.',
    keywords: [
        'granja mari pepa lorca',
        'mari pepa lorca',
        'distribución alimentaria lorca',
        'polígono saprelorca',
        'distribuidores lorca murcia',
        'productos congelados lorca',
        'hostelería lorca',
        'horeca lorca'
    ],
    openGraph: {
        title: 'Granja Mari Pepa Lorca - Distribución Alimentaria',
        description: 'Tu distribuidor de confianza en Lorca desde 1966. Polígono Industrial Saprelorca.',
        url: 'https://www.mari-pepa.com/lorca',
        images: ['https://www.mari-pepa.com/og-image.jpg'],
    },
}

export default function LorcaPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold mb-6">
                            📍 Polígono Industrial Saprelorca
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                            Granja Mari Pepa{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                                en Lorca
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
                            Tu distribuidor de productos alimentarios de confianza desde 1966.
                            Servicio especializado para hostelería y restauración en Murcia y Almería.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contacto">
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-4 text-lg">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Contactar ahora
                                </Button>
                            </Link>
                            <Link href="/productos">
                                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                                    Ver productos
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Datos de Contacto Lorca */}
            <section className="py-16 bg-white/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                            Nuestra Sede en <span className="text-blue-400">Lorca</span>
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Información de contacto */}
                            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
                                <h3 className="text-2xl font-bold text-white mb-6">Datos de Contacto</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Dirección</p>
                                            <p className="text-white/70">
                                                Pol. Industrial Saprelorca<br />
                                                Avd. Francisco Jimeno Sola, 3<br />
                                                30817 Lorca, Murcia
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Phone className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Teléfono</p>
                                            <a href="tel:+34968467514" className="text-blue-300 hover:text-blue-200 text-lg">
                                                968 46 75 14
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Email</p>
                                            <a href="mailto:pedidos@mari-pepa.com" className="text-blue-300 hover:text-blue-200">
                                                pedidos@mari-pepa.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Clock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Horario</p>
                                            <p className="text-white/70">
                                                Lunes a Viernes<br />
                                                8:00 - 13:00 y 16:00 - 19:00
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mapa embebido */}
                            <div className="bg-white/10 rounded-2xl overflow-hidden border border-white/20">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3169.1!2d-1.7009!3d37.6711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQwJzE2LjAiTiAxwrA0MicwMy4yIlc!5e0!3m2!1ses!2ses!4v1234567890"
                                    width="100%"
                                    height="100%"
                                    style={{ minHeight: '300px', border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Ubicación Granja Mari Pepa Lorca"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Por qué elegirnos */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                        ¿Por qué elegir <span className="text-teal-400">Mari Pepa</span>?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                <Truck className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Entrega en 24-48h</h3>
                            <p className="text-white/70">Servicio rápido respetando la cadena de frío en todo momento.</p>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
                            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Certificación ISO 9001</h3>
                            <p className="text-white/70">Garantía de calidad respaldada por certificación internacional.</p>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">+55 Años de Experiencia</h3>
                            <p className="text-white/70">Sirviendo a la hostelería de Murcia y Almería desde 1966.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-16 bg-gradient-to-r from-blue-600/20 to-teal-600/20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        ¿Tienes un restaurante o negocio en Lorca?
                    </h2>
                    <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                        Contacta con nosotros y descubre cómo podemos ayudarte con más de 1.500 referencias de productos.
                    </p>
                    <Link href="/contacto">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 px-8 py-4 text-lg font-semibold">
                            Solicitar información
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    )
}
