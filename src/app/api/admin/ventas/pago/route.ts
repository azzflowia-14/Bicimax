import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { VentaMostrador } from "@/models/VentaMostrador"

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "true"
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { ventaId, monto, nota } = await request.json()

    if (!ventaId || !monto || monto <= 0) {
      return NextResponse.json(
        { error: "ventaId y monto (> 0) son obligatorios" },
        { status: 400 }
      )
    }

    await connectDB()

    const venta = await VentaMostrador.findById(ventaId)
    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }
    if (venta.estado === "cancelado") {
      return NextResponse.json(
        { error: "No se puede registrar pagos en una venta cancelada" },
        { status: 400 }
      )
    }
    if (venta.estado === "pagado") {
      return NextResponse.json(
        { error: "La venta ya está completamente pagada" },
        { status: 400 }
      )
    }

    const restante = venta.total - venta.totalPagado
    if (monto > restante + 0.01) {
      return NextResponse.json(
        { error: `El monto excede el restante ($${restante.toFixed(0)})` },
        { status: 400 }
      )
    }

    const montoFinal = Math.min(monto, restante)

    venta.pagos.push({
      monto: montoFinal,
      fecha: new Date(),
      nota: nota || undefined,
    })

    venta.totalPagado = venta.pagos.reduce(
      (sum: number, p: { monto: number }) => sum + p.monto,
      0
    )

    if (venta.totalPagado >= venta.total) {
      venta.estado = "pagado"
    }

    await venta.save()

    return NextResponse.json({ ok: true, totalPagado: venta.totalPagado, estado: venta.estado })
  } catch (error) {
    console.error("Error registrando pago:", error)
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 }
    )
  }
}
