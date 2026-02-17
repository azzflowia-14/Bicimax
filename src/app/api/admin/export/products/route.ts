import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"
import { Supplier } from "@/models/Supplier"

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return new Response("No autorizado", { status: 401 })
  }

  await connectDB()

  const [products, categories, suppliers] = await Promise.all([
    Product.find().sort({ nombre: 1 }).lean(),
    Category.find().lean(),
    Supplier.find().lean(),
  ])

  const catMap = new Map(
    categories.map((c) => [c._id.toString(), c.nombre as string])
  )
  const supMap = new Map(
    suppliers.map((s) => [s._id.toString(), s.nombre as string])
  )

  const headers = [
    "SKU",
    "Nombre",
    "Marca",
    "Categoria",
    "Precio",
    "PrecioOferta",
    "Costo",
    "Margen%",
    "Stock",
    "ValorStockVenta",
    "ValorStockCosto",
    "Proveedor",
    "Activo",
  ]

  const rows = products.map((p) => {
    const precioVenta = (p.precioOferta as number) ?? (p.precio as number)
    const costo = (p.costPrice as number) || 0
    const stock = p.stock as number
    const margen =
      precioVenta > 0
        ? Math.round(((precioVenta - costo) / precioVenta) * 10000) / 100
        : 0

    return [
      escapeCsv((p.sku as string) || ""),
      escapeCsv(p.nombre as string),
      escapeCsv(p.marca as string),
      escapeCsv(catMap.get((p.categoria as string) || "") || ""),
      String(p.precio),
      p.precioOferta ? String(p.precioOferta) : "",
      String(costo),
      String(margen),
      String(stock),
      String(precioVenta * stock),
      String(costo * stock),
      escapeCsv(supMap.get((p.supplierId as string) || "") || ""),
      (p.activo as boolean) ? "Si" : "No",
    ].join(",")
  })

  const today = new Date().toISOString().slice(0, 10)
  // BOM for Excel UTF-8 compatibility
  const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-bicimax-${today}.csv"`,
    },
  })
}
