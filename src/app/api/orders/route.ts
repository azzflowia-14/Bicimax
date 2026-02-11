import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { cookies } from "next/headers"

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "true"
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await connectDB()
  const orders = await Order.find().sort({ createdAt: -1 }).lean()
  return NextResponse.json(
    orders.map((o) => ({ ...o, _id: o._id.toString() }))
  )
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { _id, estado } = await request.json()
    await connectDB()
    await Order.findByIdAndUpdate(_id, { estado })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando orden:", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
