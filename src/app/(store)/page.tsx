export const dynamic = "force-dynamic"

import Link from "next/link"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/store/product-card"
import { Bike, Truck, Shield, CreditCard } from "lucide-react"

async function getDestacados() {
  await connectDB()
  const products = await Product.find({ activo: true, destacado: true })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()
  return products.map((p) => ({
    _id: p._id.toString(),
    nombre: p.nombre,
    slug: p.slug,
    precio: p.precio,
    precioOferta: p.precioOferta,
    imagenes: p.imagenes,
    marca: p.marca,
    stock: p.stock,
    categoria: p.categoria,
  }))
}

async function getCategorias() {
  await connectDB()
  const cats = await Category.find({ activa: true }).sort({ orden: 1 }).lean()
  return cats.map((c) => ({
    _id: c._id.toString(),
    nombre: c.nombre,
    slug: c.slug,
    imagen: c.imagen,
  }))
}

export default async function HomePage() {
  const [destacados, categorias] = await Promise.all([
    getDestacados(),
    getCategorias(),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bici<span className="text-blue-400">max</span>
              <span className="block text-2xl md:text-3xl font-medium mt-2 text-slate-300">Bike Shop - Ramallo</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Variedad de marcas, talles y modelos. Todas las tarjetas.
              Envios a todo el pais.
            </p>
            <div className="flex gap-3">
              <Link href="/productos">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Ver productos
                </Button>
              </Link>
              <Link href="/productos?categoria=bicicletas">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Bicicletas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: "Envio a todo el pais", sub: "Gratis en compras +$100.000" },
              { icon: CreditCard, label: "Mercado Pago", sub: "Tarjeta, debito o transferencia" },
              { icon: Shield, label: "Compra segura", sub: "Proteccion al comprador" },
              { icon: Bike, label: "Garantia", sub: "En todos los productos" },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-2.5">
                  <feat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feat.label}</p>
                  <p className="text-xs text-muted-foreground">{feat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categorias.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categorias.map((cat) => (
              <Link key={cat._id} href={`/productos?categoria=${cat.slug}`}>
                <Card className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {cat.imagen ? (
                      <img
                        src={cat.imagen}
                        alt={cat.nombre}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Bike className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 text-center">
                    <p className="font-medium">{cat.nombre}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Productos destacados</h2>
            <Link href="/productos">
              <Button variant="outline">Ver todos</Button>
            </Link>
          </div>
          {destacados.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Proximamente agregaremos productos destacados
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {destacados.map((prod) => (
                <ProductCard key={prod._id} producto={prod} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
