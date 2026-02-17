# CLAUDE.md

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run lint         # ESLint
```

## Arquitectura

**E-commerce de bicicletas y accesorios** (Bicimax). Los clientes navegan el catálogo, agregan al carrito y pagan con Mercado Pago. Panel admin separado para gestionar productos, categorías y pedidos.

### Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- MongoDB con Mongoose
- NextAuth v5 (credentials + Google)
- MercadoPago SDK (Checkout Pro)
- Zustand (carrito persistido en localStorage)
- Tailwind CSS v4 + shadcn/ui
- Sonner (toasts) + Lucide (iconos)

### Alias de path
`@/*` apunta a `./src/*`

### Estructura de rutas
- `src/app/(store)/` — Tienda pública (layout con navbar + footer)
  - `/` — Home (hero, categorías, destacados)
  - `/productos` — Catálogo con filtros (categoría, búsqueda, orden, paginación)
  - `/producto/[id]` — Detalle de producto
  - `/carrito` — Carrito de compras
  - `/checkout` — Checkout con dirección de envío
  - `/cuenta/pedidos` — Historial de pedidos del usuario
  - `/cuenta/perfil` — Perfil del usuario
  - `/cuenta/favoritos` — Productos favoritos
- `src/app/(auth)/` — Auth (login, registro)
- `src/app/admin/` — Panel admin (login con contraseña en env)
  - `/admin/dashboard` — Dashboard con KPIs, ventas diarias, top productos, stock valorizado
  - `/admin/productos` — CRUD de productos (con costPrice, sku, proveedor)
  - `/admin/categorias` — CRUD de categorías
  - `/admin/pedidos` — Gestión de pedidos (cambiar estado)
  - `/admin/proveedores` — CRUD de proveedores

### API Routes
- `/api/auth/[...nextauth]` — NextAuth handlers
- `/api/auth/registro` — Registro de usuarios
- `/api/products` — CRUD productos (admin)
- `/api/categories` — CRUD categorías (admin)
- `/api/orders` — Listar/actualizar pedidos (admin)
- `/api/checkout` — Crear orden + preferencia MercadoPago
- `/api/webhook` — Webhook de MercadoPago (actualiza estado de orden y stock)
- `/api/admin/auth` — Login/logout admin (cookie)
- `/api/admin/dashboard` — KPIs y métricas de ventas (aggregation pipelines)
- `/api/admin/stock-report` — Stock valorizado (a precio venta y costo)
- `/api/admin/export/products` — Exportar productos como CSV
- `/api/suppliers` — CRUD proveedores (admin)

### Modelos (Mongoose)
- `User` — nombre, email, password, provider, favoritos, dirección
- `Product` — nombre, slug, precio, precioOferta, imágenes, categoría, marca, stock, especificaciones, costPrice, sku, supplierId
- `Category` — nombre, slug, imagen, activa, orden
- `Order` — userId, items (con costPriceAtPurchase), total, estado, mpPaymentId, direcciónEnvío, stockDeducted
- `Supplier` — nombre, contacto, telefono, email, direccion, notas, cuit, condicionesPago, activo

### Auth
- Clientes: NextAuth v5 con credentials + Google
- Admin: Cookie `admin-auth` setada con contraseña en `ADMIN_PASSWORD` env var

### Carrito
Zustand store en `src/lib/cart-store.ts`, persistido en localStorage como `bicimax-cart`.

## Variables de entorno

```
MONGODB_URI=mongodb://...
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MP_ACCESS_TOKEN=...
NEXT_PUBLIC_MP_PUBLIC_KEY=...
ADMIN_PASSWORD=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
