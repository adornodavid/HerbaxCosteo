"use client"

/* ==================================================
	  Imports
	================================================== */
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Search, Eye, Edit, ToggleLeft, ToggleRight, Loader2, PlusCircle, RotateCcw } from "lucide-react"
import {
  obtenerProductoDetalladoCompleto,
  obtenerFormulasAsociadasProducto,
  obtenerIngredientesAsociadosProducto,
  obtenerProductosIniciales,
  buscarProductosConFiltros,
} from "@/app/actions/productos-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listaDesplegableCatalogos } from "@/app/actions/catalogos"
import { getProductoDetailsForModal } from "@/app/actions/productos-actions" // Import the missing function

/* ==================================================
  Interfaces, tipados, clases
================================================== */
interface DropdownItem {
  id: number
  nombre: string
}

interface ProductoListado {
  ProductoId: number
  ProductoNombre: string
  ProductoDescripcion: string
  ProductoTiempo: string
  ProductoCosto: number
  ProductoActivo: boolean
  ProductoImagenUrl: string | null
  ClienteId: number
  ClienteNombre: string
  CatalogoId: number
  CatalogoNombre: string
}

interface EstadisticasProductos {
  totalProductos: number
  costoPromedio: number
  costoTotal: number // Cambiado de 'costo' a 'costoTotal' para mayor claridad
  tiempoPromedio: string
}

// Nueva interfaz para los detalles del producto en el modal
interface ProductoDetail {
  id: number
  Cliente: string
  Catalogo: string
  Producto: string
  descripcion: string
  instruccionespreparacion: string | null
  propositoprincipal: string | null
  imgurl: string | null
  CostoElaboracion: number
  precioventa: number | null
  margenutilidad: number | null
  Costo: number
  PrecioSugerido: number
}

// Nueva interfaz para los detalles completos del producto
interface ProductoDetalleCompleto {
  // Información básica
  id: number
  nombre: string
  descripcion: string
  presentacion: string
  porcion: string
  modouso: string
  porcionenvase: string
  categoriauso: string
  propositoprincipal: string
  propuestavalor: string
  instruccionesingesta: string
  edadminima: number
  advertencia: string
  condicionesalmacenamiento: string
  vidaanaquelmeses: number
  imgurl: string | null
  costo: number
  activo: boolean
  fechacreacion: string
  // Relaciones
  clienteid: number
  zonaid: number
  formaid: number
}

interface FormulaAsociada {
  formula: string
  cantidad: number
  costoparcial: number
}

interface IngredienteAsociado {
  ingrediente: string
  cantidad: number
  costoparcial: number
}

/* ==================================================
	  Componente Principal, Pagina
	================================================== */
export default function ProductosPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // --- Estados ---
  const [productos, setProductos] = useState<ProductoListado[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasProductos>({
    totalProductos: 0,
    costoPromedio: 0,
    costoTotal: 0, // Inicializado a 0
    tiempoPromedio: "N/A",
  })
  const [clientes, setClientes] = useState<DropdownItem[]>([])
  const [catalogos, setCatalogos] = useState<DropdownItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productoToToggle, setProductoToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Este estado no se usa en la búsqueda actual, pero se mantiene
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null)

  // Estados para el modal de detalles mejorado
  const [showProductoDetailsModal, setShowProductoDetailsModal] = useState(false)
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [selectedProductoCompleto, setSelectedProductoCompleto] = useState<ProductoDetalleCompleto | null>(null)
  const [selectedFormulasAsociadas, setSelectedFormulasAsociadas] = useState<FormulaAsociada[]>([])
  const [selectedIngredientesAsociados, setSelectedIngredientesAsociados] = useState<IngredienteAsociado[]>([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoListado[]>([])
  const [totalProductos, setTotalProductos] = useState(0)

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [filtroCatalogo, setFiltroCatalogo] = useState("-1")
  const [filtroEstatus, setFiltroEstatus] = useState("-1") // Nuevo filtro de estatus

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const resultadosPorPagina = 20

  const esAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.RolId), [user])

  // --- Función de búsqueda SIN dependencias automáticas ---
  const ejecutarBusquedaProductos = async (nombre: string, clienteId: number, catalogoId: number, estatus: string) => {
    if (!user) return
    setIsSearching(true)
    setPaginaActual(1)
    console.log("cli:", clienteId)
    try {
      const result = await buscarProductosConFiltros(nombre, clienteId, catalogoId, estatus, user.RolId, user.ClienteId)

      if (!result.success) {
        console.error("Error en búsqueda:", result.error)
        toast.error("Error al buscar productos.")
        setProductos([])
        return
      }

      const queryData = result.data || []

      // Transformar datos de la consulta para manejar productos sin asociación
      const flattenedData = queryData.flatMap((p: any) => {
        if (p.productosxcatalogo.length === 0) {
          // Producto sin asociaciones, mostrarlo una vez
          return {
            ProductoId: p.id,
            ProductoNombre: p.nombre,
            ProductoDescripcion: p.descripcion,
            ProductoTiempo: p.propositoprincipal,
            ProductoCosto: p.costo,
            ProductoActivo: p.activo,
            ProductoImagenUrl: p.imgurl,
            ClienteId: -1,
            ClienteNombre: "N/A",
            CatalogoId: -1,
            CatalogoNombre: "N/A",
          }
        }
        // Producto con asociaciones, aplanarlas
        return p.productosxcatalogo.map((x: any) => ({
          ProductoId: p.id,
          ProductoNombre: p.nombre,
          ProductoDescripcion: p.descripcion,
          ProductoTiempo: p.propositoprincipal,
          ProductoCosto: p.costo,
          ProductoActivo: p.activo,
          ProductoImagenUrl: p.imgurl,
          ClienteId: x.catalogos?.clientes?.id || -1,
          ClienteNombre: x.catalogos?.clientes?.nombre || "N/A",
          CatalogoId: x.catalogos?.id || -1,
          CatalogoNombre: x.catalogos?.nombre || "N/A",
        }))
      })

      // Eliminar duplicados si un producto aparece varias veces debido a múltiples asociaciones
      const uniqueProducts = Array.from(
        new Map(flattenedData.map((item: ProductoListado) => [item.ProductoId, item])).values(),
      )

      setProductos(uniqueProducts)
      setProductosFiltrados(uniqueProducts)
      setTotalProductos(uniqueProducts.length)
      toast.success(`Búsqueda completada. Se encontraron ${uniqueProducts.length} resultados.`)
    } catch (error) {
      console.error("Error inesperado al buscar productos:", error)
      toast.error("Error inesperado al buscar productos")
      setProductos([])
    } finally {
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosInicialesProductos = async () => {
    if (!user) return

    try {
      const rolId = Number.parseInt(user.RolId?.toString() || 0, 10)
      const clienteId = Number.parseInt(user.ClienteId?.toString() || -1, 10)
      console.log(clienteId)
      // Use new function with proper RolId filtering
      const productosResult = await obtenerProductosIniciales(rolId, clienteId)

      if (productosResult.success && productosResult.data) {
        // Transformar datos de la consulta para manejar productos sin asociación
        const flattenedData = productosResult.data.flatMap((p: any) => {
          if (p.productosxcatalogo.length === 0) {
            // Producto sin asociaciones, mostrarlo una vez
            return {
              ProductoId: p.id,
              ProductoNombre: p.nombre,
              ProductoDescripcion: p.descripcion,
              ProductoTiempo: p.propositoprincipal,
              ProductoCosto: p.costo,
              ProductoActivo: p.activo,
              ProductoImagenUrl: p.imgurl,
              ClienteId: -1, // O algún valor que indique "N/A"
              ClienteNombre: "N/A",
              CatalogoId: -1, // O algún valor que indique "N/A"
              CatalogoNombre: "N/A",
            }
          }
          // Producto con asociaciones, aplanarlas
          return p.productosxcatalogo.map((x: any) => ({
            ProductoId: p.id,
            ProductoNombre: p.nombre,
            ProductoDescripcion: p.descripcion,
            ProductoTiempo: p.propositoprincipal,
            ProductoCosto: p.costo,
            ProductoActivo: p.activo,
            ProductoImagenUrl: p.imgurl,
            ClienteId: x.catalogos?.clientes?.id || -1,
            ClienteNombre: x.catalogos?.clientes?.nombre || "N/A",
            CatalogoId: x.catalogos?.id || -1,
            CatalogoNombre: x.catalogos?.nombre || "N/A",
          }))
        })

        // Eliminar duplicados si un producto aparece varias veces debido a múltiples asociaciones
        const uniqueProducts = Array.from(
          new Map(flattenedData.map((item: ProductoListado) => [item.ProductoId, item])).values(),
        )

        setProductos(uniqueProducts)
        setProductosFiltrados(uniqueProducts)
        setTotalProductos(uniqueProducts.length)
      }

      // Cargar clientes
      const clienteIdParamCatalogos = [1, 2, 3, 4].includes(Number(user.RolId)) ? -1 : Number(user.ClienteId)

      const { data: clientesData, error: clientesError } = await listaDesplegableClientes(
        clienteIdParamCatalogos.toString(),
        "",
      )

      if (!clientesError) {
        const clientesConTodos = [1, 2, 3, 4].includes(Number(user.RolId))
          ? [{ id: -1, nombre: "Todos" }, ...(clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))]
          : (clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))

        setClientes(clientesConTodos)

        if ([1, 2, 3, 4].includes(Number(user.RolId))) {
          setFiltroCliente("-1")
        } else {
          const aux = clientesData.id
          setFiltroCliente(aux)
        }
        //setFiltroCliente("-1")
      } else {
        console.error("Error cargando clientes:", clientesError)
      }
      console.log("cat:", clienteIdParamCatalogos)
      // Cargar catálogos iniciales (todos, sin filtro de cliente al inicio)
      const catalogosResult = await listaDesplegableCatalogos(-1, "", clienteIdParamCatalogos)

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
      console.error("Error al cargar datos iniciales:", error)
      toast.error("Error al cargar datos iniciales")
    } finally {
      setPageLoading(false)
    }
  }

  // --- Carga Inicial y Seguridad ---
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }

      const inicializar = async () => {
        setPageLoading(true)
        await cargarDatosInicialesProductos()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin])

  // --- Handlers de Eventos ---
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
    toast.info("Filtros limpiados.")
    // Use the same logic as initial loading
    cargarDatosInicialesProductos()
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

  const handleDeleteProducto = async () => {
    if (productoToDelete === null) return

    setPageLoading(true)
    const { error } = await supabase.from("productos").update({ activo: false }).eq("id", productoToDelete)

    if (error) {
      toast.error("Error al eliminar producto: " + error.message)
    } else {
      toast.success("Producto eliminado correctamente.")
      setProductoToDelete(null)
      // Recargar la lista de productos después de la eliminación
      const clienteId = Number.parseInt(filtroCliente, 10)
      const catalogoId = Number.parseInt(filtroCatalogo, 10)
      await ejecutarBusquedaProductos(filtroNombre, clienteId, catalogoId, filtroEstatus)
    }
    setPageLoading(false)
  }

  // Handler para abrir el modal de detalles del producto
  const handleViewProductoDetails = async (productoId: number) => {
    setIsDetailsLoading(true)
    setShowProductoDetailsModal(true)
    setSelectedProductoDetails(null)
    setSelectedProductoCompleto(null)
    setSelectedFormulasAsociadas([])
    setSelectedIngredientesAsociados([])

    try {
      // Get complete product information
      const productoResult = await obtenerProductoDetalladoCompleto(productoId)
      if (productoResult.success && productoResult.data) {
        setSelectedProductoCompleto(productoResult.data)
      }

      // Get associated formulas
      const formulasResult = await obtenerFormulasAsociadasProducto(productoId)
      if (formulasResult.success && formulasResult.data) {
        setSelectedFormulasAsociadas(formulasResult.data)
      }

      // Get associated ingredients
      const ingredientesResult = await obtenerIngredientesAsociadosProducto(productoId)
      if (ingredientesResult.success && ingredientesResult.data) {
        setSelectedIngredientesAsociados(ingredientesResult.data)
      }

      // Also get the original catalog associations for compatibility
      const { success, data, error } = await getProductoDetailsForModal(productoId)
      if (success && data) {
        setSelectedProductoDetails(data)
      }
    } catch (error) {
      console.error("Error loading detailed product information:", error)
      toast.error("Error al cargar detalles del producto")
    } finally {
      setIsDetailsLoading(false)
    }
  }

  // --- Paginación ---
  const productosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return productosFiltrados.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [productosFiltrados, paginaActual])

  const totalPaginas = Math.ceil(totalProductos / resultadosPorPagina)

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  // --- Renderizado ---
  if (pageLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="/images/design-mode/cargando.gif"
                alt="Cargando..."
                width={300}
                height={300}
                unoptimized
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Título y Botón */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestión completa de Productos</p>
        </div>
        <Link href="/productos/nuevo" passHref>
          <Button id="btnProductoNuevo" name="btnProductoNuevo" className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* 2. Estadísticas */}
      {/*<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalProductos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoPromedio)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio Prep.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.tiempoPromedio}</div>
          </CardContent>
        </Card>
      </div>*/}

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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {p.ProductoDescripcion || "Sin descripción."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(p.ProductoCosto)}</p>
                      <div className="flex gap-1">
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

      {/* Modal de Confirmación de Cambio de Estado */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cambiará el estado del producto a '{productoToToggle?.activo ? "Inactivo" : "Activo"}'. ¿Deseas
              continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductoToToggle(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cambiarEstadoProducto}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showProductoDetailsModal} onOpenChange={setShowProductoDetailsModal}>
        <DialogContent className="max-w-6xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalles del Producto</DialogTitle>
            <DialogDescription>Información completa del producto seleccionado.</DialogDescription>
          </DialogHeader>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : selectedProductoCompleto ? (
            <div className="grid gap-6 py-4">
              {/* Información Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen y datos básicos */}
                <div className="space-y-4">
                  {selectedProductoCompleto.imgurl && (
                    <img
                      src={selectedProductoCompleto.imgurl || "/placeholder.svg"}
                      alt={selectedProductoCompleto.nombre}
                      className="w-full h-64 object-cover rounded-xs shadow-md"
                    />
                  )}
                  <div className="bg-gray-50 p-4 rounded-xs">
                    <h3 className="text-xl font-bold mb-2">{selectedProductoCompleto.nombre}</h3>
                    <p className="text-gray-600 mb-3">{selectedProductoCompleto.descripcion}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="font-medium">Costo:</span> {formatCurrency(selectedProductoCompleto.costo)}
                      </p>
                      <p>
                        <span className="font-medium">Estado:</span>{" "}
                        {selectedProductoCompleto.activo ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información detallada */}
                <div className="space-y-4">
                  {/* Porciones */}
                  <div className="bg-blue-50 p-4 rounded-xs">
                    <h4 className="font-semibold text-blue-800 mb-2">Información de Porciones</h4>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <p>
                        <span className="font-medium">Presentación:</span>{" "}
                        {selectedProductoCompleto.presentacion || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Porción:</span> {selectedProductoCompleto.porcion || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Porción por envase:</span>{" "}
                        {selectedProductoCompleto.porcionenvase || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Modo de Uso */}
                  <div className="bg-green-50 p-4 rounded-xs">
                    <h4 className="font-semibold text-green-800 mb-2">Modo de Uso</h4>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <p>
                        <span className="font-medium">Modo de uso:</span> {selectedProductoCompleto.modouso || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Categoría de uso:</span>{" "}
                        {selectedProductoCompleto.categoriauso || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Edad mínima:</span> {selectedProductoCompleto.edadminima || "N/A"}{" "}
                        años
                      </p>
                      <p>
                        <span className="font-medium">Instrucciones:</span>{" "}
                        {selectedProductoCompleto.instruccionesingesta || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Advertencias:</span>{" "}
                        {selectedProductoCompleto.advertencia || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Almacenamiento:</span>{" "}
                        {selectedProductoCompleto.condicionesalmacenamiento || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Detalles Adicionales */}
                  <div className="bg-purple-50 p-4 rounded-xs">
                    <h4 className="font-semibold text-purple-800 mb-2">Detalles Adicionales</h4>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <p>
                        <span className="font-medium">Vida de anaquel:</span>{" "}
                        {selectedProductoCompleto.vidaanaquelmeses || "N/A"} meses
                      </p>
                      <p>
                        <span className="font-medium">Propósito principal:</span>{" "}
                        {selectedProductoCompleto.propositoprincipal || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Propuesta de valor:</span>{" "}
                        {selectedProductoCompleto.propuestavalor || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fórmulas Asociadas */}
              {selectedFormulasAsociadas.length > 0 && (
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-3">Fórmulas Asociadas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-200">
                          <th className="text-left py-2 font-medium">Fórmula</th>
                          <th className="text-left py-2 font-medium">Cantidad</th>
                          <th className="text-left py-2 font-medium">Costo Parcial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFormulasAsociadas.map((formula, idx) => (
                          <tr key={idx} className="border-b border-emerald-100">
                            <td className="py-2">{formula.formula}</td>
                            <td className="py-2">{formula.cantidad}</td>
                            <td className="py-2">{formatCurrency(formula.costoparcial)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ingredientes Asociados */}
              {selectedIngredientesAsociados.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-3">Ingredientes Asociados</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-orange-200">
                          <th className="text-left py-2 font-medium">Ingrediente</th>
                          <th className="text-left py-2 font-medium">Cantidad</th>
                          <th className="text-left py-2 font-medium">Costo Parcial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIngredientesAsociados.map((ingrediente, idx) => (
                          <tr key={idx} className="border-b border-orange-100">
                            <td className="py-2">{ingrediente.ingrediente}</td>
                            <td className="py-2">{ingrediente.cantidad}</td>
                            <td className="py-2">{formatCurrency(ingrediente.costoparcial)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Asociaciones con Catálogos (mantener compatibilidad) */}
              {selectedProductoDetails && selectedProductoDetails.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Asociaciones con Catálogos</h4>
                  <div className="grid gap-3">
                    {selectedProductoDetails.map((detail, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>
                            <span className="font-medium">Cliente:</span> {detail.Cliente}
                          </p>
                          <p>
                            <span className="font-medium">Catálogo:</span> {detail.Catalogo}
                          </p>
                          <p>
                            <span className="font-medium">Precio de Venta:</span> {formatCurrency(detail.precioventa)}
                          </p>
                          <p>
                            <span className="font-medium">Margen:</span>{" "}
                            {detail.margenutilidad !== null ? `${detail.margenutilidad}%` : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No se encontraron detalles para este producto.</div>
          )}
          <DialogFooter>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogPrimitive.Close>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
