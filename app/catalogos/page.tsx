"use client"
import Image from "next/image"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import { BookOpen, Search, RotateCcw, Eye, Edit, PowerOff, Power } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import { useToast } from "@/components/ui/use-toast"
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
import { Loader2 } from "@/components/ui/loader2"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  obtenerCatalogosFiltrados,
  obtenerClientesParaDropdown,
  obtenerDetalleCatalogo,
} from "@/app/actions/catalogos-actions"
import { supabase } from "@/lib/supabase"
import { X } from "lucide-react"

interface Catalogo {
  id: string
  nombre: string
  descripcion: string | null
  imgurl: string | null
  activo: boolean
  fechacreacion: string
  cliente: {
    id: string
    nombre: string
  } | null
}

interface Cliente {
  id: string
  nombre: string
}

interface CatalogoDetails {
  id: string
  nombre: string
  descripcion: string | null
  imgurl: string | null
  activo: boolean
  fechacreacion: string
  cliente: {
    id: string
    nombre: string
  } | null
}

export default function CatalogosPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [totalCatalogos, setTotalCatalogos] = useState(0)
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [catalogoNameFilter, setCatalogoNameFilter] = useState("")
  const [selectedClienteId, setSelectedClienteId] = useState<string>("-1")
  const [statusFilter, setStatusFilter] = useState<string>("true")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const [sessionRolId, setSessionRolId] = useState<number | null>(null)
  const [sessionHotelId, setSessionHotelId] = useState<string | null>(null)

  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCatalogoDetails, setSelectedCatalogoDetails] = useState<CatalogoDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const cargarClientes = useCallback(async () => {
    try {
      const { data, error } = await obtenerClientesParaDropdown()

      if (error) throw new Error(error)

      const fetchedClientes: Cliente[] = [{ id: "-1", nombre: "Todos" }, ...data]
      setClientes(fetchedClientes)
    } catch (error: any) {
      console.error("Error cargando clientes:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      })
    }
  }, [toast])

  const cargarCatalogos = useCallback(
    async (nameFilter: string, clienteIdFilter: string, status: string, page: number) => {
      if (sessionRolId === null) return

      setSearching(true)
      try {
        const { data, count, error } = await obtenerCatalogosFiltrados(
          nameFilter,
          clienteIdFilter,
          status === "true",
          page,
          itemsPerPage,
        )

        if (error) throw new Error(error)

        setCatalogos(data)
        setTotalCatalogos(count)
      } catch (error: any) {
        console.error("Error cargando catálogos:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los catálogos.",
          variant: "destructive",
        })
      } finally {
        setSearching(false)
        setLoading(false)
      }
    },
    [sessionRolId, toast, itemsPerPage],
  )

  // Security and initial data loading
  useEffect(() => {
    const initPage = async () => {
      const session = await getSession()
      if (!session || session.SesionActiva !== true) {
        router.push("/login")
        return
      }
      const rolId = Number.parseInt(session.RolId?.toString() || "0", 10)
      if (rolId === 0) {
        router.push("/login")
        return
      }
      setSessionRolId(rolId)
      setSessionHotelId(session.HotelId || null)

      await cargarClientes()

      const initialClienteId = "-1"
      const initialStatus = "true"
      const initialName = ""

      await cargarCatalogos(initialName, initialClienteId, initialStatus, 1)
    }
    initPage()
  }, [router, cargarClientes, cargarCatalogos])

  const handleSearch = () => {
    setCurrentPage(1)
    cargarCatalogos(catalogoNameFilter, selectedClienteId, statusFilter, 1)
  }

  const handleClearFilters = () => {
    setCatalogoNameFilter("")
    setStatusFilter("true")
    setSelectedClienteId("-1")
    setCurrentPage(1)
    cargarCatalogos("", "-1", "true", 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    cargarCatalogos(catalogoNameFilter, selectedClienteId, statusFilter, page)
  }

  const handleStatusToggle = async (catalogoId: string, currentStatus: boolean) => {
    if (window.confirm(`¿Estás seguro de que deseas ${currentStatus ? "inactivar" : "activar"} este catálogo?`)) {
      try {
        const { error } = await supabase.from("catalogos").update({ activo: !currentStatus }).eq("id", catalogoId)

        if (error) throw error

        toast({
          title: "Éxito",
          description: `Catálogo ${currentStatus ? "inactivado" : "activado"} correctamente.`,
        })
        cargarCatalogos(catalogoNameFilter, selectedClienteId, statusFilter, currentPage)
      } catch (error: any) {
        console.error("Error actualizando estado del catálogo:", error.message)
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del catálogo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewCatalogoDetails = async (catalogoId: string) => {
    setLoadingDetails(true)
    setDetailsError(null)
    setShowDetailsDialog(true)

    try {
      const { catalogo, error } = await obtenerDetalleCatalogo(catalogoId)

      if (error) {
        setDetailsError(error)
        setSelectedCatalogoDetails(null)
        toast({
          title: "Error",
          description: `No se pudieron cargar los detalles del catálogo: ${error}`,
          variant: "destructive",
        })
      } else if (catalogo) {
        setSelectedCatalogoDetails(catalogo)
      } else {
        setDetailsError("No se encontraron detalles para este catálogo.")
        setSelectedCatalogoDetails(null)
      }
    } catch (error: any) {
      console.error("Error al obtener detalles del catálogo:", error)
      setDetailsError("Ocurrió un error inesperado al cargar los detalles.")
      setSelectedCatalogoDetails(null)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al cargar los detalles del catálogo.",
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  const totalPages = Math.ceil(totalCatalogos / itemsPerPage)

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
          <p className="text-lg font-semibold text-gray-800">Cargando Página...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Catálogos</h1>
          <p className="text-lg text-gray-500">Gestión completa de Catálogos</p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/catalogos/nuevo")}
          style={{ backgroundColor: "#5d8f72", color: "white" }}
          id="btnCatalogoNuevo"
          name="btnCatalogoNuevo"
        >
          <BookOpen className="mr-2 h-4 w-4" /> Nuevo Catálogo
        </Button>
      </div>

      {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Catálogos</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCatalogos}</div>
            <p className="text-xs text-gray-500">Catálogos registrados en el sistema</p>
          </CardContent>
        </Card>
      </div>*/}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="frmCatalogosBuscar"
            name="frmCatalogosBuscar"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
          >
            <div className="space-y-2">
              <label htmlFor="txtCatalogoNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtCatalogoNombre"
                name="txtCatalogoNombre"
                type="text"
                maxLength={150}
                value={catalogoNameFilter}
                onChange={(e) => setCatalogoNameFilter(e.target.value)}
                placeholder="Buscar por nombre de catálogo"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ddlClientes" className="text-sm font-medium">
                Cliente
              </label>
              <Select
                value={selectedClienteId}
                onValueChange={setSelectedClienteId}
                id="ddlClientes"
                name="ddlClientes"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente">
                    {selectedClienteId === "-1"
                      ? "Todos"
                      : clientes.find((c) => c.id === selectedClienteId)?.nombre || "Selecciona un cliente"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="ddlEstatusCatalogo" className="text-sm font-medium">
                Estatus
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                id="ddlEstatusCatalogo"
                name="ddlEstatusCatalogo"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estatus">
                    {statusFilter === "true" ? "Activo" : "Inactivo"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 col-span-full lg:col-span-2 justify-start flex-row items-end">
              <Button
                type="button"
                onClick={handleClearFilters}
                className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                id="btnCatalogoLimpiar"
                name="btnCatalogoLimpiar"
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar filtros
              </Button>
              <Button
                type="button"
                onClick={handleSearch}
                className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                id="btnCatalogoBuscar"
                name="btnCatalogoBuscar"
              >
                <Search className="mr-2 h-3 w-3" /> Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Catálogos</CardTitle>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#c49deb]">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="mt-2">Cargando catálogos...</p>
            </div>
          ) : catalogos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No se encontraron catálogos con los filtros aplicados.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catalogos.map((catalogo) => (
                  <Card
                    key={catalogo.id}
                    className="group relative overflow-hidden backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/90"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative z-10">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <Image
                          src={catalogo.imgurl || "/placeholder.svg?height=200&width=300&query=catalogo"}
                          alt={catalogo.nombre}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={catalogo.activo ? "default" : "secondary"} className="backdrop-blur-sm">
                            {catalogo.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                            {catalogo.nombre}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {catalogo.descripcion || "Sin descripción"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {catalogo.cliente?.nombre || "Sin cliente"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-center gap-2 pt-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-purple-100 hover:text-purple-700"
                            onClick={() => handleViewCatalogoDetails(catalogo.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-blue-100 hover:text-blue-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={
                                  catalogo.activo
                                    ? "hover:bg-red-100 hover:text-red-700"
                                    : "hover:bg-green-100 hover:text-green-700"
                                }
                              >
                                {catalogo.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción {catalogo.activo ? "inactivará" : "activará"} el catálogo "
                                  {catalogo.nombre}". ¿Deseas continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStatusToggle(catalogo.id, catalogo.activo)}>
                                  {catalogo.activo ? "Inactivar" : "Activar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>

              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="relative pb-4">
            <DialogTitle className="text-3xl font-bold text-[#986ec2]">Detalles del Catálogo</DialogTitle>
            <DialogDescription className="text-gray-600">
              Información detallada del catálogo seleccionado.
            </DialogDescription>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-6 w-6 text-gray-500" />
              <span className="sr-only">Cerrar</span>
            </DialogPrimitive.Close>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#c49deb]">
              <Loader2 className="h-16 w-16 animate-spin" />
              <p className="mt-4 text-lg">Cargando detalles del catálogo...</p>
            </div>
          ) : detailsError ? (
            <div className="text-center text-red-500 py-8">
              <p className="text-lg font-semibold">Error al cargar los detalles:</p>
              <p>{detailsError}</p>
            </div>
          ) : selectedCatalogoDetails ? (
            <ScrollArea className="flex-1 pr-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-6 py-4">
                <Card className="shadow-lg border-l-4 border-[#986ec2]">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-[#986ec2]">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedCatalogoDetails.imgurl && (
                      <div className="flex justify-center">
                        <div className="relative w-48 h-32 rounded-lg overflow-hidden">
                          <Image
                            src={selectedCatalogoDetails.imgurl || "/placeholder.svg"}
                            alt={selectedCatalogoDetails.nombre}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-28">ID:</span>
                        <span className="text-gray-900">{selectedCatalogoDetails.id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-28">Nombre:</span>
                        <span className="text-gray-900">{selectedCatalogoDetails.nombre}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-28">Cliente:</span>
                        <span className="text-gray-900">{selectedCatalogoDetails.cliente?.nombre || "N/A"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-28">Estatus:</span>
                        <span
                          className={`font-semibold ${selectedCatalogoDetails.activo ? "text-green-600" : "text-red-600"}`}
                        >
                          {selectedCatalogoDetails.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-28">Creación:</span>
                        <span className="text-gray-900">
                          {new Date(selectedCatalogoDetails.fechacreacion).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="col-span-full">
                        <span className="font-medium text-gray-700 block mb-1">Descripción:</span>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                          {selectedCatalogoDetails.descripcion || "Sin descripción."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
