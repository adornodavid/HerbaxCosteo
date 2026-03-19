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
import { Textarea } from "@/components/ui/textarea"
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
import { crearProducto } from "@/app/actions/productos"
import { obtenerClientes, obtenerCatalogos, obtenerZonas } from "@/app/actions/catalogos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CrearProductoPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])

  // --- Estados ---
  // Cargar contenido en variables
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [catalogos, setCatalogos] = useState<any[]>([])
  const [zonas, setZonas] = useState<any[]>([])
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
    const clienteid = formData.get("clienteid") as string

    if (!nombre || nombre.trim().length < 3 || !clienteid) {
      setModalValidation({
        Titulo: "Información necesaria incompleta.",
        Mensaje: "Favor de completar los campos obligatorios (Nombre, Cliente).",
      })
      setShowModalValidation(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await crearProducto(formData)
      setShowProcessing(false)

      if (result.success) {
        alert("Producto creado exitosamente")
        router.push(`/productos/${result.data}/editar`)
      } else {
        setModalError({
          Titulo: "Error al crear producto",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al crear producto")
      console.error(error)
      setModalAlert({
        Titulo: "Error inesperado",
        Mensaje: "Ocurrió un error al crear el producto. Por favor intente nuevamente.",
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

    // Cargar catálogos
    const cargarCatalogos = async () => {
      try {
        const [clientesResult, catalogosResult, zonasResult] = await Promise.all([
          obtenerClientes(),
          obtenerCatalogos(),
          obtenerZonas(),
        ])

        if (clientesResult.success && clientesResult.data) {
          setClientes(clientesResult.data)
        }
        if (catalogosResult.success && catalogosResult.data) {
          setCatalogos(catalogosResult.data)
        }
        if (zonasResult.success && zonasResult.data) {
          setZonas(zonasResult.data)
        }
      } catch (error) {
        console.error("Error cargando catálogos:", error)
      }
    }

    cargarCatalogos()
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
        Titulo="Creación de nuevo producto"
        Subtitulo="Formulario para registrar un nuevo producto"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmProducto" onSubmit={ejecutarRegistro} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="txtNombre">
                  <span className="text-red-500">*</span> Nombre
                </Label>
                <Input id="txtNombre" name="nombre" type="text" placeholder="Ingrese el nombre del producto" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ddlCliente">
                  <span className="text-red-500">*</span> Cliente
                </Label>
                <Select name="clienteid">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ddlCatalogo">Catálogo</Label>
                <Select name="catalogoid">
                  <SelectTrigger id="ddlCatalogo">
                    <SelectValue placeholder="Selecciona un catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogos.map((catalogo) => (
                      <SelectItem key={catalogo.id} value={catalogo.id.toString()}>
                        {catalogo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ddlZona">Zona</Label>
                <Select name="zonaid">
                  <SelectTrigger id="ddlZona">
                    <SelectValue placeholder="Selecciona una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((zona) => (
                      <SelectItem key={zona.id} value={zona.id.toString()}>
                        {zona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtDescripcion">Descripción</Label>
              <Textarea
                id="txtDescripcion"
                name="descripcion"
                placeholder="Ingrese la descripción del producto"
                rows={3}
              />
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
                {isSubmitting ? "Guardando..." : "Guardar Producto"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/productos")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
