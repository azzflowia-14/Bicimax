"use client"

import { useState, useEffect, useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Minus,
  Loader2,
  Store,
  Search,
  DollarSign,
  Eye,
  XCircle,
  X,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice, formatDateTime } from "@/lib/format"

interface Product {
  _id: string
  nombre: string
  precio: number
  precioOferta?: number
  imagenes: string[]
  stock: number
  activo: boolean
  marca: string
}

interface VentaItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagen: string
}

interface Pago {
  _id: string
  monto: number
  fecha: string
  nota?: string
}

interface Venta {
  _id: string
  cliente: { nombre: string; telefono: string }
  items: VentaItem[]
  total: number
  totalPagado: number
  pagos: Pago[]
  estado: "pendiente" | "pagado" | "cancelado"
  notas?: string
  createdAt: string
}

export default function AdminVentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [exportFrom, setExportFrom] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    return `${y}-${m}-01`
  })
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10))

  // Nueva Venta dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clienteNombre, setClienteNombre] = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [selectedItems, setSelectedItems] = useState<
    Array<{ productoId: string; nombre: string; precio: number; cantidad: number; stock: number; imagen: string }>
  >([])
  const [pagoInicial, setPagoInicial] = useState("")
  const [notas, setNotas] = useState("")
  const [productSearch, setProductSearch] = useState("")

  // Registrar Pago dialog
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false)
  const [pagoVenta, setPagoVenta] = useState<Venta | null>(null)
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoNota, setPagoNota] = useState("")
  const [savingPago, setSavingPago] = useState(false)

  // Detalle dialog
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [detalleVenta, setDetalleVenta] = useState<Venta | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [ventasData, prodsData] = await Promise.all([
      fetch("/api/admin/ventas").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
    setVentas(ventasData)
    setProducts(prodsData)
    setLoading(false)
  }

  // Filtered ventas
  const filtered = useMemo(() => {
    return ventas.filter((v) => {
      if (filtroEstado !== "todos" && v.estado !== filtroEstado) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          v.cliente.nombre.toLowerCase().includes(q) ||
          v.cliente.telefono.includes(q)
        )
      }
      return true
    })
  }, [ventas, filtroEstado, search])

  // Product search results
  const productResults = useMemo(() => {
    if (!productSearch.trim()) return []
    const q = productSearch.toLowerCase()
    return products
      .filter(
        (p) =>
          p.activo &&
          p.stock > 0 &&
          (p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q)) &&
          !selectedItems.find((si) => si.productoId === p._id)
      )
      .slice(0, 8)
  }, [productSearch, products, selectedItems])

  const ventaTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [selectedItems]
  )

  // --- Nueva Venta ---

  function openNuevaVenta() {
    setClienteNombre("")
    setClienteTelefono("")
    setSelectedItems([])
    setPagoInicial("")
    setNotas("")
    setProductSearch("")
    setDialogOpen(true)
  }

  function addProduct(p: Product) {
    const precio = p.precioOferta ?? p.precio
    setSelectedItems((prev) => [
      ...prev,
      {
        productoId: p._id,
        nombre: p.nombre,
        precio,
        cantidad: 1,
        stock: p.stock,
        imagen: p.imagenes[0] || "",
      },
    ])
    setProductSearch("")
  }

  function updateItemQty(productoId: string, delta: number) {
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad: Math.max(1, Math.min(i.stock, i.cantidad + delta)) }
          : i
      )
    )
  }

  function removeItem(productoId: string) {
    setSelectedItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  async function handleCrearVenta() {
    if (!clienteNombre.trim()) {
      toast.error("El nombre del cliente es obligatorio")
      return
    }
    if (!clienteTelefono.trim()) {
      toast.error("El teléfono del cliente es obligatorio")
      return
    }
    if (selectedItems.length === 0) {
      toast.error("Agrega al menos un producto")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: { nombre: clienteNombre.trim(), telefono: clienteTelefono.trim() },
          items: selectedItems.map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            cantidad: i.cantidad,
          })),
          pagoInicial: Number(pagoInicial) || 0,
          notas: notas.trim() || undefined,
        }),
      })

      if (res.ok) {
        toast.success("Venta registrada")
        setDialogOpen(false)
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al crear la venta")
      }
    } catch {
      toast.error("Error al crear la venta")
    }
    setSaving(false)
  }

  // --- Registrar Pago ---

  function openRegistrarPago(v: Venta) {
    setPagoVenta(v)
    setPagoMonto("")
    setPagoNota("")
    setPagoDialogOpen(true)
  }

  async function handleRegistrarPago() {
    if (!pagoVenta) return
    const monto = Number(pagoMonto)
    if (!monto || monto <= 0) {
      toast.error("Ingresa un monto válido")
      return
    }

    setSavingPago(true)
    try {
      const res = await fetch("/api/admin/ventas/pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ventaId: pagoVenta._id,
          monto,
          nota: pagoNota.trim() || undefined,
        }),
      })

      if (res.ok) {
        toast.success("Pago registrado")
        setPagoDialogOpen(false)
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al registrar pago")
      }
    } catch {
      toast.error("Error al registrar pago")
    }
    setSavingPago(false)
  }

  // --- Cancelar ---

  async function handleCancelar(v: Venta) {
    if (!confirm(`Cancelar venta de ${v.cliente.nombre}? Se restaurará el stock.`)) return

    const res = await fetch("/api/admin/ventas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: v._id, estado: "cancelado" }),
    })

    if (res.ok) {
      toast.success("Venta cancelada. Stock restaurado.")
      loadData()
    } else {
      const err = await res.json()
      toast.error(err.error || "Error al cancelar")
    }
  }

  // --- Ver Detalle ---

  function openDetalle(v: Venta) {
    setDetalleVenta(v)
    setDetalleDialogOpen(true)
  }

  // --- Helpers ---

  function estadoBadge(estado: string) {
    switch (estado) {
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "pagado":
        return <Badge className="bg-green-600">Pagado</Badge>
      case "cancelado":
        return <Badge className="bg-red-500">Cancelado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ventas Mostrador</h1>
            <p className="text-muted-foreground">
              {filtered.length} venta{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNuevaVenta} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Export bar */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground shrink-0">Exportar:</span>
              <Input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="w-36"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `/api/admin/export/ventas?from=${exportFrom}&to=${exportTo}`,
                    "_blank"
                  )
                }
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">
                {search || filtroEstado !== "todos"
                  ? "No se encontraron ventas"
                  : "No hay ventas mostrador. Registra la primera!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const restante = v.total - v.totalPagado
              return (
                <Card key={v._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{v.cliente.nombre}</p>
                          <span className="text-sm text-muted-foreground">
                            {v.cliente.telefono}
                          </span>
                          {estadoBadge(v.estado)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {v.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>
                            Total: <strong>{formatPrice(v.total)}</strong>
                          </span>
                          {v.estado !== "cancelado" && (
                            <>
                              <span className="text-green-600">
                                Pagado: {formatPrice(v.totalPagado)}
                              </span>
                              {restante > 0 && (
                                <span className="text-orange-600 font-medium">
                                  Restante: {formatPrice(restante)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(v.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetalle(v)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {v.estado === "pendiente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => openRegistrarPago(v)}
                            title="Registrar pago"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        {v.estado !== "cancelado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleCancelar(v)}
                            title="Cancelar venta"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog: Nueva Venta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Venta Mostrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Cliente */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Cliente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <Label>Telefono *</Label>
                  <Input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="Ej: 11-2345-6789"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Productos */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Productos</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por nombre o marca..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Search results */}
              {productResults.length > 0 && (
                <div className="border rounded-md mt-1 max-h-48 overflow-y-auto divide-y">
                  {productResults.map((p) => {
                    const precio = p.precioOferta ?? p.precio
                    return (
                      <button
                        key={p._id}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-sm"
                        onClick={() => addProduct(p)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {p.imagenes[0] && (
                            <img
                              src={p.imagenes[0]}
                              alt=""
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.marca} | Stock: {p.stock}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 ml-2 font-medium">
                          {formatPrice(precio)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selected items */}
              {selectedItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.productoId}
                      className="flex items-center gap-3 bg-slate-50 rounded-lg p-2"
                    >
                      {item.imagen && (
                        <img
                          src={item.imagen}
                          alt=""
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.precio)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateItemQty(item.productoId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.cantidad}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateItemQty(item.productoId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatPrice(item.precio * item.cantidad)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={() => removeItem(item.productoId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t">
                    <span className="text-lg font-bold">
                      Total: {formatPrice(ventaTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Pago inicial */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pago inicial (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={pagoInicial}
                  onChange={(e) => setPagoInicial(e.target.value)}
                  placeholder="0"
                />
                {ventaTotal > 0 && Number(pagoInicial) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Restante: {formatPrice(Math.max(0, ventaTotal - Number(pagoInicial)))}
                  </p>
                )}
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  placeholder="Observaciones..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCrearVenta}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {pagoVenta && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>Cliente:</strong> {pagoVenta.cliente.nombre}
                </p>
                <p>
                  <strong>Total:</strong> {formatPrice(pagoVenta.total)}
                </p>
                <p>
                  <strong>Pagado:</strong>{" "}
                  <span className="text-green-600">{formatPrice(pagoVenta.totalPagado)}</span>
                </p>
                <p>
                  <strong>Restante:</strong>{" "}
                  <span className="text-orange-600 font-medium">
                    {formatPrice(pagoVenta.total - pagoVenta.totalPagado)}
                  </span>
                </p>
              </div>

              <div>
                <Label>Monto *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max={pagoVenta.total - pagoVenta.totalPagado}
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    placeholder="Monto a pagar"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      setPagoMonto(String(pagoVenta.total - pagoVenta.totalPagado))
                    }
                  >
                    Pagar todo
                  </Button>
                </div>
              </div>

              <div>
                <Label>Nota (opcional)</Label>
                <Input
                  value={pagoNota}
                  onChange={(e) => setPagoNota(e.target.value)}
                  placeholder="Ej: efectivo, transferencia..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPagoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrarPago}
                  disabled={savingPago}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingPago && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registrar Pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {detalleVenta && (
            <div className="space-y-4">
              {/* Cliente */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{detalleVenta.cliente.nombre}</p>
                  {estadoBadge(detalleVenta.estado)}
                </div>
                <p className="text-muted-foreground">{detalleVenta.cliente.telefono}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(detalleVenta.createdAt)}
                </p>
                {detalleVenta.notas && (
                  <p className="text-muted-foreground mt-1">Notas: {detalleVenta.notas}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Productos</h4>
                <div className="space-y-2">
                  {detalleVenta.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.imagen && (
                          <img
                            src={item.imagen}
                            alt=""
                            className="w-8 h-8 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="truncate">
                          {item.cantidad}x {item.nombre}
                        </span>
                      </div>
                      <span className="shrink-0 ml-2">
                        {formatPrice(item.precio * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(detalleVenta.total)}</span>
                </div>
              </div>

              {/* Pagos */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Historial de Pagos</h4>
                {detalleVenta.pagos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                ) : (
                  <div className="space-y-1">
                    {detalleVenta.pagos.map((pago) => (
                      <div
                        key={pago._id}
                        className="flex items-center justify-between text-sm bg-green-50 rounded px-3 py-1.5"
                      >
                        <div>
                          <span className="font-medium text-green-700">
                            {formatPrice(pago.monto)}
                          </span>
                          {pago.nota && (
                            <span className="text-muted-foreground ml-2">
                              ({pago.nota})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(pago.fecha)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total pagado</span>
                    <span className="text-green-600 font-medium">
                      {formatPrice(detalleVenta.totalPagado)}
                    </span>
                  </div>
                  {detalleVenta.estado !== "cancelado" && detalleVenta.total - detalleVenta.totalPagado > 0 && (
                    <div className="flex justify-between">
                      <span>Restante</span>
                      <span className="text-orange-600 font-medium">
                        {formatPrice(detalleVenta.total - detalleVenta.totalPagado)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
