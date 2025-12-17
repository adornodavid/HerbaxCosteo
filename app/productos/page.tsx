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
    formafarmaceuticaid: number, // Added for advanced search
    objetivo: string, // Added for advanced search
    envase: string, // Added for advanced search
    formula: string, // Added for advanced search
    materiaprima: string, // Added for advanced search
    envaseavanzado: string, // Added for advanced search
    empaque: string, // Added for advanced search
  ) => {
    sessionStorage.setItem(
      "productosFilter",
      JSON.stringify({
        productonombre,
        clienteid,
        zonaid,
        catalogoid,
        estatus,
        presentacion,
        formafarmaceuticaid,
        objetivo,
        envase,
        formula,
        materiaprima,
        envaseavanzado,
        empaque,
        paginaActual,
      }),
    )

    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    // Formatear variables a mandar como parametros
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
      const result = await obtenerProductos(
        -1, // productoid
        productonombre,
        clienteid,
        zonaid,
        catalogoid,
        auxEstatus,
        presentacion, // Pass advanced filters
        formafarmaceuticaid,
        objetivo,
        envase,
        formula,
        materiaprima,
        envaseavanzado,
        empaque,
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
          productoscaracteristicas: {
            descripcion: p.productoscaracteristicas?.descripcion || null,
            presentacion: p.productoscaracteristicas?.presentacion || null,
            porcion: p.productoscaracteristicas?.porcion || null,
            modouso: p.productoscaracteristicas?.modouso || null,
            porcionenvase: p.productoscaracteristicas?.porcionenvase || null,
            categoriauso: p.productoscaracteristicas?.categoriauso || null,
            propositoprincipal: p.productoscaracteristicas?.propositoprincipal || null,
            propuestavalor: p.productoscaracteristicas?.propuestavalor || null,
            instruccionesingesta: p.productoscaracteristicas?.instruccionesingesta || null,
            edadminima: p.productoscaracteristicas?.edadminima || null,
            advertencia: p.productoscaracteristicas?.advertencia || null,
            condicionesalmacenamiento: p.productoscaracteristicas?.condicionesalmacenamiento || null,
          },
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
                        unidadmedidaid: mxf.materiasprima?.codigo || null,
                        unidadesmedida: {
                          descripcion: mxf.unidadesmedida?.descripcion || null,
                        },
                        costo: mxf.materiasprima?.codigo || null,
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
                        unidadmedidaid: fxf.formulas?.codigo || null,
                        unidadesmedida: {
                          descripcion: fxf.unidadesmedida?.descripcion || null,
                        },
                        costo: fxf.formulas?.codigo || null,
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
        return { success: false, mensaje: "No hay datos o la consulta falló." }
      }
    } catch (error) {
      // Retorno de información
      console.error("Error inesperado al buscar productos: ", error)
      console.log("Error inesperado al buscar productos: ", error)
      setProductos([])
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

      // Titulo de la página
      setPageTituloMasNuevo({
        Titulo: "Productos",
        Subtitulo: "Gestión completa de Productos",
        Visible: esAdminDOs == false ? false : false,
        BotonTexto: "Crear Producto", // Agregar texto
        Ruta: "/productos/crear", // Agregar ruta
      })
      setShowPageTituloMasNuevo(true)

      const savedFilters = sessionStorage.getItem("productosFilter")

      if (savedFilters) {
        const filters = JSON.parse(savedFilters)

        // Restaurar los estados de los filtros
        setFiltroNombre(filters.productonombre || "")
        setFiltroCliente(filters.clienteid?.toString() || "-1")
        setFiltroZona(filters.zonaid?.toString() || "-1")
        setFiltroCatalogo(filters.catalogoid?.toString() || "-1")
        setFiltroEstatus(filters.estatus || "-1")
        setFiltroPresentacion(filters.presentacion || "")
        setFiltroFormaFarmaceutica(filters.formafarmaceuticaid?.toString() || "-1")
        setFiltroObjetivo(filters.objetivo || "-1")
        setFiltroEnvase(filters.envase || "-1")
        setFiltroFormula(filters.formula || "")
        setFiltroMateriaPrima(filters.materiaprima || "")
        setFiltroEnvaseAvanzado(filters.envaseavanzado || "")
        setFiltroEmpaque(filters.empaque || "")
        setPaginaActual(filters.paginaActual || 1)
      }

      // -- Cargar DDLs
      // DDL Clientes
      const { data: clientesData, error: clientesError } = await listaDesplegableClientes(auxClienteId, "")
      if (!clientesError) {
        const clientesConTodos =
          esAdminDDLs === true
            ? [{ id: -1, nombre: "Todos" }, ...(clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))]
            : (clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))
        setClientes(clientesConTodos)

        if (!savedFilters) {
          if (esAdminDDLs) {
            setFiltroCliente("-1")
          } else {
            const aux = clientesData.id
            setFiltroCliente(aux)
          }
        }
      } else {
        console.error("Error cargando clientes:", clientesError)
      }

      // DDL catalogos
      const catalogosResult = await listaDesplegableCatalogos(-1, "", auxClienteId)
      if (!catalogosResult.error) {
        const catalogosConTodos =
          esAdminDDLs === true
            ? [
                { id: -1, nombre: "Todos" },
                ...(catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
              ]
            : (catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre }))
        setCatalogos(catalogosConTodos)

        if (!savedFilters) {
          if (esAdminDDLs === true) {
            setFiltroCatalogo("-1")
          } else {
            if (catalogosResult.data && catalogosResult.data.length > 0) {
              setFiltroCatalogo(catalogosResult.data[0].id.toString())
            }
          }
        }
      } else {
        console.error("Error cargando catálogos iniciales: ", catalogosResult.error)
        setModalError({
          Titulo: "Error cargando catálogos iniciales",
          Mensaje: catalogosResult.error,
        })
        setShowModalError(true)
      }

      if (savedFilters) {
        const filters = JSON.parse(savedFilters)

        if (filters.clienteid && filters.clienteid !== -1) {
          const zonasResult = await listDesplegableZonas(-1, "", Number(filters.clienteid))
          if (!zonasResult.error && zonasResult.data) {
            const zonasConTodos = [
              { value: "-1", text: "Todos" },
              ...zonasResult.data.map((z: any) => ({ value: z.value, text: z.text })),
            ]
            setZonasOptions(zonasConTodos)
          }
        }

        await ejecutarBusquedaProductos(
          filters.productonombre || "",
          filters.clienteid || auxClienteId,
          filters.zonaid || -1,
          filters.catalogoid || -1,
          filters.estatus || "True",
          filters.presentacion || "",
          filters.formafarmaceuticaid || -1,
          filters.objetivo || "-1",
          filters.envase || "-1",
          filters.formula || "",
          filters.materiaprima || "",
          filters.envaseavanzado || "",
          filters.empaque || "",
        )
      } else {
        // Ejecutar funcion de busqueda para cargar listado inicial
        const Result = await ejecutarBusquedaProductos(
          "", // filtroNombre
          auxClienteId, // clienteid
          -1, // zonaid
          -1, // catalogoid
          "True", // estatus
          "", // filtroPresentacion
          -1, // filtroFormaFarmaceutica
          "-1", // filtroObjetivo
          "-1", // filtroEnvase
          "", // filtroFormula
          "", // filtroMateriaPrima
          "", // filtroEnvaseAvanzado
          "", // filtroEmpaque
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
        Mensaje: error,
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
        const [formasResult, objetivosResult, envasesResult] = await Promise.all([
          listaDesplegableFormasFarmaceuticas(),
          listaDesplegableSistemas(), // Assuming 'listaDesplegableSistemas' provides data for 'Objetivo (Uso)'
          listaDesplegableEnvase(),
        ])

        if (formasResult.success && formasResult.data) {
          setFormasFarmaceuticasOptions(formasResult.data)
        }

        if (objetivosResult.success && objetivosResult.data) {
          setObjetivosOptions(objetivosResult.data)
        }

        if (envasesResult.success && envasesResult.data) {
          setEnvasesOptions(envasesResult.data)
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
    cargarOpciones()
  }, [])

  useEffect(() => {
    const buscarFormulas = async () => {
      if (formulaBuscar.trim().length >= 2) {
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
      if (materiaprimaBuscar.trim().length >= 2) {
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
      if (envaseBuscar.trim().length >= 2) {
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

  // --- Manejadores (Handles) --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const Nombre: string = filtroNombre.trim()
    const ClienteId = Number.parseInt(filtroCliente, 10)
    const ZonaId = Number.parseInt(filtroZona, 10)
    const CatalogoId = Number.parseInt(filtroCatalogo, 10)
    const Estatus = filtroEstatus
    const Presentacion = filtroPresentacion.trim()
    const FormaFarmaceuticaId = Number.parseInt(filtroFormaFarmaceutica, 10)
    const Objetivo = filtroObjetivo
    const Envase = filtroEnvase
    const Formula = filtroFormula.trim()
    const MateriaPrima = filtroMateriaPrima.trim()
    const EnvaseAvanzado = filtroEnvaseAvanzado.trim()
    const Empaque = filtroEmpaque.trim()

    ejecutarBusquedaProductos(
      Nombre,
      ClienteId,
      ZonaId,
      CatalogoId,
      Estatus,
      Presentacion,
      FormaFarmaceuticaId,
      Objetivo,
      Envase,
      Formula,
      MateriaPrima,
      EnvaseAvanzado,
      Empaque,
    )
  }

  // Busqueda - Limpiar o Resetear
  const handleLimpiarClick = () => {
    sessionStorage.removeItem("productosFilter")

    setFiltroNombre("")
    setFiltroEstatus("-1")
    setFiltroCliente(esAdminDDLs === true ? "-1" : user?.ClienteId?.toString() || "-1")
    setFiltroCatalogo("-1")
    setFiltroZona("-1")
    setFiltroPresentacion("")
    setFiltroFormaFarmaceutica("-1")
    setFiltroObjetivo("-1")
    setFiltroEnvase("-1")
    setFiltroFormula("")
    setFiltroMateriaPrima("")
    setFiltroEnvaseAvanzado("")
    setFiltroEmpaque("")

    // Reset autocomplete states
    setFormulaBuscar("")
    setFormulaSeleccionada(null)
    setMateriaprimaBuscar("")
    setMateriaprimaSeleccionada(null)
    setEnvaseBuscar("")
    setEnvaseSeleccionado(null)
    setEmpaqueBuscar("")
    setEmpaqueSeleccionado(null)

    setPaginaActual(1)
    setProductos([])
    setTotalProductos(0)
  }

  // Busqueda, camabiar cliente seleccionado
  const handleClienteChange = async (value: string) => {
    // Cambiar seleccion de filtro de cliente y resetear filtro de catálogo
    setFiltroCliente(value)
    setFiltroCatalogo("-1")

    try {
      // Transformar variable recibida
      const clienteIdNum = Number.parseInt(value, 10)
      // Preparar query
      let query = supabase.from("catalogos").select(`id, nombre`).eq("activo", true).order("nombre")
      // Filtros para el query
      if (clienteIdNum !== -1) {
        query = query.eq("clienteid", clienteIdNum)
      }
      // Ejecutar Query
      const { data, error } = await query
      if (!error) {
        // Cargar input de filtro
        const catalogosConTodos = [
          { id: -1, nombre: "Todos" },
          ...(data || []).map((c: any) => ({ id: c.id, nombre: c.nombre })),
        ]
        setCatalogos(catalogosConTodos)
      } else {
        // Mostrar error
        console.error("Error al cargar catálogos por cliente: ", error)
        console.log("Error al cargar catálogos por cliente: ", error)
        setModalError({
          Titulo: "Error al cargar catálogos por cliente",
          Mensaje: error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error al cambiar cliente: ", error)
      console.log("Error al cambiar cliente: ", error)
      setModalError({
        Titulo: "Error al cambiar cliente",
        Mensaje: error,
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
        setProductos((prev) => prev.map((p) => (p.ProductoId === id ? { ...p, ProductoActivo: nuevoEstado } : p)))
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
        }
      } else {
        setZonasOptions([{ value: "-1", text: "Todos" }])
        setFiltroZona("-1")
      }
    }
    cargarZonas()
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
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nombre}
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
                        <SelectItem value="-1">Todos</SelectItem>
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
                        <SelectItem value="-1">Todos</SelectItem>
                        {objetivosOptions.map((objetivo) => (
                          <SelectItem key={objetivo.value} value={objetivo.value}>
                            {objetivo.text}
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
                        <SelectItem value="-1">Todos</SelectItem>
                        {envasesOptions.map((envase) => (
                          <SelectItem key={envase.value} value={envase.value}>
                            {envase.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        setFiltroFormula(e.target.value) // Also update filtroFormula directly
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
                        setFiltroMateriaPrima(e.target.value) // Also update filtroMateriaPrima directly
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

                  {/* Envase Avanzado */}
                  <div className="relative">
                    <label htmlFor="txtEnvaseAvanzado" className="text-sm font-medium">
                      Envase
                    </label>
                    <Input
                      id="txtEnvaseAvanzado"
                      name="txtEnvaseAvanzado"
                      type="text"
                      placeholder="Buscar por envase..."
                      value={envaseBuscar}
                      onChange={(e) => {
                        setEnvaseBuscar(e.target.value)
                        setFiltroEnvaseAvanzado(e.target.value) // Also update filtroEnvaseAvanzado directly
                      }}
                      onFocus={() => envasesResultadosBuscar.length > 0 && setShowEnvasesDropdown(true)}
                      autoComplete="off"
                    />
                    {showEnvasesDropdown && envasesResultadosBuscar.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {envasesResultadosBuscar.map((envase) => (
                          <button
                            key={envase.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleEnvaseSelect(envase)}
                          >
                            {envase.codigo} - {envase.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="envaseid" value={envaseid || ""} />
                  </div>

                  {/* Empaque */}
                  <div className="relative">
                    <label htmlFor="txtEmpaque" className="text-sm font-medium">
                      Empaque
                    </label>
                    <Input
                      id="txtEmpaque"
                      name="txtEmpaque"
                      type="text"
                      placeholder="Buscar por empaque..."
                      value={empaqueBuscar}
                      onChange={(e) => {
                        setEmpaqueBuscar(e.target.value)
                        setFiltroEmpaque(e.target.value) // Also update filtroEmpaque directly
                      }}
                      onFocus={() => empaquesResultados.length > 0 && setShowEmpaqueDropdown(true)}
                      autoComplete="off"
                    />
                    {showEmpaqueDropdown && empaquesResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {empaquesResultados.map((empaque) => (
                          <button
                            key={empaque.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleEmpaqueSelect(empaque)}
                          >
                            {empaque.codigo} - {empaque.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="empaqueid" value={empaqueid || ""} />
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
                onClick={handleLimpiarClick}
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

                    <CardContent className="flex-grow flex flex-col justify-between p-4">
                      <div>
                        <CardTitle className="text-lg font-semibold mb-1 truncate">{p.nombre}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mb-2 truncate">
                          {p.presentacion}
                        </CardDescription>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Cliente:</span> {p.clientes?.nombre || "N/A"}
                        </p>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Código:</span> {p.codigo || "N/A"}
                        </p>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Costo:</span> {formatCurrency(p.costo)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleStatusClickActivo(p.id, p.activo)}
                            title={p.activo ? "Inactivar producto" : "Activar producto"}
                          >
                            {p.activo ? (
                              <ToggleLeft className="h-4 w-4 text-red-500" />
                            ) : (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleVerDetalles(p)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {esAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => router.push(`/productos/${p.id}/editar`)}
                              title="Editar producto"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <span className="text-xs font-medium">
                          {p.productosxcatalogo?.length > 0 ? `Precios: ${p.productosxcatalogo.length}` : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-6">
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
            !isSearching && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <X className="h-12 w-12" />
                <p className="text-lg font-medium">No se encontraron productos.</p>
                <p className="text-sm">Intenta ajustar tus filtros de búsqueda.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* --- Modales --- */}
      {/* Modal de Confirmación */}
      {showConfirmDialog && (
        <PageModalAlert
          Titulo="Confirmar Acción"
          Mensaje={`¿Está seguro que desea ${productoToToggle?.activo ? "inactivar" : "activar"} este producto?`}
          isOpen={true}
          onClose={() => {
            setShowConfirmDialog(false)
            setProductoToToggle(null)
          }}
          ConfirmButtonText={productoToToggle?.activo ? "Inactivar" : "Activar"}
          ConfirmButtonVariant="destructive"
          onConfirm={cambiarEstadoProducto}
        />
      )}
    </div>
  )
}
