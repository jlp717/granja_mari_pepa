import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">Grupo Topgel</h3>
              <p className="text-sm text-gray-400">Granja Mari Pepa</p>
            </div>
            <p className="text-sm text-gray-400">
              Especialistas en distribución de productos alimentarios de alta calidad desde 1985.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">ISO</span>
              </div>
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">♻️</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/productos" className="text-gray-400 hover:text-white transition-colors">Productos</Link></li>
              <li><Link href="/acerca" className="text-gray-400 hover:text-white transition-colors">Quiénes somos</Link></li>
              <li><Link href="/contacto" className="text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
              <li><Link href="/area-clientes" className="text-gray-400 hover:text-white transition-colors">Área de clientes</Link></li>
              <li><Link href="/politica-privacidad" className="text-gray-400 hover:text-white transition-colors">Política de privacidad</Link></li>
            </ul>
          </div>

          {/* Contact Murcia */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Murcia</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Polígono Industrial Oeste<br />Calle 15, Nave 8<br />30169 San Ginés, Murcia</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <p>+34 968 123 456</p>
              </div>
            </div>
          </div>

          {/* Contact Almería */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Almería</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Carretera de Níjar km 15<br />Polígono La Redonda<br />04120 Almería</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <p>+34 950 987 654</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <p>info@grupotopgel.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2024 Grupo Topgel. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Clock className="w-4 h-4" />
            <p>Lun-Vie: 8:00-18:00 | Sáb: 9:00-14:00</p>
          </div>
        </div>
      </div>
    </footer>
  );
}