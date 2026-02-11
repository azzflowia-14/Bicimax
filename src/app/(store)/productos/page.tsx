export const dynamic = "force-dynamic"

import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"
import { ProductCard } from "@/components/store/product-card"
import { ProductFilters } from "@/components/store/product-filters"

interface Props {
  searchParams: Promise<{
    categoria?: string
    q?: string
    orden?: string
    min?: string
    max?: string
    page?: string
  }>
}

async function getProducts(params: Awaited<Props["searchParams"]>) {
  await connectDB()

  const filter: Record<string, unknown> = { activo: true }

  if (params.categoria) {
    const cat = await Category.findOne({ slug: params.categoria })
    if (cat) filter.categoria = cat._id.toString()
  }

  if (params.q) {
    filter.$or = [
      { nombre: { $regex: params.q, $options: "i" } },
      { marca: { $regex: params.q, $options: "i" } },
      { descripcion: { $regex: params.q, $options: "i" } },
    ]
  }

  if (params.min || params.max) {
    filter.precio = {}
    if (params.min) (filter.precio as Record<string, number>).$gte = Number(params.min)
    if (params.max) (filter.precio as Record<string, number>).$lte = Number(params.max)
  }

  let sort: Record<string, 1 | -1> = { createdAt: -1 }
  if (params.orden === "precio-asc") sort = { precio: 1 }
  if (params.orden === "precio-desc") sort = { precio: -1 }
  if (params.orden === "nombre") sort = { nombre: 1 }

  const page = Math.max(1, Number(params.page) || 1)
  const limit = 12
  const skip = (page - 1) * limit

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ])

  return {
    products: products.map((p) => ({
      _id: p._id.toString(),
      nombre: p.nombre,
      slug: p.slug,
      precio: p.precio,
      precioOferta: p.precioOferta,
      imagenes: p.imagenes,
      marca: p.marca,
      stock: p.stock,
      categoria: p.categoria.toString(),
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  }
}

async function getCategorias() {
  await connectDB()
  const cats = await Category.find({ activa: true }).sort({ orden: 1 }).lean()
  return cats.map((c) => ({
    _id: c._id.toString(),
    nombre: c.nombre,
    slug: c.slug,
  }))
}

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams
  const [{ products, total, pages, page }, categorias] = await Promise.all([
    getProducts(params),
    getCategorias(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {params.q
              ? `Resultados para "${params.q}"`
              : params.categoria
                ? categorias.find((c) => c.slug === params.categoria)?.nombre || "Productos"
                : "Todos los productos"}
          </h1>
          <p className="text-sm text-muted-foreground">{total} productos</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters */}
        <aside className="lg:w-64 shrink-0">
          <ProductFilters
            categorias={categorias}
            categoriaActual={params.categoria}
            ordenActual={params.orden}
          />
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No se encontraron productos
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <ProductCard key={prod._id} producto={prod} />
                ))}
              </div>
              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/productos?${new URLSearchParams({
                        ...(params.categoria && { categoria: params.categoria }),
                        ...(params.q && { q: params.q }),
                        ...(params.orden && { orden: params.orden }),
                        page: String(p),
                      }).toString()}`}
                      className={`px-3 py-1 rounded text-sm ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
