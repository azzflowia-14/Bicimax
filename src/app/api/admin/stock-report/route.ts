import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"
import { Supplier } from "@/models/Supplier"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await connectDB()

  const full = request.nextUrl.searchParams.get("full") === "true"

  // Full mode: include all products (active + inactive) with category/supplier names
  const [products, categories, suppliers] = await Promise.all([
    Product.find(full ? {} : { activo: true })
      .select(
        full
          ? "nombre sku stock precio precioOferta costPrice marca categoria supplierId activo"
          : "nombre sku stock precio precioOferta costPrice marca"
      )
      .sort({ stock: -1 })
      .lean(),
    full ? Category.find().lean() : Promise.resolve([]),
    full ? Supplier.find().lean() : Promise.resolve([]),
  ])

  const catMap = new Map(
    categories.map((c) => [c._id.toString(), c.nombre as string])
  )
  const supMap = new Map(
    suppliers.map((s) => [s._id.toString(), s.nombre as string])
  )

  let totalUnidades = 0
  let valorVenta = 0
  let valorCosto = 0
  let sinStock = 0
  let stockBajo = 0

  const items = products.map((p) => {
    const precioVenta = (p.precioOferta as number) ?? (p.precio as number)
    const costo = (p.costPrice as number) || 0
    const stock = p.stock as number
    const valorVentaItem = precioVenta * stock
    const valorCostoItem = costo * stock
    const margen =
      precioVenta > 0
        ? Math.round(((precioVenta - costo) / precioVenta) * 10000) / 100
        : 0

    if ((p.activo as boolean) !== false) {
      totalUnidades += stock
      valorVenta += valorVentaItem
      valorCosto += valorCostoItem
      if (stock === 0) sinStock++
      else if (stock <= 3) stockBajo++
    }

    const base = {
      _id: p._id.toString(),
      nombre: p.nombre,
      sku: (p.sku as string) || "",
      marca: p.marca,
      stock,
      precioVenta,
      costPrice: costo,
      valorVentaItem,
      valorCostoItem,
      margen,
    }

    if (full) {
      return {
        ...base,
        precio: p.precio as number,
        precioOferta: (p.precioOferta as number) || null,
        categoria: catMap.get((p.categoria as string) || "") || "",
        proveedor: supMap.get((p.supplierId as string) || "") || "",
        activo: (p.activo as boolean) !== false,
      }
    }

    return base
  })

  if (full) {
    return NextResponse.json({
      summary: {
        totalProductos: products.filter((p) => (p.activo as boolean) !== false).length,
        totalUnidades,
        valorVenta,
        valorCosto,
        gananciaEstimada: valorVenta - valorCosto,
        sinStock,
        stockBajo,
      },
      productos: items,
    })
  }

  return NextResponse.json({
    totalUnidades,
    valorVenta,
    valorCosto,
    gananciaEstimada: valorVenta - valorCosto,
    productos: items,
  })
}
