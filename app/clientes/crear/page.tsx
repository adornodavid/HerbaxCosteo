"use client"

import type React from "react"
import type { ModalAlert, ModalError } from "@/types/modal" // Import ModalAlert and ModalError types

import { useState } from "react"
import { useRouter } from "next/navigation"
import { crearCliente } from "@/app/actions/clientes"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageProcessing } from "@/components/page-processing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function CrearClientePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [modalAlert, setModalAlert] = useState<ModalAlert>({ Titulo: "", Mensaje: "" })
  const [modalError, setModalError] = useState<ModalError>({ Titulo: "", Mensaje: "" })
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showValidationAlert, setShowValidationAlert] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const ejecutarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string

    if (!nombre || nombre.trim().length < 3 || !clave || clave.trim().length < 1) {
      setShowValidationAlert(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await crearCliente(formData)

      setShowProcessing(false)

      if (result.success) {
        alert("Cliente creado exitosamente")
        router.push("/clientes")
      } else {
        alert(`Error al crear cliente: ${result.error}`)
        
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al crear cliente")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showValidationAlert) {
    return (
      <PageModalAlert
        Titulo="Información necesaria incompleta."
        Mensaje="Se necesita que la información obligatoria este correctamente llenada, favor de verificar......."
        isOpen={true}
        onClose={() => setShowValidationAlert(false)}
      />
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageProcessing isOpen={showProcessing} />

      <PageTitlePlusNew
        Titulo="Creación de nuevo cliente"
        Subtitulo="Formulario para registrar un nuevo cliente"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmCliente" onSubmit={ejecutarRegistro} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="txtNombre">
                  <span className="text-red-500">*</span> Nombre
                </Label>
                <Input id="txtNombre" name="nombre" type="text" placeholder="Ingrese el nombre del cliente" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtClave">
                  <span className="text-red-500">*</span> Clave
                </Label>
                <Input id="txtClave" name="clave" type="text" placeholder="Ingrese la clave del cliente" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtDireccion">Dirección</Label>
              <Input id="txtDireccion" name="direccion" type="text" placeholder="Ingrese la dirección" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="txtTelefono">Teléfono</Label>
                <Input id="txtTelefono" name="telefono" type="tel" placeholder="Ingrese el teléfono" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtEmail">Email</Label>
                <Input id="txtEmail" name="email" type="email" placeholder="Ingrese el email" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageImg">Imagen</Label>
                <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-2">
                <Label>Previsualización</Label>
                <div className="border rounded-md h-[100px] flex items-center justify-center bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin imagen seleccionada</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                {isSubmitting ? "Guardando..." : "Guardar Cliente"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/clientes")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
