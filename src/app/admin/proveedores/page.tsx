"use client"

import { useState, useEffect } from "react"
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
import { Plus, Pencil, Trash2, Loader2, Truck, Search } from "lucide-react"
import { toast } from "sonner"

interface Supplier {
  _id: string
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  notas?: string
  cuit?: string
  condicionesPago?: string
  activo: boolean
}

const emptyForm = {
  nombre: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  notas: "",
  cuit: "",
  condicionesPago: "",
  activo: true,
}

export default function AdminProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const data = await fetch("/api/suppliers").then((r) => r.json())
    setSuppliers(data)
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditId(s._id)
    setForm({
      nombre: s.nombre,
      contacto: s.contacto || "",
      telefono: s.telefono || "",
      email: s.email || "",
      direccion: s.direccion || "",
      notas: s.notas || "",
      cuit: s.cuit || "",
      condicionesPago: s.condicionesPago || "",
      activo: s.activo,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setSaving(true)

    const data = {
      nombre: form.nombre,
      contacto: form.contacto || undefined,
      telefono: form.telefono || undefined,
      email: form.email || undefined,
      direccion: form.direccion || undefined,
      notas: form.notas || undefined,
      cuit: form.cuit || undefined,
      condicionesPago: form.condicionesPago || undefined,
      activo: form.activo,
    }

    const res = await fetch("/api/suppliers", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { _id: editId, ...data } : data),
    })

    if (res.ok) {
      toast.success(editId ? "Proveedor actualizado" : "Proveedor creado")
      setDialogOpen(false)
      loadData()
    } else {
      const err = await res.json()
      toast.error(err.error || "Error al guardar")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Desactivar este proveedor?")) return
    const res = await fetch("/api/suppliers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success("Proveedor desactivado")
      loadData()
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.activo &&
      (s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.contacto?.toLowerCase().includes(search.toLowerCase()) ||
        s.cuit?.includes(search))
  )

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Proveedores</h1>
            <p className="text-muted-foreground">
              {filtered.length} proveedor{filtered.length !== 1 ? "es" : ""}
            </p>
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo proveedor
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, contacto o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">
                {search
                  ? "No se encontraron proveedores"
                  : "No hay proveedores. Crea el primero!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <Card key={s._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{s.nombre}</p>
                        {s.cuit && (
                          <Badge variant="outline" className="text-xs">
                            CUIT: {s.cuit}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {[s.contacto, s.telefono, s.email]
                          .filter(Boolean)
                          .join(" | ") || "Sin datos de contacto"}
                      </p>
                      {s.condicionesPago && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Pago: {s.condicionesPago}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDelete(s._id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar proveedor" : "Nuevo proveedor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contacto</Label>
                <Input
                  value={form.contacto}
                  onChange={(e) =>
                    setForm({ ...form, contacto: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>CUIT</Label>
                <Input
                  value={form.cuit}
                  onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
            </div>
            <div>
              <Label>Direccion</Label>
              <Input
                value={form.direccion}
                onChange={(e) =>
                  setForm({ ...form, direccion: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Condiciones de pago</Label>
              <Input
                value={form.condicionesPago}
                onChange={(e) =>
                  setForm({ ...form, condicionesPago: e.target.value })
                }
                placeholder="Ej: 30 dias, contado"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  setForm({ ...form, activo: e.target.checked })
                }
              />
              Activo
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
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
