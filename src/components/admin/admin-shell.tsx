"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bike,
  Package,
  FolderTree,
  ShoppingBag,
  BarChart3,
  Truck,
  LogOut,
} from "lucide-react"
import { toast } from "sonner"

const menu = [
  { href: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/productos", icon: Package, label: "Productos" },
  { href: "/admin/categorias", icon: FolderTree, label: "Categorias" },
  { href: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { href: "/admin/proveedores", icon: Truck, label: "Proveedores" },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    router.push("/admin")
    toast.success("Sesion cerrada")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Bike className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-lg">
              Bici<span className="text-blue-400">max</span>
            </span>
            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded ml-1">Admin</span>
          </div>
          <nav className="space-y-1">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-700">
          <Link href="/" className="block text-xs text-slate-400 hover:text-white mb-3">
            ← Ir a la tienda
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-slate-700 w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
