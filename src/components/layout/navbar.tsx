"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Heart,
  Package,
  LogOut,
  Bike,
} from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface NavbarProps {
  categorias: Array<{ _id: string; nombre: string; slug: string }>
}

export function Navbar({ categorias }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const cartCount = useCartStore((s) => s.getCount())
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/productos?q=${encodeURIComponent(search.trim())}`)
      setSearch("")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      {/* Top bar */}
      <div className="bg-slate-800 text-white text-xs py-1.5 text-center">
        Envios a todo el pais | Pagos con Mercado Pago
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-lg font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Inicio
                </Link>
                <Link
                  href="/productos"
                  className="text-lg font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Todos los productos
                </Link>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Categorias</p>
                  {categorias.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/productos?categoria=${cat.slug}`}
                      className="block py-2 text-sm hover:text-blue-600"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.nombre}
                    </Link>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Bike className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-800">
              Bici<span className="text-blue-600">max</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/productos"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Productos
            </Link>
            {categorias.slice(0, 5).map((cat) => (
              <Link
                key={cat._id}
                href={`/productos?categoria=${cat.slug}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {cat.nombre}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Favorites */}
            {session && (
              <Link href="/cuenta/favoritos">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/carrito">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/cuenta/pedidos" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Mis pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cuenta/favoritos" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cuenta/perfil" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mi perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Ingresar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
