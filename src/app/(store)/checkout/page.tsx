"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, getTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    calle: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    telefono: "",
    notas: "",
  })

  useEffect(() => {
    setMounted(true)
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.name) {
      setForm((f) => ({ ...f, nombre: session.user!.name || "" }))
    }
  }, [session])

  if (!mounted || status === "loading") return null
  if (items.length === 0) {
    router.push("/carrito")
    return null
  }

  const total = getTotal()

  function updateForm(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nombre || !form.calle || !form.ciudad || !form.provincia || !form.codigoPostal || !form.telefono) {
      toast.error("Completa todos los campos obligatorios")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            precio: i.precio,
            cantidad: i.cantidad,
            imagen: i.imagen,
          })),
          direccionEnvio: {
            nombre: form.nombre,
            calle: form.calle,
            ciudad: form.ciudad,
            provincia: form.provincia,
            codigoPostal: form.codigoPostal,
            telefono: form.telefono,
          },
          notas: form.notas,
        }),
      })

      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }

      // Redirect to MercadoPago
      if (data.init_point) {
        window.location.href = data.init_point
      }
    } catch {
      toast.error("Error al procesar el pedido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Direccion de envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => updateForm("nombre", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="calle">Direccion (calle y numero) *</Label>
                  <Input
                    id="calle"
                    value={form.calle}
                    onChange={(e) => updateForm("calle", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={form.ciudad}
                      onChange={(e) => updateForm("ciudad", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="provincia">Provincia *</Label>
                    <Input
                      id="provincia"
                      value={form.provincia}
                      onChange={(e) => updateForm("provincia", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigoPostal">Codigo postal *</Label>
                    <Input
                      id="codigoPostal"
                      value={form.codigoPostal}
                      onChange={(e) => updateForm("codigoPostal", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Telefono *</Label>
                    <Input
                      id="telefono"
                      value={form.telefono}
                      onChange={(e) => updateForm("telefono", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Input
                    id="notas"
                    value={form.notas}
                    onChange={(e) => updateForm("notas", e.target.value)}
                    placeholder="Instrucciones de entrega, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Tu pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.productoId} className="flex justify-between text-sm">
                    <span className="truncate mr-2">
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span className="shrink-0">{formatPrice(item.precio * item.cantidad)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Pagar con Mercado Pago
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
