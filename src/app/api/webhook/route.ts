import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: (process.env.MP_ACCESS_TOKEN || "").trim(),
    })
    const paymentApi = new Payment(mpClient)
    const payment = await paymentApi.get({ id: body.data.id })

    if (!payment.external_reference) {
      return NextResponse.json({ ok: true })
    }

    await connectDB()

    if (payment.status === "approved") {
      // Atomic guard: only process if stockDeducted is not yet true
      // This prevents double stock deduction on duplicate webhooks
      const order = await Order.findOneAndUpdate(
        {
          _id: payment.external_reference,
          stockDeducted: { $ne: true },
        },
        {
          $set: {
            estado: "pagado",
            mpPaymentId: String(payment.id),
            stockDeducted: true,
          },
        },
        { new: false }
      )

      if (!order) {
        // Order not found or already processed — both are safe to ignore
        return NextResponse.json({ ok: true })
      }

      // Deduct stock (runs only once due to atomic guard)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productoId, {
          $inc: { stock: -item.cantidad },
        })
      }
    } else if (
      payment.status === "rejected" ||
      payment.status === "cancelled"
    ) {
      await Order.findByIdAndUpdate(payment.external_reference, {
        estado: "cancelado",
        mpPaymentId: String(payment.id),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
