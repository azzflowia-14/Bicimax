import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/mongodb"
import { VentaMostrador } from "@/models/VentaMostrador"

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000

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

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function formatDateAR(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(date))
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return new Response("No autorizado", { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const from = params.get("from")
  const to = params.get("to")

  await connectDB()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { estado: { $ne: "cancelado" } }
  if (from) filter.createdAt = { ...filter.createdAt, $gte: localDateToUTC(from) }
  if (to) filter.createdAt = { ...filter.createdAt, $lte: localDateToUTC(to, true) }

  const ventas = await VentaMostrador.find(filter)
    .sort({ createdAt: -1 })
    .lean()

  const headers = [
    "Fecha",
    "Cliente",
    "Telefono",
    "Productos",
    "Cant. Items",
    "Total",
    "Total Pagado",
    "Restante",
    "Estado",
    "Pagos Detalle",
    "Notas",
  ]

  const rows = ventas.map((v) => {
    const items = (v.items as Array<{ cantidad: number; nombre: string; precio: number }>)
      .map((i) => `${i.cantidad}x ${i.nombre} ($${i.precio})`)
      .join(" | ")

    const cantItems = (v.items as Array<{ cantidad: number }>).reduce(
      (sum, i) => sum + i.cantidad,
      0
    )

    const pagosDetalle = (v.pagos as Array<{ monto: number; fecha: Date | string; nota?: string }>)
      .map(
        (p) =>
          `$${p.monto} (${formatDateAR(p.fecha)}${p.nota ? " - " + p.nota : ""})`
      )
      .join(" | ")

    const totalPagado = v.totalPagado as number
    const total = v.total as number

    return [
      escapeCsv(formatDateAR(v.createdAt as Date)),
      escapeCsv((v.cliente as { nombre: string }).nombre),
      escapeCsv((v.cliente as { telefono: string }).telefono),
      escapeCsv(items),
      String(cantItems),
      String(total),
      String(totalPagado),
      String(total - totalPagado),
      v.estado as string,
      escapeCsv(pagosDetalle || "Sin pagos"),
      escapeCsv((v.notas as string) || ""),
    ].join(",")
  })

  const fromLabel = from || "inicio"
  const toLabel = to || "hoy"
  const filename = `ventas-mostrador-${fromLabel}-a-${toLabel}.csv`

  // BOM for Excel UTF-8 compatibility
  const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
