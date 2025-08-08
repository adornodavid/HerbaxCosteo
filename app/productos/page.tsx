// Contenido asumido de app/productos/page.tsx
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getProductos, deleteProducto } from '@/app/actions/productos-actions'
import { getClientes } from '@/app/actions/clientes-actions' // Asumiendo que tienes esta acción
import { getCatalogosByCliente } from '@/app/actions/catalogos-actions' // Asumiendo que tienes esta acción
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import Image from 'next/image'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface Producto {
  id: number
  nombre: string
  costo: number
  imagen_url: string | null
  cliente_id: number
  catalogo_id: number
}

interface Cliente {
  id: number
  nombre: string
}

interface Catalogo {
  id: number
  nombre: string
}

export default function ProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [nombreFilter, setNombreFilter] = useState<string>('')
  const [clienteFilter, setClienteFilter] = useState<string>('')
  const [catalogoFilter, setCatalogoFilter] = useState<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12 // Número de tarjetas por página
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchClientes = useCallback(async () => {
    const { data, error } = await getClientes() // Asume que getClientes devuelve { data: Cliente[], error: any }
    if (error) {
      console.error('Error fetching clientes:', error)
    } else {
      setClientes(data || [])
    }
  }, [])

  const fetchCatalogos = useCallback(async (clienteId: number | null) => {
    if (clienteId) {
      const { data, error } = await getCatalogosByCliente(clienteId) // Asume que getCatalogosByCliente devuelve { data: Catalogo[], error: any }
      if (error) {
        console.error('Error fetching catalogos:', error)
      } else {
        setCatalogos(data || [])
      }
    } else {
      setCatalogos([])
    }
  }, [])

  const fetchProductosData = useCallback(async () => {
    setLoading(true)
    const clienteIdNum = clienteFilter ? parseInt(clienteFilter) : null
    const catalogoIdNum = catalogoFilter ? parseInt(catalogoFilter) : null

    const { data, count, error } = await getProductos(
      nombreFilter,
      clienteIdNum,
      catalogoIdNum,
      currentPage,
      pageSize
    )

    if (error) {
      console.error('Error fetching productos:', error)
      setProductos([])
      setTotalProductos(0)
    } else {
      setProductos(data || [])
      setTotalProductos(count || 0)
    }
    setLoading(false)
  }, [nombreFilter, clienteFilter, catalogoFilter, currentPage, pageSize])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    const clienteIdNum = clienteFilter ? parseInt(clienteFilter) : null
    fetchCatalogos(clienteIdNum)
    setCatalogoFilter('') // Reset catalogo filter when cliente changes
  }, [clienteFilter, fetchCatalogos])

  useEffect(() => {
    fetchProductosData()
  }, [fetchProductosData])

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page on new search
    fetchProductosData()
  }

  const handleClear = () => {
    setNombreFilter('')
    setClienteFilter('')
    setCatalogoFilter('')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
  }

  const confirmDelete = async () => {
    if (deletingId !== null) {
      const result = await deleteProducto(deletingId)
      if (result.success) {
        fetchProductosData() // Refresh list
      } else {
        console.error('Failed to delete producto:', result.message)
      }
      setDeletingId(null)
    }
  }

  const totalPages = Math.ceil(totalProductos / pageSize)

  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Productos</h1>

      {/* Sección de Filtros */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">Buscar Productos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="nombre" className="text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <Input
              id="nombre"
              placeholder="Buscar por nombre"
              value={nombreFilter}
              onChange={(e) => setNombreFilter(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ddlClientes" className="text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <Select
              name="Cliente"
              value={clienteFilter}
              onValueChange={setClienteFilter}
            >
              <SelectTrigger id="ddlClientes" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Seleccionar Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los Clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ddlCatalogo" className="text-sm font-medium text-gray-700 mb-1">Catálogo</label>
            <Select
              name="Catalogo"
              value={catalogoFilter}
              onValueChange={setCatalogoFilter}
              disabled={!clienteFilter || catalogos.length === 0}
            >
              <SelectTrigger id="ddlCatalogo" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Seleccionar Catálogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los Catálogos</SelectItem>
                {catalogos.map((catalogo) => (
                  <SelectItem key={catalogo.id} value={catalogo.id.toString()}>
                    {catalogo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-4">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm">
              <Icons.Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button onClick={handleClear} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-md shadow-sm">
              <Icons.Eraser className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Acciones y Estadísticas */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => router.push('/productos/nuevo')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-sm">
          <Icons.Plus className="mr-2 h-4 w-4" /> Crear Nuevo Producto
        </Button>
        <div className="text-sm text-gray-600">
          Total de Productos: <span className="font-semibold">{totalProductos}</span>
        </div>
      </div>

      {/* Sección de Resultados (Tarjetas) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: pageSize }).map((_, index) => (
            <Card key={index} className="animate-pulse shadow-sm">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center text-gray-600 text-lg py-10">
          No se encontraron productos con los filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id} className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#528A94] to-[#a6d1cc] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="relative z-10 p-6 flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 transform group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={producto.imagen_url || '/placeholder.svg?height=128&width=128&query=product'}
                    alt={producto.nombre}
                    layout="fill"
                    objectFit="cover"
                    className="transition-all duration-300 group-hover:brightness-90"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2 truncate w-full">
                  {producto.nombre}
                </h3>
                <p className="text-2xl font-bold text-blue-600 group-hover:text-white transition-colors duration-300 mb-4">
                  ${producto.costo.toFixed(2)}
                </p>
                <div className="flex gap-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 shadow-sm"
                    onClick={() => router.push(`/productos/${producto.id}/editar`)}
                    title="Editar Producto"
                  >
                    <Icons.Edit className="h-5 w-5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full bg-white text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-all duration-200 shadow-sm"
                        onClick={() => setDeletingId(producto.id)}
                        title="Eliminar Producto"
                      >
                        <Icons.Trash className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    {deletingId === producto.id && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
                            y removerá sus datos de nuestros servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
