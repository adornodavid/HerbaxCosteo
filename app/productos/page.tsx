"use client"

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
  AlertDialogTrigger,
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
import { Eraser, Search, Eye, Edit, ToggleLeft, ToggleRight, Loader2, PlusCircle, RotateCcw } from 'lucide-react'
import { getProductoDetailsForModal } from "@/app/actions/productos-details-actions" // Importar la nueva acción

// --- Interfaces ---
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

// --- Componente Principal ---
export default function ProductosPage() {
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

  // Estados para el modal de detalles
  const [showProductoDetailsModal, setShowProductoDetailsModal] = useState(false)
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

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

    try {
      let query = supabase.from("productos").select(`
          id, nombre, descripcion, propositoprincipal, costo, activo, imgurl,
          productosxcatalogo!left(
            catalogos!left(
              id, nombre,
              clientes!left(id, nombre)
            )
          )
        `)

      if (nombre) query = query.ilike("nombre", `%${nombre}%`) // Cambiado a ilike para búsqueda insensible a mayúsculas/minúsculas

      if (clienteId !== -1) {
        query = query.eq("productosxcatalogo.catalogos.clientes.id", clienteId)
      }
      if (catalogoId !== -1) {
        query = query.eq("productosxcatalogo.catalogos.id", catalogoId)
      }
      if (estatus !== "-1") {
        query = query.eq("activo", estatus === "true")
      }

      const { data: queryData, error: queryError } = await query.order("nombre", { ascending: true })

      if (queryError) {
        console.error("Error en búsqueda:", queryError)
        toast.error("Error al buscar productos.")
        setProductos([])
        return
      }

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
      const uniqueProducts = Array.from(new Map(flattenedData.map((item: ProductoListado) => [item.ProductoId, item])).values());


      setProductos(uniqueProducts)
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
      // Cargar estadísticas
      const {
        data: statsData,
        error: statsError,
        count,
      } = await supabase.from("productos").select("costo, propositoprincipal", { count: "exact" })

      if (!statsError && statsData) {
        const costoTotal = statsData.reduce((sum, p) => sum + (p.costo || 0), 0)
        const costoPromedio = count ? costoTotal / count : 0
        setEstadisticas({
          totalProductos: count || 0,
          costoPromedio,
          costoTotal,
          tiempoPromedio: "25 min", // Esto es un valor fijo, considera calcularlo si es dinámico
        })
      } else if (statsError) {
        console.error("Error cargando estadísticas:", statsError);
      }


      // Cargar clientes
      let clientesQuery = supabase.from("clientes").select("id, nombre").order("nombre")

      const { data: clientesData, error: clientesError } = await clientesQuery

      if (!clientesError) {
        const clientesConTodos = [
          { id: -1, nombre: "Todos" },
          ...(clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre })),
        ]
        setClientes(clientesConTodos)
        setFiltroCliente("-1")
      } else {
        console.error("Error cargando clientes:", clientesError);
      }

      // Cargar catálogos iniciales (todos, sin filtro de cliente al inicio)
      let catalogosQuery = supabase
        .from("catalogos")
        .select(`id, nombre`)
        .eq("activo", true)
        .order("nombre")

      const { data: catalogosData, error: catalogosError } = await catalogosQuery

      if (!catalogosError) {
        const catalogosConTodos = [
          { id: -1, nombre: "Todos" },
          ...(catalogosData || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
        ]
        setCatalogos(catalogosConTodos)
        setFiltroCatalogo("-1")
      } else {
        console.error("Error cargando catálogos iniciales:", catalogosError);
      }

      // Ejecutar búsqueda inicial con todos los filtros en -1
      await ejecutarBusquedaProductos("", -1, -1, "-1")
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

      let query = supabase
        .from("catalogos")
        .select(`id, nombre`)
        .eq("activo", true)
        .order("nombre")

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
        console.error("Error al cargar catálogos por cliente:", error);
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
    setFiltroEstatus("-1") // Limpiar también el filtro de estatus
    handleClienteChange("-1") // Resetear también los catálogos
    toast.info("Filtros limpiados.")
    // Volver a ejecutar la búsqueda con filtros limpios
    ejecutarBusquedaProductos("", -1, -1, "-1")
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

    const { success, data, error } = await getProductoDetailsForModal(productoId)

    console.log(`getProductoDetailsForModal - Success: ${success}, Error: ${error ? error : "No error"}`)

    if (success && data) {
      setSelectedProductoDetails(data)
    } else {
      toast.error(`Error al cargar detalles del producto: ${error}`)
      setSelectedProductoDetails([])
    }
    setIsDetailsLoading(false)
  }

  // --- Paginación ---
  const productosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return productos.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [productos, paginaActual])

  const totalPaginas = Math.ceil(productos.length / resultadosPorPagina)

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
                src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/cargar.gif"
                alt="Cargando..."
                width={300}
                height={300}
                unoptimized
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800"></p>
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
      <Card className="border bg-card text-card-foreground shadow">
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
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {productosPaginados.length} de {productos.length} productos encontrados.
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
                  className="relative flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={p.ProductoImagenUrl || "/placeholder.svg?height=200&width=200&text=Producto"}
                      alt={p.ProductoNombre}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${p.ProductoActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                      >
                        {p.ProductoActivo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex flex-col flex-grow p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {p.ProductoNombre}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {p.ProductoDescripcion || "Sin descripción."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(p.ProductoCosto)}</p>
                      <div className="flex gap-1">
                        <Button
                          className ="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-7"
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
                          className ="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-7"
                          variant="ghost" size="icon" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          className ="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  hover:bg-accent hover:text-accent-foreground h-10 w-7"
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

      {/* Modal de Detalles del Producto */}
      <Dialog open={showProductoDetailsModal} onOpenChange={setShowProductoDetailsModal}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalles del Producto</DialogTitle>
            <DialogDescription>Información detallada del producto seleccionado.</DialogDescription>
          </DialogHeader>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : selectedProductoDetails && selectedProductoDetails.length > 0 ? (
            <div className="grid gap-4 py-4">
              {/* Mostrar información principal del producto una vez */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                {selectedProductoDetails[0].imgurl && (
                  <img
                    src={selectedProductoDetails[0].imgurl || "/placeholder.svg"}
                    alt={selectedProductoDetails[0].Producto}
                    className="w-64 h-64 object-cover rounded-md"
                  />
                )}
                <div className="grid gap-1">
                  <h3 className="text-xl font-semibold">{selectedProductoDetails[0].Producto}</h3>
                  <p className="text-muted-foreground">{selectedProductoDetails[0].descripcion}</p>
                  {selectedProductoDetails[0].instruccionespreparacion && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="text-base text-black-600 font-medium">Instrucciones:</span>{" "}
                      {selectedProductoDetails[0].instruccionespreparacion}
                    </p>
                  )}
                  {selectedProductoDetails[0].propositoprincipal && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="text-base font-medium">Proposito Principal:</span>{" "}
                      {selectedProductoDetails[0].propositoprincipal}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="text-base font-medium">Costo Total:</span>{" "}
                    {formatCurrency(selectedProductoDetails[0].Costo)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-base font-medium">Precio Mínimo:</span>{" "}
                    {formatCurrency(selectedProductoDetails[0].PrecioSugerido)}
                  </p>
                </div>
              </div>

              {/* Mostrar detalles específicos de cada asociación con catálogo */}
              {selectedProductoDetails.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Asociaciones con Catálogos:</h4>
                  <div className="grid gap-3">
                    {selectedProductoDetails.map((detail, idx) => (
                      <Card key={idx} className="p-3">
                        <p className="text-sm">
                          <span className="font-medium">Cliente:</span> {detail.Cliente}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Catálogo:</span> {detail.Catalogo}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Precio de Venta:</span> {formatCurrency(detail.precioventa)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Margen de Utilidad:</span>{" "}
                          {detail.margenutilidad !== null ? `${detail.margenutilidad}` : "N/A"}
                        </p>
                      </Card>
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
