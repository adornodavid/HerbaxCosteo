"use client"

import { useSearchParams } from "next/navigation"

export default function ResumenCotizacionPage() {
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get("id")

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Resumen de Cotización #{cotizacionId}</h1>
      <p className="text-muted-foreground mt-2">Página en construcción.</p>
    </div>
  )
}
