"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type { Cliente } from "@/types/clientes"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerClientes } from "@/app/actions/clientes"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function VerClientePage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const clienteId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
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
      const cargarCliente = async () => {
        try {
          setShowPageLoading(true)
          
          const result = await obtenerClientes(clienteId, "", "", "", "", "", "Todos")
          if (result.success && result.data && result.data.length > 0) {
            setCliente(result.data[0])
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
      if (clienteId) {
        cargarCliente()
      }
    }    
  }, [authLoading, user, router, esAdminDOs, clienteId])

  if (showPageLoading) {
    return <showPageLoading message="Cargando información del cliente..." />
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró el cliente.</p>
      </div>
    )
  }

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
        Titulo="Información de cliente"
        Subtitulo="Información completa del cliente"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      {/* Card with client information */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 h-64 md:h-auto flex items-center justify-center bg-gray-100">
              <img
                src={
                  cliente.imgurl && cliente.imgurl !== "Sin imagen"
                    ? cliente.imgurl
                    : "/placeholder.svg?height=400&width=400&text=Cliente"
                }
                alt={cliente.nombre}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Client data on the right */}
            <div className="md:w-2/3 p-6 space-y-4">
              <h1 className="text-3xl font-bold mb-6">Información del Cliente</h1>

              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span className="ml-2 text-gray-900">{cliente.id}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Nombre:</span>
                  <span className="ml-2 text-gray-900">{cliente.nombre || "Sin nombre"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Clave:</span>
                  <span className="ml-2 text-gray-900">{cliente.clave || "Sin clave"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Dirección:</span>
                  <span className="ml-2 text-gray-900">{cliente.direccion || "Sin dirección"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Teléfono:</span>
                  <span className="ml-2 text-gray-900">{cliente.telefono || "Sin teléfono"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{cliente.email || "Sin email"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Estatus:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                      cliente.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {cliente.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                  <span className="ml-2 text-gray-900">
                    {cliente.fechacreacion ? new Date(cliente.fechacreacion).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
          onClick={() => router.push(`/clientes/${clienteId}/editar`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Actualizar
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => router.push(`/clientes/${clienteId}/eliminar`)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>

        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar a listado
        </Button>
      </div>
    </div>
  )
}
