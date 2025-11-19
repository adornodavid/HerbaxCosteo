"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Eye, Edit, ToggleLeft, ToggleRight, Trash2, AppWindow, Plus, Copy, FilePlus, FlaskConical } from 'lucide-react'
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { oFormula } from "@/types/formulas"
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
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Dialog components for details modal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { 
  obtenerFormulas, 
  estatusActivoFormula, 
  listaDesplegableFormulasBuscar,
  obtenerMateriasPrimasXFormula,
  obtenerFormulasXFormula
} from "@/app/actions/formulas"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"

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
  const [Listado, setListado] = useState<oFormula[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [elementoDetalles, setElementoDetalles] = useState<oFormula | null>(null)
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [showElementoDetallesModal, setShowElementoDetallesModal] = useState(false)
  
  // Estados para Modales de Creación/Derivación
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showDeriveModal, setShowDeriveModal] = useState(false)
  
  // Estados para Derivación
  const [deriveClienteId, setDeriveClienteId] = useState("")
  const [deriveZonaId, setDeriveZonaId] = useState("")
  const [deriveFormulaBuscar, setDeriveFormulaBuscar] = useState("")
  const [deriveFormulasResultados, setDeriveFormulasResultados] = useState<ddlItem[]>([])
  const [deriveShowFormulasDropdown, setDeriveShowFormulasDropdown] = useState(false)
  const [deriveFormulaSeleccionada, setDeriveFormulaSeleccionada] = useState<any>(null)
  const [deriveFormulaDetalles, setDeriveFormulaDetalles] = useState<{
    materiasPrimas: any[],
    formulas: any[]
  }>({ materiasPrimas: [], formulas: [] })
  
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])
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
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --
  
  // Cargar Clientes para el modal de derivación
  useEffect(() => {
    const cargarClientes = async () => {
      const result = await listaDesplegableClientes(-1, "", "True")
      if (result.success && result.data) {
        const options: ddlItem[] = result.data.map((c: any) => ({
          value: c.id.toString(),
          text: c.nombre,
        }))
        setClientesOptions(options)
      }
    }
    cargarClientes()
  }, [])

  // Cargar Zonas cuando cambia el cliente en derivación
  useEffect(() => {
    const cargarZonas = async () => {
      if (deriveClienteId) {
        const result = await listDesplegableZonas(-1, "", Number(deriveClienteId))
        if (result.success && result.data) {
          setZonasOptions(result.data)
          setDeriveZonaId("")
        }
      } else {
        setZonasOptions([])
        setDeriveZonaId("")
      }
    }
    cargarZonas()
  }, [deriveClienteId])

  // Buscar fórmulas para derivación
  useEffect(() => {
    const buscarFormulas = async () => {
      if (deriveFormulaBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableFormulasBuscar(deriveFormulaBuscar)
        setDeriveFormulasResultados(resultados)
        setDeriveShowFormulasDropdown(true)
      } else {
        setDeriveFormulasResultados([])
        setDeriveShowFormulasDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarFormulas, 300)
    return () => clearTimeout(timeoutId)
  }, [deriveFormulaBuscar])

  // Manejar selección de fórmula en derivación
  const handleDeriveFormulaSelect = async (formulaId: string, formulaText: string) => {
    setDeriveFormulaBuscar(formulaText)
    setDeriveShowFormulasDropdown(false)

    // Obtener detalles generales
    const formulasResult = await obtenerFormulas(Number(formulaId), "", "", "True", -1, -1)
    
    if (formulasResult.success && formulasResult.data && formulasResult.data.length > 0) {
      const formula = formulasResult.data[0]
      setDeriveFormulaSeleccionada(formula)
      
      // Obtener composición (Materias Primas y Fórmulas)
      // La función obtenerFormulas ya trae las relaciones anidadas.
      
      setDeriveFormulaDetalles({
        materiasPrimas: formula.materiasprimasxformula || [],
        formulas: formula.formulasxformula || []
      })
    }
  }

  // Handlers para modales
  const handleCrearFormulaClick = () => {
    setShowSelectionModal(true)
  }

  const handleCrearNueva = () => {
    setShowSelectionModal(false)
    router.push("/formulas/crear")
  }

  const handleDerivar = () => {
    setShowSelectionModal(false)
    setShowDeriveModal(true)
  }

  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (id: number, nombre: string, codigo: string, estatus: string, clienteid: number) => {
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
      console.log("auxId: " + auxId + "codigo: " + codigo + " nombre: " + nombre + " auxEstatus: " + auxEstatus)
      const result = await obtenerFormulas(auxId, codigo, nombre, auxEstatus, clienteid, -1)
      console.log("Success: " + result.success + " Data: " + result.data)
      if (result.success && result.data) {
        const transformedData: oFormula[] = result.data.map((x: oFormula) => ({
          id: x.id,
          codigo: x.codigo,
          nombre: x.nombre,
          imgurl: x.imgurl,
          unidadmedidaid: x.unidadmedidaid,
          costo: x.costo,
          fechacreacion: x.fechacreacion,
          activo: x.activo,
        }))

        const Listado: oFormula[] = transformedData.map((x: oFormula) => ({
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
        setListado([]) // Clear list if no data
        setTotalListado(0)
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

    let auxClienteId = -1
    if (!esAdminDDLs) {
      auxClienteId = user.RolId
    }
    try {
      setPageTituloMasNuevo({
        Titulo: "Fórmulas",
        Subtitulo: "Gestión completa de Fórmulas",
        Visible: false, // Ocultamos el componente original para usar nuestro header personalizado
        BotonTexto: "Crear Nueva Fórmula",
        Ruta: "/formulas/crear",
      })
      setShowPageTituloMasNuevo(true)

      const Result = await ejecutarBusqueda(-1, "", "", "True", auxClienteId)
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

  const handleVerDetalles = (formula: oFormula) => {
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

    // Ejecutar búsqueda si hay algún filtro activo o si el ID está presente
    if (Id !== -1 || Nombre !== "" || Codigo !== "" || Estatus !== "Todos") {
      ejecutarBusqueda(Id, Nombre, Codigo, Estatus, user?.RolId ?? -1) // Pasar clienteid si es necesario
    } else {
      // Si no hay filtros, recargar la lista completa (o la vista por defecto)
      cargarDatosIniciales()
    }
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fórmulas</h1>
          <p className="text-muted-foreground mt-1">Gestión completa de Fórmulas</p>
        </div>
        {esAdminDOs && (
          <Button 
            onClick={handleCrearFormulaClick}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva Fórmula
          </Button>
        )}
      </div>

      {/* Modal de Selección (Crear vs Derivar) */}
      <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">Seleccione una opción</DialogTitle>
            <DialogDescription className="text-center">
              Elija cómo desea comenzar a crear su nueva fórmula
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Crear nueva fórmula</h3>
              <p className="text-sm text-gray-500 text-center">
                Cree una fórmula nueva partiendo desde cero, definiendo todos sus componentes y características manualmente.
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Derivar Fórmula</h3>
              <p className="text-sm text-gray-500 text-center">
                Use una fórmula existente como base para la creación de la composición, heredando sus materias primas y estructura.
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
              <FlaskConical className="h-6 w-6 text-purple-600" />
              Derivar Fórmula
            </DialogTitle>
            <DialogDescription>
              Seleccione la fórmula base y los parámetros para crear una nueva derivación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Inputs de Selección */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cliente</label>
                <Select value={deriveClienteId} onValueChange={setDeriveClienteId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccione cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Zona</label>
                <Select value={deriveZonaId} onValueChange={setDeriveZonaId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccione zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonasOptions.map((option) => (
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
                      <span className="font-medium">{deriveFormulaSeleccionada.unidadesmedida?.descripcion || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Costo Actual</span>
                      <span className="font-medium text-green-600">
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(deriveFormulaSeleccionada.costo || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Fecha Creación</span>
                      <span className="font-medium">
                        {deriveFormulaSeleccionada.fechacreacion ? new Date(deriveFormulaSeleccionada.fechacreacion).toLocaleDateString() : "N/A"}
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
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deriveFormulaDetalles.materiasPrimas.map((mp: any, idx: number) => (
                            <tr key={`mp-${idx}`} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 px-4">{mp.materiasprima?.codigo}</td>
                              <td className="py-2 px-4">{mp.materiasprima?.nombre}</td>
                              <td className="py-2 px-4 text-right">{mp.cantidad} {mp.materiasprima?.unidadesmedida?.descripcion}</td>
                              <td className="py-2 px-4 text-right">
                                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 6 }).format(mp.costoparcial || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Fórmulas Anidadas */}
                  {deriveFormulaDetalles.formulas.length > 0 && (
                    <div className="rounded-lg border overflow-hidden mt-4">
                      <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fórmulas Integradas
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-white">
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Código</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Nombre</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Cantidad</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-600">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deriveFormulaDetalles.formulas.map((f: any, idx: number) => (
                            <tr key={`f-${idx}`} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 px-4">{f.formulas?.codigo}</td>
                              <td className="py-2 px-4">{f.formulas?.nombre}</td>
                              <td className="py-2 px-4 text-right">{f.cantidad} {f.formulas?.unidadesmedida?.descripcion}</td>
                              <td className="py-2 px-4 text-right">
                                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 6 }).format(f.costoparcial || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {deriveFormulaDetalles.materiasPrimas.length === 0 && deriveFormulaDetalles.formulas.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                      Esta fórmula no tiene componentes registrados.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeriveModal(false)}>Cancelar</Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!deriveFormulaSeleccionada}
              onClick={() => {
                // Aquí iría la lógica para proceder con la derivación
                // Por ahora solo cerramos o redirigimos
                router.push(`/formulas/crear?baseId=${deriveFormulaSeleccionada?.id}&clienteId=${deriveClienteId}&zonaId=${deriveZonaId}`)
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
                          {new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                            minimumFractionDigits: 6,
                            maximumFractionDigits: 6,
                          }).format(elementoDetalles.FormulaCosto)}
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
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        }).format(elemento.FormulaCosto)}
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
                            <AppWindow className="h-4 w-4" />
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
