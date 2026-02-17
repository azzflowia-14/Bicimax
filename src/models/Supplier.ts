import { Schema, models, model } from "mongoose"

export interface ISupplier {
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
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>(
  {
    nombre: { type: String, required: true },
    contacto: { type: String },
    telefono: { type: String },
    email: { type: String },
    direccion: { type: String },
    notas: { type: String },
    cuit: { type: String },
    condicionesPago: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

SupplierSchema.index({ nombre: 1 })

export const Supplier =
  models.Supplier || model<ISupplier>("Supplier", SupplierSchema)
