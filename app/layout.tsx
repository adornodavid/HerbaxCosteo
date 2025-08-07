import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import Script from "next/script" // Importar Script
import "./globals.css" // Asumiendo que aquí se importan los estilos globales

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Herbax Costeo Dashboard",
  description: "Dashboard for Herbax Costeo application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Cargar el script de Preline UI */}
        <Script src="/preline.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
