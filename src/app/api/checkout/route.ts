import { NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { items, direccionEnvio, notas } = await request.json()

    if (!items?.length || !direccionEnvio) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    await connectDB()

    // Validate stock and prices from DB
    const orderItems = []
    let total = 0

    for (const item of items) {
      const product = await Product.findById(item.productoId)
      if (!product || !product.activo) {
        return NextResponse.json(
          { error: `Producto "${item.nombre}" no disponible` },
          { status: 400 }
        )
      }
      if (product.stock < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.nombre}"` },
          { status: 400 }
        )
      }

      const precio = product.precioOferta ?? product.precio
      const subtotal = precio * item.cantidad
      total += subtotal

      orderItems.push({
        productoId: product._id.toString(),
        nombre: product.nombre,
        precio,
        cantidad: item.cantidad,
        imagen: product.imagenes[0] || "",
      })
    }

    // Create order
    const order = await Order.create({
      userId: session.user.id,
      items: orderItems,
      subtotal: total,
      total,
      estado: "pendiente",
      direccionEnvio,
      notas,
    })

    // Create MercadoPago preference
    const preference = new Preference(mpClient)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const result = await preference.create({
      body: {
        items: orderItems.map((item) => ({
          id: item.productoId,
          title: item.nombre,
          quantity: item.cantidad,
          unit_price: item.precio,
          currency_id: "ARS",
        })),
        back_urls: {
          success: `${baseUrl}/cuenta/pedidos?status=success`,
          failure: `${baseUrl}/cuenta/pedidos?status=failure`,
          pending: `${baseUrl}/cuenta/pedidos?status=pending`,
        },
        auto_return: "approved",
        external_reference: order._id.toString(),
        notification_url: `${baseUrl}/api/webhook`,
      },
    })

    // Save preference ID
    order.mpPreferenceId = result.id
    await order.save()

    return NextResponse.json({
      orderId: order._id.toString(),
      init_point: result.init_point,
    })
  } catch (error) {
    console.error("Error en checkout:", error)
    return NextResponse.json(
      { error: "Error al procesar el pedido" },
      { status: 500 }
    )
  }
}
