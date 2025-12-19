"use client"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Loader2, Edit, X, HelpCircle } from "lucide-react" // Added Edit, X, HelpCircle
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
  propsPageModalValidation,
  propsPageModalError,
} from "@/types/common.types"

// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalValidation } from "@/components/page-modal-validation"
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
import { useUserSession } from "@/hooks/use-user-session"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import {
  listaDesplegableProductosBuscar,
  objetoProducto,
  listaDesplegableProductosXClientes,
  actualizarCosteoProducto, // Importar la nueva función
} from "@/app/actions/productos"
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
export default function CostearPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { user: sessionUser, loading: sessionLoading } = useUserSession()

  // -- Estados --
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalValidation, setShowModalValidation] = useState(false)
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
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false) // Nuevo modal de confirmación para actualizar
  const [showLoadingUpdateModal, setShowLoadingUpdateModal] = useState(false) // Nuevo modal de loading para actualizar

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroZonaId, setFiltroZonaId] = useState("")
  const [filtroProductoTexto, setFiltroProductoTexto] = useState("")
  const [filtroProductoId, setFiltroProductoId] = useState("")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])
  const [productosOptions, setProductosOptions] = useState<ddlItem[]>([])
  const [showProductosDropdown, setShowProductosDropdown] = useState(false)
  const [productosCliente, setProductosCliente] = useState<oProducto[]>([])

  // Estados de datos
  const [producto, setProducto] = useState<oProducto | null>(null)
  const [productoXCliente, setProductoXCliente] = useState<ProductoXClienteN | null>(null)
  const [productoXClienteOptimo25, setProductoXClienteOptimo25] = useState<ProductoXClienteOptimoN | null>(null)
  const [productoXClienteOptimo30, setProductoXClienteOptimo30] = useState<ProductoXClienteOptimo | null>(null)

  // Estados de inputs de cálculo
  const [precioVentaSinIVA, setPrecioVentaSinIVA] = useState("")
  const [precioVentaConIVA, setPrecioVentaConIVA] = useState("")
  const [forecast, setForecast] = useState("")

  const [porcentajeGeneracional, setPorcentajeGeneracional] = useState("")
  const [porcentajeNivel, setPorcentajeNivel] = useState("")
  const [porcentajeInfinito, setPorcentajeInfinito] = useState("")
  const [porcentajeIva, setPorcentajeIva] = useState("")
  const [porcentajeBonoRapido, setPorcentajeBonoRapido] = useState("")
  const [porcentajeCDA, setPorcentajeCDA] = useState("")
  const [porcentajeConstructor, setPorcentajeConstructor] = useState("")
  const [porcentajeRuta, setPorcentajeRuta] = useState("")
  const [porcentajeReembolsos, setPorcentajeReembolsos] = useState("")
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState("")
  const [porcentajeEnvio, setPorcentajeEnvio] = useState("")

  const [conversionMoneda, setConversionMoneda] = useState("")

  // Estados de búsqueda
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const hasAutoSearched = useRef(false)

  const [porcentajesEditables, setPorcentajesEditables] = useState(false)

  // -- Funciones --

  useEffect(() => {
    if (!sessionLoading && sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }, [sessionLoading, sessionUser])

  // useEffect to load zonas when filtroClienteId changes
  useEffect(() => {
    const cargarZonas = async () => {
      if (filtroClienteId) {
        const result = await listDesplegableZonas(-1, "", Number(filtroClienteId))
        if (result.success && result.data) {
          setZonasOptions(result.data)
          // Reset zona selection to "Todos" when cliente changes
          setFiltroZonaId("")
        }
      } else {
        setFiltroZonaId("")
      }
    }
    cargarZonas()
  }, [filtroClienteId])

  useEffect(() => {
    const cargarProductosCliente = async () => {
      if (filtroClienteId) {
        const result = await listaDesplegableProductosXClientes(Number(filtroClienteId), Number(filtroZonaId))
        if (result.success && result.data) {
          setProductosCliente(result.data)
        }
      } else {
        setProductosCliente([])
      }
    }
    cargarProductosCliente()
  }, [filtroClienteId, filtroZonaId])

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

  useEffect(() => {
    const buscarProductos = async () => {
      if (filtroProductoTexto.trim().length >= 2) {
        const productos = await listaDesplegableProductosBuscar(filtroProductoTexto)
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

  useEffect(() => {
    if (precioVentaSinIVA && !isNaN(Number(precioVentaSinIVA))) {
      const conIVA = Number(precioVentaSinIVA) * 1.16
      setPrecioVentaConIVA(conIVA.toFixed(2))
    } else {
      setPrecioVentaConIVA("")
    }
  }, [precioVentaSinIVA])

  useEffect(() => {
    console.log("Inicia asignacion a filtros por parametros")
    const loadFromURLParams = async () => {
      const productoid = searchParams.get("productoid")
      const clienteid = searchParams.get("clienteid")
      const zonaid = searchParams.get("zonaid")

      // Only proceed if we have URL parameters and haven't auto-searched yet
      if (productoid && clienteid && !hasAutoSearched.current) {
        hasAutoSearched.current = true

        // Step 1: Set Cliente first
        setFiltroClienteId(clienteid)

        // Step 2: Wait for zonas to load based on the cliente
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Step 3: Set Zona if provided
        const zonaValue = zonaid && zonaid !== "-1" ? zonaid : "-1"
        setFiltroZonaId(zonaValue)

        // Step 4: Wait a bit more for zona to be set
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Step 5: Set Producto
        setFiltroProductoId(productoid)

        // Step 6: Wait for all states to update, then trigger search once
        await new Promise((resolve) => setTimeout(resolve, 500))

        ejecutarBusqueda(clienteid, productoid, zonaValue)
      }
    }

    if (!authLoading && !sessionLoading) {
      loadFromURLParams()
    }
  }, [searchParams, authLoading, sessionLoading])

  const handleActualizar = () => {
    if (!filtroClienteId || !filtroProductoId || !precioVentaSinIVA || !forecast) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor complete todos los campos requeridos (Precio de venta sin IVA y Forecast).",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    setShowConfirmUpdateModal(true)
  }

  const ejecutarActualizacion = async () => {
    setShowConfirmUpdateModal(false)
    setShowLoadingUpdateModal(true)

    const startTime = Date.now()

    try {
      const result = await actualizarCosteoProducto(
        Number(filtroProductoId),
        Number(filtroClienteId),
        Number(precioVentaSinIVA),
        Number(forecast),
        Number(porcentajeGeneracional),
        Number(porcentajeNivel),
        Number(porcentajeInfinito),
        Number(porcentajeIva),
        Number(porcentajeBonoRapido),
        Number(porcentajeCDA),
        Number(porcentajeConstructor),
        Number(porcentajeRuta),
        Number(porcentajeReembolsos),
        Number(porcentajeTarjeta),
        Number(porcentajeEnvio),
      )

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, 1000 - elapsedTime)

      await new Promise((resolve) => setTimeout(resolve, remainingTime))

      if (result.success) {
        setShowLoadingUpdateModal(false)
        setModalValidation({
          Titulo: "Actualización exitosa",
          Mensaje: "El costeo del producto se ha actualizado correctamente.",
          isOpen: true,
          onClose: () => {
            setShowModalValidation(false)
            ejecutarBusqueda()
          },
        })
        setShowModalValidation(true)
      } else {
        setShowLoadingUpdateModal(false)
        setModalError({
          Titulo: "Error al actualizar",
          Mensaje: result.error || "Error desconocido",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowLoadingUpdateModal(false)
      console.error("Error al actualizar:", error)
      setModalError({
        Titulo: "Error al actualizar",
        Mensaje: `Ocurrió un error: ${error}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  const ejecutarBusqueda = async (clienteIdParam?: number, productoIdParam?: string, zonaIdParam?: string) => {
    const clienteId = filtroClienteId || clienteIdParam
    const productoId = productoIdParam || filtroProductoId
    const zonaId = zonaIdParam || filtroZonaId

    if (!clienteId || !productoId) {
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

      setProducto(null) // Corrected to set null

      const productoResult = await objetoProducto(Number(productoId), "", Number(clienteId))
      if (productoResult.success && productoResult.data) {
        setProducto(productoResult.data)
        console.log(productoResult.data)
      } else {
        setProducto(null)
      }

      const [resultOptima25, resultCotizacion, resultOptima30] = await Promise.all([
        cotizacionOptima25(Number(productoId), Number(clienteId)),
        cotizacionProducto(Number(productoId), Number(clienteId), Number(zonaId)),
        cotizacionOptima30(Number(productoId), Number(clienteId)),
      ])

      if (resultCotizacion.success && resultCotizacion.data) {
        setProductoXCliente(resultCotizacion.data[0] || null)
        console.log(resultCotizacion.data[0])

        if (resultCotizacion.data[0]?.sprecioacostear) {
          setPrecioVentaSinIVA(resultCotizacion.data[0].sprecioacostear.toString())
        }

        if (resultCotizacion.data[0]?.sforecast) {
          setForecast(resultCotizacion.data[0].sforecast.toString())
        }

        if (resultCotizacion.data[0]?.sporcentajegeneracional !== undefined) {
          setPorcentajeGeneracional(resultCotizacion.data[0].sporcentajegeneracional.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajenivel !== undefined) {
          setPorcentajeNivel(resultCotizacion.data[0].sporcentajenivel.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajeinfinito !== undefined) {
          setPorcentajeInfinito(resultCotizacion.data[0].sporcentajeinfinito.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajeiva !== undefined) {
          setPorcentajeIva(resultCotizacion.data[0].sporcentajeiva.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajebonorapido !== undefined) {
          setPorcentajeBonoRapido(resultCotizacion.data[0].sporcentajebonorapido.toString())
        }
        if (resultCotizacion.data[0]?.scda !== undefined) {
          setPorcentajeCDA(resultCotizacion.data[0].scda.toString())
        }
        

        if (resultCotizacion.data[0]?.sporcentajeconstructor !== undefined) {
          setPorcentajeConstructor(resultCotizacion.data[0].sporcentajeconstructor.toString())
        }
        if (resultCotizacion.data[0]?.porcentajeruta !== undefined) {
          setPorcentajeRuta(resultCotizacion.data[0].porcentajeruta.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajereembolsos !== undefined) {
          setPorcentajeReembolsos(resultCotizacion.data[0].sporcentajereembolsos.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajetarjeta !== undefined) {
          setPorcentajeTarjeta(resultCotizacion.data[0].sporcentajetarjeta.toString())
        }
        if (resultCotizacion.data[0]?.sporcentajeenvio !== undefined) {
          setPorcentajeEnvio(resultCotizacion.data[0].sporcentajeenvio.toString())
        }
        if (resultCotizacion.data[0]?.sconversionmoneda !== undefined) {
          setConversionMoneda(resultCotizacion.data[0].sconversionmoneda.toString())
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
    if (!filtroClienteId || !filtroProductoId || !precioVentaSinIVA || !forecast) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor complete todos los campos requeridos (Precio de venta sin IVA y Forecast).",
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
      const result = await calcularCotizacion(
        Number(filtroProductoId),
        Number(filtroClienteId),
        Number(precioVentaSinIVA),
        Number(forecast),
        Number(porcentajeGeneracional),
        Number(porcentajeNivel),
        Number(porcentajeInfinito),
        Number(porcentajeIva),
        Number(porcentajeBonoRapido),
        Number(porcentajeCDA),
        Number(porcentajeConstructor),
        Number(porcentajeRuta),
        Number(porcentajeReembolsos),
        Number(porcentajeTarjeta),
        Number(porcentajeEnvio),
        Number(conversionMoneda),
      )

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, 1000 - elapsedTime)

      await new Promise((resolve) => setTimeout(resolve, remainingTime))

      if (result.success) {
        setProductoXCliente(result.data[0] || null)
        setProductoXClienteOptimo25(result.data[0] || null)
        setProductoXClienteOptimo30(result.data[0] || null)
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
    if (sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
    setFiltroZonaId("")
    setPorcentajeGeneracional("")
    setPorcentajeNivel("")
    setPorcentajeInfinito("")
    setPorcentajeIva("")
    setPorcentajeBonoRapido("")
    setPorcentajeCDA("")
    setPorcentajeConstructor("")
    setPorcentajeRuta("")
    setPorcentajeReembolsos("")
    setPorcentajeTarjeta("")
    setPorcentajeEnvio("")
    setPorcentajesEditables(false)
    setConversionMoneda("") // Reset conversionMoneda
  }

  const handleSelectProducto = (producto: ddlItem) => {
    setFiltroProductoTexto(producto.text)
    setFiltroProductoId(producto.value)
    setShowProductosDropdown(false)
  }

  useEffect(() => {
    console.log("Inicia carga de pagina")
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

  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando..." />
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {showModalAlert && ModalAlert && (
        <PageModalAlert
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
          isOpen={true}
          onClose={() => setShowModalAlert(false)}
        />
      )}

      {showModalValidation && ModalValidation && (
        <PageModalValidation
          Titulo={ModalValidation.Titulo}
          Mensaje={ModalValidation.Mensaje}
          isOpen={true}
          onClose={() => setShowModalValidation(false)}
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

      <Dialog open={showConfirmUpdateModal} onOpenChange={setShowConfirmUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Actualización</DialogTitle>
            <DialogDescription>
              ¿Desea actualizar la información en base a los datos mostrados en la simulación?
              <br />
              <br />
              <strong>Advertencia:</strong> Los datos de la relación entre el cliente y el producto actual serán
              modificados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmUpdateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={ejecutarActualizacion}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadingUpdateModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizando...</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <span className="text-sm">Por favor espere mientras se actualiza el costeo del producto.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {showPageTituloMasNuevo && (
        <PageTitlePlusNew
          Titulo={PageTituloMasNuevo.Titulo}
          Subtitulo={PageTituloMasNuevo.Subtitulo}
          Visible={PageTituloMasNuevo.Visible}
          BotonTexto={PageTituloMasNuevo.BotonTexto}
          Ruta={PageTituloMasNuevo.Ruta}
        />
      )}

      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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

            <div>
              <label htmlFor="ddlZona" className="text-sm font-medium">
                Zona
              </label>
              <Select value={filtroZonaId} onValueChange={setFiltroZonaId}>
                <SelectTrigger id="ddlZona">
                  <SelectValue placeholder="Seleccione una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonasOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="ddlProducto" className="text-sm font-medium">
                Producto
              </label>
              <Select value={filtroProductoId} onValueChange={setFiltroProductoId}>
                <SelectTrigger id="ddlProducto">
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {productosCliente.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()} className="p-0">
                      <div className="flex items-center gap-3 p-2 w-full">
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                          <img
                            src={producto.imgurl || "/placeholder.svg?height=48&width=48&text=P"}
                            alt={producto.nombre || "Producto"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {producto.codigo} - {producto.nombre} - ${(producto.costo || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

      {hasSearched && producto && (
        <>
          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardContent className="p-0">
              <div className="flex flex-row">
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200 flex-shrink-0">
                  <img
                    src={producto.imgurl || "/placeholder.svg?height=200&width=200&text=Producto"}
                    alt={producto.nombre || "Producto"}
                    className="h-[200px] w-auto"
                  />
                </div>

                <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
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
                      <div className="py-1">
                        <span className="font-semibold text-sky-700">Tipo comisión:</span>
                        <span className="ml-2 text-white bg-blue-500 py-1 rounded px-2">
                          {productoXCliente.scategoria || "Sin categoria"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-green-700 border-b pb-1">Composición y Costo</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-green-700">MP:</span>
                        <span className="ml-2 text-gray-900">{producto.mp || "0"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">MEM:</span>
                        <span className="ml-2 text-gray-900">{producto.mem || "0"}</span>
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

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-purple-700 border-b pb-1">Porcentajes</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-purple-700">MP %:</span>
                        <span className="ml-2 text-gray-900">{((producto.mp_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">MEM %:</span>
                        <span className="ml-2 text-gray-900">{((producto.mem_porcentaje || 0) * 100).toFixed(2)}%</span>
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

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-amber-700 border-b pb-1">Costos en Moneda</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-amber-700">MP $:</span>
                        <span className="ml-2 text-gray-900">${(producto.mp_costeado || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">MEM $:</span>
                        <span className="ml-2 text-gray-900">${(producto.mem_costeado || 0).toFixed(2)}</span>
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
                        <span className="font-semibold text-amber-700">Costo Total:</span>
                        <span className="ml-2 text-gray-900">
                          $
                          {(
                            (producto.mp_costeado || 0) +
                            (producto.mem_costeado || 0) +
                            (producto.me_costeado || 0) +
                            (producto.ms_costeado || 0)
                          ).toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Precio Healthy Lab:</span>
                        <span className="ml-2 text-gray-900">${(producto.preciohl || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Precio venta(2025):</span>
                        <span className="ml-2 text-gray-900">
                          ${(productoXCliente.sprecioventasinivaaa || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Precio actual(sin IVA):</span>
                        <span className="ml-2 text-gray-900">
                          ${(productoXCliente.sprecioventasiniva || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Utilidad:</span>
                        <span className="ml-2 text-gray-900">${(producto.utilidadhl || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Ultima Modificacion:</span>
                        <span className="ml-2 text-gray-900">{productoXCliente.sfechaultimamodificacion || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div
            className={`p-4 rounded-md text-white font-semibold ${productoXCliente ? "bg-green-500" : "bg-yellow-500"}`}
          >
            {productoXCliente
              ? "✓ Este producto ya está relacionado con el cliente seleccionado"
              : "⚠ Este producto aún no está relacionado con el cliente seleccionado"}
          </div>

          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardHeader>
              <CardTitle>Datos de Costeo</CardTitle>
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

          {productoXCliente && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Calculo del Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <label htmlFor="txtfechamodificacion" className="flex justify-end text-sm font-medium text-righ mb-2">
                    Fecha Ultima Modificacion: {productoXCliente.sfechaultimamodificacion}
                  </label>

                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      {!porcentajesEditables ? (
                        <div className="relative group">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => setPorcentajesEditables(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modificar
                          </Button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                            <HelpCircle className="h-3 w-3 inline mr-1" />
                            Habilita los inputs de porcentaje para que puedan ser modificados
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={() => setPorcentajesEditables(false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>


                  {/* Segunda tabla de valores calculados */}
                  <table className="w-full border-collapse mt-4">
                    <thead>
                    <tr className="bg-gray-100 text-xs">
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[130px]">
                          % Generacional
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[90px]">% Nivel</th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                          % Infinito
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">% IVA</th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">CDA</th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                          % Bono Rápido
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[120px]">
                          % Constructor
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">% Ruta</th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[120px]">
                          % Reembolsos
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                          % Tarjeta
                        </th>
                        <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">% Envio</th>
                        <th className="border p-2 text-left font-semibold bg-purple-500 text-white w-[130px]">
                          Conversion Moneda
                        </th>
                      </tr>

                      <tr>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeGeneracional}
                            onChange={(e) => setPorcentajeGeneracional(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeNivel}
                            onChange={(e) => setPorcentajeNivel(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeInfinito}
                            onChange={(e) => setPorcentajeInfinito(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeIva}
                            onChange={(e) => setPorcentajeIva(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeCDA}
                            onChange={(e) => setPorcentajeCDA(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeBonoRapido}
                            onChange={(e) => setPorcentajeBonoRapido(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeConstructor}
                            onChange={(e) => setPorcentajeConstructor(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeRuta}
                            onChange={(e) => setPorcentajeRuta(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeReembolsos}
                            onChange={(e) => setPorcentajeReembolsos(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeTarjeta}
                            onChange={(e) => setPorcentajeTarjeta(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={porcentajeEnvio}
                            onChange={(e) => setPorcentajeEnvio(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                        <td className="border p-1">
                          <Input
                            type="text"
                            step="0.01"
                            value={conversionMoneda}
                            onChange={(e) => setConversionMoneda(e.target.value)}
                            className="h-8 text-xs"
                            disabled={!porcentajesEditables}
                          />
                        </td>
                      </tr>

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
                        
                        <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">
                          Costo Producto
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">% Costo</th>
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
                          ${productoXCliente.splangeneracional?.toFixed(3) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.splannivel?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.splaninfinito?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.sivapagado?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.scda?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sbonoiniciorapido?.toFixed(3) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sconstructoriniciorapido?.toFixed(3) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.srutaexito?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.sreembolsos?.toFixed(3) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.starjetacredito?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">${productoXCliente.senvio?.toFixed(3) || "0.00"}</td>
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

          {productoXClienteOptimo25 && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Costeo Óptimo 25%</CardTitle>
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
                          {productoXCliente.scomisionesmascosto?.toFixed(2) || "0.00"}%
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

          {productoXClienteOptimo30 && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Costeo Óptimo 30%</CardTitle>
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
                          {productoXClienteOptimo30.sutilidadoptima30?.toFixed(2) || "0.00"}%
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.scomisiones_porcentaje30
                            ? (productoXClienteOptimo30.scomisiones_porcentaje30 * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.scosto_porcentaje30
                            ? (productoXClienteOptimo30.scosto_porcentaje30 * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                        <td className="border p-2 text-sm">
                          {productoXClienteOptimo30.scomisionesmascosto30?.toFixed(2) || "0.00"}%
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventasiniva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXCliente.sprecioventaconiva?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.spreciometa30?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.spreciometaconiva30?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border p-2 text-sm">
                          ${productoXClienteOptimo30.sdiferenciautilidadesperada30?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {productoXCliente && (
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader>
                <CardTitle>Costeo Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">
                          Costo Anual
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                          Utilidad Anual
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                          Costo/Utilidad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 text-sm">${productoXCliente.scostoanual?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">${productoXCliente.sutilidadanual?.toFixed(2) || "0.00"}</td>
                        <td className="border p-2 text-sm">
                          {productoXCliente.scostoutilidadanual
                            ? (productoXCliente.scostoutilidadanual * 100).toFixed(2)
                            : "0.00"}
                          %
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            {productoXCliente ? (
              <Button
                type="button"
                variant="outline"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleActualizar}
              >
                Actualizar
              </Button>
            ) : (
              <Button type="button" className="bg-green-600 text-white hover:bg-green-700">
                Guardar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
