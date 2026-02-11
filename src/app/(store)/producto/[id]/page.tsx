export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"
import { ProductDetail } from "@/components/store/product-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params

  await connectDB()
  const product = await Product.findById(id).lean()
  if (!product || !product.activo) return notFound()

  const category = await Category.findById(product.categoria).lean()

  // Related products
  const related = await Product.find({
    _id: { $ne: product._id },
    categoria: product.categoria,
    activo: true,
  })
    .limit(4)
    .lean()

  const productData = {
    _id: product._id.toString(),
    nombre: product.nombre,
    slug: product.slug,
    descripcion: product.descripcion,
    precio: product.precio,
    precioOferta: product.precioOferta,
    imagenes: product.imagenes,
    marca: product.marca,
    stock: product.stock,
    categoria: category?.nombre || "",
    categoriaSlug: category?.slug || "",
    especificaciones: product.especificaciones || {},
  }

  const relatedData = related.map((p) => ({
    _id: p._id.toString(),
    nombre: p.nombre,
    slug: p.slug,
    precio: p.precio,
    precioOferta: p.precioOferta,
    imagenes: p.imagenes,
    marca: p.marca,
    stock: p.stock,
    categoria: p.categoria.toString(),
  }))

  return <ProductDetail producto={productData} relacionados={relatedData} />
}
