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
import type { Cliente } from "@/types/clientes"
import type { Formula } from "@/types/formulas"
import type {
  propsPageLoadingScreen,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
  propsPageModalValidation, // Declare the variable here
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
import { obtenerProductos, actualizarProducto } from "@/app/actions/productos"
import { obtenerClientes } from "@/app/actions/clientes"
import { obtenerFormulas } from "@/app/actions/formulas"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function EditarProductoPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const productoId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [activeTab, setActiveTab] = useState<"informacion" | "caracteristicas" | "elaboracion">("informacion")
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
    nombre: "",
    codigo: "",
    clienteid: "",
    formulaid: "",
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
      const result = await actualizarProducto(formDataToSend)

      setShowProcessing(false)

      if (result.success) {
        alert("Producto actualizado exitosamente")
        //router.push("/productos")
      } else {
        setModalError({
          Titulo: "Error al actualizar producto",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      setModalError({
        Titulo: "Error inesperado al actualizar producto",
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
    const cargarDatosProducto = async () => {
      try {
        setShowPageLoading(true)

        // Cargar clientes
        const clientesResult = await obtenerClientes(-1, "", "", "", "", "", "True")
        if (clientesResult.success && clientesResult.data) {
          setClientes(clientesResult.data)
        }

        // Cargar formulas
        const formulasResult = await obtenerFormulas(-1, "", "", "True", -1, -1)
        if (formulasResult.success && formulasResult.data) {
          setFormulas(formulasResult.data)
        }

        // Cargar producto
        const result = await obtenerProductos(productoId, -1, -1, "", "", "Todos")

        if (result.success && result.data && result.data.length > 0) {
          const producto = result.data[0]
          setFormData({
            nombre: producto.ProductoNombre || "",
            codigo: producto.ProductoCodigo || "",
            clienteid: producto.ClienteId?.toString() || "",
            formulaid: producto.FormulaId?.toString() || "",
          })

          // Set existing image URL and preview
          if (producto.ProductoImgUrl) {
            setExistingImageUrl(producto.ProductoImgUrl)
            setImagePreview(producto.ProductoImgUrl)
          }
        } else {
          setModalError({
            Titulo: "Error al cargar producto",
            Mensaje: "No se pudo encontrar el producto solicitado",
          })
          setShowModalError(true)
        }
      } catch (error) {
        console.error("Error cargando datos del producto:", error)
        setModalError({
          Titulo: "Error al cargar producto",
          Mensaje: "Ocurrió un error al cargar los datos del producto",
        })
        setShowModalError(true)
      } finally {
        setShowPageLoading(false)
      }
    }

    if (productoId) {
      cargarDatosProducto()
    }
  }, [authLoading, user, router, esAdminDOs, productoId])

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

  // Manejador cambio de select
  const handleSelectChange = (name: string, value: string) => {
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
        Titulo="Actualización de producto"
        Subtitulo="Formulario para actualizar un producto"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("informacion")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "informacion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Información
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("caracteristicas")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "caracteristicas"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Características
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("elaboracion")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "elaboracion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Elaboración
        </button>
      </div>

      {activeTab === "informacion" && (
        <Card>
          <CardContent className="pt-6">
            <form id="formInformacion" onSubmit={ejecutarActualizacion} className="space-y-4">
              <input type="hidden" name="id" value={productoId} />

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
                      placeholder="Ingrese el nombre del producto"
                      value={formData.nombre}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtCodigo">
                      <span className="text-red-500">*</span> Código
                    </Label>
                    <Input
                      id="txtCodigo"
                      name="codigo"
                      type="text"
                      placeholder="Ingrese el código del producto"
                      value={formData.codigo}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlCliente">
                      <span className="text-red-500">*</span> Cliente
                    </Label>
                    <Select
                      name="clienteid"
                      value={formData.clienteid}
                      onValueChange={(value) => handleSelectChange("clienteid", value)}
                    >
                      <SelectTrigger id="ddlCliente">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlFormula">
                      <span className="text-red-500">*</span> Fórmula
                    </Label>
                    <Select
                      name="formulaid"
                      value={formData.formulaid}
                      onValueChange={(value) => handleSelectChange("formulaid", value)}
                    >
                      <SelectTrigger id="ddlFormula">
                        <SelectValue placeholder="Selecciona una fórmula" />
                      </SelectTrigger>
                      <SelectContent>
                        {formulas.map((formula) => (
                          <SelectItem key={formula.id} value={formula.id.toString()}>
                            {formula.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  Actualizar
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/productos")}>
                  Regresar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "caracteristicas" && (
        <Card>
          <CardContent className="pt-6">
            <form id="formCaracteristicas" className="space-y-4">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Aquí se mostrará la información de características del producto desde la tabla
                  productoscaracteristicas
                </p>
                {/* Contenido de características se agregará más adelante */}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                  Actualizar
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/productos")}>
                  Regresar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "elaboracion" && (
        <Card>
          <CardContent className="pt-6">
            <form id="formElaboracion" className="space-y-4">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Aquí se mostrará el listado de relaciones del producto con las fórmulas y material de etiquetado
                </p>
                {/* Contenido de elaboración se agregará más adelante */}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                  Actualizar
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/productos")}>
                  Regresar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
