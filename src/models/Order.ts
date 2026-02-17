import { Schema, models, model } from "mongoose"

export interface IOrderItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagen: string
  costPriceAtPurchase: number
}

export interface IOrder {
  _id: string
  userId: string
  items: IOrderItem[]
  subtotal: number
  total: number
  estado: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado"
  metodoPago: string
  mpPaymentId?: string
  mpPreferenceId?: string
  direccionEnvio: {
    nombre: string
    calle: string
    ciudad: string
    provincia: string
    codigoPostal: string
    telefono: string
  }
  notas?: string
  stockDeducted: boolean
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productoId: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    imagen: { type: String, required: true },
    costPriceAtPurchase: { type: Number, default: 0 },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "enviado", "entregado", "cancelado"],
      default: "pendiente",
    },
    metodoPago: { type: String, default: "mercadopago" },
    mpPaymentId: { type: String },
    mpPreferenceId: { type: String },
    direccionEnvio: {
      nombre: { type: String, required: true },
      calle: { type: String, required: true },
      ciudad: { type: String, required: true },
      provincia: { type: String, required: true },
      codigoPostal: { type: String, required: true },
      telefono: { type: String, required: true },
    },
    notas: { type: String },
    stockDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

OrderSchema.index({ estado: 1, createdAt: -1 })
OrderSchema.index({ mpPaymentId: 1 }, { sparse: true })

export const Order = models.Order || model<IOrder>("Order", OrderSchema)
