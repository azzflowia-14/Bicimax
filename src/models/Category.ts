import mongoose, { Schema, models, model } from "mongoose"

export interface ICategory {
  _id: string
  nombre: string
  slug: string
  descripcion?: string
  imagen?: string
  activa: boolean
  orden: number
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    nombre: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    descripcion: { type: String },
    imagen: { type: String },
    activa: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Category = models.Category || model<ICategory>("Category", CategorySchema)
