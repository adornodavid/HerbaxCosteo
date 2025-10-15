"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageTitlePlusNew from "@/components/page-title-plus-new"
import PageModalAlert from "@/components/page-modal-alert"
import PageModalError from "@/components/page-modal-error"
import PageModalValidation from "@/components/page-modal-validation"
import PageProcessing from "@/components/page-processing"
import { obtenerMaterialesEtiquetados, actualizarMaterialEtiquetado } from "@/app/actions/material-etiquetado"
import type { PageModalAlertType, PageModalErrorType, PageModalValidationType } from "@/types/common"
import type { MaterialEtiquetado } from "@/types/material-etiquetado"

export default function EditarMaterialEtiquetadoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [materialId, setMaterialId] = useState<number>(0)
  const [material, setMaterial] = useState<MaterialEtiquetado | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setMaterialId(id)

      const result = await obtenerMaterialesEtiquetados(id, "", "", "Todos", -1, -1)

      if (result.success && result.data && result.data.length > 0) {
        const materialData = result.data[0]
        setMaterial(materialData)
        if (materialData.ImgUrl) {
          setImagePreview(materialData.ImgUrl)
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

  // Función para actualizar el material de etiquetado
  const handleActualizar = async () => {
    const formElement = document.getElementById("materialetiquetado-form") as HTMLFormElement
    const formData = new FormData(formElement)

    // Agregar el ID al formData
    formData.append("id", materialId.toString())

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
      const result = await actualizarMaterialEtiquetado(formData)

      setIsProcessing(false)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Material de etiquetado actualizado correctamente",
        })
        setShowModalAlert(true)
        setTimeout(() => {
          router.push("/materialetiquetado")
        }, 1500)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al actualizar el material de etiquetado",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setIsProcessing(false)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error inesperado al actualizar el material de etiquetado",
      })
      setShowModalError(true)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-6">Cargando...</div>
  }

  if (!material) {
    return <div className="container mx-auto py-6">Material de etiquetado no encontrado</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew title="Editar Material de Etiquetado" showButton={false} buttonText="" buttonHref="" />

      <form id="materialetiquetado-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda - Campos del formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                name="codigo"
                placeholder="Ingrese el código"
                defaultValue={material.Codigo}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ingrese el nombre"
                defaultValue={material.Nombre}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadmedidaid">Unidad de Medida</Label>
              <Input
                id="unidadmedidaid"
                name="unidadmedidaid"
                type="number"
                placeholder="ID de unidad de medida"
                defaultValue={material.UnidadMedidaId || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                name="costo"
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue={material.Costo || 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen</Label>
              <Input id="imagen" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
              <input type="hidden" name="imgurl" value={material.ImgUrl || ""} />
            </div>
          </div>

          {/* Columna derecha - Vista previa de imagen */}
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <div className="border rounded-md h-[350px] flex items-center justify-center bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Vista previa"
                  className="w-full h-auto object-cover"
                />
              ) : (
                <p className="text-muted-foreground">No hay imagen</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" onClick={handleActualizar}>
            Actualizar Material de Etiquetado
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/materialetiquetado")}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modales */}
      {isProcessing && <PageProcessing message="Actualizando material de etiquetado..." />}

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
