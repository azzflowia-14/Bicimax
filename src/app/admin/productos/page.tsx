"use client"

import { useState, useEffect, useRef } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Pencil, Trash2, Loader2, Package, Upload, X, ImageIcon } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"

interface Product {
  _id: string
  nombre: string
  precio: number
  precioOferta?: number
  imagenes: string[]
  categoria: string
  marca: string
  stock: number
  destacado: boolean
  activo: boolean
  descripcion: string
  especificaciones: Record<string, string>
}

interface Category {
  _id: string
  nombre: string
  slug: string
}

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  precioOferta: "",
  categoria: "",
  marca: "",
  stock: "",
  destacado: false,
  activo: true,
  especificaciones: "",
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imagenes, setImagenes] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [prods, cats] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
    setProducts(prods)
    setCategories(cats)
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setImagenes([])
    setDialogOpen(true)
  }

  function openEdit(p: Product) {
    setEditId(p._id)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: String(p.precio),
      precioOferta: p.precioOferta ? String(p.precioOferta) : "",
      categoria: p.categoria,
      marca: p.marca,
      stock: String(p.stock),
      destacado: p.destacado,
      activo: p.activo,
      especificaciones: Object.entries(p.especificaciones || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    })
    setImagenes(p.imagenes || [])
    setDialogOpen(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          newUrls.push(data.url)
        } else {
          const err = await res.json()
          toast.error(`Error subiendo ${file.name}: ${err.error}`)
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    if (newUrls.length) {
      setImagenes((prev) => [...prev, ...newUrls])
      toast.success(`${newUrls.length} imagen(es) subida(s)`)
    }
    setUploading(false)
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeImage(index: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.nombre || !form.precio || !form.categoria || !form.marca) {
      toast.error("Completa los campos obligatorios")
      return
    }

    setSaving(true)

    const specs: Record<string, string> = {}
    if (form.especificaciones) {
      form.especificaciones.split("\n").forEach((line) => {
        const [key, ...rest] = line.split(":")
        if (key && rest.length) specs[key.trim()] = rest.join(":").trim()
      })
    }

    const data = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      precioOferta: form.precioOferta ? Number(form.precioOferta) : undefined,
      imagenes,
      categoria: form.categoria,
      marca: form.marca,
      stock: Number(form.stock) || 0,
      destacado: form.destacado,
      activo: form.activo,
      especificaciones: specs,
    }

    const res = await fetch("/api/products", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { _id: editId, ...data } : data),
    })

    if (res.ok) {
      toast.success(editId ? "Producto actualizado" : "Producto creado")
      setDialogOpen(false)
      loadData()
    } else {
      const err = await res.json()
      toast.error(err.error || "Error")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este producto?")) return
    const res = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success("Producto eliminado")
      loadData()
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">{products.length} productos</p>
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">No hay productos. Crea el primero!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <Card key={p._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded overflow-hidden shrink-0">
                      {p.imagenes[0] ? (
                        <img src={p.imagenes[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{p.nombre}</p>
                        {p.destacado && <Badge className="bg-yellow-500 text-xs">Destacado</Badge>}
                        {!p.activo && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.marca} | Stock: {p.stock} |{" "}
                        {categories.find((c) => c._id === p.categoria)?.nombre || "Sin categoria"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatPrice(p.precioOferta ?? p.precio)}</p>
                      {p.precioOferta && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(p.precio)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDelete(p._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label>Marca *</Label>
                <Input
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Precio *</Label>
                <Input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                />
              </div>
              <div>
                <Label>Precio oferta</Label>
                <Input
                  type="number"
                  value={form.precioOferta}
                  onChange={(e) => setForm({ ...form, precioOferta: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Imagenes - Upload */}
            <div>
              <Label>Imagenes</Label>
              <div className="mt-2 space-y-3">
                {imagenes.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {imagenes.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Subiendo...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      Click para subir imagenes
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            </div>

            <div>
              <Label>Especificaciones (clave: valor, una por linea)</Label>
              <Textarea
                value={form.especificaciones}
                onChange={(e) => setForm({ ...form, especificaciones: e.target.value })}
                rows={3}
                placeholder="Rodado: 29&#10;Material: Aluminio"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                />
                Producto destacado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Activo
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
