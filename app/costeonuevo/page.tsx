"use client"

import React from "react"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, RotateCcw, Loader2 } from "lucide-react"
import type {
  ProductoXClienteN,
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
import { ModalConfirmation } from "@/components/modal-confirmation"
import { ModalSuccess } from "@/components/modal-success"

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { useUserSession } from "@/hooks/use-user-session"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import {
  listaDesplegableProductosBuscar,
  objetoProducto,
  listaDesplegableProductosXClientes,
} from "@/app/actions/productos"
import {
  cotizacionProducto,
} from "@/app/actions/productos-cotizaciones"
import {
  obtenerConfiguracionesFijo,
  obtenerEscenarioCostos,
  obtenerProductoValorOriginal,
  obtenerConfiguracionesXCliente,
  obtenerPreciosProductos,
  insertarProductoCosteo,
} from "@/app/actions/costeonuevo"
import type { oProducto } from "@/types/productos.types"
import type { ConfiguracionFijo, EscenarioCosto, ProductoValorOriginal, ConfiguracionXCliente, PreciosProducto, ProductoCosteoInsert } from "@/app/actions/costeonuevo"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CosteonuevoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { user: sessionUser, loading: sessionLoading } = useUserSession()

  // -- Estados --
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [confirmationModalData, setConfirmationModalData] = useState({ Titulo: "", Mensaje: "" })
  const [successModalData, setSuccessModalData] = useState({ Titulo: "", Mensaje: "" })
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })

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
  const [configuracionesFijo, setConfiguracionesFijo] = useState<ConfiguracionFijo[]>([])
  const [escenarioCostos, setEscenarioCostos] = useState<EscenarioCosto[]>([])
  const [productoValorOriginal, setProductoValorOriginal] = useState<ProductoValorOriginal | null>(null)
  const [configuracionesXCliente, setConfiguracionesXCliente] = useState<ConfiguracionXCliente[]>([])
  const [preciosProducto, setPreciosProducto] = useState<PreciosProducto | null>(null)
  const [configuracionesXClienteEditadas, setConfiguracionesXClienteEditadas] = useState<Record<number, number>>({})

  // Estados de búsqueda
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const hasAutoSearched = useRef(false)

  // -- Funciones --

  // Función auxiliar para detectar si un valor es porcentaje basado en tipodato
  const isValuePercentage = (tipodato?: string): boolean => {
    return tipodato?.toLowerCase().includes('porcentaje') || false
  }

  // Función para formatear números con punto decimal (no coma)
  const formatWithDot = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals).replace(',', '.')
  }

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
      setProducto(null)

      const productoResult = await objetoProducto(Number(productoId), "", Number(clienteId))
      if (productoResult.success && productoResult.data) {
        setProducto(productoResult.data)
        console.log(productoResult.data)
      } else {
        setProducto(null)
      }

      const resultCotizacion = await cotizacionProducto(Number(productoId), Number(clienteId), Number(zonaId))

      if (resultCotizacion.success && resultCotizacion.data) {
        setProductoXCliente(resultCotizacion.data[0] || null)
        console.log(resultCotizacion.data[0])
      }

      // Cargar configuraciones fijo
      const resultConfiguraciones = await obtenerConfiguracionesFijo(Number(clienteId), Number(zonaId))
      if (resultConfiguraciones.success && resultConfiguraciones.data) {
        // Filtrar registros con orden del 1 al 9
        const configuracionesAdmin = resultConfiguraciones.data.filter((config) => config.orden >= 1 && config.orden <= 9)
        // Filtrar registros con orden del 10 al 16
        const configuracionesPorcentual = resultConfiguraciones.data.filter((config) => config.orden >= 10 && config.orden <= 16)
        setConfiguracionesFijo([...configuracionesAdmin, ...configuracionesPorcentual])
        console.log("[v0] Configuraciones cargadas:", configuracionesAdmin, configuracionesPorcentual)
      } else {
        setConfiguracionesFijo([])
      }

      // Cargar escenarios de costos
      const resultEscenarios = await obtenerEscenarioCostos(Number(clienteId), Number(zonaId))
      if (resultEscenarios.success && resultEscenarios.data) {
        setEscenarioCostos(resultEscenarios.data)
        console.log("[v0] Escenarios de costos cargados:", resultEscenarios.data)
      } else {
        setEscenarioCostos([])
      }

      // Cargar valores originales del producto
      const resultValoresOriginales = await obtenerProductoValorOriginal(Number(productoId), Number(clienteId), Number(zonaId))
      if (resultValoresOriginales.success && resultValoresOriginales.data) {
        setProductoValorOriginal(resultValoresOriginales.data)
        console.log("[v0] Valores originales cargados:", resultValoresOriginales.data)
      } else {
        setProductoValorOriginal(null)
      }

      // Cargar configuraciones adicionales por cliente
      const resultConfiguracionesXCliente = await obtenerConfiguracionesXCliente(Number(clienteId), Number(zonaId))
      if (resultConfiguracionesXCliente.success && resultConfiguracionesXCliente.data) {
        setConfiguracionesXCliente(resultConfiguracionesXCliente.data)
        console.log("[v0] Configuraciones x Cliente cargadas:", resultConfiguracionesXCliente.data)
      } else {
        setConfiguracionesXCliente([])
      }

      // Cargar precios del producto
      const resultPreciosProducto = await obtenerPreciosProductos(Number(clienteId), Number(productoId))
      if (resultPreciosProducto.success && resultPreciosProducto.data) {
        setPreciosProducto(resultPreciosProducto.data)
        console.log("[v0] Precios del producto cargados:", resultPreciosProducto.data)
      } else {
        setPreciosProducto(null)
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

  const handleReset = () => {
    setFiltroClienteId("")
    setFiltroProductoTexto("")
    setFiltroProductoId("")
    setProducto(null)
    setProductoXCliente(null)
    setHasSearched(false)
    if (sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }

  // Función para actualizar valores de escenarios
  const actualizarEscenario = useCallback((escenarioid: number, campo: keyof EscenarioCosto, valor: number) => {
    setEscenarioCostos(prev => 
      prev.map(escenario => 
        escenario.escenarioid === escenarioid 
          ? { ...escenario, [campo]: valor }
          : escenario
      )
    )
  }, [])

  // Función para manejar navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number, totalRows?: number) => {
    const rows = totalRows || 16 // Total de filas (conceptos de costo: 0-15 + configuraciones adicionales)
    const cols = 5  // Total de columnas (escenarios A-E)
    
    let newRow = rowIdx
    let newCol = colIdx
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        newRow = rowIdx > 0 ? rowIdx - 1 : rows - 1
        break
      case 'ArrowDown':
        e.preventDefault()
        newRow = rowIdx < rows - 1 ? rowIdx + 1 : 0
        break
      case 'ArrowLeft':
        e.preventDefault()
        newCol = colIdx > 0 ? colIdx - 1 : cols - 1
        break
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault()
        newCol = colIdx < cols - 1 ? colIdx + 1 : 0
        if (newCol === 0 && colIdx === cols - 1) {
          newRow = rowIdx < rows - 1 ? rowIdx + 1 : 0
        }
        break
      case 'Enter':
        e.preventDefault()
        newRow = rowIdx < rows - 1 ? rowIdx + 1 : 0
        break
      default:
        return
    }
    
    const inputId = `cell-${newRow}-${newCol}`
    const nextInput = document.getElementById(inputId) as HTMLInputElement
    if (nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }, [])

  // Función para actualizar costeo
  const handleActualizarCosteo = () => {
    if (!filtroClienteId || !filtroProductoId || !preciosProducto || !productoXCliente) {
      return
    }

    setConfirmationModalData({
      Titulo: "Confirmar Actualización de Costeo",
      Mensaje: "¿Deseas realizar el costeo del producto? Esta acción guardará los datos del escenario actual en la base de datos.",
    })
    setShowConfirmationModal(true)
  }

  const handleConfirmActualizarCosteo = async () => {
    setShowConfirmationModal(false)

    if (!filtroClienteId || !filtroProductoId || !preciosProducto || !productoXCliente) {
      return
    }

    try {
      // Obtener el escenario actual
      const unidades = preciosProducto.unidadesvendidas || 0
      const escenarioActual = escenarioCostos.find(e => 
        unidades >= e.rangominimo && unidades <= e.rangomaximo
      )

      if (!escenarioActual) {
        console.error("[v0] No se encontró escenario actual")
        return
      }

      const escenarioId = escenarioActual.escenarioid

      // Obtener valores de ConfiguracionesXCliente para el escenario actual
      const categoriaProducto = productoXCliente.scategoria || ''
      const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
      const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0

      const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
      
      // Calcular valores para cada registro de ConfiguracionesXCliente
      const getConfigValue = (descripcion: string) => {
        const config = configuracionesXCliente.find(c => c.descripcion === descripcion)
        if (!config) return 0
        const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
        const usarValorDirecto = registrosSinCalculo.includes(descripcion)
        return usarValorDirecto ? valor : (preciosProducto.precioventasiniva || 0) * valor
      }

      // Calcular Total (Precio HL)
      const preciohl = (
        productoValorOriginal.materiaprima / (escenarioActual.materiaprima || 1) +
        productoValorOriginal.materialenvase / (escenarioActual.materialenvase || 1) +
        productoValorOriginal.materialempaque / (escenarioActual.materialempaque || 1) +
        productoValorOriginal.margenseguridad / (escenarioActual.margenseguridad || 1) +
        productoValorOriginal.importaciones * (escenarioActual.importaciones || 1) +
        productoValorOriginal.fletes * (escenarioActual.fletes || 1) +
        productoValorOriginal.manoobra * (escenarioActual.manoobra || 1) +
        productoValorOriginal.maquinaria * (escenarioActual.maquinaria || 1) +
        productoValorOriginal.electricidad * (escenarioActual.electricidad || 1) +
        productoValorOriginal.controlcalidad * (escenarioActual.controlcalidad || 1) +
        productoValorOriginal.supervision * (escenarioActual.supervision || 1) +
        productoValorOriginal.administracion * (escenarioActual.administracion || 1) +
        (escenarioActual.otros || 0) +
        productoValorOriginal.materiaprima * (escenarioActual.mermamp || 0) +
        productoValorOriginal.materialempaque * (escenarioActual.mermame || 0) +
        productoValorOriginal.materialenvase * (escenarioActual.mermamem || 0)
      )

      // Calcular suma de configuraciones
      const sumConfiguraciones = configuracionesXCliente
        .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
        .reduce((sum, config) => {
          const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
          const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
          const calcValue = usarValorDirecto ? valor : (preciosProducto.precioventasiniva || 0) * valor
          return sum + calcValue
        }, 0)

      const valorCategoriaCalc = (preciosProducto.precioventasiniva || 0) * valorCategoria

      // Calcular Utilidad
      const utilidad = escenarioId === 1 
        ? (preciosProducto.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
        : (preciosProducto.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - preciohl

      // Calcular Utilidad/Costo
      const utilidadcosto = preciohl > 0 ? (utilidad / preciohl) * 100 : 0

      // Calcular totales
      const totalcosto = unidades * preciohl
      const totalutilidad = unidades * utilidad

      // Crear objeto de inserción
      const dataInsert: ProductoCosteoInsert = {
        clienteid: Number(filtroClienteId),
        productoid: Number(filtroProductoId),
        precioventasiniva: preciosProducto.precioventasiniva || 0,
        precioventaconiva: preciosProducto.precioventaconiva || 0,
        fechacreacion: new Date().toISOString(),
        activo: true,
        preciohl: preciohl,
        ivapagado: getConfigValue('Porcentaje - IVA Pagado'),
        cda: getConfigValue('CDA'),
        reembolsos: getConfigValue('Porcentaje - Reembolsos'),
        tarjetacredito: getConfigValue('Porcentaje - Tarjeta de Crédito'),
        envio: getConfigValue('Envío'),
        totalcostos: totalcosto,
        categoria: valorCategoriaCalc,
        forecast: preciosProducto.unidadesvendidas || 0,
        precioventaconivaaa: preciosProducto.preciosiniva2025 || 0,
        fechamodificacion: new Date().toISOString(),
        promocionescomerciales: getConfigValue('Promociones Comerciales'),
        utilidad: utilidad,
        utilidadcosto: utilidadcosto,
        totalutilidad: totalutilidad,
        mermamp: productoValorOriginal.materiaprima * (escenarioActual.mermamp || 0),
        mermamem: productoValorOriginal.materialenvase * (escenarioActual.mermamem || 0),
        mermame: productoValorOriginal.materialempaque * (escenarioActual.mermame || 0),
        importaciones: productoValorOriginal.importaciones * (escenarioActual.importaciones || 1),
        fletes: productoValorOriginal.fletes * (escenarioActual.fletes || 1),
        manoobra: productoValorOriginal.manoobra * (escenarioActual.manoobra || 1),
        maquinaria: productoValorOriginal.maquinaria * (escenarioActual.maquinaria || 1),
        electricidad: productoValorOriginal.electricidad * (escenarioActual.electricidad || 1),
        controlcalidad: productoValorOriginal.controlcalidad * (escenarioActual.controlcalidad || 1),
        supervision: productoValorOriginal.supervision * (escenarioActual.supervision || 1),
        administracion: productoValorOriginal.administracion * (escenarioActual.administracion || 1),
        otros: escenarioActual.otros || 0,
      }

      console.log("[v0] Datos a insertar:", dataInsert)

      // Llamar a la función de inserción
      const result = await insertarProductoCosteo(dataInsert)

      if (result.success) {
        setSuccessModalData({
          Titulo: "Costeo Actualizado",
          Mensaje: "El costeo del producto se ha guardado correctamente en la base de datos.",
        })
        setShowSuccessModal(true)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al actualizar costeo",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("[v0] Error en handleConfirmActualizarCosteo:", error)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error al actualizar costeo",
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  const handleExportarExcel = () => {
    try {
      const workbook = XLSX.utils.book_new()
      
      const unidades = preciosProducto?.unidadesvendidas || 0
      const escenarioActual = escenarioCostos.find(e => unidades >= e.rangominimo && unidades <= e.rangomaximo) || escenarioCostos[0]

      // Helper para calcular el precio HL unitario por escenario
      const calcularPrecioHL = (escid: number) => {
        return (
          productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
          productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
          productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
          productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
          productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
          productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
          productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
          productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
          productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
          productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
          productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
          productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
          (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
          productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
          productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
          productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
        )
      }

      // ===== HOJA 1: Resumen =====
      const sheet1Data = []
      sheet1Data.push(["INFORMACIÓN BASE DEL PRODUCTO"])
      sheet1Data.push([])
      sheet1Data.push(["Precio Sin Iva 2025", preciosProducto?.preciosinivaaa || 0])
      sheet1Data.push(["Precio Con Iva 2025", preciosProducto?.precioconivaaa || 0])
      sheet1Data.push(["Precio Sin Iva 2026", preciosProducto?.precioventasiniva || 0])
      sheet1Data.push(["Precio Con Iva 2026", preciosProducto?.precioventaconiva || 0])
      sheet1Data.push(["Unidades Vendidas 2025", preciosProducto?.unidadesvendidas || 0])
      sheet1Data.push([])
      
      const preciohl = calcularPrecioHL(escenarioActual.escenarioid)
      sheet1Data.push(["RESUMEN HBX"])
      sheet1Data.push([])
      sheet1Data.push(["Unidades", unidades])
      sheet1Data.push(["Precio Unitario", preciosProducto?.precioventasiniva || 0])
      sheet1Data.push(["Costo Producto", preciohl])
      sheet1Data.push(["Total Costo", unidades * preciohl])
      sheet1Data.push([])
      
      sheet1Data.push(["ANÁLISIS DE RENTABILIDAD POR ESCENARIO"])
      sheet1Data.push(["Concepto", "A (<500)", "B (500-1K)", "C (1K-3K)", "D (3K-5K)", "E (5K+)"])
      
      // Precio HL Unitario
      const precioHLRow = ["Precio HL Unitario"]
      for (let escid = 1; escid <= 5; escid++) {
        precioHLRow.push(calcularPrecioHL(escid).toFixed(2))
      }
      sheet1Data.push(precioHLRow)
      
      // Utilidad
      const utilidadRow = ["Utilidad"]
      const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
      for (let escid = 1; escid <= 5; escid++) {
        const categoriaProducto = productoXCliente?.scategoria || ''
        const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
        const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
        const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
        
        const sumConfiguraciones = configuracionesXCliente
          .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
          .reduce((sum, config) => {
            const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
            const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
            const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
            return sum + calcValue
          }, 0)
        
        const total = calcularPrecioHL(escid)
        const utilidad = escid === 1 
          ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
          : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
        
        utilidadRow.push(utilidad.toFixed(2))
      }
      sheet1Data.push(utilidadRow)
      
      // Utilidad/Costo
      const utilidadCostoRow = ["Utilidad / Costo (%)"]
      for (let escid = 1; escid <= 5; escid++) {
        const categoriaProducto = productoXCliente?.scategoria || ''
        const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
        const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
        const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
        
        const sumConfiguraciones = configuracionesXCliente
          .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
          .reduce((sum, config) => {
            const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
            const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
            const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
            return sum + calcValue
          }, 0)
        
        const total = calcularPrecioHL(escid)
        const utilidad = escid === 1 
          ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
          : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
        
        const rentabilidad = total > 0 ? (utilidad / total) * 100 : 0
        utilidadCostoRow.push(rentabilidad.toFixed(2))
      }
      sheet1Data.push(utilidadCostoRow)

      const worksheet1 = XLSX.utils.aoa_to_sheet(sheet1Data)
      XLSX.utils.book_append_sheet(workbook, worksheet1, "Resumen")

      // ===== HOJA 2: Valores Calculados =====
      const sheet2Data = []
      sheet2Data.push(["VALORES CALCULADOS"])
      sheet2Data.push(["Costo", "A", "B", "C", "D", "E"])
      sheet2Data.push(["Rango (Min-Max)",
        `${escenarioCostos[0]?.rangominimo}-${escenarioCostos[0]?.rangomaximo}`,
        `${escenarioCostos[1]?.rangominimo}-${escenarioCostos[1]?.rangomaximo}`,
        `${escenarioCostos[2]?.rangominimo}-${escenarioCostos[2]?.rangomaximo}`,
        `${escenarioCostos[3]?.rangominimo}-${escenarioCostos[3]?.rangomaximo}`,
        `${escenarioCostos[4]?.rangominimo}-${escenarioCostos[4]?.rangomaximo}`
      ])
      
      // Materia Prima
      const materiaPrimaRow = ["Materia Prima"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1)
        materiaPrimaRow.push(valor.toFixed(2))
      }
      sheet2Data.push(materiaPrimaRow)
      
      // Material Envase
      const materialEnvaseRow = ["Material Envase"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1)
        materialEnvaseRow.push(valor.toFixed(2))
      }
      sheet2Data.push(materialEnvaseRow)
      
      // Material Empaque
      const materialEmpaqueRow = ["Material Empaque"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1)
        materialEmpaqueRow.push(valor.toFixed(2))
      }
      sheet2Data.push(materialEmpaqueRow)
      
      // Margen Seguridad
      const margenSeguridadRow = ["Margen Seguridad"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1)
        margenSeguridadRow.push(valor.toFixed(2))
      }
      sheet2Data.push(margenSeguridadRow)
      
      // Merma MP
      const mermaMPRow = ["Merma MP"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0)
        mermaMPRow.push(valor.toFixed(2))
      }
      sheet2Data.push(mermaMPRow)
      
      // Merma MEM
      const mermaMEMRow = ["Merma MEM"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
        mermaMEMRow.push(valor.toFixed(2))
      }
      sheet2Data.push(mermaMEMRow)
      
      // Merma ME
      const mermaMERow = ["Merma ME"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0)
        mermaMERow.push(valor.toFixed(2))
      }
      sheet2Data.push(mermaMERow)
      
      // Importaciones
      const importacionesRow = ["Importaciones"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1)
        importacionesRow.push(valor.toFixed(2))
      }
      sheet2Data.push(importacionesRow)
      
      // Fletes
      const fletesRow = ["Fletes"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1)
        fletesRow.push(valor.toFixed(2))
      }
      sheet2Data.push(fletesRow)
      
      // Mano de Obra
      const manoObraRow = ["Mano de Obra"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1)
        manoObraRow.push(valor.toFixed(2))
      }
      sheet2Data.push(manoObraRow)
      
      // Maquinaria
      const maquinariaRow = ["Maquinaria"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1)
        maquinariaRow.push(valor.toFixed(2))
      }
      sheet2Data.push(maquinariaRow)
      
      // Electricidad
      const electricidadRow = ["Electricidad"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1)
        electricidadRow.push(valor.toFixed(2))
      }
      sheet2Data.push(electricidadRow)
      
      // Control Calidad
      const controlCalidadRow = ["Control Calidad"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1)
        controlCalidadRow.push(valor.toFixed(2))
      }
      sheet2Data.push(controlCalidadRow)
      
      // Supervision
      const supervisionRow = ["Supervision"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1)
        supervisionRow.push(valor.toFixed(2))
      }
      sheet2Data.push(supervisionRow)
      
      // Administración
      const administracionRow = ["Administración"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1)
        administracionRow.push(valor.toFixed(2))
      }
      sheet2Data.push(administracionRow)
      
      // Otros
      const otrosRow = ["Otros"]
      for (let escid = 1; escid <= 5; escid++) {
        const valor = escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0
        otrosRow.push(valor.toFixed(2))
      }
      sheet2Data.push(otrosRow)
      
      // Total
      const totalRow = ["Total"]
      for (let escid = 1; escid <= 5; escid++) {
        totalRow.push(calcularPrecioHL(escid).toFixed(2))
      }
      sheet2Data.push(totalRow)
      
      // Agregar filas de ConfiguracionesXCliente
      sheet2Data.push([])
      sheet2Data.push(["IVA Pagado", configuracionesXCliente.find(c => c.descripcion === "Porcentaje - IVA Pagado")?.valor || 0])
      sheet2Data.push(["Tarjeta de Crédito", configuracionesXCliente.find(c => c.descripcion === "Porcentaje - Tarjeta de Crédito")?.valor || 0])
      sheet2Data.push(["Reembolsos", configuracionesXCliente.find(c => c.descripcion === "Porcentaje - Reembolsos")?.valor || 0])
      sheet2Data.push(["Promociones Comerciales", configuracionesXCliente.find(c => c.descripcion === "Promociones Comerciales")?.valor || 0])
      sheet2Data.push(["CDA", configuracionesXCliente.find(c => c.descripcion === "CDA")?.valor || 0])
      sheet2Data.push(["Envío", configuracionesXCliente.find(c => c.descripcion === "Envío")?.valor || 0])
      sheet2Data.push(["Otros Porcentajes", configuracionesXCliente.find(c => c.descripcion === "Otros Porcentajes")?.valor || 0])
      sheet2Data.push(["Categoria", productoXCliente?.scategoria || ""])

      const worksheet2 = XLSX.utils.aoa_to_sheet(sheet2Data)
      XLSX.utils.book_append_sheet(workbook, worksheet2, "Valores Calculados")

      // ===== HOJA 3: Escenarios de Costos =====
      const sheet3Data = []
      sheet3Data.push(["ESCENARIOS DE COSTOS"])
      sheet3Data.push([])
      sheet3Data.push(["", "Escenario 1", "Escenario 2", "Escenario 3", "Escenario 4", "Escenario 5"])
      sheet3Data.push(["Materia Prima", 
        escenarioCostos[0]?.materiaprima || 0,
        escenarioCostos[1]?.materiaprima || 0,
        escenarioCostos[2]?.materiaprima || 0,
        escenarioCostos[3]?.materiaprima || 0,
        escenarioCostos[4]?.materiaprima || 0
      ])
      sheet3Data.push(["Material Envase", 
        escenarioCostos[0]?.materialenvase || 0,
        escenarioCostos[1]?.materialenvase || 0,
        escenarioCostos[2]?.materialenvase || 0,
        escenarioCostos[3]?.materialenvase || 0,
        escenarioCostos[4]?.materialenvase || 0
      ])
      sheet3Data.push(["Material Empaque", 
        escenarioCostos[0]?.materialempaque || 0,
        escenarioCostos[1]?.materialempaque || 0,
        escenarioCostos[2]?.materialempaque || 0,
        escenarioCostos[3]?.materialempaque || 0,
        escenarioCostos[4]?.materialempaque || 0
      ])
      sheet3Data.push(["Margen Seguridad", 
        escenarioCostos[0]?.margenseguridad || 0,
        escenarioCostos[1]?.margenseguridad || 0,
        escenarioCostos[2]?.margenseguridad || 0,
        escenarioCostos[3]?.margenseguridad || 0,
        escenarioCostos[4]?.margenseguridad || 0
      ])
      sheet3Data.push(["Importaciones", 
        escenarioCostos[0]?.importaciones || 0,
        escenarioCostos[1]?.importaciones || 0,
        escenarioCostos[2]?.importaciones || 0,
        escenarioCostos[3]?.importaciones || 0,
        escenarioCostos[4]?.importaciones || 0
      ])
      sheet3Data.push(["Fletes", 
        escenarioCostos[0]?.fletes || 0,
        escenarioCostos[1]?.fletes || 0,
        escenarioCostos[2]?.fletes || 0,
        escenarioCostos[3]?.fletes || 0,
        escenarioCostos[4]?.fletes || 0
      ])
      sheet3Data.push(["Mano de Obra", 
        escenarioCostos[0]?.manoobra || 0,
        escenarioCostos[1]?.manoobra || 0,
        escenarioCostos[2]?.manoobra || 0,
        escenarioCostos[3]?.manoobra || 0,
        escenarioCostos[4]?.manoobra || 0
      ])
      sheet3Data.push(["Maquinaria", 
        escenarioCostos[0]?.maquinaria || 0,
        escenarioCostos[1]?.maquinaria || 0,
        escenarioCostos[2]?.maquinaria || 0,
        escenarioCostos[3]?.maquinaria || 0,
        escenarioCostos[4]?.maquinaria || 0
      ])
      sheet3Data.push(["Electricidad", 
        escenarioCostos[0]?.electricidad || 0,
        escenarioCostos[1]?.electricidad || 0,
        escenarioCostos[2]?.electricidad || 0,
        escenarioCostos[3]?.electricidad || 0,
        escenarioCostos[4]?.electricidad || 0
      ])
      sheet3Data.push(["Control Calidad", 
        escenarioCostos[0]?.controlcalidad || 0,
        escenarioCostos[1]?.controlcalidad || 0,
        escenarioCostos[2]?.controlcalidad || 0,
        escenarioCostos[3]?.controlcalidad || 0,
        escenarioCostos[4]?.controlcalidad || 0
      ])
      sheet3Data.push(["Supervision", 
        escenarioCostos[0]?.supervision || 0,
        escenarioCostos[1]?.supervision || 0,
        escenarioCostos[2]?.supervision || 0,
        escenarioCostos[3]?.supervision || 0,
        escenarioCostos[4]?.supervision || 0
      ])
      sheet3Data.push(["Administración", 
        escenarioCostos[0]?.administracion || 0,
        escenarioCostos[1]?.administracion || 0,
        escenarioCostos[2]?.administracion || 0,
        escenarioCostos[3]?.administracion || 0,
        escenarioCostos[4]?.administracion || 0
      ])
      sheet3Data.push(["Merma MP", 
        escenarioCostos[0]?.mermamp || 0,
        escenarioCostos[1]?.mermamp || 0,
        escenarioCostos[2]?.mermamp || 0,
        escenarioCostos[3]?.mermamp || 0,
        escenarioCostos[4]?.mermamp || 0
      ])
      sheet3Data.push(["Merma ME", 
        escenarioCostos[0]?.mermame || 0,
        escenarioCostos[1]?.mermame || 0,
        escenarioCostos[2]?.mermame || 0,
        escenarioCostos[3]?.mermame || 0,
        escenarioCostos[4]?.mermame || 0
      ])
      sheet3Data.push(["Merma MEM", 
        escenarioCostos[0]?.mermamem || 0,
        escenarioCostos[1]?.mermamem || 0,
        escenarioCostos[2]?.mermamem || 0,
        escenarioCostos[3]?.mermamem || 0,
        escenarioCostos[4]?.mermamem || 0
      ])
      sheet3Data.push(["Otros", 
        escenarioCostos[0]?.otros || 0,
        escenarioCostos[1]?.otros || 0,
        escenarioCostos[2]?.otros || 0,
        escenarioCostos[3]?.otros || 0,
        escenarioCostos[4]?.otros || 0
      ])

      const worksheet3 = XLSX.utils.aoa_to_sheet(sheet3Data)
      XLSX.utils.book_append_sheet(workbook, worksheet3, "Escenarios Costos")

      // Generar y descargar el archivo
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Costeo_${producto?.nombre || "Producto"}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("[v0] Excel exportado exitosamente")
    } catch (error) {
      console.error("[v0] Error al exportar Excel:", error)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error al exportar Excel",
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  const handleActualizarCosteo_OLD = async () => {
    if (!filtroClienteId || !filtroProductoId || !preciosProducto || !productoXCliente) {
      return
    }

    try {
      // Obtener el escenario actual
      const unidades = preciosProducto.unidadesvendidas || 0
      const escenarioActual = escenarioCostos.find(e => 
        unidades >= e.rangominimo && unidades <= e.rangomaximo
      )

      if (!escenarioActual) {
        console.error("[v0] No se encontró escenario actual")
        return
      }

      const escenarioId = escenarioActual.escenarioid

      // Obtener valores de ConfiguracionesXCliente para el escenario actual
      const categoriaProducto = productoXCliente.scategoria || ''
      const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
      const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0

      const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
      
      // Calcular valores para cada registro de ConfiguracionesXCliente
      const getConfigValue = (descripcion: string) => {
        const config = configuracionesXCliente.find(c => c.descripcion === descripcion)
        if (!config) return 0
        const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
        const usarValorDirecto = registrosSinCalculo.includes(descripcion)
        return usarValorDirecto ? valor : (preciosProducto.precioventasiniva || 0) * valor
      }

      // Calcular Total (Precio HL)
      const preciohl = (
        productoValorOriginal.materiaprima / (escenarioActual.materiaprima || 1) +
        productoValorOriginal.materialenvase / (escenarioActual.materialenvase || 1) +
        productoValorOriginal.materialempaque / (escenarioActual.materialempaque || 1) +
        productoValorOriginal.margenseguridad / (escenarioActual.margenseguridad || 1) +
        productoValorOriginal.importaciones * (escenarioActual.importaciones || 1) +
        productoValorOriginal.fletes * (escenarioActual.fletes || 1) +
        productoValorOriginal.manoobra * (escenarioActual.manoobra || 1) +
        productoValorOriginal.maquinaria * (escenarioActual.maquinaria || 1) +
        productoValorOriginal.electricidad * (escenarioActual.electricidad || 1) +
        productoValorOriginal.controlcalidad * (escenarioActual.controlcalidad || 1) +
        productoValorOriginal.supervision * (escenarioActual.supervision || 1) +
        productoValorOriginal.administracion * (escenarioActual.administracion || 1) +
        (escenarioActual.otros || 0) +
        productoValorOriginal.materiaprima * (escenarioActual.mermamp || 0) +
        productoValorOriginal.materialempaque * (escenarioActual.mermame || 0) +
        productoValorOriginal.materialenvase * (escenarioActual.mermamem || 0)
      )

      // Calcular suma de configuraciones
      const sumConfiguraciones = configuracionesXCliente
        .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
        .reduce((sum, config) => {
          const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
          const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
          const calcValue = usarValorDirecto ? valor : (preciosProducto.precioventasiniva || 0) * valor
          return sum + calcValue
        }, 0)

      const valorCategoriaCalc = (preciosProducto.precioventasiniva || 0) * valorCategoria

      // Calcular Utilidad
      const utilidad = escenarioId === 1 
        ? (preciosProducto.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
        : (preciosProducto.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - preciohl

      // Calcular Utilidad/Costo
      const utilidadcosto = preciohl > 0 ? (utilidad / preciohl) * 100 : 0

      // Calcular totales
      const totalcosto = unidades * preciohl
      const totalutilidad = unidades * utilidad

      // Crear objeto de inserción
      const dataInsert: ProductoCosteoInsert = {
        clienteid: Number(filtroClienteId),
        productoid: Number(filtroProductoId),
        precioventasiniva: preciosProducto.precioventasiniva || 0,
        precioventaconiva: preciosProducto.precioventaconiva || 0,
        fechacreacion: new Date().toISOString(),
        activo: true,
        preciohl: preciohl,
        ivapagado: getConfigValue('Porcentaje - IVA Pagado'),
        cda: getConfigValue('CDA'),
        reembolsos: getConfigValue('Porcentaje - Reembolsos'),
        tarjetacredito: getConfigValue('Porcentaje - Tarjeta de Crédito'),
        envio: getConfigValue('Envío'),
        totalcostos: totalcosto,
        categoria: valorCategoriaCalc,
        forecast: preciosProducto.unidadesvendidas || 0,
        precioventaconivaaa: preciosProducto.preciosiniva2025 || 0,
        fechamodificacion: new Date().toISOString(),
        promocionescomerciales: getConfigValue('Promociones Comerciales'),
        utilidad: utilidad,
        utilidadcosto: utilidadcosto,
        totalutilidad: totalutilidad,
        mermamp: productoValorOriginal.materiaprima * (escenarioActual.mermamp || 0),
        mermamem: productoValorOriginal.materialenvase * (escenarioActual.mermamem || 0),
        mermame: productoValorOriginal.materialempaque * (escenarioActual.mermame || 0),
        importaciones: productoValorOriginal.importaciones * (escenarioActual.importaciones || 1),
        fletes: productoValorOriginal.fletes * (escenarioActual.fletes || 1),
        manoobra: productoValorOriginal.manoobra * (escenarioActual.manoobra || 1),
        maquinaria: productoValorOriginal.maquinaria * (escenarioActual.maquinaria || 1),
        electricidad: productoValorOriginal.electricidad * (escenarioActual.electricidad || 1),
        controlcalidad: productoValorOriginal.controlcalidad * (escenarioActual.controlcalidad || 1),
        supervision: productoValorOriginal.supervision * (escenarioActual.supervision || 1),
        administracion: productoValorOriginal.administracion * (escenarioActual.administracion || 1),
        otros: escenarioActual.otros || 0,
      }

      console.log("[v0] Datos a insertar:", dataInsert)

      // Llamar a la función de inserción
      const result = await insertarProductoCosteo(dataInsert)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Costeo actualizado correctamente",
          isOpen: true,
          onClose: () => setShowModalAlert(false),
        })
        setShowModalAlert(true)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al actualizar costeo",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("[v0] Error en handleActualizarCosteo:", error)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error al actualizar costeo",
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
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

      {showModalError && ModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      <ModalConfirmation
        Titulo={confirmationModalData.Titulo}
        Mensaje={confirmationModalData.Mensaje}
        isOpen={showConfirmationModal}
        onConfirm={handleConfirmActualizarCosteo}
        onCancel={() => setShowConfirmationModal(false)}
      />

      <ModalSuccess
        Titulo={successModalData.Titulo}
        Mensaje={successModalData.Mensaje}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

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
              {/* Input de búsqueda de Producto con dropdown */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filtroProductoTexto}
                  onChange={(e) => {
                    setFiltroProductoTexto(e.target.value)
                    // Solo mostrar el dropdown si el usuario está escribiendo, no después de seleccionar
                    if (filtroProductoId === "") {
                      setShowProductosDropdown(true)
                    }
                  }}
                  onFocus={() => {
                    // Solo mostrar el dropdown si no hay un producto seleccionado
                    if (filtroProductoId === "") {
                      setShowProductosDropdown(true)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowProductosDropdown(false), 200)}
                />
                
                {/* Dropdown filtrado */}
                {showProductosDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-[300px] overflow-y-auto">
                    {productosCliente
                      .filter(p => 
                        p.codigo?.toLowerCase().includes(filtroProductoTexto.toLowerCase()) ||
                        p.nombre?.toLowerCase().includes(filtroProductoTexto.toLowerCase())
                      )
                      .map(producto => (
                        <div
                          key={producto.id}
                          onClick={() => {
                            setFiltroProductoId(producto.id.toString())
                            setFiltroProductoTexto(`${producto.codigo} - ${producto.nombre}`)
                            setShowProductosDropdown(false)
                          }}
                          className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                            <img
                              src={producto.imgurl || "/placeholder.svg?height=48&width=48&text=P"}
                              alt={producto.nombre || "Producto"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {producto.codigo} - {producto.nombre}
                            </div>
                          </div>
                        </div>
                      ))}
                    {productosCliente.filter(p => 
                      p.codigo?.toLowerCase().includes(filtroProductoTexto.toLowerCase()) ||
                      p.nombre?.toLowerCase().includes(filtroProductoTexto.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No se encontraron productos
                      </div>
                    )}
                  </div>
                )}
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lado Izquierdo - Información del Producto */}
          <div className="lg:col-span-1 space-y-4">
            {/* Imagen y Información Básica - Una sola sección */}
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Imagen del Producto - Lado Izquierdo */}
                  <div className="w-24 h-24 flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                      <img
                        src={producto.imgurl || "/placeholder.svg?height=100&width=100&text=Producto"}
                        alt={producto.nombre || "Producto"}
                        className="h-auto w-full max-h-[100px] object-contain"
                      />
                    </div>
                  </div>

                  {/* Información Básica - Lado Derecho */}
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="font-bold text-sky-700 mb-2">Información Básica</div>
                    <div>
                      <span className="font-semibold text-sky-700">ID:</span>
                      <span className="ml-2 text-gray-900">{producto.codigomaestro}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Código:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.codigo || "Sin código"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Nombre:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.nombre || "Sin nombre"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Cliente:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.clientes?.nombre || "Sin cliente"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Zona:</span>
                      <span className="ml-2 text-gray-900">{producto.zonas?.nombre || "Sin zona"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Envase:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.envase || "Sin unidad"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Presentacion:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.ff || "Sin unidad"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Cantidad:</span>
                      <span className="ml-2 text-gray-900 truncate">{producto.cantidadpresentacion || "Sin unidad"}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-semibold text-sky-700">Estatus:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          producto.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {producto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sky-700">Tipo comisión:</span>
                      <span className="text-white bg-blue-500 py-0.5 rounded px-2 text-xs">
                        {productoXCliente?.scategoria || "Sin categoria"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Composición, Costeo Administrativo y Costeo Porcentual - Una sola sección */}
            <Card className="rounded-xs border bg-card text-card-foreground shadow">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-bold text-green-700">Información del Producto</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Composición y Costo */}
                <div className="space-y-1 text-xs mb-3 pb-3 border-b">
                  <div className="font-semibold text-green-700 mb-1">Composición y Costo</div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">MP:</span>
                    <span className="text-gray-900">${producto.mp || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">MEM:</span>
                    <span className="text-gray-900">${producto.mem || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">ME:</span>
                    <span className="text-gray-900">${producto.me || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">MS:</span>
                    <span className="text-gray-900">${producto.ms || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">Costo de elaboración:</span>
                    <span className="text-gray-900">${producto.costo?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>

                {/* Costeo Administrativo */}
                {configuracionesFijo.filter((config) => config.orden >= 1 && config.orden <= 9).length > 0 && (
                  <div className="space-y-1 text-xs mb-3 pb-3 border-b">
                    <div className="font-semibold text-purple-700 mb-1">Costeo Administrativo</div>
                    {configuracionesFijo
                      .filter((config) => config.orden >= 1 && config.orden <= 9)
                      .map((config) => (
                        <div key={config.id} className="flex justify-between items-center">
                          <span className="font-semibold text-purple-700">{config.descripcion}:</span>
                          <span className="text-gray-900">${Number(config.valor)?.toFixed(2) || "0.00"}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Costeo Porcentual */}
                {configuracionesFijo.filter((config) => config.orden >= 10 && config.orden <= 16).length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-blue-700 mb-1">Costeo Porcentual</div>
                    {configuracionesFijo
                      .filter((config) => config.orden >= 10 && config.orden <= 16)
                      .map((config) => {
                        const isPercentageField = config.descripcion === 'Porcentaje - IVA Pagado' || config.descripcion === 'Porcentaje - Tarjeta de Crédito'
                        const value = Number(config.valor) || 0
                        const displayValue = isPercentageField ? (value * 100).toFixed(2) : value.toFixed(2)
                        const symbol = isPercentageField ? '%' : '$'
                        
                        return (
                          <div key={config.id} className="flex justify-between items-center">
                            <span className="font-semibold text-blue-700">{config.descripcion}:</span>
                            <span className="text-gray-900">{isPercentageField ? '' : symbol}{displayValue}{isPercentageField ? symbol : ''}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            
          </div>

          {/* Lado Derecho - Tablas y Reportes */}
          <div className="lg:col-span-3">
            <Card className="rounded-xs border bg-card text-card-foreground shadow h-full flex flex-col">
              <CardHeader className="space-y-1.5 p-4 flex flex-col gap-4">
                {/* Fila superior: Título a la izquierda, Banner de Escenario + Botón a la derecha */}
                <div className="flex items-center justify-between">
                  <CardTitle>Tablas y Reportes</CardTitle>
                  
                  <div className="flex items-center gap-3">
                    {/* Botón Exportar Excel - más pequeño */}
                    <Button
                      onClick={handleExportarExcel}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 h-auto"
                      disabled={!filtroClienteId || !filtroProductoId}
                      size="sm"
                    >
                      Exportar Excel
                    </Button>
                    
                    {/* Indicador del Escenario Actual - Banner Amarillo */}
                    <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-300 border-2 border-yellow-600 rounded-lg shadow-md">
                      {(() => {
                        const unidades = preciosProducto?.unidadesvendidas || 0
                        const escenario = escenarioCostos.find(e => 
                          unidades >= e.rangominimo && unidades <= e.rangomaximo
                        )
                        
                        if (!escenario) {
                          return <span className="text-xs font-bold text-yellow-900">Sin rango</span>
                        }
                        
                        return (
                          <div className="text-center">
                            <span className="text-xl font-bold text-white bg-yellow-600 px-2 py-1 rounded inline-block">
                              {String.fromCharCode(64 + escenario.escenarioid)}
                            </span>
                            <p className="text-xs font-semibold text-yellow-900 mt-0.5">
                              {escenario.rangominimo}-{escenario.rangomaximo}
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

              </CardHeader>
              <CardContent className="flex-1">
                <Tabs defaultValue="cotizacion" className="w-full h-full flex flex-col">
                  <TabsList className="grid grid-cols-3 gap-2 w-fit mb-4">
                    <TabsTrigger value="cotizacion">Resumen</TabsTrigger>
                    <TabsTrigger value="costo">Costos</TabsTrigger>
                    <TabsTrigger value="escenarios">Escenarios</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cotizacion" className="mt-4 flex-1">
                    {preciosProducto && (
                      <div className="space-y-6">
                        {/* Contenedor superior: Información Base + Resumen HBX */}
                        <div className="flex gap-32 items-start">
                          {/* Tabla 1: Categoría HBX - Mejorada visualmente - Más pequeña */}
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-3 text-gray-800">Información Base del Producto</h3>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-2">
                              <div className="space-y-1">
                                {/* Precio Sin Iva 2025 */}
                                <div className="bg-white rounded-lg p-1.5 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Precio Sin Iva 2025</p>
                                  <p className="text-xs font-bold text-blue-900">$ {(preciosProducto.preciosinivaaa || 0).toFixed(2)}</p>
                                </div>
                                
                                {/* Precio Con Iva 2025 */}
                                <div className="bg-white rounded-lg p-1.5 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Precio con Iva 2025</p>
                                  <p className="text-xs font-bold text-blue-900">$ {(preciosProducto.precioconivaaa || 0).toFixed(2)}</p>
                                </div>
                                
                                {/* Precio Sin Iva 2026 - EDITABLE - Destacado */}
                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-1.5 border-2 border-green-500 shadow-sm">
                                  <label className="text-xs font-bold text-green-700 uppercase tracking-widest block mb-0.5">
                                    Precio Sin Iva 2026 (Editable)
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-green-900">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="flex-1 px-2 py-0.5 text-xs font-bold bg-white border-2 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                      value={preciosProducto.precioventasiniva || 0}
                                      onChange={(e) => {
                                        const newPrecioSinIva = Number(e.target.value)
                                        const newPrecioConIva = newPrecioSinIva * 1.16
                                        setPreciosProducto(prev => prev ? { ...prev, precioventasiniva: newPrecioSinIva, precioventaconiva: newPrecioConIva } : null)
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Precio Con Iva 2026 */}
                                <div className="bg-white rounded-lg p-1.5 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Precio con Iva 2026</p>
                                  <p className="text-xs font-bold text-blue-900">$ {(preciosProducto.precioventaconiva || 0).toFixed(2)}</p>
                                </div>
                                
                                {/* Unidades Vendidas 2025 - EDITABLE - Destacado */}
                                <div className="bg-gradient-to-r from-blue-100 to-blue-100 rounded-lg p-1.5 border-2 border-blue-500 shadow-sm">
                                  <label className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-0.5">
                                    ✎ Unidades Vendidas 2025
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    className="w-full px-2 py-0.5 text-xs font-bold bg-white border-2 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    value={preciosProducto.unidadesvendidas || 0}
                                    onChange={(e) => setPreciosProducto(prev => prev ? { ...prev, unidadesvendidas: Number(e.target.value) } : null)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tabla 3: Resumen HBX - Diseño compacto - Al lado derecho */}
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-2 text-gray-800">Resumen HBX</h3>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 p-2">
                              <div className="space-y-1">
                                {/* Unidades */}
                                <div className="bg-white rounded-lg p-1.5 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Unidades</p>
                                  <p className="text-xs font-bold text-blue-900">{preciosProducto?.unidadesvendidas || 0}</p>
                                </div>
                                
                                {/* Precio */}
                                <div className="bg-white rounded-lg p-1.5 border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Precio Unitario</p>
                                  <p className="text-xs font-bold text-blue-900">${(preciosProducto?.precioventasiniva || 0).toFixed(2)}</p>
                                </div>
                                
                                {/* Costo Producto */}
                                <div className="bg-red-50 rounded-lg p-1.5 border border-red-200">
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Costo Producto</p>
                                  <p className="text-xs font-bold text-red-900">
                                    {productoValorOriginal ? (
                                      <>
                                        {(() => {
                                          const unidades = preciosProducto?.unidadesvendidas || 0
                                          const escenarioId = escenarioCostos.find(e => 
                                            unidades >= e.rangominimo && unidades <= e.rangomaximo
                                          )?.escenarioid || 1
                                          
                                          const total = (
                                            productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materiaprima || 1) +
                                            productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialenvase || 1) +
                                            productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialempaque || 1) +
                                            productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.margenseguridad || 1) +
                                            productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.importaciones || 1) +
                                            productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.fletes || 1) +
                                            productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.manoobra || 1) +
                                            productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.maquinaria || 1) +
                                            productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.electricidad || 1) +
                                            productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.controlcalidad || 1) +
                                            productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.supervision || 1) +
                                            productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.administracion || 1) +
                                            (escenarioCostos.find(e => e.escenarioid === escenarioId)?.otros || 0) +
                                            productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamp || 0) +
                                            productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermame || 0) +
                                            productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamem || 0)
                                          )
                                          return `$${total.toFixed(2)}`
                                        })()}
                                      </>
                                    ) : (
                                      '$0.00'
                                    )}
                                  </p>
                                </div>
                                
                                {/* Total Costo */}
                                <div className="bg-red-50 rounded-lg p-1.5 border border-red-200">
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Total Costo</p>
                                  <p className="text-xs font-bold text-red-900">
                                    {productoValorOriginal ? (
                                      <>
                                        {(() => {
                                          const unidades = preciosProducto?.unidadesvendidas || 0
                                          const escenarioId = escenarioCostos.find(e => 
                                            unidades >= e.rangominimo && unidades <= e.rangomaximo
                                          )?.escenarioid || 1
                                          
                                          // Costo Producto con lógica correcta (división para primeros 4, multiplicación para el resto)
                                          const costProducto = (
                                            productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materiaprima || 1) +
                                            productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialenvase || 1) +
                                            productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialempaque || 1) +
                                            productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.margenseguridad || 1) +
                                            productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.importaciones || 1) +
                                            productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.fletes || 1) +
                                            productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.manoobra || 1) +
                                            productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.maquinaria || 1) +
                                            productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.electricidad || 1) +
                                            productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.controlcalidad || 1) +
                                            productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.supervision || 1) +
                                            productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.administracion || 1) +
                                            (escenarioCostos.find(e => e.escenarioid === escenarioId)?.otros || 0) +
                                            productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamp || 0) +
                                            productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermame || 0) +
                                            productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamem || 0)
                                          )
                                          
                                          const totalCosto = unidades * costProducto
                                          return `$${totalCosto.toFixed(2)}`
                                        })()}
                                      </>
                                    ) : (
                                      '$0.00'
                                    )}
                                  </p>
                                </div>
                                
                                {/* Utilidad */}
                                <div className="bg-green-100 rounded-lg p-1.5 border border-green-600">
                                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-0.5">Utilidad Unitaria</p>
                                  <p className="text-xs font-bold text-green-900">
                                    {(() => {
                                      const unidades = preciosProducto?.unidadesvendidas || 0
                                      const escenarioId = escenarioCostos.find(e => 
                                        unidades >= e.rangominimo && unidades <= e.rangomaximo
                                      )?.escenarioid || 1
                                      
                                      // Calcular el valor de Categoria
                                      const categoriaProducto = productoXCliente?.scategoria || ''
                                      const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                      const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                      const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                      
                                      // Registros que deben mostrar solo el valor directo sin cálculo
                                      const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                      
                                      const sumConfiguraciones = configuracionesXCliente
                                        .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                        .reduce((sum, config) => {
                                        const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                        const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                        
                                        // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                        const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                        return sum + calcValue
                                      }, 0)
                                      
                                      // Calcular Total
                                      const total = (
                                        productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materiaprima || 1) +
                                        productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialenvase || 1) +
                                        productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialempaque || 1) +
                                        productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.margenseguridad || 1) +
                                        productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.importaciones || 1) +
                                        productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.fletes || 1) +
                                        productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.manoobra || 1) +
                                        productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.maquinaria || 1) +
                                        productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.electricidad || 1) +
                                        productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.controlcalidad || 1) +
                                        productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.supervision || 1) +
                                        productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.administracion || 1) +
                                        (escenarioCostos.find(e => e.escenarioid === escenarioId)?.otros || 0) +
                                        productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamp || 0) +
                                        productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermame || 0) +
                                        productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamem || 0)
                                      )
                                      
                                      // Calcular Utilidad: restar Total solo en escenarios 2, 3, 4, 5 (no en escenario 1)
                                      const utilidad = escenarioId === 1 
                                        ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                        : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                      
                                      return `$${utilidad.toFixed(2)}`
                                    })()}
                                  </p>
                                </div>
                                
                                {/* Total Utilidad */}
                                <div className="bg-green-100 rounded-lg p-1.5 border border-green-600">
                                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-0.5">Total Utilidad</p>
                                  <p className="text-xs font-bold text-green-900">
                                    {(() => {
                                      const unidades = preciosProducto?.unidadesvendidas || 0
                                      const escenarioId = escenarioCostos.find(e => 
                                        unidades >= e.rangominimo && unidades <= e.rangomaximo
                                      )?.escenarioid || 1
                                      
                                      // Calcular el valor de Categoria
                                      const categoriaProducto = productoXCliente?.scategoria || ''
                                      const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                      const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                      const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                      
                                      // Registros que deben mostrar solo el valor directo sin cálculo
                                      const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                      
                                      const sumConfiguraciones = configuracionesXCliente
                                        .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                        .reduce((sum, config) => {
                                        const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                        const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                        
                                        // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                        const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                        return sum + calcValue
                                      }, 0)
                                      
                                      // Calcular Total
                                      const total = (
                                        productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materiaprima || 1) +
                                        productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialenvase || 1) +
                                        productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialempaque || 1) +
                                        productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.margenseguridad || 1) +
                                        productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.importaciones || 1) +
                                        productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.fletes || 1) +
                                        productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.manoobra || 1) +
                                        productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.maquinaria || 1) +
                                        productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.electricidad || 1) +
                                        productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.controlcalidad || 1) +
                                        productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.supervision || 1) +
                                        productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.administracion || 1) +
                                        (escenarioCostos.find(e => e.escenarioid === escenarioId)?.otros || 0) +
                                        productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamp || 0) +
                                        productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermame || 0) +
                                        productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamem || 0)
                                      )
                                      
                                      // Calcular Utilidad Unitaria: restar Total solo en escenarios 2, 3, 4, 5 (no en escenario 1)
                                      const utilidadUnitaria = escenarioId === 1 
                                        ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                        : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                      
                                      // Total Utilidad = Unidades * Utilidad Unitaria
                                      const totalUtilidad = unidades * utilidadUnitaria
                                      return `$${totalUtilidad.toFixed(2)}`
                                    })()}
                                  </p>
                                </div>
                                
                                {/* Utilidad/Costo */}
                                <div className="bg-green-100 rounded-lg p-1.5 border border-green-600">
                                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-0.5">Utilidad/Costo %</p>
                                  <p className="text-xs font-bold text-green-900">
                                    {productoValorOriginal ? (
                                      <>
                                        {(() => {
                                          const unidades = preciosProducto?.unidadesvendidas || 0
                                          const escenarioId = escenarioCostos.find(e => 
                                            unidades >= e.rangominimo && unidades <= e.rangomaximo
                                          )?.escenarioid || 1
                                          
                                          // Calcular el valor de Categoria
                                          const categoriaProducto = productoXCliente?.scategoria || ''
                                          const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                          const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                          const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                          
                                          // Registros que deben mostrar solo el valor directo sin cálculo
                                          const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                          
                                          const sumConfiguraciones = configuracionesXCliente
                                            .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                            .reduce((sum, config) => {
                                            const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                            const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                            
                                            // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                            const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                            return sum + calcValue
                                          }, 0)
                                          
                                          // Calcular Total
                                          const total = (
                                            productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materiaprima || 1) +
                                            productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialenvase || 1) +
                                            productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.materialempaque || 1) +
                                            productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escenarioId)?.margenseguridad || 1) +
                                            productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.importaciones || 1) +
                                            productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.fletes || 1) +
                                            productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.manoobra || 1) +
                                            productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.maquinaria || 1) +
                                            productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.electricidad || 1) +
                                            productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.controlcalidad || 1) +
                                            productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.supervision || 1) +
                                            productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.administracion || 1) +
                                            (escenarioCostos.find(e => e.escenarioid === escenarioId)?.otros || 0) +
                                            productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamp || 0) +
                                            productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermame || 0) +
                                            productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escenarioId)?.mermamem || 0)
                                          )
                                          
                                          // Calcular Utilidad (igual que en Utilidad Unitaria)
                                          const utilidad = escenarioId === 1 
                                            ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                            : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                          
                                          // Calcular Utilidad/Costo usando la Utilidad correcta
                                          const rentabilidad = total > 0 ? (utilidad / total) * 100 : 0
                                          
                                          return `${rentabilidad.toFixed(2)}%`
                                        })()}
                                      </>
                                    ) : (
                                      '0.00%'
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tabla 2: Análisis de Rentabilidad por Escenario - Abajo, ancho completo */}
                        <div className="overflow-x-auto w-full">
                          <h3 className="text-lg font-bold mb-4 text-gray-800">Análisis de Rentabilidad por Escenario</h3>
                          <table className="w-full border-collapse border-2 border-blue-400 text-xs">
                              <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                  <th className="border border-blue-400 p-3 text-left font-bold">Concepto</th>
                                  <th className="border border-blue-400 p-3 text-center font-bold">A<br/>&lt;500</th>
                                  <th className="border border-blue-400 p-3 text-center font-bold">B<br/>500-1K</th>
                                  <th className="border border-blue-400 p-3 text-center font-bold">C<br/>1K-3K</th>
                                  <th className="border border-blue-400 p-3 text-center font-bold">D<br/>3K-5K</th>
                                  <th className="border border-blue-400 p-3 text-center font-bold">E<br/>5K+</th>
                                </tr>
                              </thead>
                              <tbody>
                              {/* Precio HL Unitario - Total con la lógica correcta */}
                              <tr className="bg-orange-50 hover:bg-orange-100 transition">
                                <td className="border border-gray-300 p-3 font-bold text-orange-900">Precio HL Unitario</td>
                                {[1, 2, 3, 4, 5].map((escid) => {
                                  const unidades = preciosProducto?.unidadesvendidas || 0
                                  const currentEscenario = escenarioCostos.find(e => 
                                    unidades >= e.rangominimo && unidades <= e.rangomaximo
                                  )
                                  const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                  
                                  if (!productoValorOriginal) return <td key={escid} className={`border border-gray-300 p-3 text-center font-semibold ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>$0.00</td>
                                  
                                  // Calcular Total con la lógica correcta (división para los primeros 4, multiplicación para los demás)
                                  const total = (
                                    productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                    productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                    productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                    productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                    productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                    productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                    productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                    productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                    productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                    productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                    productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                    productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                    (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                    productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                    productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                    productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                  )
                                  
                                  return (
                                    <td key={escid} className={`border border-gray-300 p-3 text-center font-semibold ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                      ${formatWithDot(total, 2)}
                                    </td>
                                  )
                                })}
                              </tr>
                              
                              {/* Utilidad con la lógica correcta */}
                              <tr className="bg-green-50 hover:bg-green-100 transition">
                                <td className="border border-gray-300 p-3 font-bold text-green-900">Utilidad</td>
                                {[1, 2, 3, 4, 5].map((escid) => {
                                  const unidades = preciosProducto?.unidadesvendidas || 0
                                  const currentEscenario = escenarioCostos.find(e => 
                                    unidades >= e.rangominimo && unidades <= e.rangomaximo
                                  )
                                  const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                  
                                  // Calcular el valor de Categoria
                                  const categoriaProducto = productoXCliente?.scategoria || ''
                                  const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                  const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                  const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                  
                                  // Registros que deben mostrar solo el valor directo sin cálculo
                                  const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                  
                                  const sumConfiguraciones = configuracionesXCliente
                                    .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                    .reduce((sum, config) => {
                                    const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                    const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                    
                                    // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                    const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                    return sum + calcValue
                                  }, 0)
                                  
                                  // Calcular Total
                                  const total = (
                                    productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                    productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                    productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                    productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                    productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                    productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                    productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                    productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                    productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                    productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                    productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                    productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                    (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                    productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                    productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                    productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                  )
                                  
                                  // Calcular Utilidad: restar Total solo en escenarios 2, 3, 4, 5 (no en escenario 1)
                                  const utilidad = escid === 1 
                                    ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                    : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                  
                                  return (
                                    <td key={escid} className={`border border-gray-300 p-3 text-center font-semibold ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                      ${formatWithDot(utilidad, 2)}
                                    </td>
                                  )
                                })}
                              </tr>
                              
                              {/* Utilidad / Costo con la lógica correcta */}
                              <tr className="bg-green-50 hover:bg-green-100 transition">
                                <td className="border border-gray-300 p-3 font-bold text-green-900">Utilidad / Costo (%)</td>
                                {[1, 2, 3, 4, 5].map((escid) => {
                                  const unidades = preciosProducto?.unidadesvendidas || 0
                                  const currentEscenario = escenarioCostos.find(e => 
                                    unidades >= e.rangominimo && unidades <= e.rangomaximo
                                  )
                                  const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                  
                                  if (!productoValorOriginal) return <td key={escid} className={`border border-gray-300 p-3 text-center font-semibold ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>0.00%</td>
                                  
                                  // Calcular el valor de Categoria
                                  const categoriaProducto = productoXCliente?.scategoria || ''
                                  const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                  const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                  const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                  
                                  // Registros que deben mostrar solo el valor directo sin cálculo
                                  const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                  
                                  const sumConfiguraciones = configuracionesXCliente
                                    .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                    .reduce((sum, config) => {
                                    const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                    const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                    
                                    // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                    const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                    return sum + calcValue
                                  }, 0)
                                  
                                  // Calcular Total
                                  const total = (
                                    productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                    productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                    productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                    productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                    productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                    productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                    productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                    productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                    productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                    productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                    productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                    productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                    (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                    productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                    productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                    productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                  )
                                  
                                  // Calcular Utilidad (igual que en la fila anterior)
                                  const utilidad = escid === 1 
                                    ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                    : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                  
                                  // Calcular Utilidad/Costo usando la Utilidad correcta
                                  const rentabilidad = total > 0 ? (utilidad / total) * 100 : 0
                                  
                                  return (
                                    <td key={escid} className={`border border-gray-300 p-3 text-center font-semibold ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                      {rentabilidad.toFixed(2)}%
                                    </td>
                                  )
                                })}
                              </tr>
                              </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {!preciosProducto && (
                      <div className="min-h-[400px] flex items-center justify-center text-gray-500">
                        <p>Selecciona un producto para ver la información de cotización</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Tab Costo */}
                  <TabsContent value="costo" className="mt-4">
                    {/* Tabla de Valores Calculados (Valores Monetarios) */}
                    {productoValorOriginal && escenarioCostos.length > 0 && (
                      <div className="overflow-x-auto mb-6">
                        <h3 className="text-sm font-semibold mb-2">Valores Calculados (en $)</h3>
                        <table className="w-full border-collapse border border-gray-300 text-xs">
                          <thead>
                            <tr className="bg-teal-700 text-white">
                              <th className="border border-gray-300 p-2 text-left font-semibold">Costo</th>
                              <th className="border border-gray-300 p-2 text-center font-semibold">A</th>
                              <th className="border border-gray-300 p-2 text-center font-semibold">B</th>
                              <th className="border border-gray-300 p-2 text-center font-semibold">C</th>
                              <th className="border border-gray-300 p-2 text-center font-semibold">D</th>
                              <th className="border border-gray-300 p-2 text-center font-semibold">E</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Rango Mínimo - Rango Máximo */}
                            <tr className="bg-gray-200">
                              <td className="border border-gray-300 p-2 font-semibold">Rango (Min-Max)</td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {escenarioCostos.find(e => e.escenarioid === 1)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === 1)?.rangomaximo}
                              </td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {escenarioCostos.find(e => e.escenarioid === 2)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === 2)?.rangomaximo}
                              </td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {escenarioCostos.find(e => e.escenarioid === 3)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === 3)?.rangomaximo}
                              </td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {escenarioCostos.find(e => e.escenarioid === 4)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === 4)?.rangomaximo}
                              </td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {escenarioCostos.find(e => e.escenarioid === 5)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === 5)?.rangomaximo}
                              </td>
                            </tr>
                            
                            {/* Materia Prima */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Materia Prima</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === 1)?.materiaprima || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === 2)?.materiaprima || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === 3)?.materiaprima || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === 4)?.materiaprima || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === 5)?.materiaprima || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Material Envase */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Material Envase</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === 1)?.materialenvase || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === 2)?.materialenvase || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === 3)?.materialenvase || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === 4)?.materialenvase || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === 5)?.materialenvase || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Material Empaque */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Material Empaque</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === 1)?.materialempaque || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === 2)?.materialempaque || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === 3)?.materialempaque || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === 4)?.materialempaque || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === 5)?.materialempaque || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Margen Seguridad */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Margen Seguridad</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === 1)?.margenseguridad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === 2)?.margenseguridad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === 3)?.margenseguridad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === 4)?.margenseguridad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === 5)?.margenseguridad || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Merma MP */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Merma MP</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === 1)?.mermamp || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === 2)?.mermamp || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === 3)?.mermamp || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === 4)?.mermamp || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === 5)?.mermamp || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Merma MEM */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Merma MEM</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === 1)?.mermamem || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === 2)?.mermamem || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === 3)?.mermamem || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === 4)?.mermamem || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === 5)?.mermamem || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Merma ME */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Merma ME</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === 1)?.mermame || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === 2)?.mermame || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === 3)?.mermame || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === 4)?.mermame || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === 5)?.mermame || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Importaciones */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Importaciones</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === 1)?.importaciones || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === 2)?.importaciones || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === 3)?.importaciones || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === 4)?.importaciones || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === 5)?.importaciones || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Fletes */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Fletes</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === 1)?.fletes || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === 2)?.fletes || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === 3)?.fletes || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === 4)?.fletes || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === 5)?.fletes || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Mano Obra */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Mano Obra</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === 1)?.manoobra || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === 2)?.manoobra || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === 3)?.manoobra || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === 4)?.manoobra || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === 5)?.manoobra || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Maquinaria */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Maquinaria</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === 1)?.maquinaria || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === 2)?.maquinaria || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === 3)?.maquinaria || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === 4)?.maquinaria || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === 5)?.maquinaria || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Electricidad */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Electricidad</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === 1)?.electricidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === 2)?.electricidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === 3)?.electricidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === 4)?.electricidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === 5)?.electricidad || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Control Calidad */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Control Calidad</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === 1)?.controlcalidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === 2)?.controlcalidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === 3)?.controlcalidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === 4)?.controlcalidad || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === 5)?.controlcalidad || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Supervision */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Supervision</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === 1)?.supervision || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === 2)?.supervision || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === 3)?.supervision || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === 4)?.supervision || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === 5)?.supervision || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Administracion */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Administracion</td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === 1)?.administracion || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === 2)?.administracion || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === 3)?.administracion || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === 4)?.administracion || 1)).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                ${(productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === 5)?.administracion || 1)).toFixed(2)}
                              </td>
                            </tr>
                            
                            {/* Otros */}
                            <tr className="bg-cyan-100">
                              <td className="border border-gray-300 p-2 font-semibold">Otros</td>
                              {[1, 2, 3, 4, 5].map((escid) => (
                                <td key={escid} className="border border-gray-300 p-2 text-center">
                                  ${formatWithDot(escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0, 2)}
                                </td>
                              ))}
                            </tr>

                            {/* Total */}
                            <tr className="bg-teal-600 text-white font-semibold">
                              <td className="border border-gray-300 p-2">Total</td>
                              {[1, 2, 3, 4, 5].map((escid) => {
                                const unidades = preciosProducto?.unidadesvendidas || 0
                                const currentEscenario = escenarioCostos.find(e => 
                                  unidades >= e.rangominimo && unidades <= e.rangomaximo
                                )
                                const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                
                                if (!productoValorOriginal) return <td key={escid} className={`border border-gray-300 p-2 text-center ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>$0.00</td>
                                
                                const total = (
                                  productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                  productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                  productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                  productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                  productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                  productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                  productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                  productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                  productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                  productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                  productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                  productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                  (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                  productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                  productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                  productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                )
                                
                                return (
                                  <td key={escid} className={`border border-gray-300 p-2 text-center ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                    ${formatWithDot(total, 2)}
                                  </td>
                                )
                              })}
                            </tr>
                            
                            {/* Separador */}
                            <tr className="h-4 bg-white-200">
                              <td colSpan={6} className="border-none"></td>
                            </tr>
                            
                            {/* Registro de Categoria en Valores Calculados */}
                            <tr className="bg-purple-100">
                              <td className="border border-gray-300 p-2 font-semibold">Categoria</td>
                              {[1, 2, 3, 4, 5].map((escid) => {
                                // Obtener la categoría del producto (A o B)
                                const categoriaProducto = productoXCliente?.scategoria || ''
                                
                                // Buscar el registro de configuracionesXCliente que coincida con la categoría
                                const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                
                                // Obtener el valor
                                const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                
                                // Calcular: Precio Sin Iva * valorCategoria
                                const calcValue = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                
                                return (
                                  <td key={escid} className="border border-gray-300 p-2 text-center">
                                    ${formatWithDot(calcValue, 2)}
                                  </td>
                                )
                              })}
                            </tr>
                            
                            {/* Registros de ConfiguracionesXCliente en Valores Calculados */}
                            {configuracionesXCliente.filter(config => config.descripcion !== 'A' && config.descripcion !== 'B').map((config) => {
                              // Registros que deben mostrar solo el valor directo sin cálculo
                              const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                              const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                              
                              return (
                                <tr key={`valores-${config.orden}`} className="bg-yellow-100">
                                  <td className="border border-gray-300 p-2 font-semibold">{config.descripcion}</td>
                                  {[1, 2, 3, 4, 5].map((escid) => {
                                    const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                    
                                    // Si es un registro que debe mostrar valor directo, no multiplicar por precio
                                    const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                    
                                    return (
                                      <td key={escid} className="border border-gray-300 p-2 text-center">
                                        ${formatWithDot(calcValue, 2)}
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            })}
                            
                            {/* Utilidad */}
                            <tr className="bg-green-100 font-semibold">
                              <td className="border border-gray-300 p-2">Utilidad</td>
                              {[1, 2, 3, 4, 5].map((escid) => {
                                const unidades = preciosProducto?.unidadesvendidas || 0
                                const currentEscenario = escenarioCostos.find(e => 
                                  unidades >= e.rangominimo && unidades <= e.rangomaximo
                                )
                                const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                
                                // Calcular el valor de Categoria
                                const categoriaProducto = productoXCliente?.scategoria || ''
                                const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                
                                // Registros que deben mostrar solo el valor directo sin cálculo
                                const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                
                                const sumConfiguraciones = configuracionesXCliente
                                  .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                  .reduce((sum, config) => {
                                  const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                  const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                  
                                  // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                  const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                  return sum + calcValue
                                }, 0)
                                
                                // Calcular Total
                                const total = (
                                  productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                  productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                  productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                  productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                  productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                  productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                  productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                  productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                  productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                  productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                  productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                  productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                  (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                  productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                  productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                  productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                )
                                
                                // Calcular Utilidad: restar Total solo en escenarios 2, 3, 4, 5 (no en escenario 1)
                                const utilidad = escid === 1 
                                  ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                  : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                
                                return (
                                  <td key={escid} className={`border border-gray-300 p-2 text-center ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                    ${formatWithDot(utilidad, 2)}
                                  </td>
                                )
                              })}
                            </tr>
                            
                            {/* Utilidad/Costo */}
                            <tr className="bg-teal-100 font-semibold">
                              <td className="border border-gray-300 p-2">Utilidad/Costo</td>
                              {[1, 2, 3, 4, 5].map((escid) => {
                                const unidades = preciosProducto?.unidadesvendidas || 0
                                const currentEscenario = escenarioCostos.find(e => 
                                  unidades >= e.rangominimo && unidades <= e.rangomaximo
                                )
                                const isCurrentEscenario = currentEscenario?.escenarioid === escid
                                
                                // Calcular el valor de Categoria
                                const categoriaProducto = productoXCliente?.scategoria || ''
                                const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                const valorCategoriaCalc = (preciosProducto?.precioventasiniva || 0) * valorCategoria
                                
                                // Registros que deben mostrar solo el valor directo sin cálculo
                                const registrosSinCalculo = ['Porcentaje - Reembolsos', 'Promociones Comerciales', 'CDA', 'Envío', 'Otros Porcentajes']
                                
                                const sumConfiguraciones = configuracionesXCliente
                                  .filter(config => config.descripcion !== 'A' && config.descripcion !== 'B')
                                  .reduce((sum, config) => {
                                  const valor = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                  const usarValorDirecto = registrosSinCalculo.includes(config.descripcion)
                                  
                                  // Si es un registro con valor directo, sumarlo directamente; si no, multiplicar por precio
                                  const calcValue = usarValorDirecto ? valor : (preciosProducto?.precioventasiniva || 0) * valor
                                  return sum + calcValue
                                }, 0)
                                
                                // Calcular Total
                                const total = (
                                  productoValorOriginal.materiaprima / (escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 1) +
                                  productoValorOriginal.materialenvase / (escenarioCostos.find(e => e.escenarioid === escid)?.materialenvase || 1) +
                                  productoValorOriginal.materialempaque / (escenarioCostos.find(e => e.escenarioid === escid)?.materialempaque || 1) +
                                  productoValorOriginal.margenseguridad / (escenarioCostos.find(e => e.escenarioid === escid)?.margenseguridad || 1) +
                                  productoValorOriginal.importaciones * (escenarioCostos.find(e => e.escenarioid === escid)?.importaciones || 1) +
                                  productoValorOriginal.fletes * (escenarioCostos.find(e => e.escenarioid === escid)?.fletes || 1) +
                                  productoValorOriginal.manoobra * (escenarioCostos.find(e => e.escenarioid === escid)?.manoobra || 1) +
                                  productoValorOriginal.maquinaria * (escenarioCostos.find(e => e.escenarioid === escid)?.maquinaria || 1) +
                                  productoValorOriginal.electricidad * (escenarioCostos.find(e => e.escenarioid === escid)?.electricidad || 1) +
                                  productoValorOriginal.controlcalidad * (escenarioCostos.find(e => e.escenarioid === escid)?.controlcalidad || 1) +
                                  productoValorOriginal.supervision * (escenarioCostos.find(e => e.escenarioid === escid)?.supervision || 1) +
                                  productoValorOriginal.administracion * (escenarioCostos.find(e => e.escenarioid === escid)?.administracion || 1) +
                                  (escenarioCostos.find(e => e.escenarioid === escid)?.otros || 0) +
                                  productoValorOriginal.materiaprima * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamp || 0) +
                                  productoValorOriginal.materialempaque * (escenarioCostos.find(e => e.escenarioid === escid)?.mermame || 0) +
                                  productoValorOriginal.materialenvase * (escenarioCostos.find(e => e.escenarioid === escid)?.mermamem || 0)
                                )
                                
                                // Calcular Utilidad (mismo que se muestra en la fila anterior)
                                const utilidad = escid === 1 
                                  ? (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc
                                  : (preciosProducto?.precioventasiniva || 0) - sumConfiguraciones - valorCategoriaCalc - total
                                
                                // Calcular Utilidad/Costo usando la misma Utilidad
                                const rentabilidad = total > 0 ? (utilidad / total) * 100 : 0
                                
                                return (
                                  <td key={escid} className={`border border-gray-300 p-2 text-center ${isCurrentEscenario ? 'bg-yellow-300 font-bold border-yellow-500 border-2' : ''}`}>
                                    {rentabilidad.toFixed(2)}%
                                  </td>
                                )
                              })}
                            </tr>
                            
                            
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Tab Escenarios */}
                  <TabsContent value="escenarios" className="mt-4">
                    {preciosProducto && (
                      <div className="space-y-6">
                        {/* Tabla de Escenarios (Factores y Porcentajes) - EDITABLE */}
                        <div className="overflow-x-auto">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">Escenarios de Costos (Factores) - Tabla Editable</h3>
                            <p className="text-xs text-gray-600 italic">Navega con flechas ↑↓←→ | Tab | Enter</p>
                          </div>
                          <table className="w-full border-collapse border border-gray-300 text-xs">
                            <thead>
                              <tr className="bg-teal-700 text-white">
                                <th className="border border-gray-300 p-2 text-left font-semibold">Costo</th>
                                <th className="border border-gray-300 p-2 text-center font-semibold">A</th>
                                <th className="border border-gray-300 p-2 text-center font-semibold">B</th>
                                <th className="border border-gray-300 p-2 text-center font-semibold">C</th>
                                <th className="border border-gray-300 p-2 text-center font-semibold">D</th>
                                <th className="border border-gray-300 p-2 text-center font-semibold">E</th>
                              </tr>
                            </thead>
                            <tbody>
                            {/* Fila de Rango Mínimo-Máximo en Escenarios */}
                              <tr className="bg-blue-100 border-t-2 border-blue-300">
                                <td className="border border-gray-300 p-1 font-semibold">Rango (Min-Max)</td>
                                {[1, 2, 3, 4, 5].map((escid) => (
                                  <td key={escid} className="border border-gray-300 p-1 text-center text-xs font-semibold">
                                    {escenarioCostos.find(e => e.escenarioid === escid)?.rangominimo} - {escenarioCostos.find(e => e.escenarioid === escid)?.rangomaximo}
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Materia Prima - PORCENTAJE */}
                              <tr className="bg-cyan-100">
                                <td className="border border-gray-300 p-1 font-semibold">Materia Prima</td>
                                {[1, 2, 3, 4, 5].map((escid, colIdx) => {
                                  const valorActual = escenarioCostos.find(e => e.escenarioid === escid)?.materiaprima || 0
                                  const displayValue = Number((valorActual * 100).toFixed(2))
                                  
                                  return (
                                    <td key={escid} className="border border-gray-300 p-1">
                                      <div className="flex items-center justify-center gap-0.5">
                                        <input
                                          id={`cell-0-${colIdx}`}
                                          type="number"
                                          step="any"
                                          className="w-full text-center bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 px-1 py-1 hover:bg-gray-50"
                                          value={displayValue}
                                          onChange={(e) => {
                                            const inputValue = Number(e.target.value)
                                            const storedValue = inputValue / 100
                                            actualizarEscenario(escid, 'materiaprima', storedValue)
                                          }}
                                          onKeyDown={(e) => handleKeyDown(e, 0, colIdx)}
                                        />
                                        <span className="text-xs text-gray-600">%</span>
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                              
                              {/* Resto de filas - Material Envase hasta Otros */}
                              {[
                                { label: 'Material Envase', field: 'materialenvase' as keyof EscenarioCosto, idx: 1 },
                                { label: 'Material Empaque', field: 'materialempaque' as keyof EscenarioCosto, idx: 2 },
                                { label: 'Margen Seguridad', field: 'margenseguridad' as keyof EscenarioCosto, idx: 3 },
                                { label: 'Importaciones', field: 'importaciones' as keyof EscenarioCosto, idx: 4 },
                                { label: 'Fletes', field: 'fletes' as keyof EscenarioCosto, idx: 5 },
                                { label: 'Mano de Obra', field: 'manoobra' as keyof EscenarioCosto, idx: 6 },
                                { label: 'Maquinaria', field: 'maquinaria' as keyof EscenarioCosto, idx: 7 },
                                { label: 'Electricidad', field: 'electricidad' as keyof EscenarioCosto, idx: 8 },
                                { label: 'Control Calidad', field: 'controlcalidad' as keyof EscenarioCosto, idx: 9 },
                                { label: 'Supervision', field: 'supervision' as keyof EscenarioCosto, idx: 10 },
                                { label: 'Administración', field: 'administracion' as keyof EscenarioCosto, idx: 11 },
                                { label: 'Merma MP', field: 'mermamp' as keyof EscenarioCosto, idx: 12 },
                                { label: 'Merma ME', field: 'mermame' as keyof EscenarioCosto, idx: 13 },
                                { label: 'Merma MEM', field: 'mermamem' as keyof EscenarioCosto, idx: 14 },
                                { label: 'Otros', field: 'otros' as keyof EscenarioCosto, idx: 15 },
                              ].map(row => (
                                <tr key={row.field} className="bg-cyan-100">
                                  <td className="border border-gray-300 p-1 font-semibold">{row.label}</td>
                                  {[1, 2, 3, 4, 5].map((escid, colIdx) => (
                                    <td key={escid} className="border border-gray-300 p-1">
                                      <div className="flex items-center justify-center gap-0.5">
                                        <span className="text-xs text-gray-600">$</span>
                                        <input
                                          id={`cell-${row.idx}-${colIdx}`}
                                          type="number"
                                          step="any"
                                          className="w-full text-center bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 px-1 py-1 hover:bg-gray-50"
                                          value={escenarioCostos.find(e => e.escenarioid === escid)?.[row.field] as number || 0}
                                          onChange={(e) => actualizarEscenario(escid, row.field, Number(e.target.value))}
                                          onKeyDown={(e) => handleKeyDown(e, row.idx, colIdx)}
                                        />
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}

                              {/* Registro de Categoria - basado en la categoria del producto */}
                              <tr className="bg-purple-100">
                                <td className="border border-gray-300 p-1 font-semibold">Categoria</td>
                                {[1, 2, 3, 4, 5].map((escid, colIdx) => {
                                  // Obtener la categoría del producto (A o B)
                                  const categoriaProducto = productoXCliente?.scategoria || ''
                                  
                                  // Buscar el registro de configuracionesXCliente que coincida con la categoría
                                  const categoriaConfig = configuracionesXCliente.find(c => c.descripcion === categoriaProducto)
                                  
                                  // Obtener el valor (si existe, sino 0)
                                  const valorCategoria = categoriaConfig ? (configuracionesXClienteEditadas[categoriaConfig.orden] ?? Number(categoriaConfig.valor)) : 0
                                  
                                  // Detectar si es porcentaje
                                  const isPercentage = categoriaConfig ? isValuePercentage(categoriaConfig.tipodato) : false
                                  const displayValue = isPercentage ? Number((valorCategoria * 100).toFixed(2)) : valorCategoria
                                  
                                  return (
                                    <td key={escid} className="border border-gray-300 p-1 text-center">
                                      <div className="flex items-center justify-center gap-0.5">
                                        <span className="text-xs text-gray-600">$</span>
                                        <input
                                          id={`cell-categoria-${colIdx}`}
                                          type="number"
                                          step="any"
                                          className="w-full text-center bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-purple-600 px-1 py-1 hover:bg-gray-50"
                                          value={displayValue}
                                          onChange={(e) => {
                                            if (categoriaConfig) {
                                              const inputValue = Number(e.target.value)
                                              const storedValue = isPercentage ? (inputValue / 100) : inputValue
                                              setConfiguracionesXClienteEditadas(prev => ({ ...prev, [categoriaConfig.orden]: storedValue }))
                                            }
                                          }}
                                          onKeyDown={(e) => handleKeyDown(e, 16, colIdx, 17 + configuracionesXCliente.length)}
                                        />
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>

                              {/* Registros de ConfiguracionesXCliente */}
                              {configuracionesXCliente.filter(config => config.descripcion !== 'A' && config.descripcion !== 'B').map((config, configIdx) => {
                                const isPercentage = isValuePercentage(config.tipodato)
                                
                                return (
                                  <tr key={`config-${config.orden}`} className="bg-yellow-100">
                                    <td className="border border-gray-300 p-1 font-semibold">{config.descripcion}</td>
                                    {[1, 2, 3, 4, 5].map((escid, colIdx) => {
                                      // Obtener el valor editado o el original (convertir a número)
                                      const baseValue = configuracionesXClienteEditadas[config.orden] ?? Number(config.valor)
                                      
                                      // Si es porcentaje, multiplicar por 100 para mostrar
                                      const displayValue = isPercentage ? Number((baseValue * 100).toFixed(2)) : baseValue
                                      
                                      return (
                                        <td key={escid} className="border border-gray-300 p-1 text-center">
                                          <div className="flex items-center justify-center gap-0.5">
                                            {!isPercentage && <span className="text-xs text-gray-600">$</span>}
                                            <input
                                              id={`cell-${16 + configIdx}-${colIdx}`}
                                              type="number"
                                              step="any"
                                              className="w-full text-center bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 px-1 py-1 hover:bg-gray-50"
                                              value={displayValue}
                                              onChange={(e) => {
                                                // Si es porcentaje, dividir por 100 al guardar
                                                const inputValue = Number(e.target.value)
                                                const storedValue = isPercentage ? (inputValue / 100) : inputValue
                                                setConfiguracionesXClienteEditadas(prev => ({ ...prev, [config.orden]: storedValue }))
                                              }}
                                              onKeyDown={(e) => handleKeyDown(e, 16 + configIdx, colIdx, 16 + configuracionesXCliente.length)}
                                            />
                                            {isPercentage && <span className="text-xs text-gray-600">%</span>}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              {/* Botón Actualizar Costeo en la parte inferior del Card */}
              <div className="border-t p-4 flex justify-center">
                <Button
                  onClick={handleActualizarCosteo}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!filtroClienteId || !filtroProductoId}
                >
                  Actualizar Costeo
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
