'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProductos, deleteProducto, getClientes, getCatalogos } from '@/app/actions/productos-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import Image from 'next/image'

interface Producto {
  ProductoId: number
  Nombre: string
  Costo: number
  ImagenUrl: string | null
  // Añade otras propiedades relevantes de tu tabla de productos
}

interface Cliente {
  ClienteId: number
  NombreCliente: string
}

interface Catalogo {
  CatalogoId: number
  NombreCatalogo: string
}

export default function ProductosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [productos, setProductos] = useState<Producto[]>([])
  const [nombreBusqueda, setNombreBusqueda] = useState(searchParams.get('nombre') || '')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(searchParams.get('clienteId') || '')
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<string>(searchParams.get('catalogoId') || '')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])

  const [totalProductos, setTotalProductos] = useState(0)
  const [costoPromedio, setCostoPromedio] = useState(0)

  const fetchClientes = useCallback(async () => {
    const data = await getClientes()
    setClientes(data)
  }, [])

  const fetchCatalogos = useCallback(async (clienteId: number | null) => {
    const data = await getCatalogos(clienteId)
    setCatalogos(data)
  }, [])

  const fetchProductosData = useCallback(async () => {
    const parsedClienteId = clienteSeleccionado ? parseInt(clienteSeleccionado) : null
    const parsedCatalogoId = catalogoSeleccionado ? parseInt(catalogoSeleccionado) : null

    const data = await getProductos(nombreBusqueda, parsedClienteId, parsedCatalogoId)
    setProductos(data as Producto[])

    // Calcular estadísticas
    setTotalProductos(data.length)
    const totalCosto = data.reduce((sum, prod) => sum + prod.Costo, 0)
    setCostoPromedio(data.length > 0 ? totalCosto / data.length : 0)
  }, [nombreBusqueda, clienteSeleccionado, catalogoSeleccionado])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    // Cargar catálogos cuando cambia el cliente seleccionado
    const parsedClienteId = clienteSeleccionado ? parseInt(clienteSeleccionado) : null
    fetchCatalogos(parsedClienteId)
    // Resetear catálogo si el cliente cambia
    setCatalogoSeleccionado('')
  }, [clienteSeleccionado, fetchCatalogos])

  useEffect(() => {
    fetchProductosData()
  }, [fetchProductosData])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (nombreBusqueda) params.set('nombre', nombreBusqueda)
    if (clienteSeleccionado) params.set('clienteId', clienteSeleccionado)
    if (catalogoSeleccionado) params.set('catalogoId', catalogoSeleccionado)
    router.push(`/productos?${params.toString()}`)
  }

  const handleClear = () => {
    setNombreBusqueda('')
    setClienteSeleccionado('')
    setCatalogoSeleccionado('')
    router.push('/productos')
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      const result = await deleteProducto(id)
      if (result.success) {
        alert(result.message)
        fetchProductosData()
      } else {
        alert(`Error: ${result.message}`)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Productos</h1>

      {/* Sección de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
            <Icons.Package className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductos}</div>
            <p className="text-xs text-white/90">Productos registrados</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
            <Icons.DollarSign className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costoPromedio.toFixed(2)}</div>
            <p className="text-xs text-white/90">Costo promedio por producto</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Productos (Mes)</CardTitle>
            <Icons.PlusCircle className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15</div> {/* Placeholder */}
            <p className="text-xs text-white/90">Productos añadidos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Búsqueda y Filtros */}
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-700">Buscar Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                type="text"
                value={nombreBusqueda}
                onChange={(e) => setNombreBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>
            <div>
              <Label htmlFor="ddlClientes">Cliente</Label>
              <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                <SelectTrigger id="ddlClientes">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.ClienteId} value={cliente.ClienteId.toString()}>
                      {cliente.NombreCliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ddlCatalogo">Catálogo</Label>
              <Select value={catalogoSeleccionado} onValueChange={setCatalogoSeleccionado} disabled={!clienteSeleccionado}>
                <SelectTrigger id="ddlCatalogo">
                  <SelectValue placeholder="Selecciona un catálogo" />
                </SelectTrigger>
                <SelectContent>
                  {catalogos.map((catalogo) => (
                    <SelectItem key={catalogo.CatalogoId} value={catalogo.CatalogoId.toString()}>
                      {catalogo.NombreCatalogo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Icons.Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button onClick={handleClear} variant="outline">
              <Icons.Eraser className="mr-2 h-4 w-4" /> Limpiar
            </Button>
            <Button onClick={() => router.push('/productos/nuevo')} className="ml-auto bg-green-500 hover:bg-green-600 text-white">
              <Icons.Plus className="mr-2 h-4 w-4" /> Crear Nuevo Producto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Resultados (Diseño de Tarjetas) */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Listado de Productos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productos.length > 0 ? (
          productos.map((producto) => (
            <Card key={producto.ProductoId} className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group">
              <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                <Image
                  src={producto.ImagenUrl || '/placeholder.svg?height=200&width=300&query=product-placeholder'}
                  alt={producto.Nombre}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <h3 className="text-xl font-semibold text-white drop-shadow-md">{producto.Nombre}</h3>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col justify-between items-start">
                <div className="w-full flex justify-between items-center mb-2">
                  <p className="text-lg font-bold text-gray-900">${producto.Costo.toFixed(2)}</p>
                  <span className="text-sm text-gray-500">Costo</span>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => router.push(`/productos/${producto.ProductoId}/editar`)}
                  >
                    <Icons.Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleDelete(producto.ProductoId)}
                  >
                    <Icons.Trash className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No se encontraron productos.</p>
        )}
      </div>
    </div>
  )
}
