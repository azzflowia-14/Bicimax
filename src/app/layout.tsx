import type { Metadata } from "next"
import { Inter, Montserrat } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["700", "900"] })

export const metadata: Metadata = {
  title: "Bicimax - Tienda de Bicicletas y Accesorios",
  description:
    "Tu tienda online de bicicletas, cascos, guantes y accesorios. Envios a todo el pais. Paga con Mercado Pago.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${montserrat.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
