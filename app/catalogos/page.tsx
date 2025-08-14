"use client"
import Image from "next/image"
import type React from "react"

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
import { BookOpen, Search, RotateCcw, Eye, Edit, PowerOff, Power, Folder, Upload, X } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  obtenerCatalogosFiltrados,
  obtenerClientesParaDropdown,
  obtenerDetalleCatalogo,
  crearCatalogo,
} from "@/app/actions/catalogos-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes-actions"
import { supabase } from "@/lib/supabase"

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
  const [sessionClienteId, setSessionClienteId] = useState<string | null>(null)

  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCatalogoDetails, setSelectedCatalogoDetails] = useState<CatalogoDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationForm, setRegistrationForm] = useState({
    nombre: "",
    descripcion: "",
    clienteId: "",
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [clientesRegistration, setClientesRegistration] = useState<Cliente[]>([])

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

  const cargarClientesRegistration = useCallback(async () => {
    try {
      if (sessionRolId === null || sessionClienteId === null) return

      const rolId = sessionRolId
      let auxClienteId: string

      if ([1, 2, 3, 4].includes(rolId)) {
        auxClienteId = "-1"
      } else {
        auxClienteId = sessionClienteId
      }

      const { data: clientesData, error } = await listaDesplegableClientes(auxClienteId, "")

      if (error) throw new Error(error)

      let fetchedClientes: Cliente[] = []
      if (auxClienteId === "-1") {
        fetchedClientes = clientesData || []
      } else {
        fetchedClientes = clientesData || []
      }

      setClientesRegistration(fetchedClientes)
    } catch (error: any) {
      console.error("Error cargando clientes para registro:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      })
    }
  }, [sessionRolId, sessionClienteId, toast])

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
      setSessionClienteId(session.ClienteId || null)

      await cargarClientes()

      const initialClienteId = "-1"
      const initialStatus = "true"
      const initialName = ""

      await cargarCatalogos(initialName, initialClienteId, initialStatus, 1)
    }
    initPage()
  }, [router, cargarClientes, cargarCatalogos])

  useEffect(() => {
    if (sessionRolId !== null && sessionClienteId !== null) {
      cargarClientesRegistration()
    }
  }, [sessionRolId, sessionClienteId, cargarClientesRegistration])

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

  const handleOpenRegistrationModal = () => {
    setRegistrationForm({
      nombre: "",
      descripcion: "",
      clienteId: "",
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowRegistrationModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRegistrarCatalogo = async () => {
    // Validación de campos
    if (!registrationForm.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del catálogo es requerido.",
        variant: "destructive",
      })
      return
    }

    if (!registrationForm.clienteId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente.",
        variant: "destructive",
      })
      return
    }

    if (!registrationForm.descripcion.trim()) {
      toast({
        title: "Error",
        description: "La descripción es requerida.",
        variant: "destructive",
      })
      return
    }

    setRegistrationLoading(true)

    try {
      const { success, error } = await crearCatalogo(
        registrationForm.clienteId,
        registrationForm.nombre,
        registrationForm.descripcion,
        selectedImage,
      )

      if (!success) {
        throw new Error(error || "Error al crear el catálogo")
      }

      toast({
        title: "Éxito",
        description: "Catálogo registrado correctamente.",
      })

      setShowRegistrationModal(false)
      // Recargar la página de catálogos
      cargarCatalogos(catalogoNameFilter, selectedClienteId, statusFilter, currentPage)
    } catch (error: any) {
      console.error("Error registrando catálogo:", error.message)
      toast({
        title: "Error",
        description: `No se pudo registrar el catálogo: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setRegistrationLoading(false)
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
          onClick={handleOpenRegistrationModal}
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
                      <div
                        className="aspect-video relative overflow-hidden rounded-t-lg cursor-pointer"
                        onClick={() => handleViewCatalogoDetails(catalogo.id)}
                      >
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-orange-100 hover:text-orange-700"
                            onClick={() => router.push(`/catalogos/agregar?getCatalogoId=${catalogo.id}`)}
                          >
                            <Folder className="h-4 w-4" />
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

      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-teal-500/10 rounded-lg" />
          <div className="relative z-10">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Registrar Nuevo Catálogo
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Complete la información para crear un nuevo catálogo.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nombreCatalogo" className="text-sm font-medium text-gray-700">
                    Nombre del Catálogo *
                  </Label>
                  <Input
                    id="nombreCatalogo"
                    value={registrationForm.nombre}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, nombre: e.target.value })}
                    placeholder="Ingrese el nombre del catálogo"
                    className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteCatalogo" className="text-sm font-medium text-gray-700">
                    Cliente *
                  </Label>
                  <Select
                    value={registrationForm.clienteId}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, clienteId: value })}
                  >
                    <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-purple-400">
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm">
                      {clientesRegistration.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcionCatalogo" className="text-sm font-medium text-gray-700">
                    Descripción *
                  </Label>
                  <Textarea
                    id="descripcionCatalogo"
                    value={registrationForm.descripcion}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, descripcion: e.target.value })}
                    placeholder="Ingrese la descripción del catálogo"
                    rows={3}
                    className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Imagen del Catálogo</Label>
                  <div className="flex flex-col items-center space-y-4">
                    {imagePreview ? (
                      <div className="relative w-48 h-32 rounded-lg overflow-hidden border-2 border-white/30">
                        <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1"
                          onClick={() => {
                            setSelectedImage(null)
                            setImagePreview(null)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-48 h-32 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center bg-white/20">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Sin imagen seleccionada</p>
                        </div>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-white/80 backdrop-blur-sm border-white/30"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistrationModal(false)}
                className="bg-white/20 border-white/30 hover:bg-white/30"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleRegistrarCatalogo}
                disabled={registrationLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                {registrationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Catálogo"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
