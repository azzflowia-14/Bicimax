import Link from "next/link"
import { Bike } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bike className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold text-white">
                Bici<span className="text-blue-400">max</span>
              </span>
            </div>
            <p className="text-sm">
              Tu tienda de bicicletas y accesorios. Todo lo que necesitas para
              rodar.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Tienda</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/productos" className="hover:text-white transition-colors">Todos los productos</Link></li>
              <li><Link href="/productos?categoria=bicicletas" className="hover:text-white transition-colors">Bicicletas</Link></li>
              <li><Link href="/productos?categoria=cascos" className="hover:text-white transition-colors">Cascos</Link></li>
              <li><Link href="/productos?categoria=accesorios" className="hover:text-white transition-colors">Accesorios</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-3">Mi Cuenta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cuenta/pedidos" className="hover:text-white transition-colors">Mis pedidos</Link></li>
              <li><Link href="/cuenta/favoritos" className="hover:text-white transition-colors">Favoritos</Link></li>
              <li><Link href="/cuenta/perfil" className="hover:text-white transition-colors">Mi perfil</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>contacto@bicimax.com</li>
              <li>+54 11 1234-5678</li>
              <li>Buenos Aires, Argentina</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Bicimax. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
