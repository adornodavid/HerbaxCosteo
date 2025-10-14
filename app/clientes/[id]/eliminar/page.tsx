"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Eye, ArrowLeft } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
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
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Backend -- 
import { useAuth } from "@/contexts/auth-context"
import { obtenerClientes, eliminarCliente } from "@/app/actions/clientes" 

/* ==================================================
	Componente Principal (Pagina)
================================================== */

export default function EliminarClientePage() {
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
  const [loading, setLoading] = useState(true)
  const [confirmText, setConfirmText] = useState("")
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

  // -- Funciones -- 
  const ejecutarEliminar = async () => {
    if (confirmText.trim().toUpperCase() !== "ELIMINAR") {
      //alert("Debes escribir la palabra ELIMINAR para confirmar la eliminación")
      setModalValidation({
        Titulo: "No se pudo eliminar el cliente seleccionado",
        Mensaje: "Debes escribir la palabra ELIMINAR para confirmar la eliminación.",
      })
      setShowModalValidation(true)
      return
    }

    try {
      const result = await eliminarCliente(clienteId)

      if (result.success) {
        setModalValidation({
          Titulo: "Cliente eliminado exitosamente",
          Mensaje: "El cliente ha sido eliminado correctamente del sistema.",
        })
        setShowModalValidation(true)
      } else {
        if (result.error) {
          setModalAlert({
            Titulo: "Error durante ejecucion de eliminado",
            Mensaje: result.error,
          })
          setShowModalAlert(true)
        } else {
          setModalError({
            Titulo: "Error en el momento de ejecutar la eliminacion del cliente",
            Mensaje: "Ocurrió un error desconocido durante la eliminación",
          })
          setShowModalError(true)
        }
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error)
      setModalError({
        Titulo: "Error en el momento de ejecutar la eliminacion del cliente",
        Mensaje: "Error inesperado al eliminar el cliente: " + error,
      })
      setShowModalError(true)
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
    const cargarCliente = async () => {
      try {
        setShowPageLoading(true)
        const result = await obtenerClientes(clienteId, "", "", "", "", "", "Todos")

        if (result.success && result.data && result.data.length > 0) {
          setCliente(result.data[0])
        }
      } catch (error) {
        console.error("Error al cargar cliente:", error)
        setModalError({
            Titulo: "Error al cargar información",
            Mensaje: error,
          })
          setShowModalError(true)
      } finally {
        setShowPageLoading(false)
      }
    }

    if (clienteId) {
      cargarCliente()
    }
  }, [authLoading, user, router, esAdminDOs, clienteId])

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!cliente) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró el cliente.</p>
      </div>
    )
  }

  // Si no se cargo el elemento principal
  if (!esAdminDOs) {
    return (
      <div className="container mx-auto py-6">
        <p>No tiene permisos para utilizar esta herramienta, si necesita ayuda solicitela con el personal encargado del sitio.</p>
      </div>
    )
  }

  // Contenido principal
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* -- Componentes -- */}
      <PageModalValidation
        Titulo={ModalValidation.Titulo}
        Mensaje={ModalValidation.Mensaje}
        isOpen={showModalValidation}
        onClose={() => {
          setShowModalValidation(false)
          router.push("/clientes")
        }}
      />

      <PageModalAlert
        Titulo={ModalAlert.Titulo}
        Mensaje={ModalAlert.Mensaje}
        isOpen={showModalAlert}
        onClose={() => setShowModalAlert(false)}
      />

      <PageModalError
        Titulo={ModalError.Titulo}
        Mensaje={ModalError.Mensaje}
        isOpen={showModalError}
        onClose={() => setShowModalError(false)}
      />

      <PageTitlePlusNew
        Titulo="Eliminar cliente"
        Subtitulo="Eliminar la información completa del cliente"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="bg-red-600 text-white p-6 rounded-lg space-y-3">
        <h2 className="text-2xl font-bold">¿Deseas eliminar este cliente?</h2>
        <p className="text-lg">
          <span className="font-semibold">Instrucciones:</span> coloca la palabra ELIMINAR en el siguiente input y dale
          clic en el botón Confirmar
        </p>
        <div className="flex gap-4 items-center">
          <Input
            type="text"
            placeholder="Escribe ELIMINAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="flex-1 bg-white text-black"
          />
          <Button onClick={ejecutarEliminar} className="bg-white text-red-600 hover:bg-gray-100 font-semibold">
            Confirmar
          </Button>
        </div>
      </div>

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
          className="bg-sky-400 hover:bg-sky-500 text-white"
          onClick={() => router.push(`/clientes/${clienteId}/ver`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver
        </Button>

        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar a listado
        </Button>
      </div>
    </div>
  )
}
