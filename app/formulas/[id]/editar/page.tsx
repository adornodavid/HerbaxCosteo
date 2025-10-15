"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type {
  propsPageLoadingScreen,
  propsPageModalValidation,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalError } from "@/components/page-modal-error"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerFormulas, actualizarFormula } from "@/app/actions/formulas"
import { obtenerUnidadesMedida } from "@/app/actions/catalogos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function EditarFormulaPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const formulaId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([])
  // Mostrar/Ocultar contenido
  const [isLoading, setIsLoading] = useState(true)
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    unidadmedidaid: "",
    costo: "",
  })

  // -- Funciones --
  const ejecutarActualizacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Variables necesarias para el proceso
    const formDataToSend = new FormData(e.currentTarget)
    const nombre = formDataToSend.get("nombre") as string
    const codigo = formDataToSend.get("codigo") as string

    // Validar variables obligatorias
    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "Completa los datos obligatorios, no se pueden quedar en blanco.",
      })
      setShowModalValidation(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      // Ejecutar funcion principal backend
      const result = await actualizarFormula(formDataToSend)

      setShowProcessing(false)

      if (result.success) {
        alert("Fórmula actualizada exitosamente")
        //router.push("/formulas")
      } else {
        setModalError({
          Titulo: "Error al actualizar fórmula",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      setModalError({
        Titulo: "Error inesperado al actualizar fórmula",
        Mensaje: error,
      })
      setShowModalError(true)
      console.error(error)
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
    // Iniciar
    const cargarDatosFormula = async () => {
      try {
        setShowPageLoading(true)
        const result = await obtenerFormulas(formulaId, "", "", "Todos", -1, -1)

        if (result.success && result.data && result.data.length > 0) {
          const formula = result.data[0]
          setFormData({
            codigo: formula.codigo || "",
            nombre: formula.nombre || "",
            unidadmedidaid: formula.unidadmedidaid?.toString() || "",
            costo: formula.costo?.toString() || "",
          })

          // Set existing image URL and preview
          if (formula.imgurl) {
            setExistingImageUrl(formula.imgurl)
            setImagePreview(formula.imgurl)
          }
        } else {
          setModalError({
            Titulo: "Error al cargar fórmula",
            Mensaje: "No se pudo encontrar la fórmula solicitada",
          })
          setShowModalError(true)
        }

        // Cargar unidades de medida
        const unidadesResult = await obtenerUnidadesMedida()
        if (unidadesResult.success && unidadesResult.data) {
          setUnidadesMedida(unidadesResult.data)
        }
      } catch (error) {
        console.error("Error cargando datos de la fórmula:", error)
        setModalError({
          Titulo: "Error al cargar fórmula",
          Mensaje: "Ocurrió un error al cargar los datos de la fórmula",
        })
        setShowModalError(true)
      } finally {
        setShowPageLoading(false)
      }
    }

    if (formulaId) {
      cargarDatosFormula()
    }
  }, [authLoading, user, router, esAdminDOs, formulaId])

  // Manejadores (Handles)
  // Manejador: Cambiar imagen
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

  // Manejador cambio de input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!esAdminDOs) {
    return (
      <div className="container mx-auto py-6">
        <p>
          No tiene permisos para utilizar esta herramienta, si necesita ayuda solicitela con el personal encargado del
          sitio.
        </p>
      </div>
    )
  }

  // Contenido principal
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

      {showModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      <PageTitlePlusNew
        Titulo="Actualización de fórmula"
        Subtitulo="Formulario para actualizar una fórmula"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmFormula" onSubmit={ejecutarActualizacion} className="space-y-4">
            <input type="hidden" name="id" value={formulaId} />

            {existingImageUrl && <input type="hidden" name="imgurl" value={existingImageUrl} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: All inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="txtCodigo">
                    <span className="text-red-500">*</span> Código
                  </Label>
                  <Input
                    id="txtCodigo"
                    name="codigo"
                    type="text"
                    placeholder="Ingrese el código de la fórmula"
                    value={formData.codigo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtNombre">
                    <span className="text-red-500">*</span> Nombre
                  </Label>
                  <Input
                    id="txtNombre"
                    name="nombre"
                    type="text"
                    placeholder="Ingrese el nombre de la fórmula"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
                  <Select
                    name="unidadmedidaid"
                    value={formData.unidadmedidaid}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, unidadmedidaid: value }))}
                  >
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
                  <Input
                    id="txtCosto"
                    name="costo"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costo}
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
                {isSubmitting ? "Guardando..." : "Guardar Fórmula"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/formulas")}>
                Regresar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
