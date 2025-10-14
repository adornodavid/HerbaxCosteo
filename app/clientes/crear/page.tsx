"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Cliente } from "@/types/clientes"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalValidation,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Componentes --
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Backend -- 
import { useAuth } from "@/contexts/auth-context"
import { crearCliente } from "@/app/actions/clientes"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CrearClientePage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])

  // --- Estados ---
  // Cargar contenido en variables
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)

  // -- Funciones -- 
  const ejecutarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string

    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
            Titulo: "Información necesaria incompleta.",
            Mensaje: "Favor de completar los campos obligatorios (Nombre, Clave).",
          })
      setShowModalValidation(true)
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
        setModalError({
          Titulo: "Error al crear cliente",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al crear cliente")
      console.error(error)
      setModalAlert({
        Titulo: "Información necesaria incompleta.",
        Mensaje: "Favor de completar los campos obligatorios (Nombre, Clave).",
      })
      setShowModalAlert(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    // Validar
    if (!user || user.RolId === 0) {
      router.push("/login")
      return
    }
  }, [authLoading, user, router, esAdminDOs])

  // -- Manejadores (Handles) --
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

  return (
    <div className="container mx-auto py-6 space-y-6">      
      <PageProcessing isOpen={showProcessing} />

      {showModalValidation && (
        <PageModalValidation
          Titulo={ModalValidation.Titulo}
          Mensaje={ModalValidation.Mensaje}
          isOpen={true}
          onClose={() => setShowModalValidation(false)}
        />
      )}

      {showModalAlert && (
        <PageModalValidation
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
          isOpen={true}
          onClose={() => setShowModalAlert(false)}
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
                <div className="border rounded-md h-[250px] flex items-center justify-center bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-auto object-cover"
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
