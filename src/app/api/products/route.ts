import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { slugify } from "@/lib/format"
import { cookies } from "next/headers"

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "true"
}

export async function GET() {
  await connectDB()
  const products = await Product.find().sort({ createdAt: -1 }).lean()
  return NextResponse.json(
    products.map((p) => ({ ...p, _id: p._id.toString() }))
  )
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()
    await connectDB()

    // Generar slug único
    let slug = slugify(data.nombre)
    let existing = await Product.findOne({ slug })
    let counter = 2
    while (existing) {
      slug = `${slugify(data.nombre)}-${counter}`
      existing = await Product.findOne({ slug })
      counter++
    }

    const product = await Product.create({ ...data, slug })

    return NextResponse.json({ _id: product._id.toString() })
  } catch (error) {
    console.error("Error creando producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
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

    if (updateData.nombre) {
      let slug = slugify(updateData.nombre)
      let existing = await Product.findOne({ slug, _id: { $ne: _id } })
      let counter = 2
      while (existing) {
        slug = `${slugify(updateData.nombre)}-${counter}`
        existing = await Product.findOne({ slug, _id: { $ne: _id } })
        counter++
      }
      updateData.slug = slug
    }

    await Product.findByIdAndUpdate(_id, updateData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando producto:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    await connectDB()
    await Product.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando producto:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
