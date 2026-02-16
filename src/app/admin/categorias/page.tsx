"use client"

import { useState, useEffect, useRef } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, FolderTree, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface Category {
  _id: string
  nombre: string
  slug: string
  descripcion?: string
  imagen?: string
  activa: boolean
  orden: number
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: "", descripcion: "", orden: "0", activa: true })
  const [imagen, setImagen] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const data = await fetch("/api/categories").then((r) => r.json())
    setCategories(data)
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm({ nombre: "", descripcion: "", orden: "0", activa: true })
    setImagen("")
    setDialogOpen(true)
  }

  function openEdit(c: Category) {
    setEditId(c._id)
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion || "",
      orden: String(c.orden),
      activa: c.activa,
    })
    setImagen(c.imagen || "")
    setDialogOpen(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setImagen(data.url)
        toast.success("Imagen subida")
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al subir imagen")
      }
    } catch {
      toast.error("Error al subir imagen")
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    if (!form.nombre) {
      toast.error("El nombre es obligatorio")
      return
    }
    setSaving(true)

    const data = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      imagen: imagen || undefined,
      orden: Number(form.orden) || 0,
      activa: form.activa,
    }

    const res = await fetch("/api/categories", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { _id: editId, ...data } : data),
    })

    if (res.ok) {
      toast.success(editId ? "Categoria actualizada" : "Categoria creada")
      setDialogOpen(false)
      loadData()
    } else {
      toast.error("Error al guardar")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta categoria?")) return
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success("Categoria eliminada")
      loadData()
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">{categories.length} categorias</p>
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva categoria
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">No hay categorias. Crea la primera!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <Card key={c._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {c.imagen && (
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                          <img src={c.imagen} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.nombre}</p>
                          {!c.activa && <Badge variant="secondary" className="text-xs">Inactiva</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Slug: {c.slug} | Orden: {c.orden}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDelete(c._id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>

            {/* Imagen - Upload */}
            <div>
              <Label>Imagen</Label>
              <div className="mt-2 space-y-2">
                {imagen && (
                  <div className="relative inline-block">
                    <img src={imagen} alt="" className="h-24 w-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => setImagen("")}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {imagen ? "Cambiar imagen" : "Subir imagen"}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            </div>

            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
              Activa
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
