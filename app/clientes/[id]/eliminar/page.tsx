"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Eye, ArrowLeft } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type { Cliente } from "@/types/clientes"
// -- Librerias --
// -- Componentes --
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageModalValidation } from "@/components/page-modal-validation"
// -- Frontend --

// -- Backend --
import { obtenerClientes, eliminarCliente } from "@/app/actions/clientes"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function EliminarClientePage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const clienteId = Number(params.id)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmText, setConfirmText] = useState("")
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [modalValidationTitle, setModalValidationTitle] = useState("")
  const [modalValidationMessage, setModalValidationMessage] = useState("")

  useEffect(() => {
    const cargarCliente = async () => {
      try {
        const result = await obtenerClientes(clienteId, "", "", "", "", "", "Todos")

        if (result.success && result.data && result.data.length > 0) {
          setCliente(result.data[0])
        }
      } catch (error) {
        console.error("Error al cargar cliente:", error)
      } finally {
        setLoading(false)
      }
    }

    if (clienteId) {
      cargarCliente()
    }
  }, [clienteId])

  const ejecutarEliminar = async () => {
    if (confirmText.trim().toUpperCase() !== "ELIMINAR") {
      alert("Debes escribir la palabra ELIMINAR para confirmar la eliminación")
      return
    }

    try {
      const result = await eliminarCliente(clienteId)

      if (result.success) {
        setModalValidationTitle("Cliente eliminado exitosamente")
        setModalValidationMessage("El cliente ha sido eliminado correctamente del sistema.")
        setShowModalValidation(true)
      } else {
        if (result.error) {
          setModalValidationTitle("Error durante ejecucion de eliminado")
          setModalValidationMessage(result.error)
        } else {
          setModalValidationTitle("Error en el momento de ejecutar la eliminacion del cliente")
          setModalValidationMessage("Ocurrió un error desconocido durante la eliminación")
        }
        setShowModalValidation(true)
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error)
      setModalValidationTitle("Error en el momento de ejecutar la eliminacion del cliente")
      setModalValidationMessage("Error inesperado al eliminar el cliente")
      setShowModalValidation(true)
    }
  }

  if (loading) {
    return <PageLoadingScreen message="Cargando información del cliente..." />
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
      <PageModalValidation
        Titulo={modalValidationTitle}
        Mensaje={modalValidationMessage}
        isOpen={showModalValidation}
        onClose={() => {
          setShowModalValidation(false)
          if (modalValidationTitle === "Cliente eliminado exitosamente") {
            router.push("/clientes")
          }
        }}
      />

      <PageTitlePlusNew
        Titulo="Información de cliente"
        Subtitulo="Información completa del cliente"
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
