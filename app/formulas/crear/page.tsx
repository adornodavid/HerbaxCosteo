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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type {
  propsPageModalValidation,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs } from "@/lib/config"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalError } from "@/components/page-modal-error"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { crearFormula } from "@/app/actions/formulas"
import { obtenerUnidadesMedida } from "@/app/actions/catalogos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CrearFormulaPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])

  // --- Estados ---
  // Cargar contenido en variables
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([])
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
    const codigo = formData.get("codigo") as string

    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
        Titulo: "Información necesaria incompleta.",
        Mensaje: "Favor de completar los campos obligatorios (Nombre, Código).",
      })
      setShowModalValidation(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await crearFormula(formData)
      setShowProcessing(false)

      if (result.success) {
        alert("Fórmula creada exitosamente")
        router.push(`/formulas/${result.data}/editar`)
      } else {
        setModalError({
          Titulo: "Error al crear fórmula",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al crear fórmula")
      console.error(error)
      setModalAlert({
        Titulo: "Información necesaria incompleta.",
        Mensaje: "Favor de completar los campos obligatorios (Nombre, Código).",
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

    // Cargar unidades de medida
    const cargarUnidadesMedida = async () => {
      try {
        const result = await obtenerUnidadesMedida()
        if (result.success && result.data) {
          setUnidadesMedida(result.data)
        }
      } catch (error) {
        console.error("Error cargando unidades de medida:", error)
      }
    }

    cargarUnidadesMedida()
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
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      <PageTitlePlusNew
        Titulo="Creación de nueva fórmula"
        Subtitulo="Formulario para registrar una nueva fórmula"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmFormula" onSubmit={ejecutarRegistro} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="txtCodigo">
                  <span className="text-red-500">*</span> Código
                </Label>
                <Input id="txtCodigo" name="codigo" type="text" placeholder="Ingrese el código de la fórmula" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtNombre">
                  <span className="text-red-500">*</span> Nombre
                </Label>
                <Input id="txtNombre" name="nombre" type="text" placeholder="Ingrese el nombre de la fórmula" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
                <Select name="unidadmedidaid">
                  <SelectTrigger id="ddlUnidadMedida">
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((unidad) => (
                      <SelectItem key={unidad.id} value={unidad.id.toString()}>
                        {unidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtCosto">Costo</Label>
                <Input id="txtCosto" name="costo" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageImg">Imagen</Label>
                <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-2">
                <Label>Previsualización</Label>
                <div className="border rounded-md h-[300px] flex items-center justify-center bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-full w-auto object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin imagen seleccionada</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                {isSubmitting ? "Guardando..." : "Guardar Fórmula"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/formulas")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
