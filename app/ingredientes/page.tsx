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
import { Loader2, Package, Search, RotateCcw, Eye, Edit, Power, PowerOff, AlertCircle } from "lucide-react"
import { getSession } from "@/app/actions/session-actions"
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
import Image from "next/image"
import {
  obtenerIngredientes,
  obtenerIngredientesPorFiltros,
  estatusActivoIngrediente,
  estadisticasIngredientesTotales,
  obtenerDetalleIngrediente,
  obtenerFormulasQueUsanIngrediente,
  obtenerProductosRelacionadosIngrediente,
} from "@/app/actions/ingredientes-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes-actions"

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
  ClienteId: string | null
}

interface Cliente {
  id: number
  nombre: string
}

interface Ingrediente {
  Folio: number
  codigo: string
  nombre: string
  Cliente: string
  Catalogo: string
  categoria: string
  UnidadMedida: string
  costo: number
  activo: boolean
}

interface DetalleIngrediente {
  Folio: number
  codigo: string
  nombre: string
  Cliente: string
  Catalogo: string
  categoria: string
  UnidadMedida: string
  costo: number
  activo: boolean
  categoriaid: number
}

interface FormulaIngrediente {
  imgurl: string | null
  Formula: string
  cantidad: number
  ingredientecostoparcial: number
}

interface ProductoIngrediente {
  imgurl: string | null
  Producto: string
  Cliente?: string
  cantidad: number
  costoparcial: number
}

/* ==================================================
  Principal - pagina
================================================== */
export default function IngredientesPage() {
  const router = useRouter()

  /* ==================================================
    Estados
  ================================================== */
  // Estados de sesión y carga
  const [sesion, setSesion] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [totalIngredientes, setTotalIngredientes] = useState(0)

  // Estados de filtros
  const [txtIngredienteNombre, setTxtIngredienteNombre] = useState("")
  const [ddlClientes, setDdlClientes] = useState("-1")
  const [ddlEstatusIngrediente, setDdlEstatusIngrediente] = useState("true")

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

  const [detailsModal, setDetailsModal] = useState({
    open: false,
    loading: false,
    ingrediente: null as DetalleIngrediente | null,
    formulas: [] as FormulaIngrediente[],
    productos: [] as ProductoIngrediente[],
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
      cargarIngredientesIniciales()
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
      const clienteIdSesion = Number.parseInt(sesion.ClienteId?.toString() || "0", 10)

      let auxClienteid: number
      if (![1, 2, 3, 4].includes(rolId)) {
        auxClienteid = clienteIdSesion
      } else {
        auxClienteid = -1
      }

      let fetchedClientes: Cliente[] = []
      let defaultSelectedValue = "-1"

      const clienteId = auxClienteid === -1 ? "-1" : auxClienteid.toString()
      const nombreCliente = ""

      const { data: clientesData, error } = await listaDesplegableClientes(clienteId, nombreCliente)

      if (error) throw new Error(error)

      if (auxClienteid === -1) {
        fetchedClientes = [{ id: -1, nombre: "Todos" }, ...(clientesData || [])]
        defaultSelectedValue = "-1"
      } else {
        fetchedClientes = clientesData || []
        defaultSelectedValue = fetchedClientes.length > 0 ? auxClienteid.toString() : "-1"
      }

      setClientes(fetchedClientes)
      setDdlClientes(defaultSelectedValue)
    } catch (error: any) {
      console.error("Error cargando clientes:", error)
      setError(`Error al cargar clientes: ${error.message}`)
      setClientes([])
      setDdlClientes("-1")
    }
  }

  //Función: cargarEstadisticas: función para cargar las estadisticas de totales
  const cargarEstadisticas = async () => {
    try {
      const { count, error } = await estadisticasIngredientesTotales()

      if (error) throw new Error(error)

      setTotalIngredientes(count || 0)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  //Función: cargarIngredientesIniciales: función para cargar el listado de ingredientes iniciales
  const cargarIngredientesIniciales = useCallback(async () => {
    try {
      if (!sesion) return

      const rolId = Number.parseInt(sesion.RolId?.toString() || "0", 10)
      let clienteIdParam = -1

      if (![1, 2, 3].includes(rolId)) {
        const clienteIdFromCookies = Number.parseInt(sesion.ClienteId?.toString() || "0", 10)
        clienteIdParam = clienteIdFromCookies
      }

      const { data, error } = await obtenerIngredientes(rolId, clienteIdParam)

      if (error) {
        throw new Error(error)
      }

      setIngredientes(data || [])
    } catch (error) {
      console.error("Error cargando ingredientes iniciales:", error)
      setError("Error al cargar los ingredientes. Por favor, intente de nuevo.")
      setIngredientes([])
    }
  }, [sesion])

  //Función: btnIngredienteBuscar: función para cargar el listado de ingredientes de acuerdo a la busqueda
  const btnIngredienteBuscar = async () => {
    try {
      setSearching(true)

      const nombre = txtIngredienteNombre.trim()
      const clienteId = ddlClientes !== "-1" ? Number.parseInt(ddlClientes) : -1
      const activo = ddlEstatusIngrediente === "true"

      const result = await obtenerIngredientesPorFiltros(nombre, clienteId, activo)

      if (result.error) {
        throw new Error(result.error)
      }

      setIngredientes(result.data || [])

      setTimeout(() => {
        setSearching(false)
      }, 500)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setError("Error al realizar la búsqueda. Por favor, intente de nuevo.")
      setSearching(false)
    }
  }

  //Función: clearIngredientesBusqueda: función para limpiar filtros y cargar listado inicial
  const clearIngredientesBusqueda = async () => {
    try {
      setTxtIngredienteNombre("")
      setDdlClientes("-1")
      setDdlEstatusIngrediente("true")

      await cargarIngredientesIniciales()
    } catch (error) {
      console.error("Error al limpiar filtros:", error)
      setError("Error al limpiar filtros. Por favor, intente de nuevo.")
    }
  }

  //Función: toggleEstadoIngrediente: función para cambiar el estatus de activo del ingrediente
  const toggleEstadoIngrediente = async (folio: number, estadoActual: boolean) => {
    const accion = estadoActual ? "inactivar" : "activar"

    setConfirmDialog({
      open: true,
      folio,
      estadoActual,
      accion,
    })
  }

  //Función: handleConfirmedToggle: función para confirmar el cambio de estatus del ingrediente
  const handleConfirmedToggle = async () => {
    setConfirmDialog({ ...confirmDialog, open: false })

    try {
      const resultado = await estatusActivoIngrediente(confirmDialog.folio, confirmDialog.estadoActual)

      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      const nuevoEstado = resultado.nuevoEstado ? "ACTIVO" : "INACTIVO"
      setSuccessDialog({
        open: true,
        message: `Ingrediente con folio ${confirmDialog.folio} ha cambiado su estado a: ${nuevoEstado}`,
      })

      btnIngredienteBuscar()
    } catch (error) {
      console.error("Error cambiando estado:", error)
      setErrorDialog({
        open: true,
        message: "Error al cambiar el estado del ingrediente",
      })
    }
  }

  //Función: btnIngredienteNuevo: función para dirigir a la creacion de un ingrediente
  const btnIngredienteNuevo = () => {
    router.push("/ingredientes/nuevo")
  }

  //Función: handleViewIngredienteDetails: función para ver la informacion de un ingrediente en un modal
  const handleViewIngredienteDetails = async (ingredienteId: number) => {
    try {
      setDetailsModal((prev) => ({ ...prev, open: true, loading: true }))

      // Get ingredient details
      const { data: ingredienteData, error: ingredienteError } = await obtenerDetalleIngrediente(ingredienteId)
      if (ingredienteError) throw new Error(ingredienteError)

      // Get formulas that use this ingredient
      const { data: formulasData, error: formulasError } = await obtenerFormulasQueUsanIngrediente(ingredienteId)
      if (formulasError) throw new Error(formulasError)

      // Get products related to this ingredient
      const { data: productosData, error: productosError } = await obtenerProductosRelacionadosIngrediente(
        ingredienteId,
        ingredienteData?.categoriaid || 0,
      )
      if (productosError) throw new Error(productosError)

      setDetailsModal({
        open: true,
        loading: false,
        ingrediente: ingredienteData,
        formulas: formulasData || [],
        productos: productosData || [],
      })
    } catch (error: any) {
      console.error("Error cargando detalles del ingrediente:", error)
      setDetailsModal((prev) => ({ ...prev, loading: false }))
      toast.error("Error al cargar los detalles del ingrediente")
    }
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
          <h1 className="text-3xl font-bold">Ingredientes</h1>
          <p className="text-lg text-muted-foreground">Gestión de Ingredientes</p>
        </div>
        <Button
          id="btnIngredienteNuevo"
          name="btnIngredienteNuevo"
          type="button"
          onClick={btnIngredienteNuevo}
          style={{
            backgroundColor: "#5d8f72",
            color: "white",
            border: "none",
          }}
          className="hover:bg-[#44785a] transition-opacity"
        >
          <Package className="h-4 w-4 mr-2" />
          Nuevo Ingrediente
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="rounded-xs grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-xs border bg-card text-card-foreground shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ingredientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIngredientes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmIngredientesBuscar" name="frmIngredientesBuscar" className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="txtIngredienteNombre">Nombre</Label>
              <Input
                id="txtIngredienteNombre"
                name="txtIngredienteNombre"
                type="text"
                maxLength={150}
                value={txtIngredienteNombre}
                onChange={(e) => setTxtIngredienteNombre(e.target.value)}
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
              <Label htmlFor="ddlEstatusIngrediente">Estatus</Label>
              <Select value={ddlEstatusIngrediente} onValueChange={setDdlEstatusIngrediente}>
                <SelectTrigger id="ddlEstatusIngrediente" name="ddlEstatusIngrediente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              id="btnIngredienteLimpiar"
              name="btnIngredienteLimpiar"
              type="button"
              onClick={clearIngredientesBusqueda}
              className="bg-[#4a4a4a] text-white hover:bg-[#333333]"
              style={{ fontSize: "12px" }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>

            <Button
              id="btnIngredienteBuscar"
              name="btnIngredienteBuscar"
              type="button"
              onClick={btnIngredienteBuscar}
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
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Listado de Ingredientes</CardTitle>
          <CardDescription>
            Mostrando {ingredientes.length} de {totalIngredientes} ingredientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-2">
                <Package className="h-8 w-8 animate-pulse text-[#cfa661]" />
                <span className="text-sm text-muted-foreground">Buscando ingredientes...</span>
              </div>
            </div>
          ) : (
            <Table id="tblIngredienteResultados">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Catálogo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad Medida</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientes.map((ingrediente) => (
                  <TableRow key={ingrediente.Folio}>
                    <TableCell>{ingrediente.Folio}</TableCell>
                    <TableCell>{ingrediente.codigo}</TableCell>
                    <TableCell>{ingrediente.nombre}</TableCell>
                    <TableCell>{ingrediente.Cliente}</TableCell>
                    <TableCell>{ingrediente.Catalogo}</TableCell>
                    <TableCell>{ingrediente.categoria}</TableCell>
                    <TableCell>{ingrediente.UnidadMedida}</TableCell>
                    <TableCell>${ingrediente.costo.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewIngredienteDetails(ingrediente.Folio)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/ingredientes/editar?getIngredienteId=${ingrediente.Folio}`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEstadoIngrediente(ingrediente.Folio, ingrediente.activo)}
                        >
                          {ingrediente.activo ? (
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
        </CardContent>
      </Card>

      {/* Modal de Detalles del Ingrediente */}
      <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalles del Ingrediente</DialogTitle>
            <DialogDescription>Información completa del ingrediente seleccionado</DialogDescription>
          </DialogHeader>

          {detailsModal.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : detailsModal.ingrediente ? (
            <div className="space-y-6">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Folio:</span> {detailsModal.ingrediente.Folio}
                    </div>
                    <div>
                      <span className="font-medium">Código:</span> {detailsModal.ingrediente.codigo}
                    </div>
                    <div>
                      <span className="font-medium">Nombre:</span> {detailsModal.ingrediente.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span> {detailsModal.ingrediente.Cliente}
                    </div>
                    <div>
                      <span className="font-medium">Catálogo:</span> {detailsModal.ingrediente.Catalogo}
                    </div>
                    <div>
                      <span className="font-medium">Categoría:</span> {detailsModal.ingrediente.categoria}
                    </div>
                    <div>
                      <span className="font-medium">Unidad Medida:</span> {detailsModal.ingrediente.UnidadMedida}
                    </div>
                    <div>
                      <span className="font-medium">Costo:</span> ${detailsModal.ingrediente.costo.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span>
                      <span
                        className={`ml-1 px-2 py-1 rounded text-xs ${
                          detailsModal.ingrediente.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {detailsModal.ingrediente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fórmulas que usan este ingrediente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fórmulas que usan este ingrediente</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailsModal.formulas.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagen</TableHead>
                          <TableHead>Fórmula</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsModal.formulas.map((formula, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {formula.imgurl ? (
                                <Image
                                  src={formula.imgurl || "/placeholder.svg"}
                                  alt={formula.Formula}
                                  width={40}
                                  height={40}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formula.Formula}</TableCell>
                            <TableCell>{formula.cantidad}</TableCell>
                            <TableCell>${formula.ingredientecostoparcial.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No hay fórmulas que usen este ingrediente</p>
                  )}
                </CardContent>
              </Card>

              {/* Productos relacionados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos relacionados</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailsModal.productos.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagen</TableHead>
                          <TableHead>Producto</TableHead>
                          {detailsModal.ingrediente.categoriaid === 3 && <TableHead>Cliente</TableHead>}
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsModal.productos.map((producto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {producto.imgurl ? (
                                <Image
                                  src={producto.imgurl || "/placeholder.svg"}
                                  alt={producto.Producto}
                                  width={40}
                                  height={40}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{producto.Producto}</TableCell>
                            {detailsModal.ingrediente.categoriaid === 3 && (
                              <TableCell>{producto.Cliente || "N/A"}</TableCell>
                            )}
                            <TableCell>{producto.cantidad}</TableCell>
                            <TableCell>${producto.costoparcial.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No hay productos relacionados con este ingrediente
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setDetailsModal((prev) => ({ ...prev, open: false }))}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Acción</DialogTitle>
            <DialogDescription>¿Está seguro que desea {confirmDialog.accion} este ingrediente?</DialogDescription>
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
