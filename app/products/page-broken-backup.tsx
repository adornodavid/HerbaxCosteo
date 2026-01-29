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
import {
  Search,
  Eye,
  Loader2,
  RotateCcw,
  Edit,
  ToggleRight,
  ToggleLeft,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
//import toast from "react-hot-toast" // Import for toast
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Producto, ProductoListado, ProductosEstadisticas } from "@/types/productos"
import type { oVistaProducto, oProductoAvanzado } from "@/types/objetoproducto"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
import type {
  ddlItem,
  ProductoDetail,
  ProductoDetalleCompleto,
  FormulaAsociada,
  IngredienteAsociado,
} from "@/types/common" // Import for ddlItem, ProductoDetail, ProductoDetalleCompleto, FormulaAsociada, IngredienteAsociado
// -- Librerias --
import { supabase } from "@/lib/supabase"
// Configuraciones
import { RolesAdmin, RolesAdminDDLs, RolesAdminDOs, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Frontend --

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerProductos, estatusActivoProducto, obtenerProductosAvanzado, listadopresentacion, listadotipocomision, listadofrecuencia, listadocodigomaestro, listadocodigo, listadocodigointerno, listadonombrematerial, listadocodigomaterial, listadodetallematerial, listadoespecificacionesmaterial, listadonombresformulas, listadocodigosformulas, listadoespecificacionesformulas, listadonombresmateriaspri, listadocodigosmateriaspri, listadofamiliasmateriaspri, listadoespecificacionesmateriaspri, listadopresentacionesmateriaspri, listadoformula, listadomedidaformula, listadofamiliamaterialempaque, listadopais, listadomedidaempaque, listadocolorempaque, listadofamiliamateriaprima, listadopresentacionmateriaprima } from "@/app/actions/products"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import {
  listaDesplegableCatalogos,
  listaDesplegableFormasFarmaceuticas,
  listaDesplegableSistemas,
  listaDesplegableEnvase,
  listaDesplegableProductosTiposComisiones, // Import for commission types
  listaDesplegableEnvaseMl, // Import for ML units
} from "@/app/actions/catalogos"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { listaDesplegableFormulasBuscar } from "@/app/actions/formulas"
import { listaDesplegableMateriasPrimasBuscar } from "@/app/actions/materia-prima"
import { listaDesplegableMaterialesEtiquetadosBuscar } from "@/app/actions/material-etiquetado"

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
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("true")
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true)
  const [filtroCatalogo, setFiltroCatalogo] = useState("-1")
  const [filtroZona, setFiltroZona] = useState("-1") // Declare filtroZona
  const [clientes, setClientes] = useState<ddlItem[]>([])
  const [catalogos, setCatalogos] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([{ value: "-1", text: "Todos" }])
  const [presentaciones, setPresentaciones] = useState<string[]>([])
  const [tiposComision, setTiposComision] = useState<string[]>([])
  const [frecuencias, setFrecuencias] = useState<string[]>([])
  const [codigosMaestros, setCodigosMaestros] = useState<string[]>([])
  const [showCodigoMaestroDropdown, setShowCodigoMaestroDropdown] = useState(false)
  const [codigoMaestroFiltrado, setCodigoMaestroFiltrado] = useState<string[]>([])
  const [codigos, setCodigos] = useState<string[]>([])
  const [showCodigoDropdown, setShowCodigoDropdown] = useState(false)
  const [codigoFiltrado, setCodigoFiltrado] = useState<string[]>([])
  const [codigosInternos, setCodigosInternos] = useState<string[]>([])
  const [showCodigoInternoDropdown, setShowCodigoInternoDropdown] = useState(false)
  const [codigoInternoFiltrado, setCodigoInternoFiltrado] = useState<string[]>([])

  // Estados para el modal de detalles mejorado
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [selectedProductoCompleto, setSelectedProductoCompleto] = useState<ProductoDetalleCompleto | null>(null)
  const [selectedFormulasAsociadas, setSelectedFormulasAsociadas] = useState<FormulaAsociada[]>([])
  const [selectedIngredientesAsociados, setSelectedIngredientesAsociados] = useState<IngredienteAsociado[]>([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  // Estados para el modal de detalles mejorado
  const [formasFarmaceuticasOptions, setFormasFarmaceuticasOptions] = useState<ddlItem[]>([])
  const [objetivosOptions, setObjetivosOptions] = useState<ddlItem[]>([])
  const [envasesOptions, setEnvasesOptions] = useState<ddlItem[]>([])

  // --- Estados ---
  const [productos, setProductos] = useState<oProductoAvanzado[]>([])
  const [estadisticas, setEstadisticas] = useState<ProductosEstadisticas>({
    totalProductos: 0,
    costoPromedio: 0,
    costoTotal: 0, // Inicializado a 0
    tiempoPromedio: "N/A",
  })
  const [productosFiltrados, setProductosFiltrados] = useState<oProductoAvanzado[]>([])
  const [totalProductos, setTotalProductos] = useState(0)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productoToToggle, setProductoToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Este estado no se usa en la búsqueda actual, pero se mantiene
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null)

  // Filtros
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showProductoFilters, setShowProductoFilters] = useState(false)
  const [showFormulaFilters, setShowFormulaFilters] = useState(false)
  const [showMaterialesFilters, setShowMaterialesFilters] = useState(false)
  const [showMateriaPrimaFilters, setShowMateriaPrimaFilters] = useState(false)
  const [filtroPresentacion, setFiltroPresentacion] = useState("")
  const [filtroFormaFarmaceutica, setFiltroFormaFarmaceutica] = useState("-1")
  const [filtroObjetivo, setFiltroObjetivo] = useState("-1")
  const [filtroEnvase, setFiltroEnvase] = useState("-1")
  const [filtroFormula, setFiltroFormula] = useState("")
  const [filtroMateriaPrima, setFiltroMateriaPrima] = useState("")
  const [filtroEnvaseAvanzado, setFiltroEnvaseAvanzado] = useState("")
  const [filtroEmpaque, setFiltroEmpaque] = useState("")

  const [filtroCodigoMaestro, setFiltroCodigoMaestro] = useState("")
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroCodigoInterno, setFiltroCodigoInterno] = useState("")
  const [filtroTipoComision, setFiltroTipoComision] = useState("-1")
  const [filtroEnvaseMl, setFiltroEnvaseMl] = useState("-1")
  const [filtroMaterialEnvaseEmpaque, setFiltroMaterialEnvaseEmpaque] = useState("")

  const [formulaBuscar, setFormulaBuscar] = useState("")
  const [formulasResultados, setFormulasResultados] = useState<any[]>([])
  const [formulaSeleccionada, setFormulaSeleccionada] = useState<{ id: number; text: string } | null>(null)
  const [formulaid, setFormulaid] = useState<number | null>(null)
  const [showFormulasDropdown, setShowFormulasDropdown] = useState(false)
  const [filtroCodigoFormula, setFiltroCodigoFormula] = useState("")
  const [filtroEspecificacionesFormula, setFiltroEspecificacionesFormula] = useState("")
  const [filtroFormulaDropdown, setFiltroFormulaDropdown] = useState("-1")
  const [filtroMedidasFormula, setFiltroMedidasFormula] = useState("-1")
  const [filtroCodigoEmpaque, setFiltroCodigoEmpaque] = useState("")
  const [filtroFamiliaEmpaque, setFiltroFamiliaEmpaque] = useState("-1")
  const [filtroDetalleEmpaque, setFiltroDetalleEmpaque] = useState("")
  const [filtroEspecificacionesEmpaque, setFiltroEspecificacionesEmpaque] = useState("")
  const [filtroPais, setFiltroPais] = useState("-1")
  const [filtroMedidaEmpaque, setFiltroMedidaEmpaque] = useState("-1")
  const [filtroColor, setFiltroColor] = useState("-1")
  const [formulasDropdown, setFormulasDropdown] = useState<string[]>([])
  const [medidasFormula, setMedidasFormula] = useState<string[]>([])
  const [familiasEmpaque, setFamiliasEmpaque] = useState<string[]>([])
  const [paises, setPaises] = useState<string[]>([])
  const [medidasEmpaque, setMedidasEmpaque] = useState<string[]>([])
  const [coloresEmpaque, setColoresEmpaque] = useState<string[]>([])
  const [familiasMateriaPrima, setFamiliasMateriaPrima] = useState<string[]>([])
  const [presentacionesMateriaPrima, setPresentacionesMateriaPrima] = useState<string[]>([])
  const [nombresMateriales, setNombresMateriales] = useState<string[]>([])
  const [showNombreMaterialDropdown, setShowNombreMaterialDropdown] = useState(false)
  const [nombreMaterialFiltrado, setNombreMaterialFiltrado] = useState<string[]>([])
  const [codigosMateriales, setCodigosMateriales] = useState<string[]>([])
  const [showCodigoMaterialDropdown, setShowCodigoMaterialDropdown] = useState(false)
  const [codigoMaterialFiltrado, setCodigoMaterialFiltrado] = useState<string[]>([])
  const [detallesMateriales, setDetallesMateriales] = useState<string[]>([])
  const [showDetalleMaterialDropdown, setShowDetalleMaterialDropdown] = useState(false)
  const [detalleMaterialFiltrado, setDetalleMaterialFiltrado] = useState<string[]>([])
  const [especificacionesMateriales, setEspecificacionesMateriales] = useState<string[]>([])
  const [showEspecificacionesMaterialDropdown, setShowEspecificacionesMaterialDropdown] = useState(false)
  const [especificacionesMaterialFiltrado, setEspecificacionesMaterialFiltrado] = useState<string[]>([])
  const [nombresFormulas, setNombresFormulas] = useState<string[]>([])
  const [showNombreFormulaDropdown, setShowNombreFormulaDropdown] = useState(false)
  const [nombreFormulaFiltrado, setNombreFormulaFiltrado] = useState<string[]>([])
  const [codigosFormulas, setCodigosFormulas] = useState<string[]>([])
  const [showCodigoFormulaDropdown, setShowCodigoFormulaDropdown] = useState(false)
  const [codigoFormulaFiltrado, setCodigoFormulaFiltrado] = useState<string[]>([])
  const [especificacionesFormulas, setEspecificacionesFormulas] = useState<string[]>([])
  const [showEspecificacionesFormulaDropdown, setShowEspecificacionesFormulaDropdown] = useState(false)
  const [especificacionesFormulaFiltrado, setEspecificacionesFormulaFiltrado] = useState<string[]>([])
  const [filtroFamiliaMateriaPrima, setFiltroFamiliaMateriaPrima] = useState("-1")
  const [filtroEspecificacionesMateriaPrima, setFiltroEspecificacionesMateriaPrima] = useState("")
  const [filtroPresentacionMateriaPrima, setFiltroPresentacionMateriaPrima] = useState("-1")
  const [filtroCodigoMateriaPrima, setFiltroCodigoMateriaPrima] = useState("")
  const [nombresMateriaPrima, setNombresMateriaPrima] = useState<string[]>([])
  const [showNombreMateriaPrimaDropdown, setShowNombreMateriaPrimaDropdown] = useState(false)
  const [nombreMateriaPrimaFiltrado, setNombreMateriaPrimaFiltrado] = useState<string[]>([])
  const [codigosMateriaPrima, setCodigosMateriaPrima] = useState<string[]>([])
  const [showCodigoMateriaPrimaDropdown, setShowCodigoMateriaPrimaDropdown] = useState(false)
  const [codigoMateriaPrimaFiltrado, setCodigoMateriaPrimaFiltrado] = useState<string[]>([])
  const [especificacionesMateriaPrima, setEspecificacionesMateriaPrima] = useState<string[]>([])
  const [showEspecificacionesMateriaPrimaDropdown, setShowEspecificacionesMateriaPrimaDropdown] = useState(false)
  const [especificacionesMateriaPrimaFiltrado, setEspecificacionesMateriaPrimaFiltrado] = useState<string[]>([])

  const [materiaprimaBuscar, setMateriaprimaBuscar] = useState("")
  const [materiaprimasResultados, setMateriaprimasResultados] = useState<any[]>([])
  const [materiaprimaSeleccionada, setMateriaprimaSeleccionada] = useState<{ id: number; text: string } | null>(null)
  const [materiaprimaid, setMateriaprimaid] = useState<number | null>(null)
  const [showMateriaprimasDropdown, setShowMateriaprimasDropdown] = useState(false)

  const [envaseBuscar, setEnvaseBuscar] = useState("")
  const [envasesResultadosBuscar, setEnvasesResultadosBuscar] = useState<any[]>([])
  const [envaseSeleccionado, setEnvaseSeleccionado] = useState<{ id: number; text: string } | null>(null)
  const [envaseid, setEnvaseid] = useState<number | null>(null)
  const [showEnvasesDropdown, setShowEnvasesDropdown] = useState(false)

  const [empaqueBuscar, setEmpaqueBuscar] = useState("")
  const [empaquesResultados, setEmpaquesResultados] = useState<any[]>([])
  const [empaqueSeleccionado, setEmpaqueSeleccionado] = useState<{ id: number; text: string } | null>(null)
  const [empaqueid, setEmpaqueid] = useState<number | null>(null)
  const [showEmpaqueDropdown, setShowEmpaqueDropdown] = useState(false)

  const [tiposComisionesOptions, setTiposComisionesOptions] = useState<ddlItem[]>([])
  const [envaseMlOptions, setEnvaseMlOptions] = useState<ddlItem[]>([])


  const [materialEnvaseBuscar, setMaterialEnvaseBuscar] = useState("")
  const [materialesEnvaseResultados, setMaterialesEnvaseResultados] = useState<any[]>([])
  const [materialEnvaseSeleccionado, setMaterialEnvaseSeleccionado] = useState<{ id: number; text: string } | null>(
    null,
  )
  const [materialEnvaseid, setMaterialEnvaseid] = useState<number | null>(null)
  const [showMaterialEnvaseDropdown, setShowMaterialEnvaseDropdown] = useState(false)

  // --- Variables (post carga elementos) ---
  const elementosPaginadosssssss = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // --- Paginación ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return productosFiltrados.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [productosFiltrados, paginaActual])

  const totalPaginas = Math.ceil(totalProductos / resultadosPorPagina)

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  // -- Funciones --
  const ejecutarBusquedaProductos = async (
    productonombre: string,
    clienteid: number,
    zonaid: number,
    catalogoid: number,
    estatus: string,
    presentacion: string, // Added for advanced search
    formafarmaceuticaid: number, // Changed to string to match state
    objetivo: number, // Changed to string to match state
    envase: string, // Changed to string to match state
    // formulaid: number | null, // Changed to accept ID
    filtroFormulaId: number | -1,
    // materiaprmaid: number | null, // Changed to accept ID
    filtroMateriaPrimaId: number | -1,
    envaseavanzado: string, // Changed to string to match state
    empaque: string, // Changed to string to match state
    // Passing new filters to the backend call
    codigomaestro: string,
    codigo: string,
    codigointerno: string,
    tipocomision: string,
    envaseeml: string,
    // materialenvaseempId: number | null, // Changed to accept ID
    filtroMaterialEnvaseEmpId: number | -1,
    // Filtros a nivel fórmula
    nombreformula: string,
    codigoformula: string,
    especificacionesformula: string,
    formula: string,
    medidasformula: string,
    // Filtros a nivel materiales
    nombrematerialempaque: string,
    codigoempaque: string,
    familiaempaque: string,
    detalleempaque: string,
    especificacionesempaque: string,
    pais: string,
    medidaempaque: string,
    color: string,
    // Filtros a nivel materia prima
    nombremateriaprima: string,
    codigomateriaprima: string,
    familiamateriaprima: string,
    especificacionesmateriaprima: string,
    presentacionmateriaprima: string,
  ) => {
    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    const auxEstatus =
      estatus === "-1"
        ? "Todos"
        : arrActivoTrue.includes(estatus)
          ? true
          : arrActivoFalse.includes(estatus)
            ? false
            : "Todos"

    const formafarmaceuticaidNum =
      formafarmaceuticaid === "-1" || formafarmaceuticaid === "" ? -1 : Number.parseInt(formafarmaceuticaid, 10)
    const sistemaIdNum = objetivo === "-1" || objetivo === "" ? -1 : Number.parseInt(objetivo, 10)
    const materialIdNum =
      filtroMaterialEnvaseEmpId !== null && filtroMaterialEnvaseEmpId !== undefined ? filtroMaterialEnvaseEmpId : -1
    const formulaidNum = filtroFormulaId !== null && filtroFormulaId !== undefined ? filtroFormulaId : -1
    const materiaprimaidNum =
      filtroMateriaPrimaId !== null && filtroMateriaPrimaId !== undefined ? filtroMateriaPrimaId : -1

    try {
      console.log(
        "parametros 111111111: " +
          "productonombre: " +
          productonombre +
          " clienteid: " +
          clienteid +
          " zonaid: " +
          zonaid +
          " estatus: " +
          estatus +
          " auxEstatus: " +
          auxEstatus +
          " codigomaestro: " +
          codigomaestro +
          " codigo: " +
          codigo +
          " codigointerno: " +
          codigointerno +
          " presentacion: " +
          presentacion +
          "  objetivo: " +
          objetivo +
          " tipocomision: " +
          tipocomision +
          " envase: " +
          envase +
          " filtroFormulaId: " +
          filtroFormulaId +
          " filtroMateriaPrimaId: " +
          filtroMateriaPrimaId +
          " empaque: " +
          empaque,
      )
      console.log("[v0] Frontend - Llamando obtenerProductosAvanzado con clienteid:", clienteid)
      
      const result = await obtenerProductosAvanzado(productonombre,clienteid,zonaid,auxEstatus,codigomaestro,codigo,codigointerno,presentacion,objetivo,tipocomision,envase,nombreformula,codigoformula,especificacionesformula,formula,medidasformula,nombrematerialempaque,codigoempaque,familiaempaque,detalleempaque,especificacionesempaque,pais,medidaempaque,color,nombremateriaprima,codigomateriaprima,familiamateriaprima,especificacionesmateriaprima,presentacionmateriaprima)
      
      console.log("[v0] Frontend - Respuesta recibida, success:", result.success)
      console.log("[v0] Frontend - Total de productos recibidos:", result.data?.length || 0)
      console.log("[v0] Frontend - Primer producto (muestra):", result.data?.[0])

      console.log(
        "parametros: " +
          "productonombre: " +
          productonombre +
          " clienteid: " +
          clienteid +
          " zonaid: " +
          zonaid +
          " auxEstatus: " +
          auxEstatus +
          " presentacion: " +
          presentacion +
          "  sistemaIdNum: " +
          sistemaIdNum +
          " envase: " +
          envase +
          " formulaidNum: " +
          formulaidNum +
          " materiaprimaidNum: " +
          materiaprimaidNum +
          " empaque: " +
          empaque +
          "codigo: " +
          codigo +
          " tipocomision: " +
          tipocomision +
          " materialIdNum: " +
          materialIdNum,
      )
      if (result.success && result.data) {
        // Usar directamente los datos de la vista vw_oproductos sin mapeo
        const productosListado: oProductoAvanzado[] = result.data as oProductoAvanzado[]

        // Actualizar estados
        setProductos(productosListado)
        setProductosFiltrados(productosListado)
        setTotalProductos(productosListado.length)

        // Retorno de información
        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        // Retorno de información
        setProductos([])
        setProductosFiltrados([]) // Also clear filtered products
        setTotalProductos(0)
        return { success: false, mensaje: "No hay datos o la consulta falló." }
      }
    } catch (error) {
      // Retorno de información
      console.error("Error inesperado al buscar productos: ", error)
      console.log("Error inesperado al buscar productos: ", error)
      setProductos([])
      setProductosFiltrados([]) // Also clear filtered products
      setTotalProductos(0)
      return { error: true, mensaje: "Error inesperado al buscar productos: " + error }
    } finally {
      setShowPageLoading(false)
      setIsLoadingInitialData(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    // Validar existe usuario
    if (!user) return

    setIsLoadingInitialData(true)

    console.log("[v0] DEBUG cargarDatosIniciales START - Initial state:", {
      filtroCliente: filtroCliente,
      filtroClienteType: typeof filtroCliente,
      esAdmin: esAdmin,
      esAdminDDLs: esAdminDDLs,
      userEmail: user?.email,
      userClienteId: user?.ClienteId
    })

    // Función para reintentar peticiones con backoff exponencial
    const fetchWithRetry = async (fetchFunction: () => Promise<any>, maxRetries = 3) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await fetchFunction()
          return result
        } catch (error: any) {
          const isTooManyRequests = 
            error?.message?.includes('Too Many') || 
            error?.message?.includes('429') ||
            error?.message?.includes('is not valid JSON') ||
            error?.message?.includes('Rate limit')
          
          const isLastAttempt = attempt === maxRetries - 1
          
          if (isTooManyRequests && !isLastAttempt) {
            const waitTime = Math.pow(2, attempt) * 1000
            console.log(`[v0] Rate limited, esperando ${waitTime/1000}s antes de reintentar (intento ${attempt + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          } else {
            throw error
          }
        }
      }
    }

    try {
      const CACHE_DURATION_CARGAR_DATOS = 5 * 60 * 1000 // 5 minutos
      let cacheWasUsedSuccessfully = false

      // Verificar si hay caché válido para cargarDatosIniciales
      const cachedDataTimestamp = localStorage.getItem('cargarDatosIniciales_timestamp')
      if (cachedDataTimestamp) {
        const age = Date.now() - parseInt(cachedDataTimestamp)
        
        if (age < CACHE_DURATION_CARGAR_DATOS) {
          console.log(`[v0] Usando caché de cargarDatosIniciales (edad: ${Math.round(age/1000)}s)`)
          
          // Cargar todos los datos del caché
          try {
            const cachedClientes = JSON.parse(localStorage.getItem('cargarDatosIniciales_clientes') || 'null')
            const cachedZonas = JSON.parse(localStorage.getItem('cargarDatosIniciales_zonas') || 'null')
            
            if (cachedClientes) {
              const clientesTransformados = cachedClientes.map((c: any) => ({
                value: c.id.toString(),
                text: c.nombre,
              }))
              setClientes([{ value: "-1", text: "Todos" }, ...clientesTransformados])
              setFiltroCliente("-1")
            }
            
            if (cachedZonas) {
              setZonasOptions([{ value: "-1", text: "Todos" }, ...cachedZonas])
              setFiltroZona("-1")
            }
            
            cacheWasUsedSuccessfully = true
            console.log('[v0] cargarDatosIniciales desde caché completado exitosamente (clientes y zonas)')
          } catch (cacheParseError) {
            console.log("[v0] Error al parsear caché de cargarDatosIniciales, continuando con carga normal...")
          }
        } else {
          console.log(`[v0] Caché de cargarDatosIniciales expirado (edad: ${Math.round(age/1000)}s), recargando...`)
        }
      } else {
        console.log('[v0] No hay caché, cargando catálogos desde Supabase...')
      }
            
            console.log('[v0] cargarDatosIniciales desde caché completado exitosamente (clientes y zonas)')
          } catch (cacheParseError) {
            console.log("[v0] Error al parsear caché de cargarDatosIniciales, continuando con carga normal...")
          }
        } else {
          console.log(`[v0] Caché de cargarDatosIniciales expirado (edad: ${Math.round(age/1000)}s), recargando...`)
        }
      }
      
      // Auxiliar para definir DDLs
      const auxClienteId = esAdminDDLs === true ? -1 : user.ClienteId

      console.log("[v0] cargarDatosIniciales - auxClienteId:", auxClienteId)

      // Titulo de la página
      setPageTituloMasNuevo({
        Titulo: "Productos",
        Subtitulo: "Gestión completa de Productos",
        Visible: esAdminDOs == false ? false : false,
        BotonTexto: "Crear Producto", // Agregar texto
        Ruta: "/productos/crear", // Agregar ruta
      })
      setShowPageTituloMasNuevo(true)

      const savedFilters = sessionStorage.getItem("productosFilters")
      console.log("[v0] savedFilters:", savedFilters)

      // Si el caché fue usado exitosamente, saltar la carga desde Supabase
      if (cacheWasUsedSuccessfully) {
        console.log("[v0] Saltando carga de clientes/zonas desde Supabase - datos ya en caché")
      } else {
        // -- Cargar DDLs primero CON RETRY Y CACHÉ
        // DDL Clientes
        console.log("[v0] Calling listaDesplegableClientes with:", auxClienteId)
        const { data: clientesData, error: clientesError } = await fetchWithRetry(() => listaDesplegableClientes(auxClienteId, ""))
      console.log("[v0] clientesData:", clientesData, "clientesError:", clientesError)
      if (clientesError || !clientesData) {
        console.log("Error al cargar clientes:", clientesError)
        setModalError({
          Titulo: "Error al cargar Clientes",
          Mensaje: clientesError || "Error desconocido.",
        })
        setShowModalError(true)
      } else {
        const clientesTransformados = clientesData.map((c: any) => ({
          value: c.id.toString(),
          text: c.nombre,
        }))
        const clientesConTodos = [{ value: "-1", text: "Todos" }, ...clientesTransformados]
        console.log("[v0] Setting clientes with:", clientesConTodos)
        setClientes(clientesConTodos)
        
        // Guardar en caché
        try {
          localStorage.setItem('cargarDatosIniciales_clientes', JSON.stringify(clientesData))
          console.log('[v0] Clientes guardados en caché')
        } catch (cacheError) {
          console.error('[v0] Error guardando clientes en caché:', cacheError)
        }
      }

      // DDL Catalogos
      console.log("[v0] Calling listaDesplegableCatalogos with:", -1, "")
      const { data: catalogosData, error: catalogosError } = await listaDesplegableCatalogos(
        -1,
        "",
        auxClienteId === -1 ? undefined : auxClienteId,
      )
      console.log("[v0] catalogosData:", catalogosData, "catalogosError:", catalogosError)
      if (catalogosError || !catalogosData) {
        console.log("Error al cargar catálogos:", catalogosError)
        setModalError({
          Titulo: "Error al cargar Catálogos",
          Mensaje: catalogosError || "Error desconocido.",
        })
        setShowModalError(true)
      } else {
        const catalogosConTodos = [{ value: "-1", text: "Todos" }, ...catalogosData]
        console.log("[v0] Setting catalogos with:", catalogosConTodos)
        setCatalogos(catalogosConTodos)
      }

      // Cargar opciones de filtros avanzados
      const formasResult = await listaDesplegableFormasFarmaceuticas(-1, "")
      if (formasResult.success && formasResult.data) {
        setFormasFarmaceuticasOptions([{ value: "-1", text: "Todos" }, ...formasResult.data])
      } else {
        console.log("Error al cargar Formas Farmacéuticas:", formasResult.error)
      }

      const sistemasResult = await listaDesplegableSistemas(-1, "")
      if (sistemasResult.success && sistemasResult.data) {
        setObjetivosOptions([{ value: "-1", text: "Todos" }, ...sistemasResult.data])
      } else {
        console.log("Error al cargar Sistemas (Objetivos):", sistemasResult.error)
      }

      const envasesResult = await listaDesplegableEnvase()
      console.log("env", envasesResult.data)
      if (envasesResult.success && envasesResult.data) {
        setEnvasesOptions([{ value: "-1", text: "Todos" }, ...envasesResult.data]) // Changed "Todos" value to "-1" for consistency
      } else {
        console.log("Error al cargar Envases:", envasesResult.error)
      }

      const tiposComisionesResult = await listaDesplegableProductosTiposComisiones("", "")
      console.log("[v0] tiposComisionesResult:", tiposComisionesResult)
      if (tiposComisionesResult.success && tiposComisionesResult.data) {
        console.log("[v0] Setting tiposComisiones with:", tiposComisionesResult.data)
        setTiposComisionesOptions([{ value: "-1", text: "Todos" }, ...tiposComisionesResult.data])
      } else {
        console.log(
          "[v0] Error or no data for tipos comisiones - success:",
          tiposComisionesResult.success,
          "data:",
          tiposComisionesResult.data,
          "error:",
          tiposComisionesResult.error,
        )
      }

      const envaseMlResult = await listaDesplegableEnvaseMl(-1, "")
      if (envaseMlResult.success && envaseMlResult.data) {
        setEnvaseMlOptions([{ value: "-1", text: "Todos" }, ...envaseMlResult.data])
      } 
        

      if (savedFilters) {
        const filters = JSON.parse(savedFilters)
        console.log("[v0] Loaded filters from sessionStorage:", filters)

        // Restaurar estados de filtros
        setFiltroNombre(filters.filtroNombre || "")
        setFiltroCliente(filters.filtroCliente || "-1")
        setFiltroZona(filters.filtroZona || "-1")
        setFiltroCatalogo(filters.filtroCatalogo || "-1")
        setFiltroEstatus(filters.filtroEstatus || "-1")
        setFiltroPresentacion(filters.filtroPresentacion || "")
        setFiltroFormaFarmaceutica(filters.filtroFormaFarmaceutica || "-1")
        setFiltroObjetivo(filters.filtroObjetivo || "-1")
        setFiltroEnvase(filters.filtroEnvase || "-1")
        setFiltroFormula(filters.filtroFormula || "") // Assuming text field for formula filter
        setFiltroMateriaPrima(filters.filtroMateriaPrima || "") // Assuming text field for materia prima filter
        setFiltroEnvaseAvanzado(filters.filtroEnvaseAvanzado || "")
        setFiltroEmpaque(filters.filtroEmpaque || "")
        setFiltroCodigoMaestro(filters.filtroCodigoMaestro || "")
        setFiltroCodigo(filters.filtroCodigo || "")
        setFiltroCodigoInterno(filters.filtroCodigoInterno || "")
        setFiltroTipoComision(filters.filtroTipoComision || "-1")
        setFiltroEnvaseMl(filters.filtroEnvaseMl || "-1")
        setFiltroMaterialEnvaseEmpaque(filters.filtroMaterialEnvaseEmpaque || "")

        // Set the selected IDs based on the loaded text filters
        // Formula
        if (filters.filtroFormula) {
          // Assuming you have a way to get formula results here or call a function
          // For now, setting to null if not found immediately
          setFormulaid(null) // Placeholder, actual logic to find ID based on text would go here
        }
        // Materia Prima
        if (filters.filtroMateriaPrima) {
          setMateriaprimaid(null) // Placeholder
        }
        // Material Envase Empaque
        if (filters.filtroMaterialEnvaseEmpaque) {
          setMaterialEnvaseid(null) // Placeholder
        }

        // If there is a selected client, load zones WITH RETRY
        if (filters.filtroCliente && filters.filtroCliente !== "-1") {
          console.log("[v0] DEBUG cargarDatosIniciales - zona loading clienteid:", {
            filtroCliente: filters.filtroCliente,
            numberConverted: Number(filters.filtroCliente),
            isNaN: isNaN(Number(filters.filtroCliente))
          })
          const zonasResult = await fetchWithRetry(() => listDesplegableZonas(-1, "", Number(filters.filtroCliente)))
          if (zonasResult.success && zonasResult.data) {
            setZonasOptions([{ value: "-1", text: "Todos" }, ...zonasResult.data])
            console.log("[v0] Loaded zones after restoring filters:", zonasResult.data)
            
            // Guardar zonas en caché
            try {
              localStorage.setItem('cargarDatosIniciales_zonas', JSON.stringify(zonasResult.data))
              console.log('[v0] Zonas guardadas en caché')
            } catch (cacheError) {
              console.error('[v0] Error guardando zonas en caché:', cacheError)
            }
          } else {
            console.log("Error al cargar Zonas:", zonasResult.error)
            setZonasOptions([{ value: "-1", text: "Todos" }]) // Reset zones if error
            setModalError({
              Titulo: "Error al cargar Zonas",
              Mensaje: zonasResult.error || "No se pudieron cargar las zonas para este cliente.",
            })
            setShowModalError(true)
          }
        }

        // Execute search with saved filters
        console.log("[v0] DEBUG cargarDatosIniciales - clienteid conversion:", {
          filtroCliente: filters.filtroCliente,
          filtroClienteType: typeof filters.filtroCliente,
          numberConverted: Number(filters.filtroCliente),
          isNaN: isNaN(Number(filters.filtroCliente)),
          auxClienteId: auxClienteId,
          finalValue: Number(filters.filtroCliente) || auxClienteId
        })
        const Result = await ejecutarBusquedaProductos(
          filters.filtroNombre || "",
          Number(filters.filtroCliente) || auxClienteId,
          Number(filters.filtroZona) || -1,
          filters.filtroEstatus || "True",
          filters.filtroCodigoMaestro || "",
          filters.filtroCodigo || "",
          filters.filtroCodigoInterno || "",
          filters.filtroPresentacion || "",
          Number(filters.filtroObjetivo) || -1,
          filters.filtroTipoComision === "-1" ? "" : filters.filtroTipoComision, // Use conditional logic here
          filters.filtroEnvase || "-1",
          // Pass the selected IDs for formula, material prima, and material envase empaque
          formulaid || -1,
          materiaprimaid || -1,
          materialEnvaseid || -1,
        )
        

        if (!Result.success) {
          setModalAlert({
            Titulo: "En ejecución de búsqueda con filtros guardados",
            Mensaje: Result.mensaje,
          })
          setShowModalAlert(true)
        }
      } else {
        console.log("[v0] No saved filters found, performing initial search with clienteid:", auxClienteId)
        const Result = await ejecutarBusquedaProductos(
          "", // filtroNombre
          auxClienteId, // clienteid (filters by user's client if not admin)
          -1, // zonaid
          -1, // catalogoid
          "True", // estatus (filters only active products)
          "", // filtroPresentacion
          -1, // filtroFormaFarmaceutica
          -1, // filtroObjetivo
          "", // filtroEnvase
          -1, // filtroFormulaId (default to null if no saved filter)
          -1, // filtroMateriaPrimaId (default to null if no saved filter)
          "", // filtroEnvaseAvanzado
          "", // filtroEmpaque
          // Passing default values for new filters
          "", // filtroCodigoMaestro
          "", // filtroCodigo
          "", // filtroCodigoInterno
          "", // filtroTipoComision (default to empty string)
          "", // filtroEnvaseMl
          -1, // filtroMaterialEnvaseEmpId (default to null if no saved filter)
        )
        if (!Result.success) {
          setModalAlert({
            Titulo: "En ejecución de búsqueda de carga inicial",
            Mensaje: Result.mensaje,
          })
          setShowModalAlert(true)
        }
      }
      
      // Guardar timestamp de cargarDatosIniciales al final
      try {
        localStorage.setItem('cargarDatosIniciales_timestamp', Date.now().toString())
        console.log('[v0] Timestamp de cargarDatosIniciales guardado en caché')
      } catch (cacheError) {
        console.error('[v0] Error guardando timestamp en caché:', cacheError)
      }
    } catch (error) {
      console.error(\"Error al cargar datos iniciales: ", error)\
      console.log("Error al cargar datos iniciales: ", error)
      setModalError({
        Titulo: "Error al cargar datos iniciales",
        Mensaje: `Error: ${error}`,
      })\
      setShowModalError(true)
    } finally {
      setShowPageLoading(false)
      setIsLoadingInitialData(false)
    }
  }

  // --- Cargar Opciones para DDLs Avanzados ---
  useEffect(() => {
    const cargarOpciones = async () => {
      // Función para reintentar peticiones con backoff exponencial
      const fetchWithRetry = async (fetchFunction: () => Promise<any>, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await fetchFunction()
            return result
          } catch (error: any) {
            const isTooManyRequests = 
              error?.message?.includes('Too Many') || 
              error?.message?.includes('429') ||
              error?.message?.includes('is not valid JSON') ||
              error?.message?.includes('Rate limit')
            
            const isLastAttempt = attempt === maxRetries - 1
            
            if (isTooManyRequests && !isLastAttempt) {
              const waitTime = Math.pow(2, attempt) * 1000
              console.log(\`[v0] Rate limited, esperando ${waitTime/1000}s antes de reintentar (intento ${attempt + 1}/${maxRetries})...`)\
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            } else {
              throw error
            }\
          }
        }
      }

      try {\
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

        // Verificar si hay caché válido
        const cachedTimestamp = localStorage.getItem('catalogos_timestamp')
        if (cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp)
          
          if (age < CACHE_DURATION) {
            console.log(`[v0] Usando caché de catálogos (edad: ${Math.round(age/1000)}s)`)
            
            // Cargar todos los datos del caché
            const cachedData = {
              formas: JSON.parse(localStorage.getItem('catalogos_formas') || 'null'),
              sistemas: JSON.parse(localStorage.getItem('catalogos_sistemas') || 'null'),
              envases: JSON.parse(localStorage.getItem('catalogos_envases') || 'null'),
              presentaciones: JSON.parse(localStorage.getItem('catalogos_presentaciones') || 'null'),
              tiposComision: JSON.parse(localStorage.getItem('catalogos_tiposComision') || 'null'),
              frecuencias: JSON.parse(localStorage.getItem('catalogos_frecuencias') || 'null'),
              codigosMaestros: JSON.parse(localStorage.getItem('catalogos_codigosMaestros') || 'null'),
              codigos: JSON.parse(localStorage.getItem('catalogos_codigos') || 'null'),
              codigosInternos: JSON.parse(localStorage.getItem('catalogos_codigosInternos') || 'null'),
              nombresMateriales: JSON.parse(localStorage.getItem('catalogos_nombresMateriales') || 'null'),
              codigosMateriales: JSON.parse(localStorage.getItem('catalogos_codigosMateriales') || 'null'),
              detallesMateriales: JSON.parse(localStorage.getItem('catalogos_detallesMateriales') || 'null'),
              especificacionesMateriales: JSON.parse(localStorage.getItem('catalogos_especificacionesMateriales') || 'null'),
              familiasEmpaque: JSON.parse(localStorage.getItem('catalogos_familiasEmpaque') || 'null'),
              paises: JSON.parse(localStorage.getItem('catalogos_paises') || 'null'),
              medidasEmpaque: JSON.parse(localStorage.getItem('catalogos_medidasEmpaque') || 'null'),
              nombresFormulas: JSON.parse(localStorage.getItem('catalogos_nombresFormulas') || 'null'),
              codigosFormulas: JSON.parse(localStorage.getItem('catalogos_codigosFormulas') || 'null'),
              especificacionesFormulas: JSON.parse(localStorage.getItem('catalogos_especificacionesFormulas') || 'null'),
              formulas: JSON.parse(localStorage.getItem('catalogos_formulas') || 'null'),
              medidasFormula: JSON.parse(localStorage.getItem('catalogos_medidasFormula') || 'null'),
              coloresEmpaque: JSON.parse(localStorage.getItem('catalogos_coloresEmpaque') || 'null'),
              familiasMateriaPrima: JSON.parse(localStorage.getItem('catalogos_familiasMateriaPrima') || 'null'),
              presentacionesMateriaPrima: JSON.parse(localStorage.getItem('catalogos_presentacionesMateriaPrima') || 'null'),
              nombresMateriaPrima: JSON.parse(localStorage.getItem('catalogos_nombresMateriaPrima') || 'null'),
              codigosMateriaPrima: JSON.parse(localStorage.getItem('catalogos_codigosMateriaPrima') || 'null'),
              especificacionesMateriaPrima: JSON.parse(localStorage.getItem('catalogos_especificacionesMateriaPrima') || 'null'),
            }

            // Setear todos los estados desde el caché
            if (cachedData.formas) setFormasFarmaceuticasOptions([{ value: "-1", text: "Todos" }, ...cachedData.formas])
            if (cachedData.sistemas) setObjetivosOptions([{ value: "-1", text: "Todos" }, ...cachedData.sistemas])
            if (cachedData.envases) setEnvasesOptions([{ value: "-1", text: "Todos" }, ...cachedData.envases])
            if (cachedData.presentaciones) setPresentaciones(cachedData.presentaciones)
            if (cachedData.tiposComision) setTiposComisionesOptions([{ value: "-1", text: "Todos" }, ...cachedData.tiposComision])
            if (cachedData.frecuencias) setFrecuencias(cachedData.frecuencias)
            if (cachedData.codigosMaestros) setCodigosMaestros(cachedData.codigosMaestros)
            if (cachedData.codigos) setCodigos(cachedData.codigos)
            if (cachedData.codigosInternos) setCodigosInternos(cachedData.codigosInternos)
            if (cachedData.nombresMateriales) {
              setNombresMateriales(cachedData.nombresMateriales)
              setNombreMaterialFiltrado(cachedData.nombresMateriales)
            }
            if (cachedData.codigosMateriales) {
              setCodigosMateriales(cachedData.codigosMateriales)
              setCodigoMaterialFiltrado(cachedData.codigosMateriales)
            }
            if (cachedData.detallesMateriales) {
              setDetallesMateriales(cachedData.detallesMateriales)
              setDetalleMaterialFiltrado(cachedData.detallesMateriales)
            }
            if (cachedData.especificacionesMateriales) {
              setEspecificacionesMateriales(cachedData.especificacionesMateriales)
              setEspecificacionesMaterialFiltrado(cachedData.especificacionesMateriales)
            }
            if (cachedData.familiasEmpaque) setFamiliasEmpaque(cachedData.familiasEmpaque)
            if (cachedData.paises) setPaises(cachedData.paises)
            if (cachedData.medidasEmpaque) setMedidasEmpaque(cachedData.medidasEmpaque)
            if (cachedData.nombresFormulas) {
              setNombresFormulas(cachedData.nombresFormulas)
              setNombreFormulaFiltrado(cachedData.nombresFormulas)
            }
            if (cachedData.codigosFormulas) {
              setCodigosFormulas(cachedData.codigosFormulas)
              setCodigoFormulaFiltrado(cachedData.codigosFormulas)
            }
            if (cachedData.especificacionesFormulas) {
              setEspecificacionesFormulas(cachedData.especificacionesFormulas)
              setEspecificacionesFormulaFiltrado(cachedData.especificacionesFormulas)
            }
            if (cachedData.formulas) setFormulasDropdown(cachedData.formulas)
            if (cachedData.medidasFormula) setMedidasFormula(cachedData.medidasFormula)
            if (cachedData.coloresEmpaque) setColoresEmpaque(cachedData.coloresEmpaque)
            if (cachedData.familiasMateriaPrima) setFamiliasMateriaPrima(cachedData.familiasMateriaPrima)
            if (cachedData.presentacionesMateriaPrima) setPresentacionesMateriaPrima(cachedData.presentacionesMateriaPrima)
            if (cachedData.nombresMateriaPrima) {
              setNombresMateriaPrima(cachedData.nombresMateriaPrima)
              setNombreMateriaPrimaFiltrado(cachedData.nombresMateriaPrima)
            }
            if (cachedData.codigosMateriaPrima) {
              setCodigosMateriaPrima(cachedData.codigosMateriaPrima)
              setCodigoMateriaPrimaFiltrado(cachedData.codigosMateriaPrima)
            }
            if (cachedData.especificacionesMateriaPrima) {
              setEspecificacionesMateriaPrima(cachedData.especificacionesMateriaPrima)
              setEspecificacionesMateriaPrimaFiltrado(cachedData.especificacionesMateriaPrima)
            }

            return // Salir sin hacer peticiones a Supabase
          } else {
            console.log(`[v0] Caché expirado (edad: ${Math.round(age/1000)}s), recargando...`)
          }
        } else {
          console.log('[v0] No hay caché, cargando catálogos desde Supabase...')
        }

        // GRUPO 1: Catálogos básicos (5 llamadas en paralelo con retry)
        console.log("[v0] Cargando GRUPO 1: Catálogos básicos...")
        const [formasResult, sistemasResult, envasesResult, presentacionesResult, tiposComisionResult] = await Promise.all([
          fetchWithRetry(() => listaDesplegableFormasFarmaceuticas(-1, "")),
          fetchWithRetry(() => listaDesplegableSistemas(-1, "")),
          fetchWithRetry(() => listaDesplegableEnvase()),
          fetchWithRetry(() => listadopresentacion()),
          fetchWithRetry(() => listadotipocomision()),
        ])

        if (formasResult.success && formasResult.data) {
          setFormasFarmaceuticasOptions([{ value: "-1", text: "Todos" }, ...formasResult.data])
        }

        if (sistemasResult.success && sistemasResult.data) {
          setObjetivosOptions([{ value: "-1", text: "Todos" }, ...sistemasResult.data])
        }

        if (envasesResult.success && envasesResult.data) {
          const envasesTransformed = envasesResult.data.map((envase: any) => ({
            value: envase.id?.toString() || envase.value,
            text: envase.nombre || envase.text,
          }))
          console.log("envatransformed", envasesTransformed)
          setEnvasesOptions([{ value: "-1", text: "Todos" }, ...envasesTransformed])
        }

        if (presentacionesResult.success && presentacionesResult.data) {
          setPresentaciones(presentacionesResult.data)
        }

          if (tiposComisionResult.success && tiposComisionResult.data) {
            setTiposComisionesOptions([{ value: "-1", text: "Todos" }, ...tiposComisionResult.data])
          }

        // GRUPO 2: Códigos y frecuencias (4 llamadas en paralelo con retry)
        console.log("[v0] Cargando GRUPO 2: Códigos y frecuencias...")
        const [frecuenciasResult, codigosMaestrosResult, codigosResult, codigosInternosResult] = await Promise.all([
          fetchWithRetry(() => listadofrecuencia()),
          fetchWithRetry(() => listadocodigomaestro()),
          fetchWithRetry(() => listadocodigo()),
          fetchWithRetry(() => listadocodigointerno()),
        ])

        if (frecuenciasResult.success && frecuenciasResult.data) {
          setFrecuencias(frecuenciasResult.data)
        }

        if (codigosMaestrosResult.success && codigosMaestrosResult.data) {
          setCodigosMaestros(codigosMaestrosResult.data)
          setCodigoMaestroFiltrado(codigosMaestrosResult.data)
        }

        if (codigosResult.success && codigosResult.data) {
          setCodigos(codigosResult.data)
          setCodigoFiltrado(codigosResult.data)
        }

        if (codigosInternosResult.success && codigosInternosResult.data) {
          setCodigosInternos(codigosInternosResult.data)
          setCodigoInternoFiltrado(codigosInternosResult.data)
        }

        // GRUPO 2: Materiales (con retry)
        const [nombresMaterialesResult, codigosMaterialesResult, detallesMat2Result, especificacionesMat2Result] = await Promise.all([
          fetchWithRetry(() => listadonombrematerial()),
          fetchWithRetry(() => listadocodigomaterial()),
          fetchWithRetry(() => listadodetallematerial()),
          fetchWithRetry(() => listadoespecificacionesmaterial()),
        ])

        if (nombresMaterialesResult.success && nombresMaterialesResult.data) {
          setNombresMateriales(nombresMaterialesResult.data)
          setNombreMaterialFiltrado(nombresMaterialesResult.data)
        }

        if (codigosMaterialesResult.success && codigosMaterialesResult.data) {
          setCodigosMateriales(codigosMaterialesResult.data)
          setCodigoMaterialFiltrado(codigosMaterialesResult.data)
        }

        if (detallesMat2Result.success && detallesMat2Result.data) {
          setDetallesMateriales(detallesMat2Result.data)
          setDetalleMaterialFiltrado(detallesMat2Result.data)
        }

        if (especificacionesMat2Result.success && especificacionesMat2Result.data) {
          setEspecificacionesMateriales(especificacionesMat2Result.data)
          setEspecificacionesMaterialFiltrado(especificacionesMat2Result.data)
        }

        // GRUPO 3: Detalles y especificaciones de materiales (5 llamadas en paralelo con retry)
        console.log("[v0] Cargando GRUPO 3: Detalles de materiales...")
        const [familiasEmpaque3Result, paises3Result, medidasEmpaque3Result] = await Promise.all([
          fetchWithRetry(() => listadofamiliamaterialempaque()),
          fetchWithRetry(() => listadopais()),
          fetchWithRetry(() => listadomedidaempaque()),
        ])

        console.log("paises3Result", paises3Result)

        if (familiasEmpaque3Result.success && familiasEmpaque3Result.data) {
          setFamiliasEmpaque(familiasEmpaque3Result.data)
        }

        if (paises3Result.success && paises3Result.data) {
          setPaises(paises3Result.data)
        }

        if (medidasEmpaque3Result.success && medidasEmpaque3Result.data) {
          setMedidasEmpaque(medidasEmpaque3Result.data)
        }

        // GRUPO 4: Fórmulas (6 llamadas en paralelo con retry)
        console.log("[v0] Cargando GRUPO 4: Fórmulas...")
        const [nombresFormulasResult, codigosFormulasResult, especificacionesFormulasResult, formulasDropdownResult, medidasFormulaResult, coloresEmpaqueResult] = await Promise.all([
          fetchWithRetry(() => listadonombresformulas()),
          fetchWithRetry(() => listadocodigosformulas()),
          fetchWithRetry(() => listadoespecificacionesformulas()),
          fetchWithRetry(() => listadoformula()),
          fetchWithRetry(() => listadomedidaformula()),
          fetchWithRetry(() => listadocolorempaque()),
        ])

        if (nombresFormulasResult.success && nombresFormulasResult.data) {
          setNombresFormulas(nombresFormulasResult.data)
          setNombreFormulaFiltrado(nombresFormulasResult.data)
        }

        if (codigosFormulasResult.success && codigosFormulasResult.data) {
          setCodigosFormulas(codigosFormulasResult.data)
          setCodigoFormulaFiltrado(codigosFormulasResult.data)
        }

        if (especificacionesFormulasResult.success && especificacionesFormulasResult.data) {
          setEspecificacionesFormulas(especificacionesFormulasResult.data)
          setEspecificacionesFormulaFiltrado(especificacionesFormulasResult.data)
        }

        if (formulasDropdownResult.success && formulasDropdownResult.data) {
          setFormulasDropdown(formulasDropdownResult.data)
        }

        if (medidasFormulaResult.success && medidasFormulaResult.data) {
          setMedidasFormula(medidasFormulaResult.data)
        }

        if (coloresEmpaqueResult.success && coloresEmpaqueResult.data) {
          setColoresEmpaque(coloresEmpaqueResult.data)
        }

        // GRUPO 5: Materias primas (5 llamadas en paralelo con retry)
        console.log("[v0] Cargando GRUPO 5: Materias primas...")
        const [familiasMateriaPrimaResult, presentacionesMateriaPrimaResult, nombresMateriaPrimaResult, codigosMateriaPrimaResult, especificacionesMateriaPrimaResult] = await Promise.all([
          fetchWithRetry(() => listadofamiliamateriaprima()),
          fetchWithRetry(() => listadopresentacionmateriaprima()),
          fetchWithRetry(() => listadonombresmateriaspri()),
          fetchWithRetry(() => listadocodigosmateriaspri()),
          fetchWithRetry(() => listadoespecificacionesmateriaspri()),
        ])

        if (familiasMateriaPrimaResult.success && familiasMateriaPrimaResult.data) {
          setFamiliasMateriaPrima(familiasMateriaPrimaResult.data)
        }

        if (presentacionesMateriaPrimaResult.success && presentacionesMateriaPrimaResult.data) {
          setPresentacionesMateriaPrima(presentacionesMateriaPrimaResult.data)
        }

        if (nombresMateriaPrimaResult.success && nombresMateriaPrimaResult.data) {
          setNombresMateriaPrima(nombresMateriaPrimaResult.data)
          setNombreMateriaPrimaFiltrado(nombresMateriaPrimaResult.data)
        }

        if (codigosMateriaPrimaResult.success && codigosMateriaPrimaResult.data) {
          setCodigosMateriaPrima(codigosMateriaPrimaResult.data)
          setCodigoMateriaPrimaFiltrado(codigosMateriaPrimaResult.data)
        }

        if (especificacionesMateriaPrimaResult.success && especificacionesMateriaPrimaResult.data) {
          setEspecificacionesMateriaPrima(especificacionesMateriaPrimaResult.data)
          setEspecificacionesMateriaPrimaFiltrado(especificacionesMateriaPrimaResult.data)
        }

        // Guardar todos los datos en localStorage para futuras visitas
        console.log('[v0] Guardando catálogos en caché...')
        try {
          localStorage.setItem('catalogos_formas', JSON.stringify(formasResult.data || []))
          localStorage.setItem('catalogos_sistemas', JSON.stringify(sistemasResult.data || []))
          const envasesTransformed = envasesResult.data?.map((envase: any) => ({
            value: envase.id?.toString() || envase.value,
            text: envase.nombre || envase.text,
          })) || []
          localStorage.setItem('catalogos_envases', JSON.stringify(envasesTransformed))
          localStorage.setItem('catalogos_presentaciones', JSON.stringify(presentacionesResult.data || []))
          localStorage.setItem('catalogos_tiposComision', JSON.stringify(tiposComisionResult.data || []))
          localStorage.setItem('catalogos_frecuencias', JSON.stringify(frecuenciasResult.data || []))
          localStorage.setItem('catalogos_codigosMaestros', JSON.stringify(codigosMaestrosResult.data || []))
          localStorage.setItem('catalogos_codigos', JSON.stringify(codigosResult.data || []))
          localStorage.setItem('catalogos_codigosInternos', JSON.stringify(codigosInternosResult.data || []))
          localStorage.setItem('catalogos_nombresMateriales', JSON.stringify(nombresMaterialesResult.data || []))
          localStorage.setItem('catalogos_codigosMateriales', JSON.stringify(codigosMaterialesResult.data || []))
          localStorage.setItem('catalogos_detallesMateriales', JSON.stringify(detallesMat2Result.data || []))
          localStorage.setItem('catalogos_especificacionesMateriales', JSON.stringify(especificacionesMat2Result.data || []))
          localStorage.setItem('catalogos_familiasEmpaque', JSON.stringify(familiasEmpaque3Result.data || []))
          localStorage.setItem('catalogos_paises', JSON.stringify(paises3Result.data || []))
          localStorage.setItem('catalogos_medidasEmpaque', JSON.stringify(medidasEmpaque3Result.data || []))
          localStorage.setItem('catalogos_nombresFormulas', JSON.stringify(nombresFormulasResult.data || []))
          localStorage.setItem('catalogos_codigosFormulas', JSON.stringify(codigosFormulasResult.data || []))
          localStorage.setItem('catalogos_especificacionesFormulas', JSON.stringify(especificacionesFormulasResult.data || []))
          localStorage.setItem('catalogos_formulas', JSON.stringify(formulasDropdownResult.data || []))
          localStorage.setItem('catalogos_medidasFormula', JSON.stringify(medidasFormulaResult.data || []))
          localStorage.setItem('catalogos_coloresEmpaque', JSON.stringify(coloresEmpaqueResult.data || []))
          localStorage.setItem('catalogos_familiasMateriaPrima', JSON.stringify(familiasMateriaPrimaResult.data || []))
          localStorage.setItem('catalogos_presentacionesMateriaPrima', JSON.stringify(presentacionesMateriaPrimaResult.data || []))
          localStorage.setItem('catalogos_nombresMateriaPrima', JSON.stringify(nombresMateriaPrimaResult.data || []))
          localStorage.setItem('catalogos_codigosMateriaPrima', JSON.stringify(codigosMateriaPrimaResult.data || []))
          localStorage.setItem('catalogos_especificacionesMateriaPrima', JSON.stringify(especificacionesMateriaPrimaResult.data || []))
          localStorage.setItem('catalogos_timestamp', Date.now().toString())
          console.log('[v0] Catálogos guardados en caché exitosamente')
        } catch (cacheError) {
          console.error('[v0] Error guardando en caché (continuando normalmente):', cacheError)
        }
      } catch (error) {
        console.error("Error loading dropdown options:", error)
        setModalError({
          Titulo: "Error al cargar opciones de filtros",
          Mensaje: `Hubo un error al cargar las opciones para los filtros avanzados: ${error}`,
        })
        setShowModalError(true)
      }
    }
    // Only load options if basic DDLs are loaded or if necessary\
    if (clientes.length > 0 && catalogos.length > 0) {
      cargarOpciones()
    } else if (clientes.length === 0 && catalogos.length === 0 && !showPageLoading) {
      // If basic DDLs didn't load correctly and page is not loading, try loading advanced options anyway.
      // This prevents double loading if cargarDatosIniciales already loaded them.
      // Or if there was an error in basic DDLs, we might still want to try loading advanced filters.
      cargarOpciones()
    }
  }, [clientes, catalogos, showPageLoading]) // Adjusted dependency
\
  useEffect(() => {
    const buscarFormulas = async () => {
      if (formulaBuscar.trim().length >= 1) {
        const resultados = await listaDesplegableFormulasBuscar(formulaBuscar)
        setFormulasResultados(resultados)
        setShowFormulasDropdown(true)
      } else {
        setFormulasResultados([])
        setShowFormulasDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarFormulas, 300)
    return () => clearTimeout(timeoutId)
  }, [formulaBuscar])

  useEffect(() => {\
    const buscarMateriaPrimas = async () => {
      if (materiaprimaBuscar.trim().length >= 1) {
        const resultados = await listaDesplegableMateriasPrimasBuscar(materiaprimaBuscar)
        setMateriaprimasResultados(resultados)
        setShowMateriaprimasDropdown(true)
      } else {
        setMateriaprimasResultados([])
        setShowMateriaprimasDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMateriaPrimas, 300)
    return () => clearTimeout(timeoutId)
  }, [materiaprimaBuscar])

  useEffect(() => {\
    const buscarEnvases = async () => {
      if (envaseBuscar.trim().length >= 1) {
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(envaseBuscar)
        const envasesFiltrados = resultados.filter((m) => m.tipomaterialid === 2)
        setEnvasesResultadosBuscar(envasesFiltrados)
        setShowEnvasesDropdown(envasesFiltrados.length > 0)
      } else {
        setEnvasesResultadosBuscar([])
        setShowEnvasesDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarEnvases, 300)
    return () => clearTimeout(timeoutId)
  }, [envaseBuscar])

  useEffect(() => {\
    const buscarEmpaques = async () => {
      if (empaqueBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(empaqueBuscar)
        const empaquesFiltrados = resultados.filter((m) => m.tipomaterialid === 1)
        setEmpaquesResultados(empaquesFiltrados)
        setShowEmpaqueDropdown(empaquesFiltrados.length > 0)
      } else {
        setEmpaquesResultados([])
        setShowEmpaqueDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarEmpaques, 300)
    return () => clearTimeout(timeoutId)
  }, [empaqueBuscar])
\
  // Effect for searching material of envase or empaque
  useEffect(() => {
    const buscarMaterialesEnvaseEmpaque = async () => {
      console.log("[v0] materialEnvaseBuscar changed to:", materialEnvaseBuscar)
      if (materialEnvaseBuscar.trim().length >= 1) {
        console.log("[v0] Calling listaDesplegableMaterialesEtiquetadosBuscar with:", materialEnvaseBuscar)
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(materialEnvaseBuscar)
        console.log("[v0] listaDesplegableMaterialesEtiquetadosBuscar result:", resultados)
        // Mapeamos a {id, text} para consistencia con el dropdown
        const materialesData = Array.isArray(resultados)
          ? resultados.map((m: any) => ({ id: m.id, text: m.nombre }))
          : []
        console.log("[v0] materialesData to set:", materialesData)
        setMaterialesEnvaseResultados(materialesData)
        setShowMaterialEnvaseDropdown(materialesData.length > 0)
        console.log("[v0] showMaterialEnvaseDropdown set to:", materialesData.length > 0)
      } else {
        setMaterialesEnvaseResultados([])
        setShowMaterialEnvaseDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMaterialesEnvaseEmpaque, 300)
    return () => clearTimeout(timeoutId)
  }, [materialEnvaseBuscar])

  // --- Manejadores (Handles) ---\
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const Nombre: string = filtroNombre.trim()
    console.log("[v0] DEBUG handleBuscar - clienteid conversion:", {
      filtroCliente: filtroCliente,
      filtroClienteType: typeof filtroCliente,
      parseInt: Number.parseInt(filtroCliente, 10),
      isNaN: isNaN(Number.parseInt(filtroCliente, 10))
    })
    const ClienteId = Number.parseInt(filtroCliente, 10)
    const ZonaId = Number.parseInt(filtroZona, 10)
    const CatalogoId = Number.parseInt(filtroCatalogo, 10)
    const Estatus = filtroEstatus
    const CodigoMaestro = filtroCodigoMaestro.trim()
    const Codigo = filtroCodigo.trim()
    const CodigoInterno = filtroCodigoInterno.trim()
    const Presentacion = filtroPresentacion.trim()
    const FormaFarmaceuticaId = Number.parseInt(filtroFormaFarmaceutica, 10)
    const Objetivo = Number.parseInt(filtroObjetivo, 10)
    const TipoComision = filtroTipoComision === "-1" ? "" : filtroTipoComision
    const Envase = filtroEnvase === "-1" ? "" : filtroEnvase
    const EnvaseMl = filtroEnvaseMl === "-1" ? "" : filtroEnvaseMl
    // Get the IDs from the selected states
    const FormulaId = formulaid === null ? -1 : formulaid
    const MateriaPrimaId = materiaprimaid === null ? -1 : materiaprimaid
    const MaterialEnvaseEmpaqueId = materialEnvaseid === null ? -1 : materialEnvaseid
    // Filtros a nivel fórmula
    const NombreFormula = formulaBuscar.trim()
    const CodigoFormula = filtroCodigoFormula.trim()
    const EspecificacionesFormula = filtroEspecificacionesFormula.trim()
    const Formula = filtroFormulaDropdown === "-1" ? "" : filtroFormulaDropdown
    const MedidasFormulas = filtroMedidasFormula === "-1" ? "" : filtroMedidasFormula
    // Filtros a nivel materiales
    const NombreMaterialEmpaque = materialEnvaseBuscar.trim()
    const CodigoEmpaque = filtroCodigoEmpaque.trim()
    const FamiliaEmpaque = filtroFamiliaEmpaque === "-1" ? "" : filtroFamiliaEmpaque
    const DetalleEmpaque = filtroDetalleEmpaque.trim()
    const EspecificacionesEmpaque = filtroEspecificacionesEmpaque.trim()
    const Pais = filtroPais === "-1" ? "" : filtroPais
    const MedidaEmpaque = filtroMedidaEmpaque === "-1" ? "" : filtroMedidaEmpaque
    const Color = filtroColor === "-1" ? "" : filtroColor
    // Filtros a nivel materia prima
    const NombreMateriaPrima = materiaprimaBuscar.trim()
    const CodigoMateriaPrima = filtroCodigoMateriaPrima.trim()
    const FamiliaMateriaPrima = filtroFamiliaMateriaPrima === "-1" ? "" : filtroFamiliaMateriaPrima
    const EspecificacionesMateriaPrima = filtroEspecificacionesMateriaPrima.trim()
    const PresentacionMateriaPrima = filtroPresentacionMateriaPrima === "-1" ? "" : filtroPresentacionMateriaPrima

    console.log(
      "habdel buscar: Nombre " +
        Nombre +
        " ClienteId:" +
        ClienteId +
        " ZonaId:" +
        ZonaId +
        " CatalogoId:" +
        CatalogoId +
        " Estatus:" +
        Estatus +
        " CodigoMaestro:" +
        CodigoMaestro +
        " Codigo:" +
        Codigo +
        " CodigoInterno:" +
        CodigoInterno +
        " Presentacion:" +
        Presentacion +
        " FormaFarmaceuticaId:" +
        FormaFarmaceuticaId +
        " Objetivo:" +
        Objetivo +
        " TipoComision:" +
        TipoComision +
        " Envase:" +
        Envase +
        " EnvaseMl:" +
        EnvaseMl +
        " FormulaId:" +
        FormulaId +
        " MateriaPrimaId:" +
        MateriaPrimaId +
        " MaterialEnvaseEmpaqueId:" +
        MaterialEnvaseEmpaqueId,
    )

    ejecutarBusquedaProductos(
      Nombre,
      ClienteId,
      ZonaId,
      CatalogoId,
      Estatus,
      Presentacion,
      FormaFarmaceuticaId, // Pass as number
      Objetivo, // Pass as number
      Envase, // Pass as string
      // Passing the selected IDs
      FormulaId,
      MateriaPrimaId,
      "", // Pass as string for advanced envase filter
      "", // Pass as string for empaque filter
      // Passing new filter values
      CodigoMaestro,
      Codigo,
      CodigoInterno,
      TipoComision,
      EnvaseMl,
      MaterialEnvaseEmpaqueId,
      // Filtros a nivel fórmula
      NombreFormula,
      CodigoFormula,
      EspecificacionesFormula,
      Formula,
      MedidasFormulas,
      // Filtros a nivel materiales
      NombreMaterialEmpaque,
      CodigoEmpaque,
      FamiliaEmpaque,
      DetalleEmpaque,
      EspecificacionesEmpaque,
      Pais,
      MedidaEmpaque,
      Color,
      // Filtros a nivel materia prima
      NombreMateriaPrima,
      CodigoMateriaPrima,
      FamiliaMateriaPrima,
      EspecificacionesMateriaPrima,
      PresentacionMateriaPrima,
    )
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    sessionStorage.removeItem("productosFilters")

    // Restablecer filtros
    setFiltroNombre("")
    setFiltroEstatus("-1")
    setFiltroCliente(esAdminDDLs ? "-1" : user?.ClienteId.toString() || "-1")
    setFiltroCatalogo("-1")
    setFiltroZona("-1")
    setFiltroPresentacion("")
    setFiltroFormaFarmaceutica("-1")
    setFiltroObjetivo("-1")
    setFiltroEnvase("-1")
    setFiltroFormula("") // Clear search term
    setFiltroMateriaPrima("") // Clear search term
    setFiltroEnvaseAvanzado("")
    setFiltroEmpaque("")
    // Resetting new filters
    setFiltroCodigoMaestro("")
    setFiltroCodigo("")
    setFiltroCodigoInterno("")
    setFiltroTipoComision("-1")
    setFiltroEnvaseMl("-1")
    setFiltroMaterialEnvaseEmpaque("") // Clear search term

    setFormulaBuscar("")
    setFiltroCodigoFormula("")
    setFiltroEspecificacionesFormula("")
    setFiltroFormulaDropdown("-1")
    setFiltroMedidasFormula("-1")
    setFiltroCodigoEmpaque("")
    setFiltroFamiliaEmpaque("-1")
    setFiltroDetalleEmpaque("")
    setFiltroEspecificacionesEmpaque("")
    setFiltroPais("-1")
    setFiltroMedidaEmpaque("-1")
    setFiltroColor("-1")
    setFiltroCodigoMateriaPrima("")
    setFiltroFamiliaMateriaPrima("-1")
    setFiltroEspecificacionesMateriaPrima("")
    setFiltroPresentacionMateriaPrima("-1")
    setFormulaid(null) // Clear ID
    setFormulaSeleccionada(null)

    setMateriaprimaBuscar("") // Corrected state variable name
    setMateriaprimaid(null) // Clear ID
    setMateriaprimaSeleccionada(null) // Corrected state variable name

    setEnvaseBuscar("")
    setEnvaseid(null)
    setEnvaseSeleccionado(null)

    setEmpaqueBuscar("")
    setEmpaqueid(null)
    setEmpaqueSeleccionado(null)

    setMaterialEnvaseBuscar("") // Added for new filter
    setMaterialEnvaseid(null) // Clear ID
    setMaterialEnvaseSeleccionado(null) // Added for new filter

    // Limpiar resultados
    setProductos([])
    setTotalProductos(0)
    setPaginaActual(1)

    ejecutarBusquedaProductos(
      "",
      -1,
      -1,
      -1,
      "True",
      "",
      -1, // Pass as number
      -1, // Pass as number
      "", // Pass as string
      // Passing the selected IDs
      -1,
      -1,
      "", // Pass as string for advanced envase filter
      "", // Pass as string for empaque filter
      // Passing new filter values
      "",
      "",
      "",
      "",
      "",
      -1,
    )
  }

  // Busqueda, camabiar cliente seleccionado
  const handleClienteChange = async (value: string) => {
    // Cambiar seleccion de filtro de cliente y resetear filtro de catálogo
    setFiltroCliente(value)
    setFiltroCatalogo("-1")

    try {
      // Transformar variable recibida
      const clienteIdNum = Number.parseInt(value, 10)

      // Cargar Zonas
      if (clienteIdNum !== -1) {
        const result = await listDesplegableZonas(-1, "", clienteIdNum)
        if (result.success && result.data) {
          setZonasOptions([{ value: "-1", text: "Todos" }, ...result.data])
          console.log("[v0] handleClienteChange - Loaded zones:", result.data)
        } else {
          console.error("Error cargando zonas por cliente:", result.error)
          setZonasOptions([{ value: "-1", text: "Todos" }]) // Reset zones if error
          setModalError({
            Titulo: "Error al cargar Zonas",
            Mensaje: result.error || "No se pudieron cargar las zonas para este cliente.",
          })
          setShowModalError(true)
        }
      } else {
        setZonasOptions([{ value: "-1", text: "Todos" }])
        setFiltroZona("-1") // Reset zona if "Todos" client is selected
        console.log("[v0] handleClienteChange - Resetting zones for 'Todos' client.")
      }

      // Preparar query para catálogos
      console.log("[v0] Calling listaDesplegableCatalogos with clienteIdNum:", clienteIdNum)
      const { data: catalogosData, error: catalogosError } = await listaDesplegableCatalogos(
        -1,
        "",
        clienteIdNum === -1 ? undefined : clienteIdNum, // Pass undefined if "Todos" client
      )
      console.log("[v0] catalogosData after handleClienteChange:", catalogosData, "catalogosError:", catalogosError)

      if (!catalogosError && catalogosData) {
        // Cargar input de filtro
        const catalogosConTodos = [{ value: "-1", text: "Todos" }, ...catalogosData]
        setCatalogos(catalogosConTodos)
        setFiltroCatalogo("-1") // Reset catalog filter when client changes
        console.log("[v0] handleClienteChange - Setting catalogs with:", catalogosConTodos)
      } else {
        // Mostrar error
        console.error("Error al cargar catálogos por cliente: ", catalogosError)
        setCatalogos([{ value: "-1", text: "Todos" }]) // Reset catalogs if error
        setModalError({
          Titulo: "Error al cargar Catálogos",
          Mensaje: catalogosError || "Error desconocido.",
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error al cambiar cliente: ", error)
      console.log("Error al cambiar cliente: ", error)
      setModalError({
        Titulo: "Error al cambiar cliente",
        Mensaje: `Error: ${error}`,
      })
      setShowModalError(true)
    }
  }

  // ESTE ES EL ÚNICO LUGAR DONDE SE EJECUTA LA BÚSQUEDA
  // Estatus - Cambiar activo/inactivo
  const handleToggleStatusClickActivo = async (productoId: number, productoActivo: boolean) => {
    try {
      const nuevoEstatus = !productoActivo
      const resultado = await estatusActivoProducto(productoId, nuevoEstatus)

      if (resultado.success) {
        // Actualizar el estado local para reflejar el cambio sin recargar todo
        setProductos((prev) => prev.map((p) => (p.id === productoId ? { ...p, activo: nuevoEstatus } : p)))
        // toast.success(`Producto ${nuevoEstatus ? "activado" : "inactivado"} correctamente.`)
      } else {
        setModalError({
          Titulo: "Error al cambiar estatus",
          Mensaje: resultado.message || "No se pudo cambiar el estatus del producto. Por favor, intente nuevamente.",
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

  const handleVerDetalles = (producto: oProductoAvanzado) => {
    router.push(`/productos/${producto.id}/ver`)
  }

  const handleToggleStatusClickProducto = (id: number, activo: boolean) => {
    setProductoToToggle({ id, activo })
    setShowConfirmDialog(true)
  }

  const cambiarEstadoProducto = async () => {
    if (!productoToToggle) return

    try {
      const { id, activo } = productoToToggle
      const nuevoEstado = !activo
      const { error } = await supabase.from("productos").update({ activo: nuevoEstado }).eq("id", id)

      if (error) {
        console.error("Error al cambiar estado:", error)
        //toast.error(`Error al cambiar estado del producto.`)
      } else {
        // Actualizar el estado local para reflejar el cambio sin recargar todo
        setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)))
        //toast.success(`Producto ${nuevoEstado ? "activado" : "inactivado"} correctamente.`)
      }
    } catch (error) {
      console.error("Error inesperado al cambiar estado:", error)
      //toast.error("Error inesperado al cambiar estado")
    }

    setShowConfirmDialog(false)
    setProductoToToggle(null)
  }

  const handleViewProductoDetails = (productId: number) => {
    // Placeholder function to handle view product details
    console.log(`View details for product ID: ${productId}`)
  }

  const handleFormulaSelect = (formula: any) => {
    console.log("formulaaaaa", formula)
    setFormulaSeleccionada({ id: formula.value, text: formula.text })
    setFormulaid(formula.value)
    setFormulaBuscar(formula.text)
    setShowFormulasDropdown(false)
    setFiltroFormula(formula.text) // Update the filter directly
  }

  const handleMateriaprimaSelect = (materiaPrima: any) => {
    setMateriaprimaSeleccionada({ id: materiaPrima.value, text: materiaPrima.text })
    setMateriaprimaid(materiaPrima.value)
    setMateriaprimaBuscar(materiaPrima.text)
    setShowMateriaprimasDropdown(false)
    setFiltroMateriaPrima(materiaPrima.text) // Update the filter directly
  }

  const handleEnvaseSelect = (envase: any) => {
    setEnvaseSeleccionado({ id: envase.id, text: envase.nombre })
    setEnvaseid(envase.id)
    setEnvaseBuscar(envase.nombre)
    setShowEnvasesDropdown(false)
    setFiltroEnvaseAvanzado(envase.nombre) // Update the filter directly
  }

  const handleEmpaqueSelect = (empaque: any) => {
    setEmpaqueSeleccionado({ id: empaque.id, text: empaque.nombre })
    setEmpaqueid(empaque.id)
    setEmpaqueBuscar(empaque.nombre)
    setShowEmpaqueDropdown(false)
    setFiltroEmpaque(empaque.nombre) // Update the filter directly
  }

  // Handler for selecting Material de Envase o Empaque
  const handleMaterialEnvaseSelect = (material: any) => {
    setMaterialEnvaseSeleccionado({ id: material.id, text: material.text })
    setMaterialEnvaseid(material.id)
    setMaterialEnvaseBuscar(material.text) // Set search term to selected item's text
    setShowMaterialEnvaseDropdown(false)
    setMaterialesEnvaseResultados([])
    setFiltroMaterialEnvaseEmpaque(material.text) // Update the filter directly
  }

  // --- Carga Inicial y Seguridad ---
  useEffect(() => {
    if (!authLoading) {
      // Validar usuario
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      // Iniciar carga de pagina
      const inicializar = async () => {
        setPageLoading({ message: "Cargando Productos..." })
        setShowPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin, esAdminDDLs, esAdminDOs])

  useEffect(() => {
    if (isLoadingInitialData) {
      console.log("[v0] useEffect filtroCliente - Waiting for initial data load to complete...")
      return
    }

    const cargarZonas = async () => {
      if (filtroCliente && filtroCliente !== "-1") {
        console.log("[v0] DEBUG useEffect filtroCliente - clienteid conversion:", {
          filtroCliente: filtroCliente,
          filtroClienteType: typeof filtroCliente,
          numberConverted: Number(filtroCliente),
          isNaN: isNaN(Number(filtroCliente))
        })
        const result = await listDesplegableZonas(-1, "", Number(filtroCliente))
        if (result.success && result.data) {
          setZonasOptions([{ value: "-1", text: "Todos" }, ...result.data])
          console.log("[v0] useEffect filtroCliente - Loaded zones:", result.data)
        } else {
          console.error("Error cargando zonas:", result.error)
          setZonasOptions([{ value: "-1", text: "Todos" }]) // Reset zones on error
        }
      } else {
        setZonasOptions([{ value: "-1", text: "Todos" }])
        setFiltroZona("-1")
        console.log("[v0] useEffect filtroCliente - Resetting zones for 'Todos' client.")
      }
    }
    // Only call if filtroCliente has changed and is not the initial "-1" or if it becomes "-1"
    if (filtroCliente) {
      cargarZonas()
    }
  }, [filtroCliente, isLoadingInitialData])

  // --- Renders (contenidos auxiliares) --
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
          <form id="frmProductosBuscar" name="frmProductosBuscar" className="space-y-4" onSubmit={handleBuscar}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="txtProductoNombre" className="text-sm font-medium">
                  Producto
                </label>
                <Input
                  id="txtProductoNombre"
                  name="txtProductoNombre"
                  type="text"
                  placeholder="Buscar por producto..."
                  maxLength={150}
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ddlClientes" className="text-sm font-medium">
                  Cliente
                </label>
                <Select name="ddlCliente" value={filtroCliente} onValueChange={handleClienteChange}>
                  <SelectTrigger id="ddlClientes">
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
              <div>
                <label htmlFor="ddlZona" className="text-sm font-medium">
                  Zona
                </label>
                <Select name="ddlZona" value={filtroZona} onValueChange={setFiltroZona}>
                  <SelectTrigger id="ddlZona">
                    <SelectValue placeholder="Selecciona una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonasOptions.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="ddlEstatus" className="text-sm font-medium">
                  Estatus
                </label>
                <Select name="ddlEstatus" value={filtroEstatus} onValueChange={setFiltroEstatus}>
                  <SelectTrigger id="ddlEstatus">
                    <SelectValue placeholder="Selecciona un estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos</SelectItem>
                    <SelectItem value="true" selected>Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                {showAdvancedFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Avanzada
              </button>
              <div className="flex-grow border-t border-muted-foreground/30"></div>
            </div>

            {showAdvancedFilters && (
              <div className="space-y-4 pt-4 border-t">
                {/* Subsección 1: A nivel Producto */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowProductoFilters(!showProductoFilters)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-gray-50"
                  >
                    <span>A nivel Producto</span>
                    {showProductoFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showProductoFilters && (
                    <div className="p-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <label htmlFor="txtProductoCodigoMaestro" className="text-sm font-medium">
                        Código Maestro
                      </label>
                      <Input
                        id="txtProductoCodigoMaestro"
                        type="text"
                        placeholder="Código maestro..."
                        value={filtroCodigoMaestro}
                        onChange={(e) => {
                          const value = e.target.value
                          setFiltroCodigoMaestro(value)
                          
                          // Filtrar códigos maestros
                          if (value) {
                            const filtrados = codigosMaestros.filter((codigo) =>
                              codigo.toLowerCase().includes(value.toLowerCase())
                            )
                            setCodigoMaestroFiltrado(filtrados)
                          } else {
                            setCodigoMaestroFiltrado(codigosMaestros)
                          }
                        }}
                        onFocus={() => setShowCodigoMaestroDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCodigoMaestroDropdown(false), 200)}
                      />
                      {showCodigoMaestroDropdown && codigoMaestroFiltrado.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {codigoMaestroFiltrado.map((codigo) => (
                            <div
                              key={codigo}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFiltroCodigoMaestro(codigo)
                                setShowCodigoMaestroDropdown(false)
                              }}
                            >
                              {codigo}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="txtProductoCodigo" className="text-sm font-medium">
                        Código
                      </label>
                      <Input
                        id="txtProductoCodigo"
                        type="text"
                        placeholder="Código..."
                        value={filtroCodigo}
                        onChange={(e) => {
                          const value = e.target.value
                          setFiltroCodigo(value)
                          
                          // Filtrar códigos
                          if (value) {
                            const filtrados = codigos.filter((codigo) =>
                              codigo.toLowerCase().includes(value.toLowerCase())
                            )
                            setCodigoFiltrado(filtrados)
                          } else {
                            setCodigoFiltrado(codigos)
                          }
                        }}
                        onFocus={() => setShowCodigoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCodigoDropdown(false), 200)}
                      />
                      {showCodigoDropdown && codigoFiltrado.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {codigoFiltrado.map((codigo) => (
                            <div
                              key={codigo}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFiltroCodigo(codigo)
                                setShowCodigoDropdown(false)
                              }}
                            >
                              {codigo}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="txtProductoCodigoInterno" className="text-sm font-medium">
                        Código Interno
                      </label>
                      <Input
                        id="txtProductoCodigoInterno"
                        type="text"
                        placeholder="Código Interno..."
                        value={filtroCodigoInterno}
                        onChange={(e) => {
                          const value = e.target.value
                          setFiltroCodigoInterno(value)
                          
                          // Filtrar códigos internos
                          if (value) {
                            const filtrados = codigosInternos.filter((codigoInterno) =>
                              codigoInterno.toLowerCase().includes(value.toLowerCase())
                            )
                            setCodigoInternoFiltrado(filtrados)
                          } else {
                            setCodigoInternoFiltrado(codigosInternos)
                          }
                        }}
                        onFocus={() => setShowCodigoInternoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCodigoInternoDropdown(false), 200)}
                      />
                      {showCodigoInternoDropdown && codigoInternoFiltrado.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {codigoInternoFiltrado.map((codigoInterno) => (
                            <div
                              key={codigoInterno}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFiltroCodigoInterno(codigoInterno)
                                setShowCodigoInternoDropdown(false)
                              }}
                            >
                              {codigoInterno}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                        <div>
                          <label htmlFor="ddlProductoCategoria" className="text-sm font-medium">
                            Tipo Comision
                          </label>
                          <Select value={filtroTipoComision} onValueChange={setFiltroTipoComision}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo Comision" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {tiposComisionesOptions.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlProductoEnvase" className="text-sm font-medium">
                            Envase
                          </label>
                          <Select value={filtroEnvase} onValueChange={setFiltroEnvase}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona envase" />
                            </SelectTrigger>
                            <SelectContent>
                              {envasesOptions.map((envase) => (
                                <SelectItem key={envase.value} value={envase.value}>
                                  {envase.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlProductoPresentacion" className="text-sm font-medium">
                            Presentación
                          </label>
                          <Select value={filtroPresentacion} onValueChange={setFiltroPresentacion}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona presentación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {presentaciones.map((presentacion) => (
                                <SelectItem key={presentacion} value={presentacion}>
                                  {presentacion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlProductoSubforma" className="text-sm font-medium">
                            Subforma
                          </label>
                          <Select value={filtroFormaFarmaceutica} onValueChange={setFiltroFormaFarmaceutica}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona subforma" />
                            </SelectTrigger>
                            <SelectContent>
                              {formasFarmaceuticasOptions.map((forma) => (
                                <SelectItem key={forma.value} value={forma.value}>
                                  {forma.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="txtProductoCantidad" className="text-sm font-medium">
                            Cantidad (Rango)
                          </label>
                          <Input
                            id="txtProductoCantidad"
                            type="text"
                            placeholder="Ej: 1-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="txtProductoDosis" className="text-sm font-medium">
                            Dosis (Rango)
                          </label>
                          <Input
                            id="txtProductoDosis"
                            type="text"
                            placeholder="Ej: 10-50"
                          />
                        </div>
                        <div>
                          <label htmlFor="ddlProductoFrecuencia" className="text-sm font-medium">
                            Frecuencia
                          </label>
                          <Select value={filtroNombre} onValueChange={(value) => setFiltroNombre(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {frecuencias.map((frecuencia) => (
                                <SelectItem key={frecuencia} value={frecuencia}>
                                  {frecuencia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlProductoSistema" className="text-sm font-medium">
                            Objetivo
                          </label>
                          <Select value={filtroObjetivo} onValueChange={setFiltroObjetivo}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {objetivosOptions.map((objetivo) => (
                                <SelectItem key={objetivo.value} value={objetivo.value}>
                                  {objetivo.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        
                      </div>
                    </div>
                  )}
                </div>

                {/* Subsección 2: A nivel Fórmula */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowFormulaFilters(!showFormulaFilters)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-gray-50"
                  >
                    <span>A nivel Fórmula</span>
                    {showFormulaFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showFormulaFilters && (
                    <div className="p-4 border-t space-y-4">
                      <input type="hidden" name="formulaid" value={formulaid || ""} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                          <label htmlFor="txtFormulaNombre" className="text-sm font-medium">
                            Nombre Formula
                          </label>
                          <Input
                            id="txtFormulaNombre"
                            type="text"
                            placeholder="Nombre de fórmula..."
                            value={formulaBuscar}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormulaBuscar(value)
                              
                              if (value) {
                                const filtrados = nombresFormulas.filter((nombre) =>
                                  nombre.toLowerCase().includes(value.toLowerCase())
                                )
                                setNombreFormulaFiltrado(filtrados)
                              } else {
                                setNombreFormulaFiltrado(nombresFormulas)
                              }
                            }}
                            onFocus={() => setShowNombreFormulaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowNombreFormulaDropdown(false), 200)}
                          />
                          {showNombreFormulaDropdown && nombreFormulaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {nombreFormulaFiltrado.map((nombre) => (
                                <div
                                  key={nombre}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFormulaBuscar(nombre)
                                    setShowNombreFormulaDropdown(false)
                                  }}
                                >
                                  {nombre}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label htmlFor="txtFormulaCodigo" className="text-sm font-medium">
                            Código
                          </label>
                          <Input
                            id="txtFormulaCodigo"
                            type="text"
                            placeholder="Código de fórmula..."
                            value={filtroCodigoFormula}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroCodigoFormula(value)
                              
                              if (value) {
                                const filtrados = codigosFormulas.filter((codigo) =>
                                  codigo.toLowerCase().includes(value.toLowerCase())
                                )
                                setCodigoFormulaFiltrado(filtrados)
                              } else {
                                setCodigoFormulaFiltrado(codigosFormulas)
                              }
                            }}
                            onFocus={() => setShowCodigoFormulaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowCodigoFormulaDropdown(false), 200)}
                          />
                          {showCodigoFormulaDropdown && codigoFormulaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {codigoFormulaFiltrado.map((codigo) => (
                                <div
                                  key={codigo}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroCodigoFormula(codigo)
                                    setShowCodigoFormulaDropdown(false)
                                  }}
                                >
                                  {codigo}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label htmlFor="txtFormulaEspecificaciones" className="text-sm font-medium">
                            Especificaciones
                          </label>
                          <Input
                            id="txtFormulaEspecificaciones"
                            type="text"
                            placeholder="Especificaciones..."
                            value={filtroEspecificacionesFormula}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroEspecificacionesFormula(value)
                              
                              if (value) {
                                const filtrados = especificacionesFormulas.filter((esp) =>
                                  esp.toLowerCase().includes(value.toLowerCase())
                                )
                                setEspecificacionesFormulaFiltrado(filtrados)
                              } else {
                                setEspecificacionesFormulaFiltrado(especificacionesFormulas)
                              }
                            }}
                            onFocus={() => setShowEspecificacionesFormulaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowEspecificacionesFormulaDropdown(false), 200)}
                          />
                          {showEspecificacionesFormulaDropdown && especificacionesFormulaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {especificacionesFormulaFiltrado.map((esp) => (
                                <div
                                  key={esp}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroEspecificacionesFormula(esp)
                                    setShowEspecificacionesFormulaDropdown(false)
                                  }}
                                >
                                  {esp}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label htmlFor="ddlFormula" className="text-sm font-medium">
                            Fórmula
                          </label>
                          <Select value={filtroFormulaDropdown} onValueChange={setFiltroFormulaDropdown}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona fórmula" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {formulasDropdown.map((formula) => (
                                <SelectItem key={formula} value={formula}>
                                  {formula}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlFormulaMedida" className="text-sm font-medium">
                            Medida Formula
                          </label>
                          <Select value={filtroMedidasFormula} onValueChange={setFiltroMedidasFormula}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona medida" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {medidasFormula.map((medida) => (
                                <SelectItem key={medida} value={medida}>
                                  {medida}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subsección 3: A nivel Materiales (empaque y/o envase) */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowMaterialesFilters(!showMaterialesFilters)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-gray-50"
                  >
                    <span>A nivel Materiales (empaque y/o envase)</span>
                    {showMaterialesFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showMaterialesFilters && (
                    <div className="p-4 border-t space-y-4">
                      <input type="hidden" name="materialenvaseid" value={materialEnvaseid || ""} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                      <label htmlFor="txtMaterialNombre" className="text-sm font-medium">
                        Nombre Empaque/Envase
                      </label>
                      <Input
                        id="txtMaterialNombre"
                        type="text"
                        placeholder="Nombre de material..."
                        value={materialEnvaseBuscar}
                        onChange={(e) => {
                          const value = e.target.value
                          setMaterialEnvaseBuscar(value)
                          
                          // Filtrar nombres de materiales
                          if (value) {
                            const filtrados = nombresMateriales.filter((nombre) =>
                              nombre.toLowerCase().includes(value.toLowerCase())
                            )
                            setNombreMaterialFiltrado(filtrados)
                          } else {
                            setNombreMaterialFiltrado(nombresMateriales)
                          }
                        }}
                        onFocus={() => setShowNombreMaterialDropdown(true)}
                        onBlur={() => setTimeout(() => setShowNombreMaterialDropdown(false), 200)}
                      />
                      {showNombreMaterialDropdown && nombreMaterialFiltrado.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {nombreMaterialFiltrado.map((nombre) => (
                            <div
                              key={nombre}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setMaterialEnvaseBuscar(nombre)
                                setShowNombreMaterialDropdown(false)
                              }}
                            >
                              {nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="txtMaterialCodigo" className="text-sm font-medium">
                        Código Empaque/Envase
                      </label>
                      <Input
                        id="txtMaterialCodigo"
                        type="text"
                        placeholder="Código de material..."
                        value={filtroCodigoEmpaque}
                        onChange={(e) => {
                          const value = e.target.value
                          setFiltroCodigoEmpaque(value)
                          
                          // Filtrar códigos de materiales
                          if (value) {
                            const filtrados = codigosMateriales.filter((codigo) =>
                              codigo.toLowerCase().includes(value.toLowerCase())
                            )
                            setCodigoMaterialFiltrado(filtrados)
                          } else {
                            setCodigoMaterialFiltrado(codigosMateriales)
                          }
                        }}
                        onFocus={() => setShowCodigoMaterialDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCodigoMaterialDropdown(false), 200)}
                      />
                      {showCodigoMaterialDropdown && codigoMaterialFiltrado.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {codigoMaterialFiltrado.map((codigo) => (
                            <div
                              key={codigo}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFiltroCodigoEmpaque(codigo)
                                setShowCodigoMaterialDropdown(false)
                              }}
                            >
                              {codigo}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                        <div>
                          <label htmlFor="ddlMaterialFamilia" className="text-sm font-medium">
                            Familia Empaque/Envase
                          </label>
                          <Select value={filtroFamiliaEmpaque} onValueChange={setFiltroFamiliaEmpaque}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona familia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {familiasEmpaque.map((familia) => (
                                <SelectItem key={familia} value={familia}>
                                  {familia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative">
                          <label htmlFor="txtMaterialDetalle" className="text-sm font-medium">
                            Detalle
                          </label>
                          <Input
                            id="txtMaterialDetalle"
                            type="text"
                            placeholder="Detalle..."
                            value={filtroDetalleEmpaque}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroDetalleEmpaque(value)
                              
                              // Filtrar detalles de materiales
                              if (value) {
                                const filtrados = detallesMateriales.filter((detalle) =>
                                  detalle.toLowerCase().includes(value.toLowerCase())
                                )
                                setDetalleMaterialFiltrado(filtrados)
                              } else {
                                setDetalleMaterialFiltrado(detallesMateriales)
                              }
                            }}
                            onFocus={() => setShowDetalleMaterialDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDetalleMaterialDropdown(false), 200)}
                          />
                          {showDetalleMaterialDropdown && detalleMaterialFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {detalleMaterialFiltrado.map((detalle) => (
                                <div
                                  key={detalle}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroDetalleEmpaque(detalle)
                                    setShowDetalleMaterialDropdown(false)
                                  }}
                                >
                                  {detalle}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label htmlFor="txtMaterialEspecificaciones" className="text-sm font-medium">
                            Especificaciones
                          </label>
                          <Input
                            id="txtMaterialEspecificaciones"
                            type="text"
                            placeholder="Especificaciones..."
                            value={filtroEspecificacionesEmpaque}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroEspecificacionesEmpaque(value)
                              
                              // Filtrar especificaciones de materiales
                              if (value) {
                                const filtrados = especificacionesMateriales.filter((especificacion) =>
                                  especificacion.toLowerCase().includes(value.toLowerCase())
                                )
                                setEspecificacionesMaterialFiltrado(filtrados)
                              } else {
                                setEspecificacionesMaterialFiltrado(especificacionesMateriales)
                              }
                            }}
                            onFocus={() => setShowEspecificacionesMaterialDropdown(true)}
                            onBlur={() => setTimeout(() => setShowEspecificacionesMaterialDropdown(false), 200)}
                          />
                          {showEspecificacionesMaterialDropdown && especificacionesMaterialFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {especificacionesMaterialFiltrado.map((especificacion) => (
                                <div
                                  key={especificacion}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroEspecificacionesEmpaque(especificacion)
                                    setShowEspecificacionesMaterialDropdown(false)
                                  }}
                                >
                                  {especificacion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label htmlFor="ddlMaterialPais" className="text-sm font-medium">
                            País
                          </label>
                          <Select value={filtroPais} onValueChange={setFiltroPais}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona país" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {paises.map((pais) => (
                                <SelectItem key={pais} value={pais}>
                                  {pais}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlMaterialMedida" className="text-sm font-medium">
                            Medida Empaque/Envase
                          </label>
                          <Select value={filtroMedidaEmpaque} onValueChange={setFiltroMedidaEmpaque}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona medida" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {medidasEmpaque.map((medida) => (
                                <SelectItem key={medida} value={medida}>
                                  {medida}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlMaterialColor" className="text-sm font-medium">
                            Color
                          </label>
                          <Select value={filtroColor} onValueChange={setFiltroColor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {coloresEmpaque.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subsección 4: A nivel Materia prima */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowMateriaPrimaFilters(!showMateriaPrimaFilters)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-gray-50"
                  >
                    <span>A nivel Materia prima</span>
                    {showMateriaPrimaFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {showMateriaPrimaFilters && (
                    <div className="p-4 border-t space-y-4">
                      <input type="hidden" name="materiaprimaid" value={materiaprimaid || ""} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                          <label htmlFor="txtMateriaNombre" className="text-sm font-medium">
                            Nombre Materia Prima
                          </label>
                          <Input
                            id="txtMateriaNombre"
                            type="text"
                            placeholder="Nombre de materia prima..."
                            value={materiaprimaBuscar}
                            onChange={(e) => {
                              const value = e.target.value
                              setMateriaprimaBuscar(value)
                              
                              if (value) {
                                const filtrados = nombresMateriaPrima.filter((nombre) =>
                                  nombre.toLowerCase().includes(value.toLowerCase())
                                )
                                setNombreMateriaPrimaFiltrado(filtrados)
                              } else {
                                setNombreMateriaPrimaFiltrado(nombresMateriaPrima)
                              }
                            }}
                            onFocus={() => setShowNombreMateriaPrimaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowNombreMateriaPrimaDropdown(false), 200)}
                          />
                          {showNombreMateriaPrimaDropdown && nombreMateriaPrimaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {nombreMateriaPrimaFiltrado.map((nombre) => (
                                <div
                                  key={nombre}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setMateriaprimaBuscar(nombre)
                                    setShowNombreMateriaPrimaDropdown(false)
                                  }}
                                >
                                  {nombre}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label htmlFor="txtMateriaCodigo" className="text-sm font-medium">
                            Código Materia Prima
                          </label>
                          <Input
                            id="txtMateriaCodigo"
                            type="text"
                            placeholder="Código..."
                            value={filtroCodigoMateriaPrima}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroCodigoMateriaPrima(value)
                              
                              if (value) {
                                const filtrados = codigosMateriaPrima.filter((codigo) =>
                                  codigo.toLowerCase().includes(value.toLowerCase())
                                )
                                setCodigoMateriaPrimaFiltrado(filtrados)
                              } else {
                                setCodigoMateriaPrimaFiltrado(codigosMateriaPrima)
                              }
                            }}
                            onFocus={() => setShowCodigoMateriaPrimaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowCodigoMateriaPrimaDropdown(false), 200)}
                          />
                          {showCodigoMateriaPrimaDropdown && codigoMateriaPrimaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {codigoMateriaPrimaFiltrado.map((codigo) => (
                                <div
                                  key={codigo}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroCodigoMateriaPrima(codigo)
                                    setShowCodigoMateriaPrimaDropdown(false)
                                  }}
                                >
                                  {codigo}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label htmlFor="txtMateriaEspecificaciones" className="text-sm font-medium">
                            Especificaciones Materia Prima
                          </label>
                          <Input
                            id="txtMateriaEspecificaciones"
                            type="text"
                            placeholder="Especificaciones..."
                            value={filtroEspecificacionesMateriaPrima}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiltroEspecificacionesMateriaPrima(value)
                              
                              if (value) {
                                const filtrados = especificacionesMateriaPrima.filter((esp) =>
                                  esp.toLowerCase().includes(value.toLowerCase())
                                )
                                setEspecificacionesMateriaPrimaFiltrado(filtrados)
                              } else {
                                setEspecificacionesMateriaPrimaFiltrado(especificacionesMateriaPrima)
                              }
                            }}
                            onFocus={() => setShowEspecificacionesMateriaPrimaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowEspecificacionesMateriaPrimaDropdown(false), 200)}
                          />
                          {showEspecificacionesMateriaPrimaDropdown && especificacionesMateriaPrimaFiltrado.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {especificacionesMateriaPrimaFiltrado.map((esp) => (
                                <div
                                  key={esp}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFiltroEspecificacionesMateriaPrima(esp)
                                    setShowEspecificacionesMateriaPrimaDropdown(false)
                                  }}
                                >
                                  {esp}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label htmlFor="ddlMateriaFamilia" className="text-sm font-medium">
                            Familia
                          </label>
                          <Select value={filtroFamiliaMateriaPrima} onValueChange={setFiltroFamiliaMateriaPrima}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona familia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {familiasMateriaPrima.map((familia) => (
                                <SelectItem key={familia} value={familia}>
                                  {familia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="ddlMateriaPresentacion" className="text-sm font-medium">
                            Presentación
                          </label>
                          <Select value={filtroPresentacionMateriaPrima} onValueChange={setFiltroPresentacionMateriaPrima}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona presentación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Todos</SelectItem>
                              {presentacionesMateriaPrima.map((presentacion) => (
                                <SelectItem key={presentacion} value={presentacion}>
                                  {presentacion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                id="btnProductosLimpiar"
                name="btnProductosLimpiar"
                type="button"
                variant="outline"
                className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={handleLimpiar}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar
              </Button>
              <Button
                id="btnProductosBuscar"
                name="btnProductosBuscar"
                type="submit"
                className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Search className="mr-2 h-3 w-3" />}{" "}
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Resultados - Listado */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {elementosPaginados.length} de {totalProductos} elementos encontrados.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSearching && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="ml-2">Buscando resultados.....</span>
            </div>
          )}

          {!isSearching && (productosFiltrados.length > 0 || elementosPaginados.length > 0) ? (
            <>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center space-x-2 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {elementosPaginados.map((p, index) => (
                  <Card
                    key={`${p.id}-${p.CatalogoId}-${index}`}
                    className="border bg-card text-card-foreground relative flex flex-col overflow-hidden rounded-xs shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Image at top */}
                    <div
                      className="relative w-full h-48 overflow-hidden cursor-pointer bg-gray-100"
                      onClick={() => handleVerDetalles(p)}
                      title="Ver detalles del producto"
                    >
                      <img
                        src={p.imgurl || "/placeholder.svg?height=200&width=200&text=Producto"}
                        alt={p.nombre}
                        className="w-full h-full object-contain rounded-t-xs"
                      />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${p.estatus === "true" || p.estatus === "1" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                      >
                        {p.estatus === "true" || p.estatus === "1" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    </div>

                    {/* Card content */}
                    <CardContent className="flex flex-col flex-grow p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{p.productoprincipal}</h3>
                      {/* Zona */}
                      {p.zona && <p className="text-xs text-gray-500 mb-2">{p.zona}</p>}
                      {/* Presentación above Código and removed label */}
                      <p className="text-sm text-gray-600 mb-2">{p.presentacion || "n/A"}</p>
                      <p className="text-sm text-gray-600 mb-2">Código: {p.codigo || "Sin código."}</p>
                      <div className="text-sm">
                        <p>
                          <span className="font-bold text-black">Subforma:</span> {p.subforma || "n/A"}
                        </p>
                        <p>
                          <span className="font-bold text-black">Precio HL:</span> {formatCurrency(Number(p.preciohl) || 0)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <div className="flex gap-3 justify-center mt-auto w-full">
                          {/* Ver - Navigates to ver page */}
                          <div className="flex flex-col items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver Cliente"
                              onClick={() => router.push(`/productos/${p.id}/ver`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground mt-1">Ver</span>
                          </div>

                          {/* Conditional div to show "hola" if esAdminDOs is true */}
                          {esAdminDOs && (
                            <>
                              <div className="flex flex-col items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Editar"
                                  onClick={() => router.push(`/productos/${p.id}/editar`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground mt-1">Editar</span>
                              </div>

                              {/* Toggle status button */}
                              <div className="flex flex-col items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={p.estatus === "true" || p.estatus === "1" ? "Inactivar" : "Activar"}
                                  onClick={() => handleToggleStatusClickActivo(p.id, p.estatus === "true" || p.estatus === "1")}
                                >
                                  {p.estatus === "true" || p.estatus === "1" ? (
                                    <ToggleRight className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <span className="text-xs text-muted-foreground mt-1">Estatus</span>
                              </div>

                              {/* Delete button */}
                              <div className="flex flex-col items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Eliminar"
                                  onClick={() => router.push(`/productos/${p.id}/eliminar`)}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                                <span className="text-xs text-muted-foreground mt-1">Eliminar</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No se encontraron resultados.</div>
          )}
        </CardContent>
      </Card>

      {/* Removed modal dialog for product details */}
    </div>
  )
}\
