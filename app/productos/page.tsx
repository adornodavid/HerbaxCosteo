'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  buscarProductos,
  getEstadisticasProductos,
} from '@/app/actions/productos-actions'
import { getClientes } from '@/app/actions/clientes-actions'
import { getCatalogos } from '@/app/actions/catalogos-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusCircle, Search, XCircle } from 'lucide-react'

interface Producto {
  id: number
  nombre: string
  costo: number
  imagen_url: string
}

interface EstadisticasProductos {
  totalProductos: number
  costoPromedio: number
  productosActivos: number
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
  const [estadisticas, setEstadisticas] = useState<EstadisticasProductos | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [searchNombre, setSearchNombre] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [selectedCatalogo, setSelectedCatalogo] = useState<string>('all')

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('nombre', searchNombre)
    formData.append('ddlClientes', selectedCliente)
    formData.append('ddlCatalogo', selectedCatalogo)
    const data = await buscarProductos(formData)
    setProductos(data)
    setLoading(false)
  }, [searchNombre, selectedCliente, selectedCatalogo])

  const fetchEstadisticas = useCallback(async () => {
    const stats = await getEstadisticasProductos()
    setEstadisticas(stats)
  }, [])

  const fetchClientes = useCallback(async () => {
    setLoadingClientes(true)
    const data = await getClientes()
    setClientes(data)
    setLoadingClientes(false)
  }, [])

  const fetchCatalogos = useCallback(async (clienteId: string) => {
    setLoadingCatalogos(true)
    const data = await getCatalogos(clienteId)
    setCatalogos(data)
    setLoadingCatalogos(false)
  }, [])

  useEffect(() => {
    fetchClientes()
    fetchEstadisticas()
    fetchProductos() // Initial fetch
  }, [fetchClientes, fetchEstadisticas, fetchProductos])

  useEffect(() => {
    if (selectedCliente !== 'all') {
      fetchCatalogos(selectedCliente)
    } else {
      setCatalogos([]) // Clear catalogs if no client is selected
      setSelectedCatalogo('all') // Reset catalog selection
    }
  }, [selectedCliente, fetchCatalogos])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProductos()
  }

  const handleClear = () => {
    setSearchNombre('')
    setSelectedCliente('all')
    setSelectedCatalogo('all')
    // Re-fetch products after clearing filters
    const formData = new FormData()
    formData.append('nombre', '')
    formData.append('ddlClientes', 'all')
    formData.append('ddlCatalogo', 'all')
    buscarProductos(formData).then(setProductos)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestión de Productos</h1>

      {/* Sección de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas ? (
              <div className="text-2xl font-bold">{estadisticas.totalProductos}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas ? (
              <div className="text-2xl font-bold">${estadisticas.costoPromedio.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-24" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas ? (
              <div className="text-2xl font-bold">{estadisticas.productosActivos}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de Búsqueda y Acciones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                placeholder="Buscar por nombre"
              />
            </div>
            <div>
              <Label htmlFor="ddlClientes">Cliente</Label>
              {loadingClientes ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  name="ddlClientes"
                  value={selectedCliente}
                  onValueChange={setSelectedCliente}
                >
                  <SelectTrigger id="ddlClientes">
                    <SelectValue placeholder="Seleccionar Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Clientes</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={String(cliente.id)}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="ddlCatalogo">Catálogo</Label>
              {loadingCatalogos ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  name="ddlCatalogo"
                  value={selectedCatalogo}
                  onValueChange={setSelectedCatalogo}
                  disabled={selectedCliente === 'all' || catalogos.length === 0}
                >
                  <SelectTrigger id="ddlCatalogo">
                    <SelectValue placeholder="Seleccionar Catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Catálogos</SelectItem>
                    {catalogos.map((catalogo) => (
                      <SelectItem key={catalogo.id} value={String(catalogo.id)}>
                        {catalogo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="col-span-1 md:col-span-3 flex justify-end gap-2">
              <Button type="submit" disabled={loading}>
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
              <Button type="button" variant="outline" onClick={handleClear} disabled={loading}>
                <XCircle className="mr-2 h-4 w-4" /> Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Botón de Crear Producto */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push('/productos/nuevo')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Producto
        </Button>
      </div>

      {/* Listado de Productos en Tarjetas */}
      <h2 className="text-2xl font-bold mb-4">Resultados de Productos</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col items-center p-4">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No se encontraron productos.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id} className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={producto.imagen_url || '/placeholder.svg?height=200&width=200&query=default+product'}
                  alt={producto.nombre}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 ease-in-out hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate w-full">{producto.nombre}</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">${producto.costo.toFixed(2)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/productos/${producto.id}/editar`)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => alert(`Eliminar ${producto.nombre}`)}>
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
