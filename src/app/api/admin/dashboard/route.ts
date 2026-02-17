import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Argentina is UTC-3 (no DST)
const PAID_STATES = ["pagado", "enviado", "entregado"]

function localDateToUTC(dateStr: string, endOfDay = false): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  const local = new Date(
    y,
    m - 1,
    d,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0
  )
  return new Date(local.getTime() + TZ_OFFSET_MS)
}

function defaultRange() {
  const now = new Date()
  const baTime = new Date(now.getTime() - TZ_OFFSET_MS)
  const y = baTime.getFullYear()
  const m = String(baTime.getMonth() + 1).padStart(2, "0")
  return { from: `${y}-${m}-01`, to: baTime.toISOString().slice(0, 10) }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const { from, to } = {
    from: params.get("from") || defaultRange().from,
    to: params.get("to") || defaultRange().to,
  }

  const fromUTC = localDateToUTC(from)
  const toUTC = localDateToUTC(to, true)

  await connectDB()

  const matchStage = {
    $match: {
      estado: { $in: PAID_STATES },
      createdAt: { $gte: fromUTC, $lte: toUTC },
    },
  }

  // KPIs
  const [kpiResult] = await Order.aggregate([
    matchStage,
    { $unwind: "$items" },
    {
      $group: {
        _id: null,
        totalVentas: {
          $sum: { $multiply: ["$items.precio", "$items.cantidad"] },
        },
        totalGanancia: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  "$items.precio",
                  { $ifNull: ["$items.costPriceAtPurchase", 0] },
                ],
              },
              "$items.cantidad",
            ],
          },
        },
        orderIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        totalVentas: 1,
        totalGanancia: 1,
        cantidadPedidos: { $size: "$orderIds" },
        ticketPromedio: {
          $cond: [
            { $gt: [{ $size: "$orderIds" }, 0] },
            { $divide: ["$totalVentas", { $size: "$orderIds" }] },
            0,
          ],
        },
      },
    },
  ])

  const kpis = kpiResult || {
    totalVentas: 0,
    totalGanancia: 0,
    cantidadPedidos: 0,
    ticketPromedio: 0,
  }

  // Margen promedio
  kpis.margenPromedio =
    kpis.totalVentas > 0
      ? Math.round((kpis.totalGanancia / kpis.totalVentas) * 10000) / 100
      : 0

  // Pedidos pendientes (all time)
  kpis.pedidosPendientes = await Order.countDocuments({
    estado: "pendiente",
  })

  // Daily sales
  const ventasDiarias = await Order.aggregate([
    matchStage,
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "America/Argentina/Buenos_Aires",
          },
        },
        total: { $sum: { $multiply: ["$items.precio", "$items.cantidad"] } },
        ganancia: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  "$items.precio",
                  { $ifNull: ["$items.costPriceAtPurchase", 0] },
                ],
              },
              "$items.cantidad",
            ],
          },
        },
        orderIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        fecha: "$_id",
        total: 1,
        ganancia: 1,
        cantidad: { $size: "$orderIds" },
      },
    },
    { $sort: { fecha: 1 } },
  ])

  // Top products
  const topProductos = await Order.aggregate([
    matchStage,
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productoId",
        nombre: { $first: "$items.nombre" },
        cantidadVendida: { $sum: "$items.cantidad" },
        totalVentas: {
          $sum: { $multiply: ["$items.precio", "$items.cantidad"] },
        },
        totalGanancia: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  "$items.precio",
                  { $ifNull: ["$items.costPriceAtPurchase", 0] },
                ],
              },
              "$items.cantidad",
            ],
          },
        },
      },
    },
    { $sort: { cantidadVendida: -1 } },
    { $limit: 10 },
  ])

  return NextResponse.json({ kpis, ventasDiarias, topProductos })
}
