"use client"

import type React from "react"
import type { ModalAlert, ModalError } from "@/types/modal"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { obtenerClientes, actualizarCliente } from "@/app/actions/clientes"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageProcessing } from "@/components/page-processing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")

  const [formData, setFormData] = useState({
    nombre: "",
    clave: "",
    direccion: "",
    telefono: "",
    email: "",
  })

  const [modalAlert, setModalAlert] = useState<ModalAlert>({ Titulo: "", Mensaje: "" })
  const [modalError, setModalError] = useState<ModalError>({ Titulo: "", Mensaje: "" })
  const [modalValidation, setModalValidation] = useState<ModalError>({ Titulo: "", Mensaje: "" })
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)

  useEffect(() => {
    const cargarDatosCliente = async () => {
      try {
        setIsLoading(true)
        const result = await obtenerClientes(clienteId, "", "", "", "", "", "Todos")

        if (result.success && result.data && result.data.length > 0) {
          const cliente = result.data[0]
          setFormData({
            nombre: cliente.nombre || "",
            clave: cliente.clave || "",
            direccion: cliente.direccion || "",
            telefono: cliente.telefono || "",
            email: cliente.email || "",
          })

          // Set existing image URL and preview
          if (cliente.imgurl) {
            setExistingImageUrl(cliente.imgurl)
            setImagePreview(cliente.imgurl)
          }
        } else {
          setModalError({
            Titulo: "Error al cargar cliente",
            Mensaje: "No se pudo encontrar el cliente solicitado",
          })
          setShowModalError(true)
        }
      } catch (error) {
        console.error("Error cargando datos del cliente:", error)
        setModalError({
          Titulo: "Error al cargar cliente",
          Mensaje: "Ocurrió un error al cargar los datos del cliente",
        })
        setShowModalError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (clienteId) {
      cargarDatosCliente()
    }
  }, [clienteId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(existingImageUrl || null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const ejecutarActualizacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formDataToSend = new FormData(e.currentTarget)
    const nombre = formDataToSend.get("nombre") as string
    const clave = formDataToSend.get("clave") as string

    if (!nombre || nombre.trim().length < 3 || !clave || clave.trim().length < 1) {
      setShowModalValidation(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await actualizarCliente(formDataToSend)

      setShowProcessing(false)

      if (result.success) {
        alert("Cliente actualizado exitosamente")
        //router.push("/clientes")
      } else {
        setModalError({
          Titulo: "Error al actualizar cliente",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al actualizar cliente")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <PageProcessing isOpen={true} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageProcessing isOpen={showProcessing} />

      {showModalValidation && (
        <PageModalValidation
          Titulo="Información necesaria incompleta."
          Mensaje="Favor de completar los campos obligatorios (Nombre, Clave)."
          isOpen={true}
          onClose={() => setShowModalValidation(false)}
        />
      )}

      {showModalError && (
        <PageModalError
          Titulo={modalError.Titulo}
          Mensaje={modalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      <PageTitlePlusNew
        Titulo="Actualización de cliente"
        Subtitulo="Formulario para actualizar un cliente"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmCliente" onSubmit={ejecutarActualizacion} className="space-y-4">
            <input type="hidden" name="id" value={clienteId} />

            {existingImageUrl && <input type="hidden" name="imgurl" value={existingImageUrl} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: All inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="txtNombre">
                    <span className="text-red-500">*</span> Nombre
                  </Label>
                  <Input
                    id="txtNombre"
                    name="nombre"
                    type="text"
                    placeholder="Ingrese el nombre del cliente"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtClave">
                    <span className="text-red-500">*</span> Clave
                  </Label>
                  <Input
                    id="txtClave"
                    name="clave"
                    type="text"
                    placeholder="Ingrese la clave del cliente"
                    value={formData.clave}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtDireccion">Dirección</Label>
                  <Input
                    id="txtDireccion"
                    name="direccion"
                    type="text"
                    placeholder="Ingrese la dirección"
                    value={formData.direccion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtTelefono">Teléfono</Label>
                  <Input
                    id="txtTelefono"
                    name="telefono"
                    type="tel"
                    placeholder="Ingrese el teléfono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtEmail">Email</Label>
                  <Input
                    id="txtEmail"
                    name="email"
                    type="email"
                    placeholder="Ingrese el email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageImg">Imagen</Label>
                  <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              {/* Right column: Image preview only */}
              <div className="space-y-2">
                <Label>Previsualización de Imagen</Label>
                <div className="border rounded-md flex items-center justify-center bg-muted max-h-[350px] h-[350px]">
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
