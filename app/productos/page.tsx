"use client"
/* ==================================================
	Imports
================================================== */
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Producto } from "@/types/productos"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdmin, RolesAdminDDLs, RolesAdminDOs } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// -- Frontend --

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { estatusActivoProducto } from "@/app/actions/productos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function ProductosPage() {
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
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [Listado, setListado] = useState<Producto[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [ListadoSinResultados, setListadoSinResultados] = useState(false)
  const [elementoDetalles, setElementoDetalles] = useState<Producto | null>(null)
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [showElementoDetallesModal, setShowElementoDetallesModal] = useState(false)
  // Cargar contenido en elementos
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })
  const [filtroId, setFiltroId] = useState("")
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --
  const ejecutarBusquedaProductos = async (id: number, nombre: string, codigo: string, estatus: string) => {
    // User's existing function - DO NOT MODIFY
    // This function will be preserved from the original file
  }

  const cargarDatosIniciales = async () => {
    // User's existing function - DO NOT MODIFY
    // This function will be preserved from the original file
  }

  // Estatus - Cambiar activo/inactivo
  const handleToggleStatusClickActivo = async (productoId: number, productoActivo: boolean) => {
    try {
      const nuevoEstatus = !productoActivo
      const resultado = await estatusActivoProducto(productoId, nuevoEstatus)

      if (resultado) {
        await cargarDatosIniciales()
      } else {
        setModalError({
          Titulo: "Error al cambiar estatus",
          Mensaje: "No se pudo cambiar el estatus del producto. Por favor, intente nuevamente.",
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

  const handleVerDetalles = (producto: Producto) => {
    setElementoDetalles(producto)
    setShowElementoDetallesModal(true)
  }

  // -- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const Id = filtroId === "" || filtroId === "0" ? -1 : Number.parseInt(filtroId, 10)
    const Nombre: string = filtroNombre.trim()
    const Codigo: string = filtroCodigo.trim()
    const Estatus = filtroEstatus === "-1" ? "Todos" : filtroEstatus

    ejecutarBusquedaProductos(Id, Nombre, Codigo, Estatus)
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroCodigo("")
    setFiltroNombre("")
    setFiltroEstatus("-1")

    cargarDatosIniciales()
  }

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    // User's existing useEffect - DO NOT MODIFY
    // This useEffect will be preserved from the original file
  }, [authLoading, user, router, esAdmin, esAdminDDLs, esAdminDOs])

  // --- Renders (contenidos auxiliares) ---
  // Loading
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando Productos..." />
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
              <label htmlFor="txtProductoId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="txtProductoId"
                name="txtProductoId"
                type="number"
                min="0"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtProductoNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtProductoNombre"
                name="txtProductoNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtProductoCodigo" className="text-sm font-medium">
                Código
              </label>
              <Input
                id="txtProductoCodigo"
                name="txtProductoCodigo"
                type="text"
                placeholder="Buscar por código..."
                maxLength={50}
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
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

      <Dialog open={showElementoDetallesModal} onOpenChange={setShowElementoDetallesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
          </DialogHeader>
          {elementoDetalles && (
            <Card className="overflow-hidden border-0 shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-64 md:h-auto flex items-center justify-center bg-gray-300">
                    <img
                      src={
                        elementoDetalles.ProductoImgUrl && elementoDetalles.ProductoImgUrl !== "Sin imagen"
                          ? elementoDetalles.ProductoImgUrl
                          : "/placeholder.svg?height=400&width=400&text=Producto"
                      }
                      alt={elementoDetalles.ProductoNombre}
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  <div className="md:w-2/3 p-6 space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Información del Producto</h2>

                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-700">ID:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.ProductoId}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Nombre:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.ProductoNombre}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Código:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.ProductoCodigo}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Estatus:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                            elementoDetalles.ProductoActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {elementoDetalles.ProductoActivo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                        <span className="ml-2 text-gray-900">
                          {elementoDetalles.ProductoFechaCreacion
                            ? new Date(elementoDetalles.ProductoFechaCreacion).toLocaleDateString()
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
        <CardContent>{/* User's existing card grid display will be preserved here */}</CardContent>
      </Card>
    </div>
  )
}
