"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ShoppingBag } from "lucide-react"
import { formatPrice, formatDateTime } from "@/lib/format"
import { toast } from "sonner"

interface Order {
  _id: string
  userId: string
  items: Array<{
    nombre: string
    precio: number
    cantidad: number
    imagen: string
  }>
  total: number
  estado: string
  direccionEnvio: {
    nombre: string
    calle: string
    ciudad: string
    provincia: string
    codigoPostal: string
    telefono: string
  }
  createdAt: string
}

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const data = await fetch("/api/orders").then((r) => r.json())
    setOrders(data)
    setLoading(false)
  }

  async function updateEstado(orderId: string, estado: string) {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: orderId, estado }),
      })
      if (res.ok) {
        toast.success("Estado actualizado")
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al actualizar estado")
      }
    } catch {
      toast.error("Error de conexion")
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">{orders.length} pedidos</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">No hay pedidos aun</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">Pedido #{order._id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold">{formatPrice(order.total)}</p>
                      <Select
                        value={order.estado}
                        onValueChange={(v) => updateEstado(order._id, v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            <Badge className={estadoColors[order.estado] || ""}>
                              {order.estado}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {["pendiente", "pagado", "enviado", "entregado", "cancelado"].map(
                            (e) => (
                              <SelectItem key={e} value={e}>
                                <Badge className={`${estadoColors[e] || ""} text-xs`}>
                                  {e}
                                </Badge>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Items</p>
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm">
                          {item.cantidad}x {item.nombre} — {formatPrice(item.precio * item.cantidad)}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Enviar a</p>
                      <p className="text-sm">{order.direccionEnvio.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.direccionEnvio.calle}, {order.direccionEnvio.ciudad},{" "}
                        {order.direccionEnvio.provincia} ({order.direccionEnvio.codigoPostal})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tel: {order.direccionEnvio.telefono}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
