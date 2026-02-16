import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  // Verificar auth admin (cookie-based)
  const cookieStore = await cookies()
  const auth = cookieStore.get("admin-auth")
  if (auth?.value !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!.trim()
    const apiKey = process.env.CLOUDINARY_API_KEY!.trim()
    const apiSecret = process.env.CLOUDINARY_API_SECRET!.trim()

    // Generar firma para upload autenticado
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const folder = "bicimax"
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    // Subir directo a Cloudinary via REST API (compatible con Vercel serverless)
    const cloudinaryForm = new FormData()
    cloudinaryForm.append("file", file)
    cloudinaryForm.append("folder", folder)
    cloudinaryForm.append("timestamp", timestamp)
    cloudinaryForm.append("api_key", apiKey)
    cloudinaryForm.append("signature", signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudinaryForm }
    )

    if (!res.ok) {
      const errBody = await res.text()
      console.error("Cloudinary error:", res.status, errBody)
      return NextResponse.json(
        { error: "Error al subir imagen", details: errBody },
        { status: 500 }
      )
    }

    const data = await res.json()
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    console.error("Error al subir imagen:", error)
    return NextResponse.json(
      { error: "Error al subir imagen", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
