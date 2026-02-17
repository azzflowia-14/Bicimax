import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await connectDB()

  const products = await Product.find({ activo: true })
    .select("nombre sku stock precio precioOferta costPrice marca")
    .sort({ stock: -1 })
    .lean()

  let totalUnidades = 0
  let valorVenta = 0
  let valorCosto = 0

  const items = products.map((p) => {
    const precioVenta = (p.precioOferta as number) ?? (p.precio as number)
    const costo = (p.costPrice as number) || 0
    const stock = p.stock as number
    const valorVentaItem = precioVenta * stock
    const valorCostoItem = costo * stock
    const margen = precioVenta > 0 ? ((precioVenta - costo) / precioVenta) * 100 : 0

    totalUnidades += stock
    valorVenta += valorVentaItem
    valorCosto += valorCostoItem

    return {
      _id: p._id.toString(),
      nombre: p.nombre,
      sku: p.sku || "",
      marca: p.marca,
      stock,
      precioVenta,
      costPrice: costo,
      valorVentaItem,
      valorCostoItem,
      margen: Math.round(margen * 100) / 100,
    }
  })

  return NextResponse.json({
    totalUnidades,
    valorVenta,
    valorCosto,
    gananciaEstimada: valorVenta - valorCosto,
    productos: items,
  })
}
