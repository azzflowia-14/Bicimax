export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { ProductCard } from "@/components/store/product-card"
import { Heart } from "lucide-react"

export default async function FavoritosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?redirect=/cuenta/favoritos")

  await connectDB()
  const user = await User.findById(session.user.id)
  if (!user || !user.favoritos?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis favoritos</h1>
        <div className="text-center py-16">
          <Heart className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-muted-foreground">No tenes productos favoritos todavia</p>
        </div>
      </div>
    )
  }

  const products = await Product.find({
    _id: { $in: user.favoritos },
    activo: true,
  }).lean()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis favoritos</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard
            key={p._id.toString()}
            producto={{
              _id: p._id.toString(),
              nombre: p.nombre,
              slug: p.slug,
              precio: p.precio,
              precioOferta: p.precioOferta,
              imagenes: p.imagenes,
              marca: p.marca,
              stock: p.stock,
              categoria: p.categoria.toString(),
            }}
          />
        ))}
      </div>
    </div>
  )
}
