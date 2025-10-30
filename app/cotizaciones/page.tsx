"use client"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Loader2 } from "lucide-react"
import type {
  ProductoXCliente,
  ProductoXClienteOptimo,
  ProductoXClienteN,
  ProductoXClienteOptimoN,
} from "@/types/productos.types"
import type { ddlItem } from "@/types/common.types"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
} from "@/types/common.types"

// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listaDesplegableProductos, objetoProducto } from "@/app/actions/productos"
import {
  cotizacionProducto,
  cotizacionOptima25,
  cotizacionOptima30,
  calcularCotizacion,
} from "@/app/actions/productos-cotizaciones"
import type { oProducto } from "@/types/productos.types"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CotizacionesPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // --- Estados ---
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroProductoTexto, setFiltroProductoTexto] = useState("")
  const [filtroProductoId, setFiltroProductoId] = useState("")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [productosOptions, setProductosOptions] = useState<ddlItem[]>([])
  const [showProductosDropdown, setShowProductosDropdown] = useState(false)

  // Estados de datos
  const [producto, setProducto] = useState<oProducto | null>(null)
  const [productoXCliente, setProductoXCliente] = useState<ProductoXClienteN | null>(null)
  const [productoXClienteOptimo25, setProductoXClienteOptimo25] = useState<ProductoXClienteOptimoN | null>(null)
  const [productoXClienteOptimo30, setProductoXClienteOptimo30] = useState<ProductoXClienteOptimo | null>(null)

  // Estados de inputs de cálculo
  const [precioVentaSinIVA, setPrecioVentaSinIVA] = useState("")
  const [precioVentaConIVA, setPrecioVentaConIVA] = useState("")
  const [forecast, setForecast] = useState("")

  // Estados de búsqueda
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // -- Funciones --
  // Cargar clientes para dropdown
  useEffect(() => {
    const cargarClientes = async () => {
      const result = await listaDesplegableClientes(-1, "", "True")
      if (result.success && result.data) {
        const options: ddlItem[] = result.data.map((c: any) => ({
          value: c.id.toString(),
          text: c.nombre,
        }))
        setClientesOptions(options)
      }
    }
    cargarClientes()
  }, [])

  // Buscar productos mientras se escribe
  useEffect(() => {
    const buscarProductos = async () => {
      if (filtroProductoTexto.trim().length >= 2) {
        const productos = await listaDesplegableProductos(filtroProductoTexto)
        setProductosOptions(productos)
        setShowProductosDropdown(true)
      } else {
        setProductosOptions([])
        setShowProductosDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarProductos, 300)
    return () => clearTimeout(timeoutId)
  }, [filtroProductoTexto])

  // Calcular precio con IVA automáticamente
  useEffect(() => {
    if (precioVentaSinIVA && !isNaN(Number(precioVentaSinIVA))) {
      const conIVA = Number(precioVentaSinIVA) * 1.16
      setPrecioVentaConIVA(conIVA.toFixed(2))
    } else {
      setPrecioVentaConIVA("")
    }
  }, [precioVentaSinIVA])

  // Función de búsqueda principal
  const ejecutarBusqueda = async () => {
    if (!filtroClienteId || !filtroProductoId) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor seleccione un cliente y un producto para buscar.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    setIsSearching(true)

    try {
      let transformedData: ProductoXCliente

      // Limpiar espacio de resultado
      setProducto(false)

      // Obtener información del producto
      const productoResult = await objetoProducto(Number(filtroProductoId), "", Number(filtroClienteId))
      if (productoResult.success && productoResult.data) {
        setProducto(productoResult.data)
        console.log(productoResult.data)
        /*
        transformedData = productoResult.data.map((p: oProducto) => ({
            clienteid: p.clienteid,
            clientes: {
              nombre: p.clientes?.nombre || null,
            },
        }))
        */
      } else {
        setProducto(null)
      }

      // Ejecutar las 3 funciones de cotización
      const [resultOptima25, resultCotizacion, resultOptima30] = await Promise.all([
        cotizacionOptima25(Number(filtroProductoId), Number(filtroClienteId)),
        cotizacionProducto(Number(filtroProductoId), Number(filtroClienteId)),
        cotizacionOptima30(Number(filtroProductoId), Number(filtroClienteId)),
      ])

      // Guardar resultados en estados
      if (resultCotizacion.success && resultCotizacion.data) {
        setProductoXCliente(resultCotizacion.data[0] || null)
        console.log(resultCotizacion.data[0])

        if (resultCotizacion.data[0]?.sprecioventasiniva) {
          setPrecioVentaSinIVA(resultCotizacion.data[0].sprecioventasiniva.toString())
        }
      }

      if (resultOptima25.success && resultOptima25.data) {
        setProductoXClienteOptimo25(resultOptima25.data[0] || null)
        console.log(resultOptima25.data[0])
      }

      if (resultOptima30.success && resultOptima30.data) {
        setProductoXClienteOptimo30(resultOptima30.data[0] || null)
        console.log(resultOptima30.data[0])
      }

      setHasSearched(true)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setModalError({
        Titulo: "Error en búsqueda",
        Mensaje: `Ocurrió un error al buscar: ${error}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCalcular = () => {
    if (!filtroClienteId || !filtroProductoId || !precioVentaSinIVA) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor complete todos los campos requeridos.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    setShowConfirmModal(true)
  }

  const ejecutarCalculo = async () => {
    setShowConfirmModal(false)
    setShowLoadingModal(true)

    const startTime = Date.now()

    try {
      // Ejecutar calcularCotizacion
      const result = await calcularCotizacion(
        Number(filtroProductoId),
        Number(filtroClienteId),
        Number(precioVentaSinIVA),
      )

      // Ensure minimum 1 second loading time
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, 1000 - elapsedTime)

      await new Promise((resolve) => setTimeout(resolve, remainingTime))

      if (result.success) {
        setProductoXCliente(result.data[0] || null)
        setShowLoadingModal(false)
      } else {
        setShowLoadingModal(false)
        setModalError({
          Titulo: "Error al calcular",
          Mensaje: result.error || "Error desconocido",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowLoadingModal(false)
      console.error("Error al calcular:", error)
      setModalError({
        Titulo: "Error al calcular",
        Mensaje: `Ocurrió un error: ${error}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  // Función reset
  const handleReset = () => {
    setFiltroClienteId("")
    setFiltroProductoTexto("")
    setFiltroProductoId("")
    setProducto(null)
    setProductoXCliente(null)
    setProductoXClienteOptimo25(null)
    setProductoXClienteOptimo30(null)
    setPrecioVentaSinIVA("")
    setPrecioVentaConIVA("")
    setForecast("")
    setHasSearched(false)
  }

  // Seleccionar producto del dropdown
  const handleSelectProducto = (producto: ddlItem) => {
    setFiltroProductoTexto(producto.text)
    setFiltroProductoId(producto.value)
    setShowProductosDropdown(false)
  }

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }

      setPageTituloMasNuevo({
        Titulo: "Costeo Productos",
        Subtitulo: "Gestión Costeo de productos",
        Visible: false,
        BotonTexto: "",
        Ruta: "",
      })
      setShowPageTituloMasNuevo(true)
      setShowPageLoading(false)
    }
  }, [authLoading, user, router])

  // --- Renders (contenidos auxiliares) ---
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando..." />
  }

  // --- Contenido ---
  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Modales */}
      {showModalAlert && ModalAlert && (
        <PageModalAlert
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
          isOpen={true}
          onClose={() => setShowModalAlert(false)}
        />
      )}

      {showModalError && ModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cálculo</DialogTitle>
            <DialogDescription>
              ¿Desea calcular una vista previa de la nueva información de costos y precios de su producto?
              <br />
              <br />
              <strong>Nota:</strong> El calculo a realizar es una simulacion previa al registro del costeo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={ejecutarCalculo}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadingModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Calculando...</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <span className="text-sm">Por favor espere mientras se calcula la cotización.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Título */}
      {showPageTituloMasNuevo && (
        <PageTitlePlusNew
          Titulo={PageTituloMasNuevo.Titulo}
          Subtitulo={PageTituloMasNuevo.Subtitulo}
          Visible={PageTituloMasNuevo.Visible}
          BotonTexto={PageTituloMasNuevo.BotonTexto}
          Ruta={PageTituloMasNuevo.Ruta}
        />
      )}

      {/* Filtros de Búsqueda */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Cliente Dropdown */}
            <div>
              <label htmlFor="ddlCliente" className="text-sm font-medium">
                Cliente
              </label>
              <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                <SelectTrigger id="ddlCliente">
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Producto Autocomplete */}
            <div className="relative">
              <label htmlFor="txtProducto" className="text-sm font-medium">
                Producto
              </label>
              <Input
                id="txtProducto"
                type="text"
                placeholder="Buscar producto..."
                value={filtroProductoTexto}
                onChange={(e) => setFiltroProductoTexto(e.target.value)}
                onFocus={() => {
                  if (productosOptions.length > 0) setShowProductosDropdown(true)
                }}
              />
              <input type="hidden" value={filtroProductoId} />

              {/* Dropdown de productos */}
              {showProductosDropdown && productosOptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {productosOptions.map((producto) => (
                    <div
                      key={producto.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectProducto(producto)}
                    >
                      {producto.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2 col-span-full md:col-span-2 lg:col-span-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Reset
              </Button>
              <Button
                type="button"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={ejecutarBusqueda}
                disabled={isSearching}
              >
                <Search className="mr-2 h-3 w-3" /> {isSearching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal - Solo se muestra después de buscar */}
      {hasSearched && producto && (
        <>
          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardContent className="p-0">
              <div className="flex flex-row">
                {/* Image on left with gray background */}
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200 flex-shrink-0">
                  <img
                    src={producto.imgurl || "/placeholder.svg?height=200&width=200&text=Producto"}
                    alt={producto.nombre || "Producto"}
                    className="h-[200px] w-auto"
                  />
                </div>

                {/* Product info on right - organized in sections */}
                <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Section 1: Basic Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-sky-700 border-b pb-1">Información Básica</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-sky-700">ID:</span>
                        <span className="ml-2 text-gray-900">{producto.id}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Código:</span>
                        <span className="ml-2 text-gray-900">{producto.codigo || "Sin código"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Nombre:</span>
                        <span className="ml-2 text-gray-900">{producto.nombre || "Sin nombre"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Cliente:</span>
                        <span className="ml-2 text-gray-900">{producto.clientes?.nombre || "Sin cliente"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Zona:</span>
                        <span className="ml-2 text-gray-900">{producto.zonas?.nombre || "Sin zona"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Unidad de Medida:</span>
                        <span className="ml-2 text-gray-900">
                          {producto.unidadesmedida?.descripcion || "Sin unidad"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Estatus:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                            producto.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Composition & Cost */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-green-700 border-b pb-1">Composición y Costo</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-green-700">MP:</span>
                        <span className="ml-2 text-gray-900">{producto.mp || "0"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">ME:</span>
                        <span className="ml-2 text-gray-900">{producto.me || "0"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">MS:</span>
                        <span className="ml-2 text-gray-900">{producto.ms || "0"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">Costo de elaboración:</span>
                        <span className="ml-2 text-gray-900">${producto.costo?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Percentages */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-purple-700 border-b pb-1">Porcentajes</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-purple-700">MP %:</span>
                        <span className="ml-2 text-gray-900">{((producto.mp_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">ME %:</span>
                        <span className="ml-2 text-gray-900">{((producto.me_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">MS %:</span>
                        <span className="ml-2 text-gray-900">{((producto.ms_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Costs in Currency */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-amber-700 border-b pb-1">Costos en Moneda</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-amber-700">MP $:</span>
                        <span className="ml-2 text-gray-900">${(producto.mp_costeado || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">ME $:</span>
                        <span className="ml-2 text-gray-900">${(producto.me_costeado || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">MS $:</span>
                        <span className="ml-2 text-gray-900">${(producto.ms_costeado || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Precio Healthy Lab:</span>
                        <span className="ml-2 text-gray-900">${(producto.preciohl || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leyenda de relación con cliente */}
          <div
            className={`p-4 rounded-md text-white font-semibold ${productoXCliente ? "bg-green-500" : "bg-yellow-500"}`}
          >
            {productoXCliente
              ? "✓ Este producto ya está relacionado con el cliente seleccionado"
              : "⚠ Este producto aún no está relacionado con el cliente seleccionado"}
          </div>

          {/* Inputs de cálculo */}
          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardHeader>
              <CardTitle>Datos de Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label htmlFor="txtPrecioSinIVA" className="text-sm font-medium">
                    Precio de venta sin IVA
                  </label>
                  <Input
                    id="txtPrecioSinIVA"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={precioVentaSinIVA}
                    onChange={(e) => setPrecioVentaSinIVA(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="txtPrecioConIVA" className="text-sm font-medium">
                    Precio de venta con IVA
                  </label>
                  <Input id="txtPrecioConIVA" type="text" value={precioVentaConIVA} disabled />
                </div>

                <div>
                  <label htmlFor="txtForecast" className="text-sm font-medium">
                    Forecast
                  </label>
                  <Input
                    id="txtForecast"
                    type="number"
                    placeholder="0"
                    value={forecast}
                    onChange={(e) => setForecast(e.target.value)}
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleCalcular}
                  >
                    Calcular
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla ProductoXCliente */}
          {productoXCliente && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Cotización Actual del Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Plan Generacional
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">Plan Nivel</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Plan Infinito
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">Iva Pagado</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">CDA</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Bono Inicio Rapido
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Constructor Inicio Rapido
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">Ruta Exito</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">Reembolsos</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Tarjeta Credito
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">Envio</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Costo Producto
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">% Costo</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">
                          Total Costos
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Utilidad Marginal
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Precio Actual % Utilidad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.splangeneracional?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.splannivel?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.splaninfinito?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.sivapagado?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.scda?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sbonoiniciorapido?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sconstructoriniciorapido?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.srutaexito?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.sreembolsos?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.starjetacredito?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.senvio?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.spreciohl?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          {productoXCliente.sporcentajecosto?.toFixed(2) || "0.00"}%
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.stotalcostos?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sutilidadmarginal?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXCliente.sprecioactualporcentajeutilidad?.toFixed(2) || "0.00"}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla ProductoXClienteOptimo25 */}
          {productoXClienteOptimo25 && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Cotización Óptima 25%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Utilidad Óptima Minima
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          % Comisiones
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">% Costo</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Comisiones + costo
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Sin IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Con IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Meta
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Precio Meta Con IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Diferencia Utilidad Minima
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo25.sutilidadoptima?.toFixed(2) || "0.00"}%
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo25.scomisiones_porcentaje
                            ? (productoXClienteOptimo25.scomisiones_porcentaje * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo25.scosto_porcentaje
                            ? (productoXClienteOptimo25.scosto_porcentaje * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo25.scomisionesmascosto?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventasiniva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventaconiva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo25.spreciometa?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo25.spreciometaconiva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo25.sdiferenciautilidadesperada?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla ProductoXClienteOptimo30 */}
          {productoXClienteOptimo30 && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Cotización Óptima 30%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Utilidad Óptima Minima
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          % Comisiones
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">% Costo</th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                          Comisiones + costo
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Sin IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Con IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Precio Meta
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Precio Meta Con IVA
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Diferencia Utilidad Minima
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.sutilidadoptima?.toFixed(2) || "0.00"}%
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.scomisiones_porcentaje
                            ? (productoXClienteOptimo30.scomisiones_porcentaje * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.scosto_porcentaje
                            ? (productoXClienteOptimo30.scosto_porcentaje * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo25.scomisionesmascosto?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventasiniva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventaconiva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.spreciometa?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.spreciometaconiva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.sdiferenciautilidadesperada?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
              Actualizar
            </Button>
            <Button type="button" className="bg-green-600 text-white hover:bg-green-700">
              Guardar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
