"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/lib/cart-store"
import { toast } from "sonner"

interface ProductCardProps {
  producto: {
    _id: string
    nombre: string
    slug: string
    precio: number
    precioOferta?: number
    imagenes: string[]
    marca: string
    stock: number
    categoria: string
  }
}

export function ProductCard({ producto }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = producto.precioOferta && producto.precioOferta < producto.precio
  const sinStock = producto.stock <= 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (sinStock) return
    addItem({
      productoId: producto._id,
      nombre: producto.nombre,
      precio: precioFinal,
      imagen: producto.imagenes[0] || "/placeholder.png",
      stock: producto.stock,
    })
    toast.success("Agregado al carrito")
  }

  return (
    <Link href={`/producto/${producto._id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {producto.imagenes[0] ? (
            <img
              src={producto.imagenes[0]}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Sin imagen
            </div>
          )}
          {tieneOferta && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              -{Math.round(((producto.precio - producto.precioOferta!) / producto.precio) * 100)}%
            </Badge>
          )}
          {sinStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Sin stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase">{producto.marca}</p>
          <h3 className="font-medium text-sm mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {producto.nombre}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">{formatPrice(precioFinal)}</span>
            {tieneOferta && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(producto.precio)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            onClick={handleAddToCart}
            disabled={sinStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {sinStock ? "Sin stock" : "Agregar"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
