import { Schema, models, model } from "mongoose"

export interface IUser {
  _id: string
  nombre: string
  email: string
  password?: string
  imagen?: string
  provider: "credentials" | "google"
  favoritos: string[]
  direccion?: {
    calle: string
    ciudad: string
    provincia: string
    codigoPostal: string
    telefono: string
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    imagen: { type: String },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    favoritos: [{ type: String }],
    direccion: {
      calle: String,
      ciudad: String,
      provincia: String,
      codigoPostal: String,
      telefono: String,
    },
  },
  { timestamps: true }
)

export const User = models.User || model<IUser>("User", UserSchema)
