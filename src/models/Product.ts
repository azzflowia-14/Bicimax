import mongoose, { Schema, models, model } from "mongoose"

export interface IProduct {
  _id: string
  nombre: string
  slug: string
  descripcion: string
  precio: number
  precioOferta?: number
  imagenes: string[]
  categoria: string
  marca: string
  stock: number
  destacado: boolean
  activo: boolean
  especificaciones: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    nombre: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    precioOferta: { type: Number },
    imagenes: [{ type: String }],
    categoria: { type: String, required: true, ref: "Category" },
    marca: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    destacado: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
    especificaciones: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

ProductSchema.index({ nombre: "text", descripcion: "text", marca: "text" })
ProductSchema.index({ categoria: 1 })
ProductSchema.index({ slug: 1 })
ProductSchema.index({ precio: 1 })
ProductSchema.index({ destacado: 1, activo: 1 })

export const Product = models.Product || model<IProduct>("Product", ProductSchema)
