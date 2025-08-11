"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Search, RotateCcw, Eye, Edit, Power, PowerOff, AlertCircle, X } from "lucide-react"
import { getSession } from "@/app/actions/session-actions"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import {
  obtenerFormulas,
  obtenerFormulasPorFiltros,
  estatusActivoFormula,
  estadisticasFormulasTotales,
} from "@/app/actions/formulas-actions"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: string | null
  RolId: string | null
  Permisos: string[] | null
  SesionActiva: boolean | null
}

interface Cliente {
  id: number
  nombre: string
}

interface Formula {
  folio: number
  formula: string
  costo: number
  cliente: string
  activo: boolean
}

interface FormulaDetalle {
  id: number
  nombre: string
  costo: number
  activo: boolean
  fechacreacion: string
  imgurl: string | null
}

interface IngredienteFormula {
  id: number
  Ingrediente: string
  cantidad: number
  ingredientecostoparcial: number
}

interface PlatilloFormula {
  id: number
  Platillo: string
  imgurl: string | null
}

interface FormulaCompleta {
  formula: FormulaDetalle | null
  ingredientes: IngredienteFormula[]
  platillos: PlatilloFormula[]
  error?: string
}

/* ==================================================
  Principal - pagina
================================================== */
export default function FormulasPage() {
  const router = useRouter()

  /* ==================================================
    Estaods
  ================================================== */
  // Estados de sesión y carga
  const [sesion, setSesion] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [totalFormulas, setTotalFormulas] = useState(0)

  // Estados de filtros
  const [txtFormulaNombre, setTxtFormulaNombre] = useState("")
  const [ddlClientes, setDdlClientes] = useState("-1") // Valor por defecto para "Todos"
  const [ddlEstatusFormula, setDdlEstatusFormula] = useState("true") // Valor por defecto "Activo"

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  // Estados para el modal de detalles
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedFormulaDetails, setSelectedFormulaDetails] = useState<FormulaCompleta | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Estados para los modales de confirmación y mensajes
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    folio: 0,
    estadoActual: false,
    accion: "",
  })
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  })
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  })

  /* ==================================================
    Al cargar la pagina
  ================================================== */
  // Cargar sesión al montar el componente
  useEffect(() => {
    cargarSesion()
  }, [])

  // Cargar datos iniciales cuando la sesión esté lista
  useEffect(() => {
    if (sesion) {
      cargarClientes()
      cargarEstadisticas()
      cargarFormulasIniciales()
    }
  }, [sesion])

  /* ==================================================
    Validaciones con session
  ================================================== */
  const cargarSesion = async () => {
    try {
      const datosSession = await getSession()

      // Validación de seguridad
      if (!datosSession || datosSession.SesionActiva !== true) {
        router.push("/login")
        return
      }

      if (!datosSession.RolId || Number.parseInt(datosSession.RolId.toString(), 10) === 0) {
        router.push("/login")
        return
      }

      setSesion(datosSession)
    } catch (error) {
      console.error("Error cargando sesión:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  /* ==================================================
    Funciones
  ================================================== */
  //Función: cargarClientes: función para cargar el dropdownlist de clientes
  const cargarClientes = async () => {
    try {
      if (!sesion) return

      const rolId = Number.parseInt(sesion.RolId?.toString() || "0", 10)
      const hotelIdSesion = Number.parseInt(sesion.HotelId?.toString() || "0", 10)

      let auxHotelid: number
      if (![1, 2, 3, 4].includes(rolId)) {
        auxHotelid = hotelIdSesion
      } else {
        auxHotelid = -1
      }

      let fetchedClientes: Cliente[] = []
      let defaultSelectedValue = "-1" // Valor por defecto para el ddl

      if (auxHotelid === -1) {
        // Si auxHotelid es -1, obtener todos los clientes y agregar "Todos"
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nombre")
          .order("nombre", { ascending: true })

        if (error) throw error

        fetchedClientes = [{ id: -1, nombre: "Todos" }, ...(data || [])]
        defaultSelectedValue = "-1" // Seleccionar "Todos"
      } else {
        // Si auxHotelid tiene un valor específico, filtrar por ese cliente
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nombre")
          .eq("id", auxHotelid)
          .order("nombre", { ascending: true })

        if (error) throw error

        fetchedClientes = data || []
        // Si se encontró el cliente, seleccionarlo, de lo contrario, volver a "Todos"
        defaultSelectedValue = fetchedClientes.length > 0 ? auxHotelid.toString() : "-1"
      }

      setClientes(fetchedClientes)
      setDdlClientes(defaultSelectedValue) // Aplicar el valor por defecto
    } catch (error: any) {
      console.error("Error cargando clientes:", error)
      setError(`Error al cargar clientes: ${error.message}`)
      setClientes([])
      setDdlClientes("-1") // Fallback a "Todos" en caso de error
    }
  }

  //Función: cargarEstadisticas: función para cargar las estadisticas de totales
  const cargarEstadisticas = async () => {
    try {
      const { count, error } = await estadisticasFormulasTotales()

      if (error) throw new Error(error)

      setTotalFormulas(count || 0)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  //Función: cargarFormulasIniciales: función para cargar el listado de formulas iniciales
  const cargarFormulasIniciales = useCallback(async () => {
    try {
      if (!sesion) return

      const { data, error, totalCount } = await obtenerFormulas(currentPage, itemsPerPage)

      if (error) {
        throw new Error(error)
      }

      const formulasFormateadas = (data || []).map((formula: any) => ({
        folio: formula.Folio,
        formula: formula.Nombre,
        costo: formula.Costo || 0,
        notaspreparacion: formula.NotasPreparacion || "",
        cliente: formula.Cliente || "N/A",
        activo: formula.Activo,
      }))

      setFormulas(formulasFormateadas)
      setTotalPages(Math.ceil(totalCount / itemsPerPage))
    } catch (error) {
      console.error("Error cargando fórmulas iniciales:", error)
      setError("Error al cargar las fórmulas. Por favor, intente de nuevo.")
      setFormulas([])
    }
  }, [sesion, currentPage, ddlEstatusFormula])

  //Función: btnFormulaBuscar: función para cargar el listado de formulas de acuerdo a la busqueda
  const btnFormulaBuscar = async () => {
    try {
      setSearching(true)

      // Preparar parámetros para la función
      const nombre = txtFormulaNombre.trim()
      const clienteId = ddlClientes !== "-1" ? ddlClientes : ""
      const activo = ddlEstatusFormula === "true"

      // Llamar a la función obtenerFormulasPorFiltros
      const result = await obtenerFormulasPorFiltros(nombre, clienteId, activo, currentPage, itemsPerPage)

      if (result.error) {
        throw new Error(result.error)
      }

      // Mapear los datos al formato esperado por el componente
      const formulasFormateadas = (result.data || []).map((formula: any) => ({
        folio: formula.Folio,
        formula: formula.Nombre,
        costo: formula.Costo || 0,
        notaspreparacion: formula.NotasPreparacion || 0,
        cliente: formula.Cliente || "N/A",
        activo: formula.Activo,
      }))

      setFormulas(formulasFormateadas)
      setTotalPages(Math.ceil((result.totalCount || 0) / itemsPerPage))

      // Simular animación de 0.5 segundos
      setTimeout(() => {
        setSearching(false)
      }, 500)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setError("Error al realizar la búsqueda. Por favor, intente de nuevo.")
      setSearching(false)
    }
  }

  //Función: clearFormulasBusqueda: función para cargar el listado de formulas de acuerdo a limpieza de filtros, busqueda inicial de carga de pagina
  const clearFormulasBusqueda = async () => {
    try {
      setTxtFormulaNombre("")
      setDdlClientes("-1") // Restablecer a "Todos"
      setDdlEstatusFormula("true") // Restablecer a "Activo"
      setCurrentPage(1)

      // Usar obtenerFormulas en lugar de cargarFormulasIniciales
      const result = await obtenerFormulas(1, itemsPerPage)

      if (result.error) {
        throw new Error(result.error)
      }

      // Mapear los datos al formato esperado por el componente
      const formulasFormateadas = (result.data || []).map((formula: any) => ({
        folio: formula.Folio,
        formula: formula.Nombre,
        costo: formula.Costo || 0,
        notaspreparacion: formula.NotasPreparacion || 0,
        cliente: formula.Cliente,
        activo: formula.Activo,
      }))

      setFormulas(formulasFormateadas)
      setTotalPages(Math.ceil((result.totalCount || 0) / itemsPerPage))
    } catch (error) {
      console.error("Error al limpiar filtros:", error)
      setError("Error al limpiar filtros. Por favor, intente de nuevo.")
    }
  }

  //Función: toggleEstadoFormula: función para cambiar el estatus de activo de la formula
  const toggleEstadoFormula = async (folio: number, estadoActual: boolean) => {
    const accion = estadoActual ? "inactivar" : "activar"

    // Show confirmation dialog instead of window.confirm
    setConfirmDialog({
      open: true,
      folio,
      estadoActual,
      accion,
    })
  }

  //Función: handleConfirmedToggle: función para confirmar el cambiar el estatus de activo de la formula
  const handleConfirmedToggle = async () => {
    setConfirmDialog({ ...confirmDialog, open: false })

    try {
      const resultado = await estatusActivoFormula(confirmDialog.folio, confirmDialog.estadoActual)

      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      const nuevoEstado = resultado.nuevoEstado ? "ACTIVA" : "INACTIVA"
      // Show success dialog instead of alert
      setSuccessDialog({
        open: true,
        message: `Fórmula con folio ${confirmDialog.folio} ha cambiado su estado a: ${nuevoEstado}`,
      })

      btnFormulaBuscar() // Recargar la lista con los filtros actuales
    } catch (error) {
      console.error("Error cambiando estado:", error)
      // Show error dialog instead of alert
      setErrorDialog({
        open: true,
        message: "Error al cambiar el estado de la fórmula",
      })
    }
  }

  //Función: btnFormulaNuevo: función para dirigir a la creacion de una formula
  const btnFormulaNuevo = () => {
    router.push("/formulas/nuevo")
  }

  //Función: handleViewFormulaDetails: función para ver la informacion de una formula en un modal
  const handleViewFormulaDetails = async (formulaId: number) => {
    setLoadingDetails(true)
    setDetailsError(null)
    setSelectedFormulaDetails(null)
    setShowDetailsDialog(true) // Abrir el diálogo inmediatamente para mostrar el estado de carga

    try {
      // const result = await getFormulaDetails(formulaId)
      // if (result.error) {
      //   setDetailsError(result.error)
      //   toast.error(result.error)
      // } else {
      //   setSelectedFormulaDetails(result)
      // }

      // Placeholder until formulas-actions.ts is implemented
      setDetailsError("Funcionalidad de detalles pendiente de implementación")
    } catch (err: any) {
      console.error("Error al cargar detalles de la fórmula:", err)
      setDetailsError("Error al cargar los detalles de la fórmula.")
      toast.error("Error al cargar los detalles de la fórmula.")
    } finally {
      setLoadingDetails(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/cargar.gif"
              alt="Procesando..."
              width={300}
              height={300}
              unoptimized
              className="absolute inset-0 animate-bounce-slow"
            />
          </div>
          <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fórmulas</h1>
          <p className="text-lg text-muted-foreground">Gestión de Fórmulas</p>
        </div>
        <Button
          id="btnFormulaNuevo"
          name="btnFormulaNuevo"
          type="button"
          onClick={btnFormulaNuevo}
          style={{
            backgroundColor: "#5d8f72",
            color: "white",
            border: "none",
          }}
          className="hover:bg-[#44785a] transition-opacity"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Nueva Fórmula
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fórmulas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFormulas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmFormulasBuscar" name="frmFormulasBuscar" className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="txtFormulaNombre">Nombre</Label>
              <Input
                id="txtFormulaNombre"
                name="txtFormulaNombre"
                type="text"
                maxLength={150}
                value={txtFormulaNombre}
                onChange={(e) => setTxtFormulaNombre(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="ddlClientes">Cliente</Label>
              <Select value={ddlClientes} onValueChange={setDdlClientes}>
                <SelectTrigger id="ddlClientes" name="Cliente">
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="ddlEstatusFormula">Estatus</Label>
              <Select value={ddlEstatusFormula} onValueChange={setDdlEstatusFormula}>
                <SelectTrigger id="ddlEstatusFormula" name="ddlEstatusFormula">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              id="btnFormulaLimpiar"
              name="btnFormulaLimpiar"
              type="button"
              onClick={clearFormulasBusqueda}
              className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
              style={{ fontSize: "12px" }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>

            <Button
              id="btnFormulaBuscar"
              name="btnFormulaBuscar"
              type="button"
              onClick={btnFormulaBuscar}
              disabled={searching}
              className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
              style={{ fontSize: "12px" }}
            >
              {searching ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Fórmulas</CardTitle>
          <CardDescription>
            Mostrando {formulas.length} de {totalFormulas} fórmulas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-2">
                <BookOpen className="h-8 w-8 animate-pulse text-[#cfa661]" />
                <span className="text-sm text-muted-foreground">Buscando fórmulas...</span>
              </div>
            </div>
          ) : (
            <Table id="tblFormulaResultados">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Fórmula</TableHead>
                  <TableHead>Notas Preparacion</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map((formula) => (
                  <TableRow key={formula.folio}>
                    <TableCell>{formula.folio}</TableCell>
                    <TableCell>{formula.formula}</TableCell>
                    <TableCell>{formula.notaspreparacion}</TableCell>
                    <TableCell>${formula.costo.toFixed(2)}</TableCell>
                    <TableCell>{formula.cliente}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewFormulaDetails(formula.folio)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/formulas/${formula.folio}/editar`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEstadoFormula(formula.folio, formula.activo)}
                        >
                          {formula.activo ? (
                            <PowerOff className="h-3 w-3 text-red-500" />
                          ) : (
                            <Power className="h-3 w-3 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles de Fórmula */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-[#cfa661]">Detalles de Fórmula</DialogTitle>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogPrimitive.Close>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-10 w-10 animate-spin text-[#cfa661]" />
                <span className="text-lg text-muted-foreground">Cargando detalles de la fórmula...</span>
              </div>
            </div>
          ) : detailsError ? (
            <div className="flex flex-1 items-center justify-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{detailsError}</AlertDescription>
              </Alert>
            </div>
          ) : selectedFormulaDetails?.formula ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 py-4">
                {/* Sección de Detalles de la Fórmula */}
                <Card className="lg:col-span-3 w-[410px] shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">{selectedFormulaDetails.formula.nombre}</CardTitle>
                    <CardDescription>Información general de la fórmula</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {selectedFormulaDetails.formula.imgurl && (
                      <div className="w-full max-w-xs mx-auto mb-4">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={selectedFormulaDetails.formula.imgurl || "/placeholder.svg"}
                            alt={`Imagen de ${selectedFormulaDetails.formula.nombre}`}
                            fill
                            className="rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=180&width=320"
                            }}
                          />
                        </AspectRatio>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Folio:</div>
                      <div>{selectedFormulaDetails.formula.id}</div>
                      <div className="font-medium">Costo de Total:</div>
                      <div>${selectedFormulaDetails.formula.costo?.toFixed(2) || "0.00"}</div>
                      <div className="font-medium">Estatus:</div>
                      <div>{selectedFormulaDetails.formula.activo ? "Activa" : "Inactiva"}</div>
                      <div className="font-medium">Fecha de Creación:</div>
                      <div>{new Date(selectedFormulaDetails.formula.fechacreacion).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-md mb-2">Notas de Preparación:</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedFormulaDetails.formula.notaspreparacion || "No hay notas de preparación."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sección de Ingredientes */}
                <Card className="lg:col-span-3 w-[400px] shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">Ingredientes</CardTitle>
                    <CardDescription>Componentes de esta fórmula</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedFormulaDetails.ingredientes.length > 0 ? (
                      <ScrollArea className="h-[400px] w-full rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ingrediente</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Costo Parcial</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFormulaDetails.ingredientes.map((ingrediente) => (
                              <TableRow key={ingrediente.id}>
                                <TableCell className="text-xs">{ingrediente.Ingrediente}</TableCell>
                                <TableCell className="text-right">{ingrediente.cantidad}</TableCell>
                                <TableCell className="text-right">
                                  ${ingrediente.ingredientecostoparcial?.toFixed(2) || "0.00"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay ingredientes asociados a esta fórmula.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Sección de Platillos que usan esta Fórmula */}
                <Card className="lg:col-span-6 shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">Platillos que usan esta Fórmula</CardTitle>
                    <CardDescription>Platillos donde se utiliza esta fórmula</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedFormulaDetails.platillos.length > 0 ? (
                      <ScrollArea className="h-[200px] w-full rounded-md border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-2">
                          {selectedFormulaDetails.platillos.map((platillo) => (
                            <Card key={platillo.id} className="flex flex-col items-center text-center p-2">
                              <AspectRatio ratio={1 / 1} className="w-24 h-24 mb-2">
                                <Image
                                  src={platillo.imgurl || "/placeholder.svg?height=96&width=96&query=platillo"}
                                  alt={`Imagen de ${platillo.Platillo}`}
                                  fill
                                  className="rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                                  }}
                                />
                              </AspectRatio>
                              <p className="font-medium text-sm">{platillo.Platillo}</p>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">Ningún platillo utiliza esta fórmula.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">No se encontraron detalles para esta fórmula.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Acción</DialogTitle>
            <DialogDescription>¿Está seguro que desea {confirmDialog.accion} esta fórmula?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmedToggle}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog({ ...successDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Éxito</DialogTitle>
            <DialogDescription>{successDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessDialog({ ...successDialog, open: false })}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog({ ...errorDialog, open: false })}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
