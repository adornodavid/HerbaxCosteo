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
import type { Producto, oProducto, ProductoListado, ProductosEstadisticas } from "@/types/productos"
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
import { obtenerProductos, estatusActivoProducto } from "@/app/actions/productos"
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
  const [filtroEstatus, setFiltroEstatus] = useState("-1")
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [filtroCatalogo, setFiltroCatalogo] = useState("-1")
  const [filtroZona, setFiltroZona] = useState("-1") // Declare filtroZona
  const [clientes, setClientes] = useState<ddlItem[]>([])
  const [catalogos, setCatalogos] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([{ value: "-1", text: "Todos" }])

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
  const [productos, setProductos] = useState<ProductoListado[]>([])
  const [estadisticas, setEstadisticas] = useState<ProductosEstadisticas>({
    totalProductos: 0,
    costoPromedio: 0,
    costoTotal: 0, // Inicializado a 0
    tiempoPromedio: "N/A",
  })
  const [productosFiltrados, setProductosFiltrados] = useState<oProducto[]>([])
  const [totalProductos, setTotalProductos] = useState(0)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productoToToggle, setProductoToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Este estado no se usa en la búsqueda actual, pero se mantiene
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null)

  // Filtros
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filtroPresentacion, setFiltroPresentacion] = useState("")
  const [filtroFormaFarmaceutica, setFiltroFormaFarmaceutica] = useState("-1")
  const [filtroObjetivo, setFiltroObjetivo] = useState("-1")
  const [filtroEnvase, setFiltroEnvase] = useState("-1")
  const [filtroFormula, setFiltroFormula] = useState("")
  const [filtroMateriaPrima, setFiltroMateriaPrima] = useState("")
  const [filtroEnvaseAvanzado, setFiltroEnvaseAvanzado] = useState("")
  const [filtroEmpaque, setFiltroEmpaque] = useState("")

  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroTipoComision, setFiltroTipoComision] = useState("-1")
  const [filtroEnvaseMl, setFiltroEnvaseMl] = useState("-1")
  const [filtroMaterialEnvaseEmpaque, setFiltroMaterialEnvaseEmpaque] = useState("")

  const [formulaBuscar, setFormulaBuscar] = useState("")
  const [formulasResultados, setFormulasResultados] = useState<any[]>([])
  const [formulaSeleccionada, setFormulaSeleccionada] = useState<{ id: number; text: string } | null>(null)
  const [formulaid, setFormulaid] = useState<number | null>(null)
  const [showFormulasDropdown, setShowFormulasDropdown] = useState(false)

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
    codigo: string,
    tipocomision: string,
    envaseeml: string,
    // materialenvaseempId: number | null, // Changed to accept ID
    filtroMaterialEnvaseEmpId: number | -1,
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
          " catalogoid: " +
          catalogoid +
          " estatus: " +
          estatus +
          " presentacion: " +
          presentacion +
          " formafarmaceuticaid: " +
          formafarmaceuticaid +
          "  objetivo: " +
          objetivo +
          " envase: " +
          envase +
          " filtroFormulaId: " +
          filtroFormulaId +
          " filtroMateriaPrimaId: " +
          filtroMateriaPrimaId +
          " envaseavanzado: " +
          envaseavanzado +
          " empaque: " +
          empaque +
          "codigo: " +
          codigo +
          " tipocomision: " +
          tipocomision +
          " envaseeml: " +
          envaseeml +
          " filtroMaterialEnvaseEmpId: " +
          filtroMaterialEnvaseEmpId,
      )
      const result = await obtenerProductos(
        -1, // productoid
        productonombre,
        clienteid,
        zonaid,
        catalogoid,
        auxEstatus,
        codigo,
        presentacion, // Keep as string, don't convert
        formafarmaceuticaidNum, // Now passing as number
        sistemaIdNum, // Now passing as number (converted from objetivo)
        tipocomision,
        envase, // Keep as string, don't convert
        envaseeml,
        formulaidNum, // Now passing as number
        materiaprimaidNum, // Now passing as number
        materialIdNum, // Now passing as number
      )
      console.log(
        "parametros: " +
          "productonombre: " +
          productonombre +
          " clienteid: " +
          clienteid +
          " zonaid: " +
          zonaid +
          " catalogoid: " +
          catalogoid +
          " auxEstatus: " +
          auxEstatus +
          " presentacion: " +
          presentacion +
          " formafarmaceuticaidNum: " +
          formafarmaceuticaidNum +
          "  sistemaIdNum: " +
          sistemaIdNum +
          " envase: " +
          envase +
          " formulaidNum: " +
          formulaidNum +
          " materiaprimaidNum: " +
          materiaprimaidNum +
          " envaseavanzado: " +
          envaseavanzado +
          " empaque: " +
          empaque +
          "codigo: " +
          codigo +
          " tipocomision: " +
          tipocomision +
          " envaseeml: " +
          envaseeml +
          " materialIdNum: " +
          materialIdNum,
      )
      console.log("result: " + result.success)
      console.log("result.data: " + result.data)
      if (result.success && result.data) {
        const transformedData: oProducto[] = result.data.map((p: oProducto) => ({
          id: p.id,
          producto: p.producto,
          presentacion: p.presentacion,
          nombre: p.nombre,
          formafarmaceuticaid: p.formafarmaceuticaid,
          formasfarmaceuticas: {
            nombre: p.formasfarmaceuticas?.nombre || null,
          },
          porcion: p.porcion,
          sistemaid: p.sistemaid,
          sistemas: {
            nombre: p.sistemas?.nombre || null,
          },
          codigomaestro: p.codigomaestro || null,
          codigo: p.codigo,
          envase: p.envase || null,
          envaseml: p.envaseml || null,
          clienteid: p.clienteid,
          clientes: {
            nombre: p.clientes?.nombre || null,
          },
          zonaid: p.zonaid,
          zonas: {
            nombre: p.zonas?.nombre || null,
          },
          categoria: p.categoria,
          imgurl: p.imgurl,
          unidadmedidaid: p.unidadmedidaid,
          unidadesmedida: {
            descripcion: p.unidadesmedida?.descripcion || null,
          },
          mp: p.mp,
          mem: p.mem,
          me: p.me,
          ms: p.ms,
          mp_porcentaje: p.mp_porcentaje,
          mem_porcentaje: p.mem_porcentaje,
          me_porcentaje: p.me_porcentaje,
          ms_porcentaje: p.ms_porcentaje,
          mp_costeado: p.mp_costeado,
          mem_costeado: p.mem_costeado,
          me_costeado: p.me_costeado,
          ms_costeado: p.ms_costeado,
          costo: p.costo,
          preciohl: p.preciohl,
          utilidadhl: p.utilidadhl,
          forecasthl: p.forecasthl,
          preciosinivaaa: p.preciosinivaaa,
          precioconivaaa: p.precioconivaaa,
          fechacreacion: p.fechacreacion,
          activo: p.activo,
          productoscaracteristicas:
            p.productoscaracteristicas?.map((pc) => ({
              // Mapping products_characteristics correctly
              id: pc.id,
              productoId: pc.productoId,
              descripcion: pc.descripcion,
              presentacion: pc.presentacion,
              porcion: pc.porcion,
              modouso: pc.modouso,
              porcionenvase: pc.porcionenvase,
              categoriauso: pc.categoriauso,
              propositoprincipal: pc.propositoprincipal,
              propuestavalor: pc.propuestavalor,
              instruccionesingesta: pc.instruccionesingesta,
              edadminima: pc.edadminima,
              advertencia: pc.advertencia,
              condicionesalmacenamiento: pc.condicionesalmacenamiento,
            })) || null, // Assuming products_characteristics is a single object or array of one
          productosxcatalogo:
            p.productosxcatalogo?.map((cat) => ({
              catalogoid: cat.catalogoid || null,
              precioventa: cat.precioventa || null,
              margenutilidad: cat.margenutilidad || null,
              catalogos: {
                nombre: cat.catalogos?.nombre || null,
                descripcion: cat.catalogos?.descripcion || null,
              },
            })) || [],
          formulasxproducto:
            p.formulasxproducto?.map((fxp) => ({
              formulaid: fxp.formulaid || null,
              formulas:
                {
                  codigo: fxp.formulas?.codigo || null,
                  nombre: fxp.formulas?.nombre || null,
                  unidadmedidaid: fxp.formulas?.unidadmedidaid || null,
                  unidadesmedida: {
                    descripcion: fxp.unidadesmedida?.descripcion || null,
                  },
                  costo: fxp.formulas?.costo || null,
                  materiasprimasxformula:
                    fxp.materiasprimasxformula?.map((mxf) => ({
                      materiaprimaid: mxf.materiaprimaid || null,
                      cantidad: mxf.cantidad || null,
                      costoparcial: mxf.costoparcial || null,
                      materiasprima: {
                        codigo: mxf.materiasprima?.codigo || null,
                        nombre: mxf.materiasprima?.nombre || null,
                        unidadmedidaid: mxf.materiasprima?.unidadmedidaid || null, // Corrected from codigo
                        unidadesmedida: {
                          descripcion: mxf.unidadesmedida?.descripcion || null,
                        },
                        costo: mxf.materiasprima?.costo || null,
                      },
                    })) || [],
                  formulasxformula:
                    fxp.formulasxformula?.map((fxf) => ({
                      secundariaid: fxf.secundariaid || null,
                      cantidad: fxf.cantidad || null,
                      costoparcial: fxf.costoparcial || null,
                      formulas: {
                        codigo: fxf.formulas?.codigo || null,
                        nombre: fxf.formulas?.nombre || null,
                        unidadmedidaid: fxf.formulas?.unidadmedidaid || null, // Corrected from codigo
                        unidadesmedida: {
                          descripcion: fxf.unidadesmedida?.descripcion || null,
                        },
                        costo: fxf.formulas?.costo || null,
                      },
                    })) || [],
                } || null,
            })) || [],
        }))

        const productosListado: oProducto[] = transformedData

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
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    // Validar existe usuario
    if (!user) return

    try {
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

      // -- Cargar DDLs primero
      // DDL Clientes
      console.log("[v0] Calling listaDesplegableClientes with:", auxClienteId)
      const { data: clientesData, error: clientesError } = await listaDesplegableClientes(auxClienteId, "")
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

      const tiposComisionesResult = await listaDesplegableProductosTiposComisiones(-1, "")
      if (tiposComisionesResult.success && tiposComisionesResult.data) {
        setTiposComisionesOptions([{ value: "-1", text: "Todos" }, ...tiposComisionesResult.data])
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
        setFiltroCodigo(filters.filtroCodigo || "")
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

        // If there is a selected client, load zones
        if (filters.filtroCliente && filters.filtroCliente !== "-1") {
          const zonasResult = await listDesplegableZonas(-1, "", Number(filters.filtroCliente))
          if (zonasResult.success && zonasResult.data) {
            setZonasOptions([{ value: "-1", text: "Todos" }, ...zonasResult.data])
            console.log("[v0] Loaded zones after restoring filters:", zonasResult.data)
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
        const Result = await ejecutarBusquedaProductos(
          filters.filtroNombre || "",
          Number(filters.filtroCliente) || auxClienteId,
          Number(filters.filtroZona) || -1,
          Number(filters.filtroCatalogo) || -1,
          filters.filtroEstatus || "True",
          filters.filtroPresentacion || "",
          Number(filters.filtroFormaFarmaceutica) || -1,
          Number(filters.filtroObjetivo) || -1,
          filters.filtroEnvase || "-1",
          // Pass the selected IDs for formula, material prima, and material envase empaque
          formulaid,
          materiaprimaid,
          filters.filtroEnvaseAvanzado || "",
          filters.filtroEmpaque || "",
          // Passing restored new filters
          filters.filtroCodigo || "",
          filters.filtroTipoComision === "-1" ? "" : filters.filtroTipoComision, // Use conditional logic here
          filters.filtroEnvaseMl || "-1",
          materialEnvaseid,
        )

        if (!Result.success) {
          setModalAlert({
            Titulo: "En ejecución de búsqueda con filtros guardados",
            Mensaje: Result.mensaje,
          })
          setShowModalAlert(true)
        }
      } else {
        console.log("[v0] No saved filters found, performing initial search.")
        const Result = await ejecutarBusquedaProductos(
          "", // filtroNombre
          auxClienteId, // clienteid
          -1, // zonaid
          -1, // catalogoid
          "True", // estatus
          "", // filtroPresentacion
          -1, // filtroFormaFarmaceutica
          -1, // filtroObjetivo
          "", // filtroEnvase
          -1, // filtroFormulaId (default to null if no saved filter)
          -1, // filtroMateriaPrimaId (default to null if no saved filter)
          "", // filtroEnvaseAvanzado
          "", // filtroEmpaque
          // Passing default values for new filters
          "", // filtroCodigo
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
    } catch (error) {
      console.error("Error al cargar datos iniciales: ", error)
      console.log("Error al cargar datos iniciales: ", error)
      setModalError({
        Titulo: "Error al cargar datos iniciales",
        Mensaje: `Error: ${error}`,
      })
      setShowModalError(true)
    } finally {
      setShowPageLoading(false)
    }
  }

  // --- Cargar Opciones para DDLs Avanzados ---
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        const [formasResult, sistemasResult, envasesResult] = await Promise.all([
          listaDesplegableFormasFarmaceuticas(-1, ""),
          listaDesplegableSistemas(-1, ""), // Assuming 'listaDesplegableSistemas' provides data for 'Objetivo (Uso)'
          listaDesplegableEnvase(),
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
          setEnvasesOptions([{ value: "-1", text: "Todos" }, ...envasesTransformed]) // Changed "Todos" value to "-1"
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
    // Only load options if basic DDLs are loaded or if necessary
    if (clientes.length > 0 && catalogos.length > 0) {
      cargarOpciones()
    } else if (clientes.length === 0 && catalogos.length === 0 && !showPageLoading) {
      // If basic DDLs didn't load correctly and page is not loading, try loading advanced options anyway.
      // This prevents double loading if cargarDatosIniciales already loaded them.
      // Or if there was an error in basic DDLs, we might still want to try loading advanced filters.
      cargarOpciones()
    }
  }, [clientes, catalogos, showPageLoading]) // Adjusted dependency

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

  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
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

  // Effect for searching material of envase or empaque
  useEffect(() => {
    const buscarMaterialesEnvaseEmpaque = async () => {
      if (materialEnvaseBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(materialEnvaseBuscar)
        setMaterialesEnvaseResultados(resultados)
        setShowMaterialEnvaseDropdown(resultados.length > 0)
      } else {
        setMaterialesEnvaseResultados([])
        setShowMaterialEnvaseDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMaterialesEnvaseEmpaque, 300)
    return () => clearTimeout(timeoutId)
  }, [materialEnvaseBuscar])

  // --- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const Nombre: string = filtroNombre.trim()
    const ClienteId = Number.parseInt(filtroCliente, 10)
    const ZonaId = Number.parseInt(filtroZona, 10)
    const CatalogoId = Number.parseInt(filtroCatalogo, 10)
    const Estatus = filtroEstatus
    const Codigo = filtroCodigo.trim()
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
        " Codigo:" +
        Codigo +
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
      Envase, // Pass as string for advanced envase filter
      "", // Pass as string for empaque filter
      // Passing new filter values
      Codigo,
      TipoComision,
      EnvaseMl,
      MaterialEnvaseEmpaqueId,
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
    setFiltroCodigo("")
    setFiltroTipoComision("-1")
    setFiltroEnvaseMl("-1")
    setFiltroMaterialEnvaseEmpaque("") // Clear search term

    setFormulaBuscar("")
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

  const handleVerDetalles = (producto: oProducto) => {
    // Changed type to oProducto
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
        setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, activo: nuevoEstado } : p))) // Corrected property name
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
    const cargarZonas = async () => {
      if (filtroCliente && filtroCliente !== "-1") {
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
  }, [filtroCliente])

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
                    <SelectItem value="true">Activo</SelectItem>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="txtCodigo" className="text-sm font-medium">
                      Código
                    </label>
                    <Input
                      id="txtCodigo"
                      name="txtCodigo"
                      type="text"
                      placeholder="Buscar por código..."
                      value={filtroCodigo}
                      onChange={(e) => setFiltroCodigo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="txtPresentacion" className="text-sm font-medium">
                      Presentación
                    </label>
                    <Input
                      id="txtPresentacion"
                      name="txtPresentacion"
                      type="text"
                      placeholder="Buscar por presentación..."
                      value={filtroPresentacion}
                      onChange={(e) => setFiltroPresentacion(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="ddlFormaFarmaceutica" className="text-sm font-medium">
                      Forma farmacéutica
                    </label>
                    <Select
                      name="ddlFormaFarmaceutica"
                      value={filtroFormaFarmaceutica}
                      onValueChange={setFiltroFormaFarmaceutica}
                    >
                      <SelectTrigger id="ddlFormaFarmaceutica">
                        <SelectValue placeholder="Selecciona forma" />
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
                    <label htmlFor="ddlObjetivo" className="text-sm font-medium">
                      Objetivo (Uso)
                    </label>
                    <Select name="ddlObjetivo" value={filtroObjetivo} onValueChange={setFiltroObjetivo}>
                      <SelectTrigger id="ddlObjetivo">
                        <SelectValue placeholder="Selecciona objetivo" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="ddlTipoComision" className="text-sm font-medium">
                      Tipo de Comisión
                    </label>
                    <Select name="ddlTipoComision" value={filtroTipoComision} onValueChange={setFiltroTipoComision}>
                      <SelectTrigger id="ddlTipoComision">
                        <SelectValue placeholder="Selecciona tipo comisión" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposComisionesOptions.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="ddlEnvase" className="text-sm font-medium">
                      Envase
                    </label>
                    <Select name="ddlEnvase" value={filtroEnvase} onValueChange={setFiltroEnvase}>
                      <SelectTrigger id="ddlEnvase">
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
                    <label htmlFor="ddlEnvaseMl" className="text-sm font-medium">
                      Envase ML
                    </label>
                    <Select name="ddlEnvaseMl" value={filtroEnvaseMl} onValueChange={setFiltroEnvaseMl}>
                      <SelectTrigger id="ddlEnvaseMl">
                        <SelectValue placeholder="Selecciona envase ML" />
                      </SelectTrigger>
                      <SelectContent>
                        {envaseMlOptions.map((envase) => (
                          <SelectItem key={envase.value} value={envase.value}>
                            {envase.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fórmula */}
                  <div className="relative">
                    <label htmlFor="txtFormula" className="text-sm font-medium">
                      Fórmula
                    </label>
                    <Input
                      id="txtFormula"
                      name="txtFormula"
                      type="text"
                      placeholder="Buscar por fórmula..."
                      value={formulaBuscar}
                      onChange={(e) => {
                        setFormulaBuscar(e.target.value)
                        setFiltroFormula(e.target.value) // Keep the search term in the filter state
                      }}
                      onFocus={() => formulasResultados.length > 0 && setShowFormulasDropdown(true)}
                      autoComplete="off"
                    />
                    {showFormulasDropdown && formulasResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {formulasResultados.map((formula) => (
                          <button
                            key={formula.value}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleFormulaSelect(formula)}
                          >
                            {formula.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="formulaid" value={formulaid || ""} />
                  </div>

                  {/* Materia Prima */}
                  <div className="relative">
                    <label htmlFor="txtMateriaPrima" className="text-sm font-medium">
                      Materia prima
                    </label>
                    <Input
                      id="txtMateriaPrima"
                      name="txtMateriaPrima"
                      type="text"
                      placeholder="Buscar por materia prima..."
                      value={materiaprimaBuscar}
                      onChange={(e) => {
                        setMateriaprimaBuscar(e.target.value)
                        setFiltroMateriaPrima(e.target.value) // Keep the search term in the filter state
                      }}
                      onFocus={() => materiaprimasResultados.length > 0 && setShowMateriaprimasDropdown(true)}
                      autoComplete="off"
                    />
                    {showMateriaprimasDropdown && materiaprimasResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {materiaprimasResultados.map((materiaPrima) => (
                          <button
                            key={materiaPrima.value}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleMateriaprimaSelect(materiaPrima)}
                          >
                            {materiaPrima.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="materiaprimaid" value={materiaprimaid || ""} />
                  </div>

                  {/* Material de Envase o Empaque */}
                  <div className="relative">
                    <label htmlFor="txtMaterialEnvaseEmpaque" className="text-sm font-medium">
                      Material de Envase o Empaque
                    </label>
                    <Input
                      id="txtMaterialEnvaseEmpaque"
                      name="txtMaterialEnvaseEmpaque"
                      type="text"
                      placeholder="Buscar por material..."
                      value={materialEnvaseBuscar}
                      onChange={(e) => {
                        setMaterialEnvaseBuscar(e.target.value)
                        setFiltroMaterialEnvaseEmpaque(e.target.value) // Keep the search term in the filter state
                      }}
                      onFocus={() => materialesEnvaseResultados.length > 0 && setShowMaterialEnvaseDropdown(true)}
                      autoComplete="off"
                    />
                    {showMaterialEnvaseDropdown && materialesEnvaseResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {materialesEnvaseResultados.map((material) => (
                          <button
                            key={material.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleMaterialEnvaseSelect(material)}
                          >
                            {material.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="materialenvaseid" value={materialEnvaseid || ""} />
                  </div>
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
                          className={`px-2 py-1 text-xs rounded-xs font-semibold ${p.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {/* Card content */}
                    <CardContent className="flex flex-col flex-grow p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{p.producto}</h3>
                      {/* Código */}
                      {p.zonas && <p className="text-xs text-gray-500 mb-2">{p.zonas.nombre}</p>}
                      {/* Presentación above Código and removed label */}
                      <p className="text-sm text-gray-600 mb-2">{p.presentacion || "n/A"}</p>
                      <p className="text-sm text-gray-600 mb-2">Código: {p.codigo || "Sin código."}</p>
                      <div className="text-sm">
                        <p>
                          <span className="font-bold text-black">Forma:</span> {p.formasfarmaceuticas?.nombre || "n/A"}
                        </p>
                        <p>
                          <span className="font-bold text-black">Precio HL:</span> {formatCurrency(p.preciohl)}
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
                                  title={p.activo ? "Inactivar" : "Activar"}
                                  onClick={() => handleToggleStatusClickActivo(p.id, p.activo)}
                                >
                                  {p.activo ? (
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
}
