import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { VentaMostrador } from "@/models/VentaMostrador"
import { Product } from "@/models/Product"

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "true"
}

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await connectDB()

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")

  const filter: Record<string, string> = {}
  if (estado && estado !== "todos") {
    filter.estado = estado
  }

  const ventas = await VentaMostrador.find(filter)
    .sort({ createdAt: -1 })
    .lean()

  const result = ventas.map((v) => ({
    ...v,
    _id: v._id.toString(),
    pagos: v.pagos.map((p: Record<string, unknown>) => ({
      ...p,
      _id: p._id?.toString(),
    })),
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { cliente, items, pagoInicial, notas } = await request.json()

    if (!cliente?.nombre || !cliente?.telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono del cliente son obligatorios" },
        { status: 400 }
      )
    }

    if (!items?.length) {
      return NextResponse.json(
        { error: "Debe agregar al menos un producto" },
        { status: 400 }
      )
    }

    await connectDB()

    const ventaItems = []
    let total = 0

    // Validate stock and build items
    for (const item of items) {
      const product = await Product.findById(item.productoId)
      if (!product || !product.activo) {
        return NextResponse.json(
          { error: `Producto "${item.nombre || item.productoId}" no disponible` },
          { status: 400 }
        )
      }
      if (product.stock < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.nombre}" (disponible: ${product.stock})` },
          { status: 400 }
        )
      }

      const precio = product.precioOferta ?? product.precio
      total += precio * item.cantidad

      ventaItems.push({
        productoId: product._id.toString(),
        nombre: product.nombre,
        precio,
        cantidad: item.cantidad,
        imagen: product.imagenes[0] || "",
        costPriceAtPurchase: product.costPrice || 0,
      })
    }

    // Deduct stock atomically
    for (const item of ventaItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productoId, stock: { $gte: item.cantidad } },
        { $inc: { stock: -item.cantidad } },
        { new: true }
      )
      if (!updated) {
        // Race condition: stock was taken between check and deduction
        // Restore any stock already deducted
        for (const prev of ventaItems) {
          if (prev.productoId === item.productoId) break
          await Product.findByIdAndUpdate(prev.productoId, {
            $inc: { stock: prev.cantidad },
          })
        }
        return NextResponse.json(
          { error: `Stock insuficiente para "${item.nombre}" (concurrencia)` },
          { status: 409 }
        )
      }
    }

    // Build pagos
    const pagos = []
    let totalPagado = 0
    const montoInicial = Number(pagoInicial) || 0
    if (montoInicial > 0) {
      pagos.push({ monto: montoInicial, fecha: new Date() })
      totalPagado = montoInicial
    }

    const estado = totalPagado >= total ? "pagado" : "pendiente"

    const venta = await VentaMostrador.create({
      cliente: { nombre: cliente.nombre, telefono: cliente.telefono },
      items: ventaItems,
      total,
      totalPagado,
      pagos,
      estado,
      notas: notas || undefined,
    })

    return NextResponse.json({ _id: venta._id.toString() }, { status: 201 })
  } catch (error) {
    console.error("Error creando venta mostrador:", error)
    return NextResponse.json(
      { error: "Error al crear la venta" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { _id, estado } = await request.json()

    if (estado !== "cancelado") {
      return NextResponse.json(
        { error: "Solo se permite cancelar ventas desde aquí" },
        { status: 400 }
      )
    }

    await connectDB()

    const venta = await VentaMostrador.findById(_id)
    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }
    if (venta.estado === "cancelado") {
      return NextResponse.json(
        { error: "La venta ya está cancelada" },
        { status: 400 }
      )
    }

    // Restore stock
    for (const item of venta.items) {
      await Product.findByIdAndUpdate(item.productoId, {
        $inc: { stock: item.cantidad },
      })
    }

    venta.estado = "cancelado"
    await venta.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error cancelando venta:", error)
    return NextResponse.json(
      { error: "Error al cancelar la venta" },
      { status: 500 }
    )
  }
}
