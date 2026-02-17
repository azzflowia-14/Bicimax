import { Schema, models, model } from "mongoose"

export interface IVentaMostradorItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagen: string
  costPriceAtPurchase: number
}

export interface IPago {
  _id?: string
  monto: number
  fecha: Date
  nota?: string
}

export interface IVentaMostrador {
  _id: string
  cliente: {
    nombre: string
    telefono: string
  }
  items: IVentaMostradorItem[]
  total: number
  totalPagado: number
  pagos: IPago[]
  estado: "pendiente" | "pagado" | "cancelado"
  notas?: string
  createdAt: Date
  updatedAt: Date
}

const VentaMostradorItemSchema = new Schema<IVentaMostradorItem>(
  {
    productoId: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    imagen: { type: String, default: "" },
    costPriceAtPurchase: { type: Number, default: 0 },
  },
  { _id: false }
)

const PagoSchema = new Schema<IPago>({
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  nota: { type: String },
})

const VentaMostradorSchema = new Schema<IVentaMostrador>(
  {
    cliente: {
      nombre: { type: String, required: true },
      telefono: { type: String, required: true },
    },
    items: [VentaMostradorItemSchema],
    total: { type: Number, required: true },
    totalPagado: { type: Number, default: 0 },
    pagos: [PagoSchema],
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "cancelado"],
      default: "pendiente",
    },
    notas: { type: String },
  },
  { timestamps: true }
)

VentaMostradorSchema.index({ estado: 1, createdAt: -1 })
VentaMostradorSchema.index({ "cliente.telefono": 1 })

export const VentaMostrador =
  models.VentaMostrador ||
  model<IVentaMostrador>("VentaMostrador", VentaMostradorSchema)
