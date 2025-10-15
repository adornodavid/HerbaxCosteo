import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { obtenerMateriasPrima } from "@/app/actions/materia-prima"
import PageTitlePlusNew from "@/components/page-title-plus-new"

export default async function VerMateriaPrimaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const materiaId = Number.parseInt(id)

  // Obtener los datos de la materia prima
  const result = await obtenerMateriasPrima(materiaId, "", "", "Todos", -1, -1)

  if (!result.success || !result.data || result.data.length === 0) {
    notFound()
  }

  const materia = result.data[0]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew title="Detalles de Materia Prima" showButton={false} buttonText="" buttonHref="" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda - Información */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="text-lg font-semibold">{materia.Codigo}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold">{materia.Nombre}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Unidad de Medida ID</p>
              <p className="text-lg">{materia.UnidadMedidaId || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Costo</p>
              <p className="text-lg">${materia.Costo?.toFixed(2) || "0.00"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg">
                {materia.Activo ? (
                  <span className="text-green-600">Activo</span>
                ) : (
                  <span className="text-red-600">Inactivo</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="text-lg">
                {materia.FechaCreacion ? new Date(materia.FechaCreacion).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha - Imagen */}
        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-md h-[350px] flex items-center justify-center bg-gray-100">
              {materia.ImgUrl ? (
                <img
                  src={materia.ImgUrl || "/placeholder.svg"}
                  alt={materia.Nombre}
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
          <Link href={`/materiaprima/${materiaId}/editar`}>Editar</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/materiaprima">Volver al Listado</Link>
        </Button>
      </div>
    </div>
  )
}
