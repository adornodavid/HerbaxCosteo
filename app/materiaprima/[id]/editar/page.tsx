"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageProcessing } from "@/components/page-processing"
import { obtenerMateriasPrimas, actualizarMateriaPrima } from "@/app/actions/materia-prima"
import { listaDesplegableUnidadesMedida } from "@/app/actions/catalogos"
import type { PageModalAlertType, PageModalErrorType, PageModalValidationType } from "@/types/common"
import type { MateriaPrima } from "@/types/materia-prima"
import type { ddlItem } from "@/types/common.types"

export default function EditarMateriaPrimaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [materiaId, setMateriaId] = useState<number>(0)
  const [materia, setMateria] = useState<MateriaPrima | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Estados para unidades de medida
  const [unidadesMedida, setUnidadesMedida] = useState<ddlItem[]>([])
  const [selectedUnidadMedida, setSelectedUnidadMedida] = useState<string>("")

  // Estados para los modales
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [ModalValidation, setModalValidation] = useState<PageModalValidationType>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [ModalAlert, setModalAlert] = useState<PageModalAlertType>()
  const [showModalError, setShowModalError] = useState(false)
  const [ModalError, setModalError] = useState<PageModalErrorType>()
  const [isProcessing, setIsProcessing] = useState(false)

  // Estados para el formulario
  const [imagePreview, setImagePreview] = useState<string>("")

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      const id = Number.parseInt(resolvedParams.id)
      setMateriaId(id)

      // Cargar unidades de medida
      const unidadesResult = await listaDesplegableUnidadesMedida()
      if (unidadesResult.success && unidadesResult.data) {
        setUnidadesMedida(unidadesResult.data)
      }

      // Cargar datos de la materia prima por ID
      const result = await obtenerMateriasPrimas(id, "", "", "Todos", -1, -1)

      if (result.success && result.data && result.data.length > 0) {
        const materiaData = result.data[0]
        setMateria(materiaData)
        if (materiaData.ImgUrl) {
          setImagePreview(materiaData.ImgUrl)
        }
        // Establecer la unidad de medida seleccionada
        if (materiaData.UnidadMedidaId) {
          setSelectedUnidadMedida(materiaData.UnidadMedidaId.toString())
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [params])

  // Función para manejar la selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Función para actualizar la materia prima
  const handleActualizar = async () => {
    const formElement = document.getElementById("materiaprima-form") as HTMLFormElement
    const formData = new FormData(formElement)

    // Agregar el ID al formData
    formData.append("id", materiaId.toString())

    // Agregar la unidad de medida seleccionada
    formData.append("unidadmedidaid", selectedUnidadMedida)

    // Validar campos requeridos
    const nombre = formData.get("nombre") as string
    const codigo = formData.get("codigo") as string

    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
        Titulo: "Validación",
        Mensaje: "El nombre debe tener al menos 3 caracteres",
      })
      setShowModalValidation(true)
      return
    }

    if (!codigo || codigo.trim().length < 1) {
      setModalValidation({
        Titulo: "Validación",
        Mensaje: "El código es requerido",
      })
      setShowModalValidation(true)
      return
    }

    setIsProcessing(true)

    try {
      const result = await actualizarMateriaPrima(formData)

      setIsProcessing(false)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Materia prima actualizada correctamente",
        })
        setShowModalAlert(true)
        setTimeout(() => {
          router.push("/materiaprima")
        }, 1500)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al actualizar la materia prima",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setIsProcessing(false)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error inesperado al actualizar la materia prima",
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
      <PageTitlePlusNew title="Editar Materia Prima" showButton={false} buttonText="" buttonHref="" />

      <form id="materiaprima-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda - Campos del formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID</Label>
              <Input id="id" name="id" value={materia.id} disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" name="codigo" placeholder="Ingrese el código" defaultValue={materia.Codigo} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" placeholder="Ingrese el nombre" defaultValue={materia.Nombre} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadmedidaid">Unidad de Medida</Label>
              <Select value={selectedUnidadMedida} onValueChange={setSelectedUnidadMedida}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione unidad de medida" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesMedida.map((unidad) => (
                    <SelectItem key={unidad.value} value={unidad.value}>
                      {unidad.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                name="costo"
                type="number"
                step="0.000001"
                placeholder="0.00"
                defaultValue={materia.Costo || 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="factorimportacion">Factor Importación</Label>
              <Input
                id="factorimportacion"
                name="factorimportacion"
                type="number"
                step="0.000001"
                placeholder="0.00"
                defaultValue={materia.FactorImportacion || 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoconfactorimportacion">Costo con Factor Importación</Label>
              <Input
                id="costoconfactorimportacion"
                name="costoconfactorimportacion"
                type="number"
                step="0.000001"
                placeholder="0.00"
                defaultValue={materia.CostoConFactorImportacion || 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen</Label>
              <Input id="imagen" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
              <input type="hidden" name="imgurl" value={materia.ImgUrl || ""} />
            </div>
          </div>

          {/* Columna derecha - Vista previa de imagen */}
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <div className="border rounded-md h-[450px] flex items-center justify-center bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Vista previa"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-muted-foreground">No hay imagen</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" onClick={handleActualizar}>
            Actualizar Materia Prima
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/materiaprima")}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modales */}
      {isProcessing && <PageProcessing message="Actualizando materia prima..." />}

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
          onClose={() => setShowModalAlert(false)}
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
