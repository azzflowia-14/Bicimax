export const dynamic = "force-dynamic"

import { connectDB } from "@/lib/mongodb"
import { Category } from "@/models/Category"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

async function getCategorias() {
  await connectDB()
  const cats = await Category.find({ activa: true })
    .sort({ orden: 1 })
    .lean()
  return cats.map((c) => ({
    _id: c._id.toString(),
    nombre: c.nombre,
    slug: c.slug,
  }))
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categorias = await getCategorias()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={categorias} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
