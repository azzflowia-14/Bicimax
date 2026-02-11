"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface Props {
  categorias: Array<{ _id: string; nombre: string; slug: string }>
  categoriaActual?: string
  ordenActual?: string
}

export function ProductFilters({ categorias, categoriaActual, ordenActual }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/productos?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Categorias</Label>
        <div className="space-y-1">
          <button
            className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
              !categoriaActual ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-slate-50"
            }`}
            onClick={() => setParam("categoria", null)}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat._id}
              className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                categoriaActual === cat.slug
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => setParam("categoria", cat.slug)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Ordenar por</Label>
        <div className="space-y-1">
          {[
            { value: "", label: "Mas recientes" },
            { value: "precio-asc", label: "Menor precio" },
            { value: "precio-desc", label: "Mayor precio" },
            { value: "nombre", label: "Nombre A-Z" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                (ordenActual || "") === opt.value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => setParam("orden", opt.value || null)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
