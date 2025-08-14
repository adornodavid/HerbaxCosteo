"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, RotateCcw } from 'lucide-react'
import { obtenerClientesFiltrados, obtenerTotalClientes } from "@/app/actions/clientes-actions" // Importación de las nuevas acciones
import Image from "next/image"

// Tipo para los resultados del query SQL específico para clientes
type ClienteResult = {
  Folio: number
  Nombre: string
  Direccion: string | null
  ImgUrl: string | null // Añadido para la imagen del cliente
  Estatus: boolean
}

export default function ClientesPage() { // Cambiado de HotelesPage a ClientesPage
  const [clients, setClients] = useState<ClienteResult[]>([]) // Cambiado de hotels a clients
  const [totalClientes, setTotalClientes] = useState(0) // Cambiado de totalHoteles a totalClientes
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para los filtros
  const [searchNombreCliente, setSearchNombreCliente] = useState("") // Cambiado de searchNombre a searchNombreCliente
  const [currentSearchNombreCliente, setCurrentSearchNombreCliente] = useState("") // Cambiado de currentSearchNombre a currentSearchNombreCliente

  const mounted = useRef(true)
  const itemsPerPage = 20

  const fetchData = useCallback(async () => {
    if (!mounted.current) return

    setLoading(true)
    setError(null)

    try {
      // Obtener estadísticas generales
      const { total: totalClientesCount, error: statsError } = await obtenerTotalClientes() // Cambiado a obtenerTotalClientes
      if (statsError) {
        console.error("Error al obtener estadísticas de clientes:", statsError)
      } else if (mounted.current) {
        setTotalClientes(totalClientesCount) // Cambiado a setTotalClientes
      }

      // Obtener clientes filtrados
      const {
        data,
        error: clientesError, // Cambiado a clientesError
        totalCount: count,
      } = await obtenerClientesFiltrados(currentSearchNombreCliente, currentPage, itemsPerPage) // Cambiado a obtenerClientesFiltrados y solo se pasa el nombre

      if (clientesError) { // Cambiado a clientesError
        if (mounted.current) {
          setError(clientesError) // Cambiado a clientesError
        }
      } else if (mounted.current) {
        setClients(data || []) // Cambiado a setClients
        setTotalCount(count)
      }
    } catch (err) {
      console.error("Error en fetchData de clientes:", err)
      if (mounted.current) {
        setError("Error al cargar los datos de clientes")
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [currentSearchNombreCliente, currentPage]) // Dependencia ajustada

  useEffect(() => {
    mounted.current = true
    fetchData()

    return () => {
      mounted.current = false
    }
  }, [fetchData])

  const handleSearch = () => {
    setSearchNombreCliente(searchNombreCliente) // Ajustado
    setCurrentSearchNombreCliente(searchNombreCliente) // Ajustado
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleClearFilters = () => {
    setSearchNombreCliente("") // Ajustado
    setCurrentSearchNombreCliente("") // Ajustado
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/cargando.gif"
              alt="Procesando..."
              width={300}
              height={300}
              unoptimized
              className="absolute inset-0 animate-bounce-slow"
            />
          </div>
          <p className="text-lg font-semibold text-gray-800">Cargando Página de Clientes...</p> {/* Texto ajustado */}
        </div>
      </div>
    )
  }

  const handleFormSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch()
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Título de la página */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2> {/* Cambiado a Clientes */}
          <p className="text-muted-foreground">Gestión de clientes</p> {/* Texto ajustado */}
        </div>
      </div>

      {/* Resúmenes de estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes Registrados</CardTitle> {/* Texto ajustado */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : totalClientes.toLocaleString()} {/* Cambiado a totalClientes */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Buscar clientes por nombre</CardDescription> {/* Texto ajustado */}
        </CardHeader>
        <CardContent>
          <form id="frmClientesBuscar" name="frmClientesBuscar" className="flex gap-4 items-end" onSubmit={handleFormSearchSubmit}> {/* ID ajustado */}
            <div className="flex-1">
              <label htmlFor="txtClienteNombre" className="text-sm font-medium"> {/* ID ajustado */}
                Nombre
              </label>
              <Input
                id="txtClienteNombre" // ID ajustado
                name="txtClienteNombre" // Nombre ajustado
                type="text"
                maxLength={150}
                value={searchNombreCliente} // Ajustado
                onChange={(e) => setSearchNombreCliente(e.target.value)} // Ajustado
                placeholder="Buscar por nombre..."
              />
            </div>
            <Button
              id="btnClientesLimpiar" // ID ajustado
              name="btnClientesLimpiar" // Nombre ajustado
              type="button"
              onClick={handleClearFilters}
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
            <Button
              id="btnClientesBuscar" // ID ajustado
              name="btnClientesBuscar" // Nombre ajustado
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sección de tarjetas de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle> {/* Texto ajustado */}
          <CardDescription>
            {loading
              ? "Cargando..."
              : `Mostrando ${clients.length} de ${totalCount} clientes (Página ${currentPage} de ${totalPages})`} {/* Texto y variable ajustados */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>Error: {error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? ( // Cambiado a clients
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clientes con los criterios de búsqueda especificados. {/* Texto ajustado */}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => ( // Cambiado a clients.map
                <Card key={client.Folio} className="flex flex-col items-center text-center p-4">
                  <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden">
                    <Image
                      src={client.ImgUrl || "/placeholder-user.jpg"} // Usar ImgUrl o placeholder
                      alt={client.Nombre}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-full"
                    />
                  </div>
                  <CardTitle className="text-lg font-semibold mb-1">{client.Nombre}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2">
                    {client.Direccion || "Dirección no especificada"}
                  </CardDescription>
                  <Badge variant={client.Estatus ? "default" : "secondary"}>
                    {client.Estatus ? "Activo" : "Inactivo"}
                  </Badge>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
