import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { VentaMostrador } from "@/models/VentaMostrador"

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Argentina is UTC-3 (no DST)
const PAID_STATES = ["pagado", "enviado", "entregado"]
const VM_VALID_STATES = ["pendiente", "pagado"] // both represent real sales

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

  const vmMatchStage = {
    $match: {
      estado: { $in: VM_VALID_STATES },
      createdAt: { $gte: fromUTC, $lte: toUTC },
    },
  }

  // Shared pipeline fragments for item-level aggregation
  const itemGroupStage = {
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
      docIds: { $addToSet: "$_id" },
    },
  }

  const itemProjectStage = {
    $project: {
      _id: 0,
      totalVentas: 1,
      totalGanancia: 1,
      cantidad: { $size: "$docIds" },
    },
  }

  // KPIs — run both aggregations in parallel
  const [orderKpiArr, vmKpiArr] = await Promise.all([
    Order.aggregate([matchStage, { $unwind: "$items" }, itemGroupStage, itemProjectStage]),
    VentaMostrador.aggregate([vmMatchStage, { $unwind: "$items" }, itemGroupStage, itemProjectStage]),
  ])

  const oKpi = orderKpiArr[0] || { totalVentas: 0, totalGanancia: 0, cantidad: 0 }
  const vmKpi = vmKpiArr[0] || { totalVentas: 0, totalGanancia: 0, cantidad: 0 }

  const totalVentas = oKpi.totalVentas + vmKpi.totalVentas
  const totalGanancia = oKpi.totalGanancia + vmKpi.totalGanancia
  const cantidadTotal = oKpi.cantidad + vmKpi.cantidad

  const kpis = {
    totalVentas,
    totalGanancia,
    cantidadPedidos: cantidadTotal,
    ticketPromedio: cantidadTotal > 0 ? totalVentas / cantidadTotal : 0,
    margenPromedio: totalVentas > 0 ? Math.round((totalGanancia / totalVentas) * 10000) / 100 : 0,
    pedidosPendientes: 0,
    ventasMostradorPendientes: 0,
    cantidadOnline: oKpi.cantidad,
    cantidadMostrador: vmKpi.cantidad,
  }

  // Counts (all time)
  const [pedPend, vmPend] = await Promise.all([
    Order.countDocuments({ estado: "pendiente" }),
    VentaMostrador.countDocuments({ estado: "pendiente" }),
  ])
  kpis.pedidosPendientes = pedPend
  kpis.ventasMostradorPendientes = vmPend

  // Daily sales — both collections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyPipeline = (matchS: any) => [
    matchS,
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
        docIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        fecha: "$_id",
        total: 1,
        ganancia: 1,
        cantidad: { $size: "$docIds" },
      },
    },
    { $sort: { fecha: 1 as const } },
  ]

  const [orderDaily, vmDaily] = await Promise.all([
    Order.aggregate(dailyPipeline(matchStage)),
    VentaMostrador.aggregate(dailyPipeline(vmMatchStage)),
  ])

  // Merge daily by fecha
  const dailyMap = new Map<string, { total: number; ganancia: number; cantidad: number }>()
  for (const d of [...orderDaily, ...vmDaily]) {
    const existing = dailyMap.get(d.fecha)
    if (existing) {
      existing.total += d.total
      existing.ganancia += d.ganancia
      existing.cantidad += d.cantidad
    } else {
      dailyMap.set(d.fecha, { total: d.total, ganancia: d.ganancia, cantidad: d.cantidad })
    }
  }
  const ventasDiarias = Array.from(dailyMap.entries())
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Top products — both collections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPipeline = (matchS: any) => [
    matchS,
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
  ]

  const [orderTop, vmTop] = await Promise.all([
    Order.aggregate(topPipeline(matchStage)),
    VentaMostrador.aggregate(topPipeline(vmMatchStage)),
  ])

  // Merge top products by _id
  const topMap = new Map<string, { nombre: string; cantidadVendida: number; totalVentas: number; totalGanancia: number }>()
  for (const p of [...orderTop, ...vmTop]) {
    const existing = topMap.get(p._id)
    if (existing) {
      existing.cantidadVendida += p.cantidadVendida
      existing.totalVentas += p.totalVentas
      existing.totalGanancia += p.totalGanancia
    } else {
      topMap.set(p._id, {
        nombre: p.nombre,
        cantidadVendida: p.cantidadVendida,
        totalVentas: p.totalVentas,
        totalGanancia: p.totalGanancia,
      })
    }
  }
  const topProductos = Array.from(topMap.entries())
    .map(([_id, data]) => ({ _id, ...data }))
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, 10)

  return NextResponse.json({ kpis, ventasDiarias, topProductos })
}
