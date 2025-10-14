"use client"
/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Edit, ToggleLeft, ToggleRight, EyeOff, X, Eye } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Cliente } from "@/types/clientes"
import type { PageLoadingScreen, PageProcessing, PageTitlePlusNew, PageModalValidation, PageModalAlert, PageModalError, PageModalTutorial } from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdmin, RolesAdminDDLs, RolesAdminDOs, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth" // Import useAuth hook
import { obtenerClientes } from "@/services/clientes" // Import obtenerClientes function
import { estatusActivoCliente } from "@/services/clientes" // Import estatusActivoCliente function

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function ClientesPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdmin = useMemo(() => user && RolesAdmin.includes(user.RolId), [user])
  const esAdminDDLs = useMemo(() => user && RolesAdminDDLs.includes(user.RolId), [user])
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  // Paginación
  const resultadosPorPagina = 20

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<PageLoadingScreen>()
  const [Listado, setListado] = useState<Cliente[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<PageModalAlert>()
  const [ModalError, setModalError] = useState<PageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<PageModalTutorial>()
  const [ListadoSinResultados, setListadoSinResultados] = useState(false)
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [showDetallesModal, setShowDetallesModal] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  // Cargar contenido en elementos
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })
  const [filtroId, setFiltroId] = useState("")
  const [filtroClave, setFiltroClave] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --
  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (id: number, nombre: string, clave: string, estatus: string) => {
    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    // Formatear variables a mandar como parametros
    const auxId = id != -1 ? id : -1
    const auxEstatus =
      estatus === "-1"
        ? "Todos"
        : arrActivoTrue.includes(estatus)
          ? true
          : arrActivoFalse.includes(estatus)
            ? false
            : "Todos"

    // Ejecutar Consulta principal
    try {
      const result = await obtenerClientes(auxId, nombre, clave, "", "", "", auxEstatus)
      if (result.success && result.data) {
        console.log(result.success, " - data: ", result.data)
        const transformedData: Cliente[] = result.data.map((c: Cliente) => ({
          id: c.id,
          nombre: c.nombre,
          clave: c.clave,
          direccion: c.direccion,
          telefono: c.telefono,
          email: c.email,
          imgurl: c.imgurl,
          fechacreacion: c.fechacreacion,
          activo: c.activo,
        }))

        const Listado: Cliente[] = transformedData.map((c: Cliente) => ({
          ClienteId: c.id,
          ClienteNombre: c.nombre || "Sin nombre",
          ClienteClave: c.clave || "Sin clave",
          ClienteDireccion: c.direccion || "Sin dirección",
          ClienteTelefono: c.telefono || "Sin telefono",
          ClienteEmail: c.email || "Sin email",
          ClienteImgUrl: c.imgurl || "Sin imagen",
          ClienteFechaCreacion: c.fechacreacion,
          ClienteActivo: c.activo === true,
        }))

        setListado(Listado)
        setTotalListado(Listado.length)
        setListadoSinResultados(Listado.length === 0)

        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        console.log("No hay datos o la consulta falló.")
        return { success: false, mensaje: "No hay datos o la consulta falló." }
      }
    } catch (error) {
      console.log("Error inesperado al buscar clientes: ", error)
      setListado([])
      setListadoSinResultados(true)
      return { error: true, mensaje: "Error inesperado al buscar clientes: " + error }
    } finally {
      setIsSearching(false)
    }
  }

  // Inicio (carga inicial y seguridad)
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      const auxClienteId = esAdminDDLs === true ? -1 : user.ClienteId

      setPageTituloMasNuevo({
        Titulo: "Clientes",
        Subtitulo: "Gestión completa de Clientes",
        Visible: esAdminDOs == true ? true : false,
        BotonTexto: "Crear Nuevo Cliente",
        Ruta: "/clientes/crear",
      })
      setShowPageTituloMasNuevo(true)

      const Result = await ejecutarBusqueda(auxClienteId, "", "", "True")
      if (!Result.success) {
        
        setModalAlert({
          Titulo: "En ejecucion de Busqueda de carga inicial",
          Mensaje: Result.mensaje,
        })
        setShowModalAlert(true)
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales: ", error)
      console.log("Error al cargar datos iniciales: ", error)

      setModalError({
        Titulo: "Error al cargar datos iniciales",
        Mensaje: error,
      })
      setShowModalError(true)
    } finally {
      setShowPageLoading(false)
    }
  }

  // Estatus - Cambiar activo/inactivo
  const handleToggleStatusClickActivo = async (clienteId: number, clienteActivo: boolean) => {
    try {
      // Toggle the status (if active, make inactive; if inactive, make active)
      const nuevoEstatus = !clienteActivo

      // Call the estatusActivoCliente function
      const resultado = await estatusActivoCliente(clienteId, nuevoEstatus)

      if (resultado) {
        // Success - refresh the list
        await cargarDatosIniciales()
      } else {
        // Error
        setModalError({
          Titulo: "Error al cambiar estatus",
          Mensaje: "No se pudo cambiar el estatus del cliente. Por favor, intente nuevamente.",
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error en handleToggleStatusClickActivo:", error)
      setModalError({
        Titulo: "Error al cambiar estatus",
        Mensaje: `Error inesperado: ${error}`,
      })
      setShowModalError(true)
    }
  }

  const handleVerDetalles = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setShowDetallesModal(true)
  }

  // -- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    // Prevenir cambio de pagina
    e.preventDefault()

    // Variables auxiliares y formateadas para mandar como parametros
    const Id = filtroId === "" || filtroId === "0" ? -1 : Number.parseInt(filtroId, 10)
    const Nombre: string = filtroNombre.trim()
    const Clave: string = filtroClave.trim()
    const Estatus = filtroEstatus === "-1" ? "Todos" : filtroEstatus

    ejecutarBusqueda(Id, Nombre, Clave, Estatus)
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroClave("")
    setFiltroNombre("")
    setFiltroEstatus("-1")

    cargarDatosIniciales()
  }

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    if (!authLoading) {
      // Validar
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      // Iniciar
      const inicializar = async () => {
        setPageLoading({ message: "Cargando Clientes..." })
        setShowPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin, esAdminDDLs, esAdminDOs])

  // --- Renders (contenidos auxiliares) ---
  // Loading
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando Clientes..." />
  }

  // --- Contenido ---
  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
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

      {/* 1. Título y Botón */}
      {showPageTituloMasNuevo && (
        <PageTitlePlusNew
          Titulo={PageTituloMasNuevo.Titulo}
          Subtitulo={PageTituloMasNuevo.Subtitulo}
          Visible={PageTituloMasNuevo.Visible}
          BotonTexto={PageTituloMasNuevo.BotonTexto}
          Ruta={PageTituloMasNuevo.Ruta}
        />
      )}

      {/* 2. Filtros de Búsqueda */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleBuscar}>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="txtClienteId"
                name="txtClienteId"
                type="number"
                min="0"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtClienteNombre"
                name="txtClienteNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteClave" className="text-sm font-medium">
                Clave
              </label>
              <Input
                id="txtClienteClave"
                name="txtClienteClave"
                type="text"
                placeholder="Buscar por clave..."
                maxLength={50}
                value={filtroClave}
                onChange={(e) => setFiltroClave(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="ddlEstatus" className="text-sm font-medium">
                Estatus
              </label>
              <Select name="ddlEstatus" value={filtroEstatus} onValueChange={setFiltroEstatus}>
                <SelectTrigger id="ddlEstatus">
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Todos</SelectItem>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 col-span-full md:col-span-2 lg:col-span-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={handleLimpiar}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
              >
                <Search className="mr-2 h-3 w-3" /> Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDetallesModal} onOpenChange={setShowDetallesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {clienteSeleccionado && (
            <Card className="overflow-hidden border-0 shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Image on the left - centered vertically */}
                  <div className="md:w-1/3 h-64 md:h-auto flex items-center justify-center bg-gray-300">
                    <img
                      src={
                        clienteSeleccionado.ClienteImgUrl && clienteSeleccionado.ClienteImgUrl !== "Sin imagen"
                          ? clienteSeleccionado.ClienteImgUrl
                          : "/placeholder.svg?height=400&width=400&text=Cliente"
                      }
                      alt={clienteSeleccionado.ClienteNombre}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Client data on the right */}
                  <div className="md:w-2/3 p-6 space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Información del Cliente</h2>

                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-700">ID:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteId}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Nombre:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteNombre}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Clave:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteClave}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Dirección:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteDireccion}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Teléfono:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteTelefono}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900">{clienteSeleccionado.ClienteEmail}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Estatus:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                            clienteSeleccionado.ClienteActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {clienteSeleccionado.ClienteActivo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                        <span className="ml-2 text-gray-900">
                          {clienteSeleccionado.ClienteFechaCreacion
                            ? new Date(clienteSeleccionado.ClienteFechaCreacion).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Resultados - Listado */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Mostrando {Listado?.length || 0} elementos encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="ml-2">Buscando resultados.....</span>
            </div>
          )}

          {!isSearching && Listado.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <span>No se encontraron resultados con los parametros indicados, favor de verificar.</span>
            </div>
          )}

          {!isSearching && Listado.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {Listado.map((elemento) => (
                <Card
                  key={elemento.ClienteId}
                  className="border bg-card text-card-foreground relative flex flex-col overflow-hidden rounded-xs shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Image at top */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={
                        elemento.ClienteImgUrl && elemento.ClienteImgUrl !== "Sin imagen"
                          ? elemento.ClienteImgUrl
                          : "/placeholder.svg?height=200&width=200&text=Cliente"
                      }
                      alt={elemento.ClienteNombre}
                      className="w-full h-full object-cover rounded-t-xs"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                          elemento.ClienteActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {elemento.ClienteActivo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  {/* Card content */}
                  <CardContent className="flex flex-col flex-grow p-4">
                    {/* Name in bold */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{elemento.ClienteNombre}</h3>

                    {/* Clave in normal text */}
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Clave:</span> {elemento.ClienteClave}
                    </p>

                    {/* Direccion */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      <span className="font-medium">Direccion:</span> {elemento.ClienteDireccion}
                    </p>

                    {/* Divider line */}
                    <div className="border-t border-gray-200 my-3"></div>

                    {/* Action buttons at bottom */}
                    <div className="flex gap-3 justify-center mt-auto">
                      {/* Detalles - Opens modal */}
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Detalles"
                          onClick={() => handleVerDetalles(elemento)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground mt-1">Detalles</span>
                      </div>

                      {/* Ver - Navigates to ver page */}
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Cliente"
                          onClick={() => router.push(`/clientes/${elemento.ClienteId}/ver`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground mt-1">Ver</span>
                      </div>

                      {esAdminDOs && (
                        <>
                          {/* Editar */}
                          <div className="flex flex-col items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => router.push(`/clientes/${elemento.ClienteId}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground mt-1">Editar</span>
                          </div>

                          {/* Estatus */}
                          <div className="flex flex-col items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={elemento.ClienteActivo ? "Inactivar" : "Activar"}
                              onClick={() => handleToggleStatusClickActivo(elemento.ClienteId, elemento.ClienteActivo)}
                            >
                              {elemento.ClienteActivo ? (
                                <ToggleRight className="h-4 w-4 text-red-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground mt-1">Estatus</span>
                          </div>

                          {/* Eliminar */}
                          <div className="flex flex-col items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar"
                              onClick={() => router.push(`/clientes/${elemento.ClienteId}/eliminar`)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                            <span className="text-xs text-muted-foreground mt-1">Eliminar</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
