import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Supplier } from "@/models/Supplier"
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
  const suppliers = await Supplier.find().sort({ nombre: 1 }).lean()
  return NextResponse.json(
    suppliers.map((s) => ({ ...s, _id: s._id.toString() }))
  )
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()
    await connectDB()

    if (!data.nombre?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      )
    }

    const supplier = await Supplier.create(data)
    return NextResponse.json({ _id: supplier._id.toString() })
  } catch (error) {
    console.error("Error creando proveedor:", error)
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { _id, ...updateData } = data
    await connectDB()
    await Supplier.findByIdAndUpdate(_id, updateData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando proveedor:", error)
    return NextResponse.json(
      { error: "Error al actualizar" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    await connectDB()
    await Supplier.findByIdAndUpdate(id, { activo: false })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando proveedor:", error)
    return NextResponse.json(
      { error: "Error al eliminar" },
      { status: 500 }
    )
  }
}
