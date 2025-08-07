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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  costoTotal: number
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
  tiempopreparacion: string | null
  imgurl: string | null
  CostoElaboracion: number
  precioventa: number | null
  margenutilidad: number | null
  CostoTotal: number
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
    costoTotal: 0,
    tiempoPromedio: "N/A",
  })
  const [clientes, setClientes] = useState<DropdownItem[]>([])
  const [catalogos, setCatalogos] = useState<DropdownItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productoToToggle, setProductoToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null)

  // Estados para el modal de detalles
  const [showProductoDetailsModal, setShowProductoDetailsModal] = useState(false)
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroCliente, setFiltroCliente] = useState("-1")
  const [filtroCatalogo, setFiltroCatalogo] = useState("-1")

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const resultadosPorPagina = 20

  const esAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.RolId), [user])

  // --- Función de búsqueda SIN dependencias automáticas ---
  const ejecutarBusquedaProductos = async (nombre: string, clienteId: number, catalogoId: number) => {
    if (!user) return
    setIsSearching(true)
    setPaginaActual(1)

    try {
      let query = supabase.from("productos").select(`
          id, nombre, descripcion, tiempopreparacion, costototal, costoadministrativo, activo, imgurl,
          productosxcatalogo!inner(
            catalogos!inner(
              id, nombre,
              clientes!inner(id, nombre)
            )
          )
        `)

      if (nombre) query = query.like("nombre", `%${nombre}%`)
      if (clienteId !== -1) query = query.eq("productosxcatalogo.catalogos.clientes.id", clienteId)
      if (catalogoId !== -1) query = query.eq("productosxcatalogo.catalogos.id", catalogoId)

      const { data: queryData, error: queryError } = await query.order("nombre", { ascending: true })

      if (queryError) {
        console.error("Error en búsqueda:", queryError)
        toast.error("Error al buscar productos.")
        setProductos([])
        return
      }

      // Transformar datos de la consulta
      const flattenedData = queryData.flatMap((p: any) =>
        p.productosxcatalogo.map((x: any) => ({
          ProductoId: p.id,
          ProductoNombre: p.nombre,
          ProductoDescripcion: p.descripcion,
          ProductoTiempo: p.tiempopreparacion,
          ProductoCosto: p.costototal,
          ProductoCostoAdministrativo: p.costoadministrativo,
          ProductoActivo: p.activo,
          ProductoImagenUrl: p.imgurl,
          ClienteId: x.catalogos.clientes.id,
          ClienteNombre: x.catalogos.clientes.nombre,
          CatalogoId: x.catalogos.id,
          CatalogoNombre: x.catalogos.nombre,
        })),
      )
      setProductos(flattenedData)
      toast.success(`Búsqueda completada. Se encontraron ${flattenedData.length} resultados.`)
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
      } = await supabase.from("productos").select("costototal, tiempopreparacion", { count: "exact" })

      if (!statsError && statsData && statsData.length > 0) {
        const costoTotal = statsData.reduce((sum, p) => sum + (p.costototal || 0), 0)
        const costoPromedio = count ? costoTotal / count : 0
        setEstadisticas({
          totalProductos: count || 0,
          costoPromedio,
          costoTotal,
          tiempoPromedio: "25 min",
        })
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
      }

      // Cargar catálogos iniciales
      let catalogosQuery = supabase
        .from("catalogos")
        .select(`
          id, nombre,
          clientes!inner(
            id
          )
        `)
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
      }

      // Ejecutar búsqueda inicial
      await ejecutarBusquedaProductos("", -1, -1)
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
    setFiltroCatalogo("-1")

    try {
      const clienteIdNum = Number.parseInt(value, 10)

      let query = supabase
        .from("catalogos")
        .select(`
          id, nombre,
          clientes!inner(
            id
          )
        `)
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
    ejecutarBusquedaProductos(filtroNombre, clienteId, catalogoId)
  }

  const clearProductosBusqueda = () => {
    setFiltroNombre("")
    setFiltroCliente("-1")
    handleClienteChange("-1") // Resetear también los catálogos
    toast.info("Filtros limpiados.")
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
      await ejecutarBusquedaProductos(filtroNombre, clienteId, catalogoId)
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

  const filteredProductos = productos.filter((producto) =>
    producto.ProductoNombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/vitaminas.gif"
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* 3. Filtros */}
      <Card>
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
                  <SelectValue />
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
                  <SelectValue />
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
              <Select name="ddlEstatus" value={} onValueChange={}>
                <SelectTrigger id="ddlEstatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  
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

      {/* 4. Grid de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {productosPaginados.length} de {productos.length} productos encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table id="tblProductosResultados">
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Catálogo</TableHead>
                  <TableHead>Costo total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearching ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredProductos.length > 0 ? (
                  filteredProductos.map((p, index) => (
                    <TableRow key={`${p.ProductoId}-${p.CatalogoId}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.ProductoImagenUrl || "/placeholder.svg?height=40&width=40"}
                            alt={p.ProductoNombre}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-medium">{p.ProductoNombre}</div>
                            <div className="text-sm text-muted-foreground hidden sm:block">{p.ProductoDescripcion}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.ClienteNombre}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.CatalogoNombre}</TableCell>
                      <TableCell>{formatCurrency(p.ProductoCosto)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${p.ProductoActivo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {p.ProductoActivo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
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
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              {/* Botón de eliminar comentado como en el original */}
                              {/*
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Eliminar Producto"
                                onClick={() => setProductoToDelete(p.ProductoId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              */}
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción desactivará el producto. No se eliminará permanentemente de la base de
                                  datos, pero ya no estará visible en la aplicación.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteProducto}>Confirmar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                  {selectedProductoDetails[0].tiempopreparacion && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="text-base font-medium">Tiempo de Preparación:</span>{" "}
                      {selectedProductoDetails[0].tiempopreparacion}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="text-base font-medium">Costo Total:</span>{" "}
                    {formatCurrency(selectedProductoDetails[0].CostoTotal)}
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
