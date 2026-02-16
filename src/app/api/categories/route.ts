import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Category } from "@/models/Category"
import { slugify } from "@/lib/format"
import { cookies } from "next/headers"

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "true"
}

export async function GET() {
  await connectDB()
  const categories = await Category.find().sort({ orden: 1 }).lean()
  return NextResponse.json(
    categories.map((c) => ({ ...c, _id: c._id.toString() }))
  )
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()
    await connectDB()

    let slug = slugify(data.nombre)
    let existing = await Category.findOne({ slug })
    let counter = 2
    while (existing) {
      slug = `${slugify(data.nombre)}-${counter}`
      existing = await Category.findOne({ slug })
      counter++
    }
    const category = await Category.create({ ...data, slug })

    return NextResponse.json({ _id: category._id.toString() })
  } catch (error) {
    console.error("Error creando categoria:", error)
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 })
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
      let existing = await Category.findOne({ slug, _id: { $ne: _id } })
      let counter = 2
      while (existing) {
        slug = `${slugify(updateData.nombre)}-${counter}`
        existing = await Category.findOne({ slug, _id: { $ne: _id } })
        counter++
      }
      updateData.slug = slug
    }

    await Category.findByIdAndUpdate(_id, updateData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando categoria:", error)
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
    await Category.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando categoria:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
