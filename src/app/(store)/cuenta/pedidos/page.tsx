export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag } from "lucide-react"
import { formatPrice, formatDateTime } from "@/lib/format"

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

export default async function PedidosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?redirect=/cuenta/pedidos")

  await connectDB()
  const orders = await Order.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-muted-foreground">Todavia no hiciste ningun pedido</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order._id.toString()}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Pedido #{order._id.toString().slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <Badge className={estadoColors[order.estado] || ""}>
                      {order.estado}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map((item: { nombre: string; imagen: string; cantidad: number; precio: number }, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden shrink-0">
                        {item.imagen && (
                          <img src={item.imagen} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="flex-1 truncate">{item.nombre}</span>
                      <span className="text-muted-foreground">x{item.cantidad}</span>
                      <span>{formatPrice(item.precio * item.cantidad)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
