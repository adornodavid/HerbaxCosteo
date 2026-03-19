"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageProcessing } from "@/components/page-processing"
import { obtenerMateriasPrima, eliminarMateriaPrima } from "@/app/actions/materia-prima"
import type { PageModalAlertType, PageModalErrorType, PageModalValidationType } from "@/types/common"
import type { MateriaPrima } from "@/types/materia-prima"

export default function EliminarMateriaPrimaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [materiaId, setMateriaId] = useState<number>(0)
  const [materia, setMateria] = useState<MateriaPrima | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [confirmacion, setConfirmacion] = useState("")

  // Estados para los modales
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [ModalValidation, setModalValidation] = useState<PageModalValidationType>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [ModalAlert, setModalAlert] = useState<PageModalAlertType>()
  const [showModalError, setShowModalError] = useState(false)
  const [ModalError, setModalError] = useState<PageModalErrorType>()
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      const id = Number.parseInt(resolvedParams.id)
      setMateriaId(id)

      const result = await obtenerMateriasPrima(id, "", "", "Todos", -1, -1)

      if (result.success && result.data && result.data.length > 0) {
        setMateria(result.data[0])
      }

      setIsLoading(false)
    }

    loadData()
  }, [params])

  // Función para eliminar la materia prima
  const handleEliminar = async () => {
    if (confirmacion.toLowerCase() !== "eliminar") {
      setModalValidation({
        Titulo: "Validación",
        Mensaje: 'Debe escribir "ELIMINAR" para confirmar la eliminación',
      })
      setShowModalValidation(true)
      return
    }

    setIsProcessing(true)

    try {
      const result = await eliminarMateriaPrima(materiaId)

      setIsProcessing(false)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Materia prima eliminada correctamente",
        })
        setShowModalAlert(true)
        setTimeout(() => {
          router.push("/materiaprima")
        }, 1500)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al eliminar la materia prima",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setIsProcessing(false)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error inesperado al eliminar la materia prima",
      })
      setShowModalError(true)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-6">Cargando...</div>
  }

  if (!materia) {
    return <div className="container mx-auto py-6">Materia prima no encontrada</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew title="Eliminar Materia Prima" showButton={false} buttonText="" buttonHref="" />

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

      {/* Sección de confirmación */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmacion" className="text-red-700">
              Para confirmar la eliminación, escriba "ELIMINAR"
            </Label>
            <Input
              id="confirmacion"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="Escriba ELIMINAR"
              className="border-red-300"
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="destructive" onClick={handleEliminar}>
              Eliminar Materia Prima
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/materiaprima")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      {isProcessing && <PageProcessing message="Eliminando materia prima..." />}

      {ModalValidation && (
        <PageModalValidation
          Titulo={ModalValidation.Titulo}
          Mensaje={ModalValidation.Mensaje}
          isOpen={showModalValidation}
          onClose={() => setShowModalValidation(false)}
        />
      )}

      {ModalAlert && (
        <PageModalAlert
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
          isOpen={showModalAlert}
          onClose={() => {
            setShowModalAlert(false)
            router.push("/materiaprima")
          }}
        />
      )}

      {ModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={showModalError}
          onClose={() => setShowModalError(false)}
        />
      )}
    </div>
  )
}
