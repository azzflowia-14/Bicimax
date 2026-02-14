"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Bike, ChevronDown, ChevronUp } from "lucide-react"

type TipoBici = "MTB" | "Ruta" | "Urbana"

interface RangoRodado {
  min: number
  max: number
  MTB: string | null
  Ruta: string | null
  Urbana: string | null
}

const RANGOS: RangoRodado[] = [
  { min: 90, max: 110, MTB: "R12", Ruta: null, Urbana: "R12" },
  { min: 110, max: 120, MTB: "R16", Ruta: null, Urbana: "R16" },
  { min: 120, max: 135, MTB: "R20", Ruta: null, Urbana: "R20" },
  { min: 135, max: 150, MTB: "R24", Ruta: "R24", Urbana: "R24" },
  { min: 150, max: 165, MTB: "R26", Ruta: "R26", Urbana: "R26" },
  { min: 165, max: 175, MTB: "R27.5", Ruta: "R28", Urbana: "R26" },
  { min: 175, max: 185, MTB: "R29", Ruta: "R28", Urbana: "R29" },
  { min: 185, max: 200, MTB: "R29", Ruta: "R28", Urbana: "R29" },
]

function getRodado(tipo: TipoBici, altura: number): string | null {
  const rango = RANGOS.find((r) => altura >= r.min && altura < r.max)
  if (!rango) {
    if (altura >= 200) {
      const ultimo = RANGOS[RANGOS.length - 1]
      return ultimo[tipo]
    }
    return null
  }
  return rango[tipo]
}

export function BikeCalculator() {
  const [tipo, setTipo] = useState<TipoBici>("MTB")
  const [altura, setAltura] = useState(170)
  const [showTabla, setShowTabla] = useState(false)

  const rodado = getRodado(tipo, altura)

  const tipos: { value: TipoBici; label: string }[] = [
    { value: "MTB", label: "MTB" },
    { value: "Ruta", label: "Ruta" },
    { value: "Urbana", label: "Urbana" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Controles */}
        <div className="space-y-5">
          {/* Tipo de bici */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de bicicleta</Label>
            <div className="flex gap-2">
              {tipos.map((t) => (
                <Button
                  key={t.value}
                  variant={tipo === t.value ? "default" : "outline"}
                  className={
                    tipo === t.value
                      ? "bg-blue-600 hover:bg-blue-700 flex-1"
                      : "flex-1"
                  }
                  onClick={() => setTipo(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Altura */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tu altura: <span className="text-blue-600 font-bold">{altura} cm</span>
            </Label>
            <input
              type="range"
              min={90}
              max={200}
              value={altura}
              onChange={(e) => setAltura(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>90 cm</span>
              <span>200 cm</span>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[180px]">
            {rodado ? (
              <>
                <Bike className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Tu rodado recomendado
                </p>
                <p className="text-5xl font-black text-blue-600 font-[family-name:var(--font-montserrat)]">
                  {rodado}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Para {tipo} con {altura} cm de altura
                </p>
                <Link
                  href={`/productos?q=rodado+${rodado.replace("R", "")}`}
                  className="mt-4"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Ver bicicletas {rodado}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Bike className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-muted-foreground">
                  No hay rodado de {tipo} disponible para esa altura
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de referencia colapsable */}
      <div>
        <button
          onClick={() => setShowTabla(!showTabla)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {showTabla ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showTabla ? "Ocultar" : "Ver"} tabla de referencia
        </button>

        {showTabla && (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-2 text-left font-medium">Altura</th>
                  <th className="px-4 py-2 text-center font-medium">MTB</th>
                  <th className="px-4 py-2 text-center font-medium">Ruta</th>
                  <th className="px-4 py-2 text-center font-medium">Urbana</th>
                </tr>
              </thead>
              <tbody>
                {RANGOS.map((r) => (
                  <tr
                    key={r.min}
                    className={
                      altura >= r.min && altura < r.max
                        ? "bg-blue-50 font-medium"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td className="px-4 py-2">
                      {r.min}-{r.max} cm
                    </td>
                    <td className="px-4 py-2 text-center">{r.MTB ?? "-"}</td>
                    <td className="px-4 py-2 text-center">{r.Ruta ?? "-"}</td>
                    <td className="px-4 py-2 text-center">{r.Urbana ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
