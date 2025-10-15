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
import { Search, Eye, Edit, ToggleLeft, ToggleRight, Loader2, PlusCircle, RotateCcw, EyeOff, X } from "lucide-react"

import Link from "next/link"
import Image from "next/image"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Producto, oProducto, ProductoCatalogo, ProductoListado, ProductosEstadisticas } from "@/types/productos"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// -- Frontend --

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerProductos, estatusActivoProducto } from "@/app/actions/productos"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listaDesplegableCatalogos } from "@/app/actions/catalogos"

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


  // --- Estados ---
  const [productos, setProductos] = useState<ProductoListado[]>([])
  const [estadisticas, setEstadisticas] = useState<ProductosEstadisticas>({
    totalProductos: 0,
    costoPromedio: 0,
    costoTotal: 0, // Inicializado a 0
    tiempoPromedio: "N/A",
  })
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoListado[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [clientes, setClientes] = useState<ddlItem[]>([])
  const [catalogos, setCatalogos] = useState<ddlItem[]>([])
  
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productoToToggle, setProductoToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Este estado no se usa en la búsqueda actual, pero se mantiene
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null)

   // Filtros
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [filtroCatalogo, setFiltroCatalogo] = useState("-1")
  
  // Estados para el modal de detalles mejorado
  const [showProductoDetailsModal, setShowProductoDetailsModal] = useState(false)
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [selectedProductoCompleto, setSelectedProductoCompleto] = useState<ProductoDetalleCompleto | null>(null)
  const [selectedFormulasAsociadas, setSelectedFormulasAsociadas] = useState<FormulaAsociada[]>([])
  const [selectedIngredientesAsociados, setSelectedIngredientesAsociados] = useState<IngredienteAsociado[]>([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  // --- Variables (post carga elementos) ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

// --- Paginación ---
  const productosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return productosFiltrados.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [productosFiltrados, paginaActual])

  const totalPaginas = Math.ceil(totalProductos / resultadosPorPagina)

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

    
  // -- Funciones --
  const ejecutarBusquedaProductos = async (productonombre: string, clienteid: number, catalogoid: number, estatus: string) => {
    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    // Formatear variables a mandar como parametros
    console.log("filtros: productonombre: " + productonombre + " _ clienteid: " + clienteid + " _ catalogoid: " + catalogoid + " _ estatus: " + estatus)
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
        productonombre, // productonombre
        clienteid, // clienteid
        -1, // zonaid
        catalogoid,
        auxEstatus, // activo
      )

      if (result.success && result.data) {
        const transformedData: oProducto[] = result.data.map((p: oProducto) => ({
          id: p.id,
          codigo: p.codigo,
          clienteid: p.clienteid,
          clientes: {
            nombre: p.clientes?.nombre || null,
          },
          zonaid: p.zonaid,
          zonas: {
            nombre: p.zonas?.nombre || null,
          },
          nombre: p.nombre,
          imgurl: p.imgurl,
          unidadmedidaid: p.unidadmedidaid,
          unidadesmedida: {
            descripcion: p.unidadesmedida?.descripcion || null,
          },
          costo: p.costo,
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
          productosxcatalogo: p.productosxcatalogo?.map((cat) => ({
            catalogoid: cat.catalogoid || null,
            precioventa: cat.precioventa || null,
            margenutilidad: cat.margenutilidad || null,
            catalogos: {
              nombre: cat.catalogos?.nombre || null,
              descripcion: cat.catalogos?.descripcion || null,
            },
          })) || [],

          formulasxproducto: p.formulasxproducto?.map((fxp) => ({
            formulaid: fxp.formulaid || null,
            formulas: {
              codigo: fxp.formulas?.codigo || null,
              nombre: fxp.formulas?.nombre || null,
              unidadmedidaid: fxp.formulas?.unidadmedidaid || null,
              unidadesmedida: {
                descripcion: fxp.unidadesmedida?.descripcion || null,
              },
              costo: fxp.formulas?.costo || null,
              materiasprimasxformula: fxp.materiasprimasxformula?.map((mxf) => ({
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
            } || null,
          })) || [],
        }))
        /*
        const transformedData: Producto[] = result.data.map((p: Producto) => ({
          id: p.id,
          codigo: p.codigo,
          clienteid: p.clienteid,
          clientes: {
            nombre: p.clientes?.nombre || null,
          },
          zonaid: p.zonaid,
          zonas: {
            nombre: p.zonas?.nombre || null,
          },
          nombre: p.nombre,
          imgurl: p.imgurl,
          unidadmedidaid: p.unidadmedidaid,
          unidadesmedida: {
            descripcion: p.unidadesmedida?.descripcion || null,
          },
          costo: p.costo,
          activo: p.activo,
          productoscaracteristicas: {
            descripcion: p.productoscaracteristicas?.[0]?.descripcion || null,
            presentacion: p.productoscaracteristicas?.[0]?.presentacion || null,
            porcion: p.productoscaracteristicas?.[0]?.porcion || null,
            modouso: p.productoscaracteristicas?.[0]?.modouso || null,
            porcionenvase: p.productoscaracteristicas?.[0]?.porcionenvase || null,
            categoriauso: p.productoscaracteristicas?.[0]?.categoriauso || null,
            propositoprincipal: p.productoscaracteristicas?.[0]?.propositoprincipal || null,
            propuestavalor: p.productoscaracteristicas?.[0]?.propuestavalor || null,
            instruccionesingesta: p.productoscaracteristicas?.[0]?.instruccionesingesta || null,
            edadminima: p.productoscaracteristicas?.[0]?.edadminima || null,
            advertencia: p.productoscaracteristicas?.[0]?.advertencia || null,
            condicionesalmacenamiento: p.productoscaracteristicas?.[0]?.condicionesalmacenamiento || null,
          },
          productosxcatalogo:
            p.productosxcatalogo?.map((x: any) => ({
              catalogoid: x.catalogoid || null,
              precioventa: x.precioventa || null,
              margenutilidad: x.margenutilidad || null,
              catalogos: {
                id: x.catalogos?.id || null,
                nombre: x.catalogos?.nombre || null,
                descripcion: x.catalogos?.descripcion || null,
              },
            })) || [],
          
        }))
        */

        const productosListado: ProductoListado[] = transformedData.map((p: oProducto) => ({
          ProductoId: p.id,
          ProductoCodigo: p.codigo || "Sin codigo",
          ProductoNombre: p.nombre || "Sin nombre",
          ProductoDescripcion: p.productoscaracteristicas.descripcion || p.nombre || "Sin descripción",
          ProductoTiempo: "N/A",
          ProductoCosto: p.costo || 0,
          ProductoActivo: p.activo === true,
          ProductoImagenUrl: p.imgurl,
          ClienteId: p.clienteid || -1,
          ClienteNombre: p.clientes?.nombre || "N/A",
          CatalogoId: p.productosxcatalogo[0]?.catalogoid || -1,
          CatalogoNombre: p.productosxcatalogo[0]?.catalogos?.nombre || "N/A",
        }))

        // Actualizar estados
        setProductos(productosListado)
        setProductosFiltrados(productosListado)
        setTotalProductos(productosListado.length)

        // Retorno de información
        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        // Retorno de información
        console.log("[v0] No hay datos o la consulta falló")
        setProductos([])
        return { success: false, mensaje: "No hay datos o la consulta falló." }
      }

      /*if (!result.success) {
        console.error("Error en búsqueda del filtro de búsqueda:", result.error)
        setProductos([])
        return
      }*/
    } catch (error) {
      // Retorno de información
      console.error("Error inesperado al buscar productos:", error)
      setProductos([])
      return { error: true, mensaje: "Error inesperado al buscar productos: " + error }
    } finally {
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      const auxClienteId = esAdminDDLs === true ? -1 : user.ClienteId

      setPageTituloMasNuevo({
        Titulo: "Productos",
        Subtitulo: "Gestión completa de Productos",
        Visible: esAdminDOs == true ? true : false,
        BotonTexto: "Crear Nuevo Producto",
        Ruta: "/productos/crear",
      })
      setShowPageTituloMasNuevo(true)
     
      const Result = await ejecutarBusquedaProductos("", auxClienteId, -1, "True")
      if (!Result.success) {
        setModalAlert({
          Titulo: "En ejecución de búsqueda de carga inicial",
          Mensaje: Result.mensaje,
        })
        setShowModalAlert(true)
      }

      // -- Cargar DDLs
      // DDL Clientes
      const { data: clientesData, error: clientesError } = await listaDesplegableClientes(auxClienteId,"")

      if (!clientesError) {
        const clientesConTodos = esAdminDDLs === true ? [{ id: -1, nombre: "Todos" }, ...(clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))]
          : (clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))
        setClientes(clientesConTodos)

        if (esAdminDDLs) {
          setFiltroCliente("-1")
        } else {
          const aux = clientesData.id
          setFiltroCliente(aux)
        }
        //setFiltroCliente("-1")
      } else {
        console.error("Error cargando clientes:", clientesError)
      }

      // -- Cargar catalogos
      const catalogosResult = await listaDesplegableCatalogos(-1, "", auxClienteId)

      if (!catalogosResult.error) {
        const catalogosConTodos = [1, 2, 3, 4].includes(Number(user.RolId))
          ? [
              { id: -1, nombre: "Todos" },
              ...(catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
            ]
          : (catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre }))

        setCatalogos(catalogosConTodos)

        if ([1, 2, 3, 4].includes(Number(user.RolId))) {
          setFiltroCatalogo("-1") // Set to "Todos" for admin roles
        } else {
          // Set to first available catalog for restricted users
          if (catalogosResult.data && catalogosResult.data.length > 0) {
            setFiltroCatalogo(catalogosResult.data[0].id.toString())
          }
        }
      } else {
        console.error("Error cargando catálogos iniciales:", catalogosResult.error)
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
      //setPageLoading(false)
    }
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

// --- Handles - Manejo de Eventos ---
  const handleClienteChange = async (value: string) => {
    setFiltroCliente(value)
    setFiltroCatalogo("-1") // Resetear catálogo al cambiar cliente

    try {
      const clienteIdNum = Number.parseInt(value, 10)

      let query = supabase.from("catalogos").select(`id, nombre`).eq("activo", true).order("nombre")

      if (clienteIdNum !== -1) {
        query = query.eq("clienteid", clienteIdNum)
      }

      const { data, error } = await query

      if (!error) {
        const catalogosConTodos = [
          { id: -1, nombre: "Todos" },
          ...(data || []).map((c: any) => ({ id: c.id, nombre: c.nombre })),
        ]
        setCatalogos(catalogosConTodos)
      } else {
        console.error("Error al cargar catálogos por cliente:", error)
      }
    } catch (error) {
      console.error("Error al cambiar cliente:", error)
    }
  }
  
  // ESTE ES EL ÚNICO LUGAR DONDE SE EJECUTA LA BÚSQUEDA
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const clienteId = Number.parseInt(filtroCliente, 10)
    const catalogoId = Number.parseInt(filtroCatalogo, 10)
    ejecutarBusquedaProductos(filtroNombre, clienteId, catalogoId, filtroEstatus)
  }

  const clearProductosBusqueda = () => {
    setFiltroNombre("")
    setFiltroCliente("-1")
    setFiltroCatalogo("-1")
    setFiltroEstatus("-1")
    handleClienteChange("-1")

    cargarDatosIniciales()
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
        toast.error(`Error al cambiar estado del producto.`)
      } else {
        // Actualizar el estado local para reflejar el cambio sin recargar todo
        setProductos((prev) => prev.map((p) => (p.ProductoId === id ? { ...p, ProductoActivo: nuevoEstado } : p)))
        toast.success(`Producto ${nuevoEstado ? "activado" : "inactivado"} correctamente.`)
      }
    } catch (error) {
      console.error("Error inesperado al cambiar estado:", error)
      toast.error("Error inesperado al cambiar estado")
    }

    setShowConfirmDialog(false)
    setProductoToToggle(null)
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

  // --- Renders (contenidos auxiliares) ---
  // Loading
  /*if (showPageLoading) {
    return <PageLoadingScreen message="Cargando Productos..." />
  }*/

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
      {/* 3. Filtros */}

      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="frmProductosBuscar"
            name="frmProductosBuscar"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end"
            onSubmit={handleFormSubmit}
          >
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
            <div className="lg:col-span-2">
              <label htmlFor="ddlCatalogo" className="text-sm font-medium">
                Catálogo
              </label>
              <Select name="ddlCatalogo" value={filtroCatalogo} onValueChange={setFiltroCatalogo}>
                <SelectTrigger id="ddlCatalogo">
                  <SelectValue placeholder="Selecciona un catálogo" />
                </SelectTrigger>
                <SelectContent>
                  {catalogos.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                id="btnProductosLimpiar"
                name="btnProductosLimpiar"
                type="button"
                variant="outline"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={clearProductosBusqueda}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar
              </Button>
              <Button
                id="btnProductosBuscar"
                name="btnProductosBuscar"
                type="submit"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
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

      {/* 4. Grid de Resultados - Ahora con Tarjetas */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {productosPaginados.length} de {totalProductos} productos encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <span className="ml-2 text-lg">Cargando productos...</span>
            </div>
          ) : productosPaginados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {productosPaginados.map((p, index) => (
                <Card
                  key={`${p.ProductoId}-${p.CatalogoId}-${index}`}
                  className="border bg-card text-card-foreground relative flex flex-col overflow-hidden rounded-xs shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div
                    className="relative w-full h-48 overflow-hidden cursor-pointer"
                    onClick={() => handleViewProductoDetails(p.ProductoId)}
                    title="Ver detalles del producto"
                  >
                    <Image
                      src={p.ProductoImagenUrl || "/placeholder.svg?height=200&width=200&text=Producto"}
                      alt={p.ProductoNombre}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-xs transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${p.ProductoActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                      >
                        {p.ProductoActivo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex flex-col flex-grow p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{p.ProductoNombre}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 text-right">
                      Código: {p.ProductoCodigo || "Sin código."}
                    </p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(p.ProductoCosto)}</p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <div className="flex gap-3 justify-center mt-auto">
                        

                        <Button
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-7"
                          variant="ghost"
                          size="icon"
                          title="Ver Detalles"
                          onClick={() => handleViewProductoDetails(p.ProductoId)}
                          disabled={isDetailsLoading}
                        >
                          {isDetailsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/productos/editar?getProductoId=${p.ProductoId}`} passHref>
                          <Button
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-7"
                            variant="ghost"
                            size="icon"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  hover:bg-accent hover:text-accent-foreground h-10 w-7"
                          variant="ghost"
                          size="icon"
                          title={p.ProductoActivo ? "Inactivar" : "Activar"}
                          onClick={() => handleToggleStatusClickProducto(p.ProductoId, p.ProductoActivo)}
                        >
                          {p.ProductoActivo ? (
                            <ToggleRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No se encontraron resultados.</div>
          )}
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
    </div>
  )
}
