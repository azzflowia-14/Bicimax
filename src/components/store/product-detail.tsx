"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Minus, Plus, Heart, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/lib/cart-store"
import { ProductCard } from "./product-card"
import { toast } from "sonner"

interface Props {
  producto: {
    _id: string
    nombre: string
    slug: string
    descripcion: string
    precio: number
    precioOferta?: number
    imagenes: string[]
    marca: string
    stock: number
    categoria: string
    categoriaSlug: string
    especificaciones: Record<string, string>
  }
  relacionados: Array<{
    _id: string
    nombre: string
    slug: string
    precio: number
    precioOferta?: number
    imagenes: string[]
    marca: string
    stock: number
    categoria: string
  }>
}

export function ProductDetail({ producto, relacionados }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [cantidad, setCantidad] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = producto.precioOferta && producto.precioOferta < producto.precio
  const sinStock = producto.stock <= 0
  const specs = Object.entries(producto.especificaciones)

  function handleAddToCart() {
    if (sinStock) return
    for (let i = 0; i < cantidad; i++) {
      addItem({
        productoId: producto._id,
        nombre: producto.nombre,
        precio: precioFinal,
        imagen: producto.imagenes[0] || "/placeholder.png",
        stock: producto.stock,
      })
    }
    toast.success(`${cantidad} x ${producto.nombre} agregado al carrito`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-blue-600">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/productos" className="hover:text-blue-600">Productos</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/productos?categoria=${producto.categoriaSlug}`} className="hover:text-blue-600">
          {producto.categoria}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{producto.nombre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3">
            {producto.imagenes[selectedImage] ? (
              <img
                src={producto.imagenes[selectedImage]}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Sin imagen
              </div>
            )}
          </div>
          {producto.imagenes.length > 1 && (
            <div className="flex gap-2">
              {producto.imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${
                    i === selectedImage ? "border-blue-600" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-muted-foreground uppercase">{producto.marca}</p>
          <h1 className="text-2xl font-bold mt-1">{producto.nombre}</h1>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold">{formatPrice(precioFinal)}</span>
            {tieneOferta && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(producto.precio)}
                </span>
                <Badge className="bg-red-500">
                  -{Math.round(((producto.precio - producto.precioOferta!) / producto.precio) * 100)}%
                </Badge>
              </>
            )}
          </div>

          <div className="mt-4">
            {sinStock ? (
              <Badge variant="secondary">Sin stock</Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-300">
                {producto.stock} en stock
              </Badge>
            )}
          </div>

          <Separator className="my-6" />

          {/* Quantity + Add to cart */}
          {!sinStock && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{cantidad}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al carrito
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Description */}
          <div>
            <h2 className="font-semibold mb-2">Descripcion</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {producto.descripcion}
            </p>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Especificaciones</h2>
              <div className="border rounded-lg overflow-hidden">
                {specs.map(([key, value], i) => (
                  <div
                    key={key}
                    className={`flex text-sm ${i % 2 === 0 ? "bg-slate-50" : ""}`}
                  >
                    <span className="font-medium w-1/3 p-3 border-r">{key}</span>
                    <span className="p-3">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {relacionados.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Productos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relacionados.map((prod) => (
              <ProductCard key={prod._id} producto={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
