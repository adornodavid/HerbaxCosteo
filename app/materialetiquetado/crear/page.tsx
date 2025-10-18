"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageTitlePlusNew from "@/components/page-title-plus-new"
import PageModalAlert from "@/components/page-modal-alert"
import PageModalError from "@/components/page-modal-error"
import PageModalValidation from "@/components/page-modal-validation"
import PageProcessing from "@/components/page-processing"
import { crearMaterialEtiquetado } from "@/app/actions/material-etiquetado"
import type { PageModalAlertType, PageModalErrorType, PageModalValidationType } from "@/types/common"

export default function CrearMaterialEtiquetadoPage() {
  const router = useRouter()

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

  // Función para guardar el material de etiquetado
  const handleGuardar = async () => {
    const formElement = document.getElementById("materialetiquetado-form") as HTMLFormElement
    const formData = new FormData(formElement)

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
      const result = await crearMaterialEtiquetado(formData)

      setIsProcessing(false)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Material de etiquetado creado correctamente",
        })
        setShowModalAlert(true)
        setTimeout(() => {
          router.push(`/materialetiquetado/${result.data}/editar`)
        }, 1500)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al crear el material de etiquetado",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setIsProcessing(false)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error inesperado al crear el material de etiquetado",
      })
      setShowModalError(true)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew title="Crear Material de Etiquetado" showButton={false} buttonText="" buttonHref="" />

      <form id="materialetiquetado-form" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda - Campos del formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" name="codigo" placeholder="Ingrese el código" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" placeholder="Ingrese el nombre" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadmedidaid">Unidad de Medida</Label>
              <Input id="unidadmedidaid" name="unidadmedidaid" type="number" placeholder="ID de unidad de medida" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">Costo</Label>
              <Input id="costo" name="costo" type="number" step="0.01" placeholder="0.00" defaultValue="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen</Label>
              <Input id="imagen" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          {/* Columna derecha - Vista previa de imagen */}
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <div className="border rounded-md h-[300px] flex items-center justify-center bg-muted">
              {imagePreview ? (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Vista previa"
                  className="h-full w-auto object-cover"
                />
              ) : (
                <p className="text-muted-foreground">No hay imagen seleccionada</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" onClick={handleGuardar}>
            Guardar Material de Etiquetado
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/materialetiquetado")}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modales */}
      {isProcessing && <PageProcessing message="Creando material de etiquetado..." />}

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
