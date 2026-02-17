"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  BarChart3,
  Download,
  Warehouse,
  Store,
} from "lucide-react"
import { formatPrice } from "@/lib/format"

interface Kpis {
  totalVentas: number
  totalGanancia: number
  cantidadPedidos: number
  ticketPromedio: number
  margenPromedio: number
  pedidosPendientes: number
  ventasMostradorPendientes: number
  cantidadOnline: number
  cantidadMostrador: number
}

interface VentaDiaria {
  fecha: string
  total: number
  ganancia: number
  cantidad: number
}

interface TopProducto {
  _id: string
  nombre: string
  cantidadVendida: number
  totalVentas: number
  totalGanancia: number
}

interface StockReport {
  totalUnidades: number
  valorVenta: number
  valorCosto: number
  gananciaEstimada: number
  productos: Array<{
    _id: string
    nombre: string
    sku: string
    stock: number
    precioVenta: number
    costPrice: number
    margen: number
  }>
}

function getDefaultRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return {
    from: `${y}-${m}-01`,
    to: now.toISOString().slice(0, 10),
  }
}

function getQuickRange(key: string) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  if (key === "7d") {
    const from = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    return { from: from.toISOString().slice(0, 10), to: today }
  }
  if (key === "prev") {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const m = now.getMonth() === 0 ? 12 : now.getMonth()
    const lastDay = new Date(y, m, 0).getDate()
    return {
      from: `${y}-${String(m).padStart(2, "0")}-01`,
      to: `${y}-${String(m).padStart(2, "0")}-${lastDay}`,
    }
  }
  // "month" — default
  return getDefaultRange()
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState(getDefaultRange)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [ventasDiarias, setVentasDiarias] = useState<VentaDiaria[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])
  const [stockReport, setStockReport] = useState<StockReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQuick, setActiveQuick] = useState("month")

  const loadData = useCallback(async (from: string, to: string) => {
    setLoading(true)
    const [dashboard, stock] = await Promise.all([
      fetch(`/api/admin/dashboard?from=${from}&to=${to}`).then((r) => r.json()),
      fetch("/api/admin/stock-report").then((r) => r.json()),
    ])
    setKpis(dashboard.kpis)
    setVentasDiarias(dashboard.ventasDiarias)
    setTopProductos(dashboard.topProductos)
    setStockReport(stock)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData(range.from, range.to)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleQuick(key: string) {
    const r = getQuickRange(key)
    setRange(r)
    setActiveQuick(key)
    loadData(r.from, r.to)
  }

  function handleFilter() {
    setActiveQuick("")
    loadData(range.from, range.to)
  }

  function handleExport() {
    window.open("/api/admin/export/products?format=csv", "_blank")
  }

  const maxDailyTotal =
    ventasDiarias.length > 0
      ? Math.max(...ventasDiarias.map((v) => v.total))
      : 1

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Resumen de ventas y stock</p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Date filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {[
                  { key: "month", label: "Este mes" },
                  { key: "prev", label: "Mes anterior" },
                  { key: "7d", label: "Ultimos 7 dias" },
                ].map((q) => (
                  <Button
                    key={q.key}
                    variant={activeQuick === q.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuick(q.key)}
                    className={
                      activeQuick === q.key
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="date"
                  value={range.from}
                  onChange={(e) =>
                    setRange({ ...range, from: e.target.value })
                  }
                  className="w-36"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="date"
                  value={range.to}
                  onChange={(e) =>
                    setRange({ ...range, to: e.target.value })
                  }
                  className="w-36"
                />
                <Button
                  size="sm"
                  onClick={handleFilter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            {kpis && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard
                  title="Ventas totales"
                  value={formatPrice(kpis.totalVentas)}
                  icon={DollarSign}
                  color="text-green-600"
                />
                <KpiCard
                  title="Online"
                  value={String(kpis.cantidadOnline)}
                  icon={ShoppingCart}
                  color="text-blue-600"
                  sub={
                    kpis.pedidosPendientes > 0
                      ? `${kpis.pedidosPendientes} pendiente${kpis.pedidosPendientes > 1 ? "s" : ""}`
                      : undefined
                  }
                />
                <KpiCard
                  title="Mostrador"
                  value={String(kpis.cantidadMostrador)}
                  icon={Store}
                  color="text-indigo-600"
                  sub={
                    kpis.ventasMostradorPendientes > 0
                      ? `${kpis.ventasMostradorPendientes} pendiente${kpis.ventasMostradorPendientes > 1 ? "s" : ""} de cobro`
                      : undefined
                  }
                />
                <KpiCard
                  title="Ticket promedio"
                  value={formatPrice(kpis.ticketPromedio)}
                  icon={BarChart3}
                  color="text-purple-600"
                />
                <KpiCard
                  title="Ganancia bruta"
                  value={formatPrice(kpis.totalGanancia)}
                  icon={TrendingUp}
                  color="text-emerald-600"
                />
                <KpiCard
                  title="Margen promedio"
                  value={`${kpis.margenPromedio}%`}
                  icon={TrendingUp}
                  color={kpis.margenPromedio >= 30 ? "text-green-600" : "text-orange-500"}
                />
              </div>
            )}

            {/* Daily sales */}
            {ventasDiarias.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ventas por dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ventasDiarias.map((v) => (
                      <div key={v.fecha} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24 shrink-0">
                          {v.fecha.slice(5).replace("-", "/")}
                        </span>
                        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-blue-500 rounded transition-all"
                            style={{
                              width: `${(v.total / maxDailyTotal) * 100}%`,
                            }}
                          />
                          <div
                            className="absolute inset-0 h-full bg-emerald-500/30 rounded"
                            style={{
                              width: `${(v.ganancia / maxDailyTotal) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-28 text-right shrink-0">
                          {formatPrice(v.total)}
                        </span>
                        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                          {v.cantidad}p
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-blue-500" /> Ventas
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-emerald-500/30" />{" "}
                      Ganancia
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top products */}
            {topProductos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Top productos vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProductos.map((p, i) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate">{p.nombre}</span>
                        <Badge variant="secondary">
                          {p.cantidadVendida} uds
                        </Badge>
                        <span className="w-28 text-right font-medium">
                          {formatPrice(p.totalVentas)}
                        </span>
                        <span className="w-28 text-right text-emerald-600">
                          +{formatPrice(p.totalGanancia)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stock valorizado */}
            {stockReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Stock valorizado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold">
                        {stockReport.totalUnidades}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unidades en stock
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">
                        {formatPrice(stockReport.valorVenta)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor a precio venta
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatPrice(stockReport.valorCosto)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor a precio costo
                      </p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatPrice(stockReport.gananciaEstimada)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ganancia potencial
                      </p>
                    </div>
                  </div>

                  {stockReport.productos.length > 0 && (
                    <details>
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Ver detalle por producto (
                        {stockReport.productos.length})
                      </summary>
                      <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                        {stockReport.productos
                          .filter((p) => p.stock > 0)
                          .map((p) => (
                            <div
                              key={p._id}
                              className="flex items-center gap-2 text-sm py-1 border-b border-slate-100"
                            >
                              <span className="flex-1 truncate">
                                {p.nombre}
                              </span>
                              {p.sku && (
                                <span className="text-xs text-muted-foreground">
                                  {p.sku}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {p.stock} uds
                              </Badge>
                              <span className="w-20 text-right text-xs">
                                {formatPrice(p.precioVenta)}
                              </span>
                              <span className="w-20 text-right text-xs text-muted-foreground">
                                C: {formatPrice(p.costPrice)}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${p.margen >= 30 ? "text-green-700" : "text-orange-600"}`}
                              >
                                {p.margen}%
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No data state */}
            {kpis && kpis.cantidadPedidos === 0 && ventasDiarias.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-muted-foreground">
                    No hay ventas en el periodo seleccionado
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-orange-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
