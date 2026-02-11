import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const paymentApi = new Payment(mpClient)
    const payment = await paymentApi.get({ id: body.data.id })

    if (!payment.external_reference) {
      return NextResponse.json({ ok: true })
    }

    await connectDB()

    const order = await Order.findById(payment.external_reference)
    if (!order) {
      return NextResponse.json({ ok: true })
    }

    order.mpPaymentId = String(payment.id)

    if (payment.status === "approved") {
      order.estado = "pagado"

      // Descontar stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productoId, {
          $inc: { stock: -item.cantidad },
        })
      }
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      order.estado = "cancelado"
    }

    await order.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
