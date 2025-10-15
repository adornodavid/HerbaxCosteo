"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type { Producto } from "@/types/productos"
import type {
  propsPageLoadingScreen,
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
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerProductos } from "@/app/actions/productos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function VerProductoPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const productoId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [activeTab, setActiveTab] = useState<"informacion" | "caracteristicas" | "formulas" | "materialetiquetado">(
    "informacion",
  )
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    if (!authLoading) {
      // Validar
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      // Iniciar
      const cargarProducto = async () => {
        try {
          setShowPageLoading(true)

          const result = await obtenerProductos(productoId, -1, -1, "", "", "Todos")
          if (result.success && result.data && result.data.length > 0) {
            setProducto(result.data[0])
          }
        } catch (error) {
          console.error("Error al cargar información: ", error)
          setModalError({
            Titulo: "Error al cargar información",
            Mensaje: error,
          })
          setShowModalError(true)
        } finally {
          setShowPageLoading(false)
        }
      }
      // Si se obtuvo el id
      if (productoId) {
        cargarProducto()
      }
    }
  }, [authLoading, user, router, esAdminDOs, productoId])

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!producto) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró el producto.</p>
      </div>
    )
  }

  // Contenido principal
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* -- Componentes -- */}
      {showModalAlert && (
        <PageModalAlert
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

      {showModalTutorial && (
        <PageModalTutorial
          Titulo={ModalTutorial.Titulo}
          Subtitulo={ModalTutorial.Subtitulo}
          VideoUrl={ModalTutorial.VideoUrl}
          isOpen={true}
          onClose={() => setShowModalTutorial(false)}
        />
      )}

      <PageTitlePlusNew
        Titulo="Información de producto"
        Subtitulo="Información completa del producto"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("informacion")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "informacion"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Información
        </button>
        <button
          onClick={() => setActiveTab("caracteristicas")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "caracteristicas"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Características
        </button>
        <button
          onClick={() => setActiveTab("formulas")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "formulas" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Fórmulas
        </button>
        <button
          onClick={() => setActiveTab("materialetiquetado")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "materialetiquetado"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Material de etiquetado
        </button>
      </div>

      {activeTab === "informacion" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-64 md:h-auto flex items-center justify-center bg-gray-100">
                <img
                  src={
                    producto.ProductoImgUrl && producto.ProductoImgUrl !== "Sin imagen"
                      ? producto.ProductoImgUrl
                      : "/placeholder.svg?height=400&width=400&text=Producto"
                  }
                  alt={producto.ProductoNombre}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Product data on the right */}
              <div className="md:w-2/3 p-6 space-y-4">
                <h1 className="text-3xl font-bold mb-6">Información del Producto</h1>

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">ID:</span>
                    <span className="ml-2 text-gray-900">{producto.ProductoId}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{producto.ProductoNombre || "Sin nombre"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Código:</span>
                    <span className="ml-2 text-gray-900">{producto.ProductoCodigo || "Sin código"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Cliente:</span>
                    <span className="ml-2 text-gray-900">{producto.ClienteNombre || "Sin cliente"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Fórmula:</span>
                    <span className="ml-2 text-gray-900">{producto.FormulaNombre || "Sin fórmula"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Estatus:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                        producto.ProductoActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {producto.ProductoActivo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                    <span className="ml-2 text-gray-900">
                      {producto.ProductoFechaCreacion
                        ? new Date(producto.ProductoFechaCreacion).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "caracteristicas" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Características del Producto</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                Aquí se mostrarán las características del producto de acuerdo a la tabla productoscaracteristicas.
              </p>
              {/* TODO: Agregar lógica para cargar y mostrar características desde productoscaracteristicas */}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "formulas" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Fórmulas Asignadas</h2>
            <div className="space-y-2">
              <p className="text-gray-600">Aquí se mostrará el listado de fórmulas asignadas a este producto.</p>
              {/* TODO: Agregar lógica para cargar y mostrar fórmulas asignadas */}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "materialetiquetado" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Material de Etiquetado</h2>
            <div className="space-y-2">
              <p className="text-gray-600">Aquí se mostrará el listado de material de etiquetado para este producto.</p>
              {/* TODO: Agregar lógica para cargar y mostrar material de etiquetado */}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        {esAdminDOs && (
          <>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              onClick={() => router.push(`/productos/${productoId}/editar`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Actualizar
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => router.push(`/productos/${productoId}/eliminar`)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </>
        )}

        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar a listado
        </Button>
      </div>
    </div>
  )
}
