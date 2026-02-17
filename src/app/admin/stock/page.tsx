"use client"

import { useState, useEffect, useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Search,
  Download,
  Package,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react"
import { formatPrice } from "@/lib/format"

interface StockProduct {
  _id: string
  nombre: string
  sku: string
  marca: string
  categoria: string
  proveedor: string
  stock: number
  precio: number
  precioOferta: number | null
  precioVenta: number
  costPrice: number
  margen: number
  valorStockVenta: number
  valorStockCosto: number
  activo: boolean
}

interface StockSummary {
  totalUnidades: number
  totalProductos: number
  valorVenta: number
  valorCosto: number
  gananciaEstimada: number
  sinStock: number
  stockBajo: number
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("stock-asc")
  const [filtro, setFiltro] = useState("todos")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const res = await fetch("/api/admin/stock-report?full=true")
    const data = await res.json()
    setProducts(data.productos)
    setSummary(data.summary)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = products

    // Filter
    if (filtro === "sin-stock") {
      list = list.filter((p) => p.stock === 0)
    } else if (filtro === "stock-bajo") {
      list = list.filter((p) => p.stock > 0 && p.stock <= 3)
    } else if (filtro === "con-stock") {
      list = list.filter((p) => p.stock > 0)
    } else if (filtro === "inactivos") {
      list = list.filter((p) => !p.activo)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      )
    }

    // Sort
    const sorted = [...list]
    switch (sortBy) {
      case "stock-asc":
        sorted.sort((a, b) => a.stock - b.stock)
        break
      case "stock-desc":
        sorted.sort((a, b) => b.stock - a.stock)
        break
      case "nombre":
        sorted.sort((a, b) => a.nombre.localeCompare(b.nombre))
        break
      case "valor-desc":
        sorted.sort((a, b) => b.valorStockVenta - a.valorStockVenta)
        break
      case "margen-asc":
        sorted.sort((a, b) => a.margen - b.margen)
        break
      case "margen-desc":
        sorted.sort((a, b) => b.margen - a.margen)
        break
    }

    return sorted
  }, [products, search, sortBy, filtro])

  function handleExport() {
    window.open("/api/admin/export/products?format=csv", "_blank")
  }

  function stockBadge(stock: number) {
    if (stock === 0) return <Badge className="bg-red-500 text-xs">Sin stock</Badge>
    if (stock <= 3) return <Badge className="bg-orange-500 text-xs">{stock} uds</Badge>
    return <Badge variant="outline" className="text-green-600 border-green-300 text-xs">{stock} uds</Badge>
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock</h1>
            <p className="text-muted-foreground">
              Inventario completo de productos
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryCard label="Productos" value={String(summary.totalProductos)} />
                <SummaryCard label="Unidades totales" value={String(summary.totalUnidades)} />
                <SummaryCard
                  label="Valor stock (venta)"
                  value={formatPrice(summary.valorVenta)}
                  className="text-blue-700"
                />
                <SummaryCard
                  label="Valor stock (costo)"
                  value={formatPrice(summary.valorCosto)}
                />
                <SummaryCard
                  label="Ganancia potencial"
                  value={formatPrice(summary.gananciaEstimada)}
                  className="text-emerald-700"
                />
                <SummaryCard
                  label="Sin stock"
                  value={String(summary.sinStock)}
                  className={summary.sinStock > 0 ? "text-red-600" : ""}
                  alert={summary.sinStock > 0}
                />
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, SKU, marca o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="con-stock">Con stock</SelectItem>
                  <SelectItem value="stock-bajo">Stock bajo (1-3)</SelectItem>
                  <SelectItem value="sin-stock">Sin stock</SelectItem>
                  <SelectItem value="inactivos">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock-asc">Menor stock primero</SelectItem>
                  <SelectItem value="stock-desc">Mayor stock primero</SelectItem>
                  <SelectItem value="nombre">Nombre A-Z</SelectItem>
                  <SelectItem value="valor-desc">Mayor valor stock</SelectItem>
                  <SelectItem value="margen-desc">Mayor margen</SelectItem>
                  <SelectItem value="margen-asc">Menor margen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Product list */}
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-1 text-center">Stock</div>
                  <div className="col-span-1 text-right">Precio</div>
                  <div className="col-span-1 text-right">Costo</div>
                  <div className="col-span-1 text-center">Margen</div>
                  <div className="col-span-2 text-right">Valor stock</div>
                  <div className="col-span-2">Proveedor</div>
                </div>

                {filtered.map((p) => (
                  <Card key={p._id} className={!p.activo ? "opacity-50" : ""}>
                    <CardContent className="p-4">
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 min-w-0">
                          <p className="font-medium truncate">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.sku && <span className="mr-2">SKU: {p.sku}</span>}
                            {p.marca} | {p.categoria}
                            {!p.activo && <span className="ml-2 text-red-500">(Inactivo)</span>}
                          </p>
                        </div>
                        <div className="col-span-1 text-center">
                          {stockBadge(p.stock)}
                        </div>
                        <div className="col-span-1 text-right text-sm">
                          {p.precioOferta ? (
                            <div>
                              <span className="line-through text-xs text-muted-foreground">{formatPrice(p.precio)}</span>
                              <br />
                              <span className="text-red-600">{formatPrice(p.precioOferta)}</span>
                            </div>
                          ) : (
                            formatPrice(p.precio)
                          )}
                        </div>
                        <div className="col-span-1 text-right text-sm text-muted-foreground">
                          {formatPrice(p.costPrice)}
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${p.margen >= 30 ? "text-green-700" : p.margen >= 15 ? "text-orange-600" : "text-red-600"}`}
                          >
                            {p.margen}%
                          </Badge>
                        </div>
                        <div className="col-span-2 text-right text-sm">
                          <p>{formatPrice(p.valorStockVenta)}</p>
                          <p className="text-xs text-muted-foreground">
                            C: {formatPrice(p.valorStockCosto)}
                          </p>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground truncate">
                          {p.proveedor || "-"}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.sku && `SKU: ${p.sku} | `}{p.marca}
                            </p>
                          </div>
                          {stockBadge(p.stock)}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span>Venta: <strong>{formatPrice(p.precioVenta)}</strong></span>
                          <span className="text-muted-foreground">Costo: {formatPrice(p.costPrice)}</span>
                          <Badge variant="secondary" className={`text-xs ${p.margen >= 30 ? "text-green-700" : "text-orange-600"}`}>
                            {p.margen}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}

function SummaryCard({
  label,
  value,
  className,
  alert,
}: {
  label: string
  value: string
  className?: string
  alert?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {alert && <AlertTriangle className="h-3 w-3 text-red-500" />}
          <p className={`text-xl font-bold ${className || ""}`}>{value}</p>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
