"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Eye, Edit, ToggleLeft, ToggleRight, EyeOff, Trash2 } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Formula } from "@/types/formulas"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdmin, RolesAdminDDLs, RolesAdminDOs, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Dialog components for details modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerFormulas, estatusActivoFormula } from "@/app/actions/formulas"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function FormulasPage() {
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
  const [Listado, setListado] = useState<Formula[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [elementoDetalles, setElementoDetalles] = useState<Formula | null>(null)
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [showElementoDetallesModal, setShowElementoDetallesModal] = useState(false)
  // Cargar componentes
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })
  // Cargar inputs
  const [filtroId, setFiltroId] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --
  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (id: number, nombre: string, codigo: string, estatus: string) => {
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
          ? "True"
          : arrActivoFalse.includes(estatus)
            ? "False"
            : "Todos"

    // Ejecutar Consulta principal
    try {
      console.log("auxId: " + auxId + " codigo: " + codigo + " nombre: " + nombre + " auxEstatus: " + auxEstatus)
      const result = await obtenerFormulas(auxId, codigo, nombre, auxEstatus, -1, -1)
      console.log("Success: " + result.success + " Data: " + result.data)
      if (result.success && result.data) {
        const transformedData: Formula[] = result.data.map((x: Formula) => ({
          id: x.id,
          codigo: x.codigo,
          nombre: x.nombre,
          imgurl: x.imgurl,
          unidadmedidaid: x.unidadmedidaid,
          costo: x.costo,
          fechacreacion: x.fechacreacion,
          activo: x.activo,
        }))

        const Listado: Formula[] = transformedData.map((x: Formula) => ({
          FormulaId: x.id,
          FormulaCodigo: x.codigo || "Sin código",
          FormulaNombre: x.nombre || "Sin nombre",
          FormulaImgUrl: x.imgurl || "Sin imagen",
          FormulaUnidadMedidaId: x.unidadmedidaid || 0,
          FormulaCosto: x.costo || 0,
          FormulaFechaCreacion: x.fechacreacion,
          FormulaActivo: x.activo === true,
        }))

        setListado(Listado)
        setTotalListado(Listado.length)

        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        console.log("No hay datos o la consulta falló.")
        return { success: false, mensaje: "No hay datos o la consulta falló." + result.error }
      }

      if (!result.success) {
        console.error("Error en búsqueda del filtro de búsqueda: " + result.error)
        console.log("Error en búsqueda del filtro de búsqueda: " + result.error)
        setListado([])
        return { success: false, mensaje: "Error en búsqueda del filtro de búsqueda: " + result.error }
      }
    } catch (error) {
      console.log("Error inesperado al buscar elementos: " + error)
      setListado([])
      return { error: true, mensaje: "Error inesperado al buscar elementos: " + error }
    } finally {
      setIsSearching(false)
    }
  }

  // Inicio (carga inicial y seguridad)
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      setPageTituloMasNuevo({
        Titulo: "Fórmulas",
        Subtitulo: "Gestión completa de Fórmulas",
        Visible: esAdminDOs == true ? true : false,
        BotonTexto: "Crear Nueva Fórmula",
        Ruta: "/formulas/crear",
      })
      setShowPageTituloMasNuevo(true)

      const Result = await ejecutarBusqueda(-1, "", "", "True")
      if (!Result.success) {
        setModalAlert({
          Titulo: "En ejecucion de Busqueda de carga inicial",
          Mensaje: Result.mensaje,
        })
        setShowModalAlert(true)
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
      console.log("Error al cargar datos iniciales:", error)

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
  const handleToggleStatusClickActivo = async (Id: number, formulaActivo: boolean) => {
    try {
      // Toggle the status (if active, make inactive; if inactive, make active)
      const nuevoEstatus = !formulaActivo

      // Ejecutar función
      const resultado = await estatusActivoFormula(Id, nuevoEstatus)
      if (resultado) {
        await cargarDatosIniciales()
      } else {
        // Mostrar error
        setModalError({
          Titulo: "Error al cambiar estatus",
          Mensaje: "No se pudo cambiar el estatus del elemento seleccionado. Por favor, intente nuevamente.",
        })
        setShowModalError(true)
      }
    } catch (error) {
      // Mostrar error
      console.error("Error en handleToggleStatusClickActivo:", error)
      setModalError({
        Titulo: "Error al cambiar estatus",
        Mensaje: `Error inesperado: ${error}`,
      })
      setShowModalError(true)
    }
  }

  const handleVerDetalles = (formula: Formula) => {
    setElementoDetalles(formula)
    setShowElementoDetallesModal(true)
  }

  // -- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    // Prevenir cambio de pagina
    e.preventDefault()

    // Variables auxiliares y formateadas para mandar como parametros
    const Id = filtroId === "" || filtroId === "0" ? -1 : Number.parseInt(filtroId, 10)
    const Nombre: string = filtroNombre.trim()
    const Codigo: string = filtroCodigo.trim()
    const Estatus = filtroEstatus === "-1" ? "Todos" : filtroEstatus

    ejecutarBusqueda(Id, Nombre, Codigo, Estatus)
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroNombre("")
    setFiltroCodigo("")
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
        setPageLoading({ message: "Cargando Fórmulas..." })
        setShowPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin, esAdminDDLs, esAdminDOs])

  // --- Renders (contenidos auxiliares) ---
  // Loading
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando Fórmulas..." />
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
              <label htmlFor="txtFormulaId" className="text-sm font-medium">
                Id
              </label>
              <Input
                id="txtFormulaId"
                name="txtFormulaId"
                type="text"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtFormulaNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtFormulaNombre"
                name="txtFormulaNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtFormulaCodigo" className="text-sm font-medium">
                Código
              </label>
              <Input
                id="txtFormulaCodigo"
                name="txtFormulaCodigo"
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

      {/* Dialog modal for formula details */}
      <Dialog open={showElementoDetallesModal} onOpenChange={setShowElementoDetallesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Fórmula</DialogTitle>
          </DialogHeader>
          {elementoDetalles && (
            <Card className="overflow-hidden border-0 shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Image on the left - centered vertically */}
                  <div className="md:w-1/3 h-64 md:h-auto flex items-center justify-center bg-gray-300">
                    <img
                      src={
                        elementoDetalles.FormulaImgUrl && elementoDetalles.FormulaImgUrl !== "Sin imagen"
                          ? elementoDetalles.FormulaImgUrl
                          : "/placeholder.svg?height=400&width=400&text=Formula"
                      }
                      alt={elementoDetalles.FormulaNombre}
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Formula data on the right */}
                  <div className="md:w-2/3 p-6 space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Información de la Fórmula</h2>

                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-700">ID:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.FormulaId}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Código:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.FormulaCodigo}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Nombre:</span>
                        <span className="ml-2 text-gray-900">{elementoDetalles.FormulaNombre}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Costo:</span>
                        <span className="ml-2 text-gray-900">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                            elementoDetalles.FormulaCosto,
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Estatus:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                            elementoDetalles.FormulaActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {elementoDetalles.FormulaActivo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                        <span className="ml-2 text-gray-900">
                          {elementoDetalles.FormulaFechaCreacion
                            ? new Date(elementoDetalles.FormulaFechaCreacion).toLocaleDateString()
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Costo</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isSearching && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>Buscando resultados.....</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching && Listado.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span>No se encontraron resultados con los parametros indicados, favor de verificar.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching &&
                  Listado?.map((elemento) => (
                    <tr key={elemento.FormulaId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{elemento.FormulaId}</td>
                      <td className="py-3 px-4">{elemento.FormulaCodigo}</td>
                      <td className="py-3 px-4">{elemento.FormulaNombre}</td>
                      <td className="py-3 px-4">
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                          elemento.FormulaCosto,
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                            elemento.FormulaActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {elemento.FormulaActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Detalles"
                            onClick={() => handleVerDetalles(elemento)}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver"
                            onClick={() => router.push(`/formulas/${elemento.FormulaId}/ver`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {esAdminDOs && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar"
                                onClick={() => router.push(`/formulas/${elemento.FormulaId}/editar`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={elemento.FormulaActivo ? "Inactivar" : "Activar"}
                                onClick={() =>
                                  handleToggleStatusClickActivo(elemento.FormulaId, elemento.FormulaActivo)
                                }
                              >
                                {elemento.FormulaActivo ? (
                                  <ToggleRight className="h-4 w-4 text-red-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Eliminar"
                                onClick={() => router.push(`/formulas/${elemento.FormulaId}/eliminar`)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
