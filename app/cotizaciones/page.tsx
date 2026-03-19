"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  RotateCcw,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AppWindow,
  Plus,
  Copy,
  FilePlus,
} from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { ddlItem } from "@/types/common.types"
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
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Dialog components for details modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { supabase } from "@/lib/supabase-client"
import { obtenerCotizaciones } from "@/app/actions/cotizaciones"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CotizacionesPage() {
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
  const [Listado, setListado] = useState<any[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)

  // Estados para Modales de Creación/Derivación
  const [showTipoCotizacionModal, setShowTipoCotizacionModal] = useState(false)
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showDeriveModal, setShowDeriveModal] = useState(false)

  // Estados para modal Derivar Fórmula
  const [deriveClienteId, setDeriveClienteId] = useState("-1")
  const [deriveFormulaBuscar, setDeriveFormulaBuscar] = useState("")
  const [deriveFormulasResultados, setDeriveFormulasResultados] = useState<any[]>([])
  const [deriveShowFormulasDropdown, setDeriveShowFormulasDropdown] = useState(false)
  const [deriveFormulaSeleccionada, setDeriveFormulaSeleccionada] = useState<any>(null)
  const [deriveFormulaDetalles, setDeriveFormulaDetalles] = useState<{
    materiasPrimas: any[]
    formulas: any[]
  }>({
    materiasPrimas: [],
    formulas: [],
  })
  const deriveFormulaSearchRef = useRef<HTMLDivElement>(null)

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
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")
  const [clientes, setClientes] = useState<any[]>([])
  const [estatusOptions, setEstatusOptions] = useState<any[]>([{ value: "-1", text: "Todos" }])

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --

  const handleCrearCotizacionClick = () => {
    setShowTipoCotizacionModal(true)
  }

  const handleNuevoProducto = () => {
    setShowTipoCotizacionModal(false)
    setShowSelectionModal(true)
  }

  const handleReabastecimiento = () => {
    setShowTipoCotizacionModal(false)
    // Funcionalidad por definir
  }

  const handleCrearNueva = () => {
    setShowSelectionModal(false)
    router.push("/cotizaciones/crear")
  }

  const handleDerivar = () => {
    setShowSelectionModal(false)
    setShowDeriveModal(true)
  }

  // useEffect para buscar fórmulas según el cliente y el texto de búsqueda
  useEffect(() => {
    const buscarFormulas = async () => {
      if (deriveFormulaBuscar.trim().length >= 2 && deriveClienteId !== "-1") {
        const { listaDesplegableFormulasBuscar } = await import("@/app/actions/formulas")
        const resultados = await listaDesplegableFormulasBuscar(deriveFormulaBuscar, Number(deriveClienteId))
        if (resultados.success && resultados.data) {
          setDeriveFormulasResultados(resultados.data)
          setDeriveShowFormulasDropdown(true)
        } else {
          setDeriveFormulasResultados([])
        }
      } else {
        setDeriveFormulasResultados([])
        setDeriveShowFormulasDropdown(false)
      }
    }

    buscarFormulas()
  }, [deriveFormulaBuscar, deriveClienteId])

  // Función para seleccionar fórmula en modal Derivar
  const handleDeriveFormulaSelect = async (formulaId: string, formulaText: string) => {
    setDeriveFormulaBuscar(formulaText)
    setDeriveShowFormulasDropdown(false)

    // Obtener detalles generales
    const { obtenerFormulas } = await import("@/app/actions/formulas")
    const formulasResult = await obtenerFormulas(Number(formulaId), "", "", "True", -1, -1)

    if (formulasResult.success && formulasResult.data && formulasResult.data.length > 0) {
      const formula = formulasResult.data[0]
      setDeriveFormulaSeleccionada(formula)

      setDeriveFormulaDetalles({
        materiasPrimas: formula.materiasprimasxformula || [],
        formulas: formula.formulasxformula || [],
      })
    }
  }

  // useEffect para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deriveFormulaSearchRef.current && !deriveFormulaSearchRef.current.contains(event.target as Node)) {
        setDeriveShowFormulasDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleClienteChange = async (value: string) => {
    setFiltroCliente(value)
  }

  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (nombre: string, clienteid: number, estatus: string) => {
    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    // Formatear variables a mandar como parametros
    const auxEstatus = estatus === "-1" ? "Todos" : estatus

    // Ejecutar Consulta principal
    try {
      console.log("nombre: " + nombre + " clienteid: " + clienteid + " auxEstatus: " + auxEstatus)
      
      const result = await obtenerCotizaciones(nombre, clienteid, auxEstatus)
      
      console.log("Success: " + result.success + " Data: " + result.data)
      if (result.success && result.data) {
        setListado(result.data)
        setTotalListado(result.data.length)

        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        console.log("No hay datos o la consulta falló.")
        setListado([])
        setTotalListado(0)
        return { success: false, mensaje: "No hay datos o la consulta falló." }
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

    let auxClienteId = -1
    if (!esAdminDDLs) {
      auxClienteId = user.RolId
    }
    try {
      setPageTituloMasNuevo({
        Titulo: "Cotizaciones",
        Subtitulo: "Gestión completa de Cotizaciones",
        Visible: false,
        BotonTexto: "Crear Nueva Cotización",
        Ruta: "/cotizaciones/crear",
      })
      setShowPageTituloMasNuevo(true)

      // Cargar clientes
      const clientesResult = await listaDesplegableClientes(auxClienteId, "")
      if (clientesResult.data) {
        const clientesTransformados = clientesResult.data.map((c: any) => ({
          value: c.id.toString(),
          text: c.nombre,
        }))
        const clientesConTodos = [{ value: "-1", text: "Todos" }, ...clientesTransformados]
        setClientes(clientesConTodos)
      }

      // Cargar estatus de cotizaciones
      try {
        const { data, error } = await supabase
          .from("cotizaciones")
          .select("estatus")
          .order("estatus", { ascending: true })
        
        if (!error && data && data.length > 0) {
          const estatusUnicos = Array.from(new Set(data.map((item: any) => item.estatus))).map((status: any) => ({
            value: status,
            text: status,
          }))
          setEstatusOptions([{ value: "-1", text: "Todos" }, ...estatusUnicos])
        }
      } catch (error) {
        console.error("Error cargando estatus:", error)
        setEstatusOptions([{ value: "-1", text: "Todos" }])
      }

      const Result = await ejecutarBusqueda("", -1, "Todos")
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
  const handleToggleStatusClickActivo = async (Id: number, activo: boolean) => {
    try {
      // Toggle the status (if active, make inactive; if inactive, make active)
      const nuevoEstatus = !activo

      // TODO: Ejecutar función estatusActivoCotizacion cuando esté disponible
      // const resultado = await estatusActivoCotizacion(Id, nuevoEstatus)
      
      const resultado = false // Simular por ahora
      
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



  // -- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    // Prevenir cambio de pagina
    e.preventDefault()

    // Variables auxiliares y formateadas para mandar como parametros
    const Nombre: string = filtroNombre.trim()
    const ClienteId = Number.parseInt(filtroCliente, 10)
    const Estatus = filtroEstatus === "-1" ? "Todos" : filtroEstatus

    // Ejecutar búsqueda si hay algún filtro activo
    if (Nombre !== "" || ClienteId !== -1 || Estatus !== "Todos") {
      ejecutarBusqueda(Nombre, ClienteId, Estatus)
    } else {
      // Si no hay filtros, recargar la lista completa (o la vista por defecto)
      cargarDatosIniciales()
    }
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    setFiltroNombre("")
    setFiltroCliente("-1")
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
        setPageLoading({ message: "Cargando Cotizaciones..." })
        setShowPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin, esAdminDDLs, esAdminDOs])

  // --- Renders (contenidos auxiliares) ---
  // Loading
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando Cotizaciones..." />
  }

  // --- Contenido ---
  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* -- Componentes Modales -- */}
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

      {/* 1. Título y Botón (Personalizado) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">Gestión completa de Cotizaciones</p>
        </div>
        {esAdminDOs && (
          <Button onClick={handleCrearCotizacionClick} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva Cotización
          </Button>
        )}
      </div>

      {/* Modal de Tipo de Cotización (Nuevo Producto vs Reabastecimiento) */}
      <Dialog open={showTipoCotizacionModal} onOpenChange={setShowTipoCotizacionModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">¿Qué deseas cotizar?</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Tarjeta Nuevo Producto */}
            <div
              className="group relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
              onClick={handleNuevoProducto}
            >
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <AppWindow className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nuevo Producto</h3>
              <p className="text-sm text-gray-500 text-center">
                Cotice un producto nuevo que no se encuentra actualmente en el catálogo.
              </p>
            </div>

            {/* Tarjeta Reabastecimiento */}
            <div
              className="group relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer"
              onClick={handleReabastecimiento}
            >
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <RotateCcw className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reabastecimiento</h3>
              <p className="text-sm text-gray-500 text-center">
                Cotice productos existentes para reabastecimiento de inventario.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Selección (Crear vs Derivar) */}
      <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">Seleccione una opción</DialogTitle>
            <DialogDescription className="text-center">
              Elija cómo desea comenzar a crear su nueva cotización
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Tarjeta Crear Nueva */}
            <div
              className="group relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
              onClick={handleCrearNueva}
            >
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <FilePlus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nueva Formula</h3>
              <p className="text-sm text-gray-500 text-center">
                Cree una cotización nueva partiendo desde cero, definiendo todos sus componentes y características
                manualmente comenzando con la creacion de una nueva formula.
              </p>
            </div>

            {/* Tarjeta Derivar */}
            <div
              className="group relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
              onClick={handleDerivar}
            >
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Copy className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Derivar Formula</h3>
              <p className="text-sm text-gray-500 text-center">
                Use una formula existente como base para la creación, heredando sus materiales y estructura.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Derivar Fórmula */}
      <Dialog open={showDeriveModal} onOpenChange={setShowDeriveModal}>
        <DialogContent className="max-w-4xl max-h-[700px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Copy className="h-6 w-6 text-purple-600" />
              Derivar Fórmula
            </DialogTitle>
            <DialogDescription>
              Seleccione el cliente y la fórmula base para crear una nueva derivación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Inputs de Selección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cliente</label>
                <Select value={deriveClienteId} onValueChange={setDeriveClienteId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccione cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative" ref={deriveFormulaSearchRef}>
                <label className="text-sm font-medium text-gray-700">Fórmula Base</label>
                <Input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={deriveFormulaBuscar}
                  onChange={(e) => setDeriveFormulaBuscar(e.target.value)}
                  onFocus={() => deriveFormulasResultados.length > 0 && setDeriveShowFormulasDropdown(true)}
                  className="bg-white"
                  disabled={deriveClienteId === "-1"}
                />
                {deriveShowFormulasDropdown && deriveFormulasResultados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {deriveFormulasResultados.map((formula) => (
                      <button
                        key={formula.value}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => handleDeriveFormulaSelect(formula.value, formula.text)}
                      >
                        {formula.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Información de la Fórmula Seleccionada */}
            {deriveFormulaSeleccionada && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Info General */}
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                    <h3 className="font-semibold text-purple-900">Información General</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                      ID: {deriveFormulaSeleccionada.id}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500 text-xs">Código</span>
                      <span className="font-medium">{deriveFormulaSeleccionada.codigo}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-gray-500 text-xs">Nombre</span>
                      <span className="font-medium">{deriveFormulaSeleccionada.nombre}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Unidad Medida</span>
                      <span className="font-medium">
                        {deriveFormulaSeleccionada.unidadesmedida?.descripcion || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Costo Actual</span>
                      <span className="font-medium text-green-600">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        }).format(deriveFormulaSeleccionada.costo || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Fecha Creación</span>
                      <span className="font-medium">
                        {deriveFormulaSeleccionada.fechacreacion
                          ? new Date(deriveFormulaSeleccionada.fechacreacion).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Composición */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Composición de la Fórmula</h3>

                  {/* Materias Primas */}
                  {deriveFormulaDetalles.materiasPrimas.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Materias Primas
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-white">
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Código</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Nombre</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Cantidad</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Unidad Medida</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deriveFormulaDetalles.materiasPrimas.map((mp: any, idx: number) => (
                            <tr key={`mp-${idx}`} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 px-4">{mp.materiasprima?.codigo}</td>
                              <td className="py-2 px-4">{mp.materiasprima?.nombre}</td>
                              <td className="py-2 px-4 text-right">
                                {mp.cantidad}
                              </td>
                              <td className="py-2 px-4">
                                {mp.materiasprima?.unidadesmedida?.descripcion}
                              </td>
                              <td className="py-2 px-4 text-right">
                                ${(mp.costoparcial || 0).toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Fórmulas */}
                  {deriveFormulaDetalles.formulas.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fórmulas
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-white">
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Código</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Nombre</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Cantidad</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Unidad Medida</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deriveFormulaDetalles.formulas.map((f: any, idx: number) => (
                            <tr key={`f-${idx}`} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 px-4">{f.formulas?.codigo}</td>
                              <td className="py-2 px-4">{f.formulas?.nombre}</td>
                              <td className="py-2 px-4 text-right">
                                {f.cantidad}
                              </td>
                              <td className="py-2 px-4">
                                {f.formulas?.unidadesmedida?.descripcion}
                              </td>
                              <td className="py-2 px-4 text-right">
                                ${(f.costoparcial || 0).toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {deriveFormulaDetalles.materiasPrimas.length === 0 && deriveFormulaDetalles.formulas.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                      Esta fórmula no tiene composición definida.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeriveModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!deriveFormulaSeleccionada}
              onClick={() => {
                // Guardar datos de la fórmula derivada en sessionStorage
                if (deriveFormulaSeleccionada && deriveFormulaDetalles) {
                  const datosDerivacion = {
                    formulaBase: deriveFormulaSeleccionada,
                    materiasPrimas: deriveFormulaDetalles.materiasPrimas,
                    formulas: deriveFormulaDetalles.formulas,
                  }
                  sessionStorage.setItem("formulaDerivada", JSON.stringify(datosDerivacion))
                }
                router.push("/cotizaciones/crear")
              }}
            >
              Utilizar esta fórmula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Filtros de Búsqueda */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleBuscar}>
            <div className="lg:col-span-2">
              <label htmlFor="txtCotizacionNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtCotizacionNombre"
                name="txtCotizacionNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="ddlCliente" className="text-sm font-medium">
                Cliente
              </label>
              <Select name="ddlCliente" value={filtroCliente} onValueChange={handleClienteChange}>
                <SelectTrigger id="ddlCliente">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="ddlEstatusFilter" className="text-sm font-medium">
                Estatus
              </label>
              <Select name="ddlEstatusFilter" value={filtroEstatus} onValueChange={setFiltroEstatus}>
                <SelectTrigger id="ddlEstatusFilter">
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  {estatusOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.text}
                    </SelectItem>
                  ))}
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
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Activo</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isSearching && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>Buscando resultados.....</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching && Listado.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span>No se encontraron resultados con los parametros indicados, favor de verificar.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching &&
                  Listado?.map((elemento) => (
                    <tr
                      key={elemento.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/cotizaciones/${elemento.id}/ver`)}
                    >
                      <td className="py-3 px-4">{elemento.id}</td>
                      <td className="py-3 px-4">{elemento.titulo}</td>
                      <td className="py-3 px-4">{elemento.tipo}</td>
                      <td className="py-3 px-4">{elemento.usuario}</td>
                      <td className="py-3 px-4">{elemento.estatus}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                            elemento.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {elemento.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/cotizaciones/${elemento.id}/ver`)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {esAdminDOs && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/cotizaciones/crear?id=${elemento.id}`)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={elemento.activo ? "Inactivar" : "Activar"}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleStatusClickActivo(elemento.id, elemento.activo)
                                }}
                              >
                                {elemento.activo ? (
                                  <ToggleRight className="h-4 w-4 text-red-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Eliminar"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/cotizaciones/${elemento.id}/eliminar`)
                                }}
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

const filtroCodigo = ""
const setFiltroCodigo = () => {}
