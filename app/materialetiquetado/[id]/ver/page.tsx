import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { obtenerMaterialesEtiquetados } from "@/app/actions/material-etiquetado"
import PageTitlePlusNew from "@/components/page-title-plus-new"

export default async function VerMaterialEtiquetadoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const materialId = Number.parseInt(id)

  // Obtener los datos del material de etiquetado
  const result = await obtenerMaterialesEtiquetados(materialId, "", "", "Todos", -1, -1)

  if (!result.success || !result.data || result.data.length === 0) {
    notFound()
  }

  const material = result.data[0]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew title="Detalles de Material de Etiquetado" showButton={false} buttonText="" buttonHref="" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda - Información */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="text-lg font-semibold">{material.Codigo}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold">{material.Nombre}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Unidad de Medida ID</p>
              <p className="text-lg">{material.UnidadMedidaId || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Costo</p>
              <p className="text-lg">${material.Costo?.toFixed(2) || "0.00"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg">
                {material.Activo ? (
                  <span className="text-green-600">Activo</span>
                ) : (
                  <span className="text-red-600">Inactivo</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="text-lg">
                {material.FechaCreacion ? new Date(material.FechaCreacion).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha - Imagen */}
        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-md h-[350px] flex items-center justify-center bg-gray-100">
              {material.ImgUrl ? (
                <img
                  src={material.ImgUrl || "/placeholder.svg"}
                  alt={material.Nombre}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <p className="text-muted-foreground">Sin imagen</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/materialetiquetado/${materialId}/editar`}>Editar</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/materialetiquetado">Volver al Listado</Link>
        </Button>
      </div>
    </div>
  )
}
