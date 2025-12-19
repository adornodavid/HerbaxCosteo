"use client"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"
import type { ddlItem } from "@/types/common.types"
import type {
  propsPageLoadingScreen,
  propsPageTitlePlusNew,
  propsPageModalAlert,
  propsPageModalError,
} from "@/types/common.types"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { useUserSession } from "@/hooks/use-user-session"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { listaDesplegableProductosXClientes } from "@/app/actions/productos"
import {
  obtenerReporteCosteo,
  recalcularCotizacionReporte,
  actualizarRegistrosModificados,
} from "@/app/actions/reportecosteo"
import type { oProducto } from "@/types/productos.types"

type ColumnConfig = {
  key: string
  label: string
  headerColor: string
  isSticky?: boolean
  stickyLeft?: string
}

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function ReporteCosteoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { user: sessionUser, loading: sessionLoading } = useUserSession()

  // --- Estados ---
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
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

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroZonaId, setFiltroZonaId] = useState("")
  const [filtroProductoId, setFiltroProductoId] = useState("-1")
  // const [showSuccessModal, setShowSuccessModal] = useState(false) // This line was removed as it's now defined above.
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])
  const [productosCliente, setProductosCliente] = useState<oProducto[]>([])

  // Estados de reporte
  const [reporteData, setReporteData] = useState<any[]>([])
  const [reporteColumns, setReporteColumns] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 30

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([])

  const [recalculandoFila, setRecalculandoFila] = useState<number | null>(null)
  const [registrosModificados, setRegistrosModificados] = useState<Set<number>>(new Set())
  const [actualizando, setActualizando] = useState(false)
  const [reporteDataOriginal, setReporteDataOriginal] = useState<any[]>([])

  const [showModalConfirmacion, setShowModalConfirmacion] = useState(false)
  const [showModalCargando, setShowModalCargando] = useState(false)

  // -- Funciones --

  useEffect(() => {
    if (!sessionLoading && sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }, [sessionLoading, sessionUser])

  useEffect(() => {
    const cargarZonas = async () => {
      if (filtroClienteId) {
        const result = await listDesplegableZonas(-1, "", Number(filtroClienteId))
        if (result.success && result.data) {
          setZonasOptions(result.data)
        }
      } else {
        setZonasOptions([])
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

  const ejecutarBusqueda = async () => {
    // Modified to include filtroZonaId in the check
    if (!filtroClienteId || !filtroZonaId || !filtroProductoId) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor seleccione un cliente, zona y un producto para buscar.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    setIsSearching(true)

    try {
      const result = await obtenerReporteCosteo(Number(filtroProductoId), Number(filtroClienteId), Number(filtroZonaId))

      if (result.success && result.data) {
        // setReporteData(result.data) // Original line
        const reporteCompleto = result.data
        setReporteData(reporteCompleto)
        setReporteDataOriginal(JSON.parse(JSON.stringify(reporteCompleto)))

        if (result.data.length > 0) {
          const columns = Object.keys(result.data[0])
          setReporteColumns(columns)

          const configs: ColumnConfig[] = columns.map((col, index) => {
            const isSticky = index < 3
            const stickyLeft = index === 0 ? "0px" : index === 1 ? "150px" : index === 2 ? "300px" : undefined

            let headerColor = "bg-blue-600"
            if (index === 0) headerColor = "bg-blue-700" // First column darker
            if (index === 1) headerColor = "bg-blue-700" // Second column darker
            if (index === 2) headerColor = "bg-blue-700" // Third column darker

            return {
              key: col,
              label: col.replace(/_/g, " ").toUpperCase(),
              headerColor: headerColor,
              isSticky: isSticky,
              stickyLeft: stickyLeft,
            }
          })
          setColumnConfigs(configs)
        } else {
          setReporteColumns([])
          setColumnConfigs([])
        }

        setCurrentPage(1)
        setHasSearched(true)
      } else {
        setModalError({
          Titulo: "Error en búsqueda",
          Mensaje: result.error || "No se encontraron datos",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
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

  const handlePrecioSinIvaChange = async (rowIndex: number, nuevoValor: number, row: any) => {
    const actualIndex = indexOfFirstRecord + rowIndex
    setRecalculandoFila(actualIndex)

    console.log("[v0] handlePrecioSinIvaChange called", {
      rowIndex,
      actualIndex,
      nuevoValor,
      folio: row.folio,
      clienteId: filtroClienteId,
      zonaId: filtroZonaId,
      forecast: row.sforecast,
    })

    try {
      const result = await recalcularCotizacionReporte(
        row.folio, // productosid
        Number(filtroClienteId), // clientesid
        Number(filtroZonaId), // zonasid
        nuevoValor, // preciosiniva
        row.sforecast || 0, // forecasts
      )

      console.log("[v0] recalcularCotizacionReporte result", result)

      if (result.success && result.data) {
        const nuevosDatos = Array.isArray(result.data) ? result.data[0] : result.data

        console.log("[v0] Nuevos datos a aplicar", nuevosDatos)

        const registroOriginal = reporteDataOriginal[actualIndex]
        const valorOriginal = registroOriginal?.sprecioventasiniva

        setRegistrosModificados((prev) => {
          const newSet = new Set(prev)
          // Solo agregar si el valor es diferente al original
          if (nuevoValor !== valorOriginal) {
            newSet.add(row.folio)
          } else {
            // Remover si volvió al valor original
            newSet.delete(row.folio)
          }
          return newSet
        })

        // Actualizar el estado con los nuevos valores calculados
        setReporteData((prevData) => {
          const newData = [...prevData]
          newData[actualIndex] = {
            ...newData[actualIndex],
            sprecioventasiniva: nuevoValor,
            sprecioventaconiva: nuevosDatos.sprecioventaconiva,
            splangeneracional: nuevosDatos.splangeneracional,
            splannivel: nuevosDatos.splannivel,
            splaninfinito: nuevosDatos.splaninfinito,
            sivapagado: nuevosDatos.sivapagado,
            scda: nuevosDatos.scda,
            sbonoiniciorapido: nuevosDatos.sbonoiniciorapido,
            sconstructoriniciorapido: nuevosDatos.sconstructoriniciorapido,
            srutaexito: nuevosDatos.srutaexito,
            sreembolsos: nuevosDatos.sreembolsos,
            starjetacredito: nuevosDatos.starjetacredito,
            senvio: nuevosDatos.senvio,
            spreciohl: nuevosDatos.spreciohl,
            sporcentajecosto: nuevosDatos.sporcentajecosto,
            stotalcostos: nuevosDatos.stotalcostos,
            sutilidadmarginal: nuevosDatos.sutilidadmarginal,
            sprecioactualporcentajeutilidad: nuevosDatos.sprecioactualporcentajeutilidad,
            sutilidadoptima: nuevosDatos.sutilidadoptima,
            scomisiones_porcentaje: nuevosDatos.scomisiones_porcentaje * 100,
            scosto_porcentaje: nuevosDatos.scosto_porcentaje * 100,
            scomisionesmascosto: nuevosDatos.scomisionesmascosto,
            spreciosiniva: nuevosDatos.sprecioventasiniva || nuevosDatos.spreciosiniva,
            sprecioconiva: nuevosDatos.sprecioventaconiva || nuevosDatos.sprecioconiva,
            spreciometa: nuevosDatos.spreciometa,
            spreciometaconiva: nuevosDatos.spreciometaconiva,
            sdiferenciautilidadesperada: nuevosDatos.sdiferenciautilidadesperada,
            sutilidadoptima30: nuevosDatos.sutilidadoptima30,
            scomisiones_porcentaje30: nuevosDatos.scomisiones_porcentaje30 * 100,
            scosto_porcentaje30: nuevosDatos.scosto_porcentaje30 * 100,
            scomisionesmascosto30: nuevosDatos.scomisionesmascosto30,
            spreciosiniva30: nuevosDatos.sprecioventasiniva30 || nuevosDatos.spreciosiniva30,
            sprecioconiva30: nuevosDatos.sprecioventaconiva30 || nuevosDatos.sprecioconiva30,
            spreciometa30: nuevosDatos.spreciometa30,
            spreciometaconiva30: nuevosDatos.spreciometaconiva30,
            sdiferenciautilidadesperada30: nuevosDatos.sdiferenciautilidadesperada30,
            scostoanual: nuevosDatos.scostoanual,
            sutilidadanual: nuevosDatos.sutilidadanual,
            scostoutilidadanual: nuevosDatos.scostoutilidadanual * 100,
          }
          console.log("[v0] Datos actualizados en estado:", newData[actualIndex])
          return newData
        })
      } else {
        // alert(`Error al recalcular: ${result.error || "Error desconocido"}`)
        setModalError({
          Titulo: "Error al recalcular",
          Mensaje: result.error || "Error desconocido",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error en handlePrecioSinIvaChange:", error)
      // alert("Error al procesar el cambio de precio")
      setModalError({
        Titulo: "Error al procesar",
        Mensaje: "Ocurrió un error al procesar el cambio de precio.",
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    } finally {
      setRecalculandoFila(null)
    }
  }

  const handleActualizarRegistros = async () => {
    if (registrosModificados.size === 0) {
      // alert("No hay registros modificados para actualizar")
      setModalAlert({
        Titulo: "Sin modificaciones",
        Mensaje: "No hay registros modificados para actualizar.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    // Show confirmation modal instead of window.confirm
    setShowModalConfirmacion(true)
  }

  const ejecutarActualizacion = async () => {
    setShowModalConfirmacion(false)
    setShowModalCargando(true)
    setActualizando(true)

    try {
      // Obtener los datos completos de los registros modificados
      const registrosParaActualizar = reporteData.filter((row) => registrosModificados.has(row.folio))

      console.log("[v0] Registros a actualizar:", registrosParaActualizar)

      const result = await actualizarRegistrosModificados(registrosParaActualizar, Number(filtroClienteId))

      setShowModalCargando(false)

      if (result.success) {
        setSuccessMessage(
          `Actualización exitosa:\n- ProductosXCliente: ${result.actualizados.productosxcliente}`,
        )
        setShowSuccessModal(true)
        // Limpiar los registros modificados
        setRegistrosModificados(new Set())
      } else {
        // alert(`Error en la actualización: ${result.error}`)
        setModalError({
          Titulo: "Error en la actualización",
          Mensaje: result.error,
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error al actualizar registros:", error)
      // alert("Error al actualizar los registros")
      setShowModalCargando(false)
      setModalError({
        Titulo: "Error al actualizar",
        Mensaje: `Ocurrió un error al actualizar los registros: ${error instanceof Error ? error.message : String(error)}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    } finally {
      setActualizando(false)
    }
  }

  const exportarExcel = () => {
    try {
      if (reporteData.length === 0) {
        setModalAlert({
          Titulo: "Sin datos",
          Mensaje: "No hay datos para exportar. Por favor realice una búsqueda primero.",
          isOpen: true,
          onClose: () => setShowModalAlert(false),
        })
        setShowModalAlert(true)
        return
      }

      // Crear workbook
      const wb = XLSX.utils.book_new()

      // Convertir datos a formato de hoja
      const wsData = [
        // Encabezados
        [
          "FOLIO",
          "CÓDIGO",
          "NOMBRE",
          "TIPO COMISION",
          "PRECIO VENTA 2025",
          "PRECIO VENTA SIN IVA",
          "PRECIO VENTA CON IVA",
          "PLAN GENERACIONAL",
          "PLAN NIVEL",
          "PLAN INFINITO",
          "IVA PAGADO",
          "CDA",
          "BONO INICIO RÁPIDO",
          "CONSTRUCTOR INICIO RÁPIDO",
          "RUTA ÉXITO",
          "REEMBOLSOS",
          "TARJETA CRÉDITO",
          "ENVÍO",
          "PRECIO HL",
          "PORCENTAJE COSTO",
          "TOTAL COSTOS",
          "UTILIDAD MARGINAL",
          "PRECIO ACTUAL % UTILIDAD",
          "UTILIDAD ÓPTIMA",
          "COMISIONES %",
          "COSTO %",
          "COMISIONES + COSTO",
          "PRECIO SIN IVA",
          "PRECIO CON IVA",
          "PRECIO META",
          "PRECIO META CON IVA",
          "DIFERENCIA UTILIDAD ESPERADA",
          "UTILIDAD ÓPTIMA 30",
          "COMISIONES % 30",
          "COSTO % 30",
          "COMISIONES + COSTO 30",
          "PRECIO SIN IVA 30",
          "PRECIO CON IVA 30",
          "PRECIO META 30",
          "PRECIO META CON IVA 30",
          "DIFERENCIA UTILIDAD ESPERADA 30",
          "COSTO ANUAL",
          "UTILIDAD ANUAL",
          "COSTO UTILIDAD ANUAL",
          "FORECAST",
        ],
        // Datos
        ...reporteData.map((row) => [
          row.folio || "-",
          row.scodigo || "-",
          row.snombre || "-",
          row.scategoria || "-",
          typeof row.sprecioventaconivaaa === "number"
            ? row.sprecioventaconivaaa.toFixed(2)
            : row.sprecioventaconivaaa || "-",
          typeof row.sprecioventasiniva === "number"
            ? row.sprecioventasiniva.toFixed(2)
            : row.sprecioventasiniva || "-",
          typeof row.sprecioventaconiva === "number"
            ? row.sprecioventaconiva.toFixed(2)
            : row.sprecioventaconiva || "-",
          typeof row.splangeneracional === "number" ? row.splangeneracional.toFixed(2) : row.splangeneracional || "-",
          typeof row.splannivel === "number" ? row.splannivel.toFixed(2) : row.splannivel || "-",
          typeof row.splaninfinito === "number" ? row.splaninfinito.toFixed(2) : row.splaninfinito || "-",
          typeof row.sivapagado === "number" ? row.sivapagado.toFixed(2) : row.sivapagado || "-",
          typeof row.scda === "number" ? row.scda.toFixed(2) : row.scda || "-",
          typeof row.sbonoiniciorapido === "number" ? row.sbonoiniciorapido.toFixed(2) : row.sbonoiniciorapido || "-",
          typeof row.sconstructoriniciorapido === "number"
            ? row.sconstructoriniciorapido.toFixed(2)
            : row.sconstructoriniciorapido || "-",
          typeof row.srutaexito === "number" ? row.srutaexito.toFixed(2) : row.srutaexito || "-",
          typeof row.sreembolsos === "number" ? row.sreembolsos.toFixed(2) : row.sreembolsos || "-",
          typeof row.starjetacredito === "number" ? row.starjetacredito.toFixed(2) : row.starjetacredito || "-",
          typeof row.senvio === "number" ? row.senvio.toFixed(2) : row.senvio || "-",
          typeof row.spreciohl === "number" ? row.spreciohl.toFixed(2) : row.spreciohl || "-",
          typeof row.sporcentajecosto === "number" ? row.sporcentajecosto.toFixed(2) : row.sporcentajecosto || "-",
          typeof row.stotalcostos === "number" ? row.stotalcostos.toFixed(2) : row.stotalcostos || "-",
          typeof row.sutilidadmarginal === "number" ? row.sutilidadmarginal.toFixed(2) : row.sutilidadmarginal || "-",
          typeof row.sprecioactualporcentajeutilidad === "number"
            ? row.sprecioactualporcentajeutilidad.toFixed(2)
            : row.sprecioactualporcentajeutilidad || "-",
          typeof row.sutilidadoptima === "number" ? row.sutilidadoptima.toFixed(2) : row.sutilidadoptima || "-",
          typeof row.scomisiones_porcentaje === "number"
            ? row.scomisiones_porcentaje.toFixed(2)
            : row.scomisiones_porcentaje || "-",
          typeof row.scosto_porcentaje === "number" ? row.scosto_porcentaje.toFixed(2) : row.scosto_porcentaje || "-",
          typeof row.scomisionesmascosto === "number"
            ? row.scomisionesmascosto.toFixed(2)
            : row.scomisionesmascosto || "-",
          typeof row.spreciosiniva === "number" ? row.spreciosiniva.toFixed(2) : row.spreciosiniva || "-",
          typeof row.sprecioconiva === "number" ? row.sprecioconiva.toFixed(2) : row.sprecioconiva || "-",
          typeof row.spreciometa === "number" ? row.spreciometa.toFixed(2) : row.spreciometa || "-",
          typeof row.spreciometaconiva === "number" ? row.spreciometaconiva.toFixed(2) : row.spreciometaconiva || "-",
          typeof row.sdiferenciautilidadesperada === "number"
            ? row.sdiferenciautilidadesperada.toFixed(2)
            : row.sdiferenciautilidadesperada || "-",
          typeof row.sutilidadoptima30 === "number" ? row.sutilidadoptima30.toFixed(2) : row.sutilidadoptima30 || "-",
          typeof row.scomisiones_porcentaje30 === "number"
            ? row.scomisiones_porcentaje30.toFixed(2)
            : row.scomisiones_porcentaje30 || "-",
          typeof row.scosto_porcentaje30 === "number"
            ? row.scosto_porcentaje30.toFixed(2)
            : row.scosto_porcentaje30 || "-",
          typeof row.scomisionesmascosto30 === "number"
            ? row.scomisionesmascosto30.toFixed(2)
            : row.scomisionesmascosto30 || "-",
          typeof row.spreciosiniva30 === "number" ? row.spreciosiniva30.toFixed(2) : row.spreciosiniva30 || "-",
          typeof row.sprecioconiva30 === "number" ? row.sprecioconiva30.toFixed(2) : row.sprecioconiva30 || "-",
          typeof row.spreciometa30 === "number" ? row.spreciometa30.toFixed(2) : row.spreciometa30 || "-",
          typeof row.spreciometaconiva30 === "number"
            ? row.spreciometaconiva30.toFixed(2)
            : row.spreciometaconiva30 || "-",
          typeof row.sdiferenciautilidadesperada30 === "number"
            ? row.sdiferenciautilidadesperada30.toFixed(2)
            : row.sdiferenciautilidadesperada30 || "-",
          typeof row.scostoanual === "number" ? row.scostoanual.toFixed(2) : row.scostoanual || "-",
          typeof row.sutilidadanual === "number" ? row.sutilidadanual.toFixed(2) : row.sutilidadanual || "-",
          typeof row.scostoutilidadanual === "number"
            ? row.scostoutilidadanual.toFixed(2)
            : row.scostoutilidadanual || "-",
          typeof row.sforecast === "number" ? row.sforecast : row.sforecast || "-",
        ]),
      ]

      // Crear hoja
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Agregar hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Costeo")

      // Generate Excel file as array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Create blob and download
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte_costeo_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Mostrar mensaje de éxito
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Error exportando a Excel:", error)
      setModalError({
        Titulo: "Error al exportar",
        Mensaje: `Ocurrió un error al exportar: ${error instanceof Error ? error.message : String(error)}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }

      setPageTituloMasNuevo({
        Titulo: "Reporte de Costeo",
        Subtitulo: "Consulta y exportación de reporte de costeo de productos",
        Visible: false,
        BotonTexto: "",
        Ruta: "",
      })
      setShowPageTituloMasNuevo(true)
      setShowPageLoading(false)
    }
  }, [authLoading, user, router])

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = reporteData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(reporteData.length / recordsPerPage)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-t-lg p-6 flex flex-col items-center">
              <div className="bg-white rounded-full p-3 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white text-center">Actualización Exitosa</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-center whitespace-pre-line mb-6">{successMessage}</p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <SelectItem value="-1">Todos</SelectItem>
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

            <div className="flex gap-2 justify-end">
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

      {hasSearched && reporteData.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, reporteData.length)} de{" "}
              {reporteData.length} registros
              {registrosModificados.size > 0 && (
                <span className="ml-4 text-orange-600 font-semibold">
                  ({registrosModificados.size} modificado{registrosModificados.size !== 1 ? "s" : ""})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {registrosModificados.size > 0 && (
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleActualizarRegistros}
                  disabled={actualizando}
                >
                  {actualizando ? "Actualizando..." : `Actualizar (${registrosModificados.size})`}
                </Button>
              )}
              <Button type="button" className="bg-green-600 text-white hover:bg-green-700" onClick={exportarExcel}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
          </div>

          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardHeader>
              <CardTitle>Reporte de Costeo de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto relative" style={{ maxHeight: "600px", overflow: "auto" }}>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {/* Columna 1 - Folio (Sticky both horizontal and vertical) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "0px", top: "0px", minWidth: "80px", position: "sticky" }}
                      >
                        FOLIO
                      </th>

                      {/* Columna 2 - Código (Sticky both horizontal and vertical) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "80px", top: "0px", minWidth: "120px", position: "sticky" }}
                      >
                        CÓDIGO
                      </th>

                      {/* Columna 3 - Nombre (Sticky both horizontal and vertical) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "200px", top: "0px", minWidth: "250px", position: "sticky" }}
                      >
                        NOMBRE
                      </th>

                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-700 sticky z-10"
                        style={{ top: "0px", minWidth: "70px" }}
                      >
                        TIPO COMISION
                      </th>

                      {/* Columna precio 2025 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-700 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        PRECIO VENTA 2025
                      </th>

                      {/* Columna 4 - Precio Venta Sin IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-700 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        PRECIO ACTUAL SIN IVA
                      </th>

                      {/* Columna 5 - Precio Venta Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-700 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        PRECIO ACTUAL CON IVA
                      </th>

                      {/* Columna 6 - Plan Generacional */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        PLAN GENERACIONAL
                      </th>

                      {/* Columna 7 - Plan Nivel */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        PLAN NIVEL
                      </th>

                      {/* Columna 8 - Plan Infinito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        PLAN INFINITO
                      </th>

                      {/* Columna 9 - IVA Pagado */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        IVA PAGADO
                      </th>

                      {/* Columna 10 - CDA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "100px" }}
                      >
                        CDA
                      </th>

                      {/* Columna 11 - Bono Inicio Rápido */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        BONO INICIO RÁPIDO
                      </th>

                      {/* Columna 12 - Constructor Inicio Rápido */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "180px" }}
                      >
                        CONSTRUCTOR INICIO RÁPIDO
                      </th>

                      {/* Columna 13 - Ruta Éxito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        RUTA ÉXITO
                      </th>

                      {/* Columna 14 - Reembolsos */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        REEMBOLSOS
                      </th>

                      {/* Columna 15 - Tarjeta Crédito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "140px" }}
                      >
                        TARJETA CRÉDITO
                      </th>

                      {/* Columna 16 - Envío */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "100px" }}
                      >
                        ENVÍO
                      </th>

                      {/* Columna 17 - Precio HL */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        COSTO PRODUCTO
                      </th>

                      {/* Columna 18 - Porcentaje Costo */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        % COSTO
                      </th>

                      {/* Columna 19 - Total Costos */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-900 sticky z-10"
                        style={{ top: "0px", minWidth: "130px" }}
                      >
                        TOTAL COSTOS
                      </th>

                      {/* Columna 20 - Utilidad Marginal */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        UTILIDAD MARGINAL
                      </th>

                      {/* Columna 21 - Precio Actual % Utilidad */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "180px" }}
                      >
                        PRECIO ACTUAL % UTILIDAD
                      </th>

                      {/* Columna 22 - Utilidad Óptima */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "140px" }}
                      >
                        UTILIDAD OPTIMA 25
                      </th>

                      {/* Columna 23 - Comisiones % */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "130px" }}
                      >
                        COMISIONES %
                      </th>

                      {/* Columna 24 - Costo % */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "100px" }}
                      >
                        COSTO %
                      </th>

                      {/* Columna 25 - Comisiones + Costo */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "160px" }}
                      >
                        COMISIONES + COSTO
                      </th>

                      {/* Columna 26 - Precio Sin IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "140px" }}
                      >
                        PRECIO SIN IVA
                      </th>

                      {/* Columna 27 - Precio Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                      >
                        PRECIO CON IVA
                      </th>

                      {/* Columna 28 - Precio Meta */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        PRECIO META
                      </th>

                      {/* Columna 29 - Precio Meta Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "170px" }}
                      >
                        PRECIO META CON IVA
                      </th>

                      {/* Columna 30 - Diferencia Utilidad Esperada */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "200px" }}
                      >
                        DIFERENCIA UTILIDAD ESPERADA
                      </th>

                      {/* Columna 31 - Utilidad Óptima 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "160px" }}
                      >
                        UTILIDAD ÓPTIMA 30
                      </th>

                      {/* Columna 32 - Comisiones % 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "150px" }}
                      >
                        COMISIONES % 30
                      </th>

                      {/* Columna 33 - Costo % 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "120px" }}
                      >
                        COSTO % 30
                      </th>

                      {/* Columna 34 - Comisiones + Costo 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600 sticky z-10"
                        style={{ top: "0px", minWidth: "180px" }}
                      >
                        COMISIONES + COSTO 30
                      </th>

                      {/* Columna 35 - Precio Sin IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "160px" }}
                      >
                        PRECIO SIN IVA 30
                      </th>

                      {/* Columna 36 - Precio Con IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "160px" }}
                      >
                        PRECIO CON IVA 30
                      </th>

                      {/* Columna 37 - Precio Meta 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-900 sticky z-10"
                        style={{ top: "0px", minWidth: "140px" }}
                      >
                        PRECIO META 30
                      </th>

                      {/* Columna 38 - Precio Meta Con IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-600 sticky z-10"
                        style={{ top: "0px", minWidth: "190px" }}
                      >
                        PRECIO META CON IVA 30
                      </th>

                      {/* Columna 39 - Diferencia Utilidad Esperada 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-blue-600 sticky z-10"
                        style={{ top: "0px", minWidth: "220px" }}
                      >
                        DIFERENCIA UTILIDAD ESPERADA 30
                      </th>

                      {/* Columna 40 - Costo Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-900 sticky z-10"
                        style={{ top: "0px", minWidth: "130px" }}
                      >
                        COSTO ANUAL
                      </th>

                      {/* Columna 41 - Utilidad Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "140px" }}
                      >
                        UTILIDAD ANUAL
                      </th>

                      {/* Columna 42 - Costo Utilidad Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "180px" }}
                      >
                        COSTO UTILIDAD ANUAL
                      </th>
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600 sticky z-10"
                        style={{ top: "0px", minWidth: "180px" }}
                      >
                        FORECAST
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={rowIndex % 2 === 0 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}
                      >
                        {/* Columna 1 - Folio (Sticky) */}
                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky z-10 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ left: "0px", top: "0px", minWidth: "80px", position: "sticky" }}
                        >
                          {row.folio || "-"}
                        </td>

                        {/* Columna 2 - Código (Sticky) */}
                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky z-10 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ left: "80px", top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {row.scodigo || "-"}
                        </td>

                        {/* Columna 3 - Nombre (Sticky) */}
                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky z-10 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ left: "200px", top: "0px", minWidth: "250px", position: "sticky" }}
                        >
                          {row.snombre || "-"}
                        </td>

                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ top: "0px", minWidth: "70px", position: "sticky" }}
                        >
                          {row.scategoria || "-"}
                        </td>

                        {/* Columna 2025 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.sprecioventaconivaaa === "number"
                            ? `$${row.sprecioventaconivaaa.toFixed(2)}`
                            : row.sprecioventaconivaaa || "-"}
                        </td>

                        {/* Columna 4 - Precio Venta Sin IVA */}
                        <td
                          className="border border-gray-300 p-1 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              className="w-full text-right pr-2 h-8 text-sm"
                              defaultValue={
                                typeof row.sprecioventasiniva === "number" ? row.sprecioventasiniva.toFixed(2) : ""
                              }
                              onBlur={(e) => {
                                const nuevoValor = Number.parseFloat(e.target.value) || 0
                                if (nuevoValor !== row.sprecioventasiniva) {
                                  handlePrecioSinIvaChange(rowIndex, nuevoValor, row)
                                }
                              }}
                              disabled={recalculandoFila === indexOfFirstRecord + rowIndex}
                            />
                            {recalculandoFila === indexOfFirstRecord + rowIndex && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Columna 5 - Precio Venta Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.sprecioventaconiva === "number"
                            ? `$${row.sprecioventaconiva.toFixed(2)}`
                            : row.sprecioventaconiva || "-"}
                        </td>

                        {/* Columna 6 - Plan Generacional */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.splangeneracional === "number"
                            ? `$${row.splangeneracional.toFixed(2)}`
                            : row.splangeneracional || "-"}
                        </td>

                        {/* Columna 7 - Plan Nivel */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.splannivel === "number" ? `$${row.splannivel.toFixed(2)}` : row.splannivel || "-"}
                        </td>

                        {/* Columna 8 - Plan Infinito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.splaninfinito === "number"
                            ? `$${row.splaninfinito.toFixed(2)}`
                            : row.splaninfinito || "-"}
                        </td>

                        {/* Columna 9 - IVA Pagado */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.sivapagado === "number" ? `$${row.sivapagado.toFixed(2)}` : row.sivapagado || "-"}
                        </td>

                        {/* Columna 10 - CDA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "100px", position: "sticky" }}
                        >
                          {typeof row.scda === "number" ? `$${row.scda.toFixed(2)}` : row.scda || "-"}
                        </td>

                        {/* Columna 11 - Bono Inicio Rápido */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.sbonoiniciorapido === "number"
                            ? `$${row.sbonoiniciorapido.toFixed(2)}`
                            : row.sbonoiniciorapido || "-"}
                        </td>

                        {/* Columna 12 - Constructor Inicio Rápido */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "180px", position: "sticky" }}
                        >
                          {typeof row.sconstructoriniciorapido === "number"
                            ? `$${row.sconstructoriniciorapido.toFixed(2)}`
                            : row.sconstructoriniciorapido || "-"}
                        </td>

                        {/* Columna 13 - Ruta Éxito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.srutaexito === "number" ? `$${row.srutaexito.toFixed(2)}` : row.srutaexito || "-"}
                        </td>

                        {/* Columna 14 - Reembolsos */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.sreembolsos === "number"
                            ? `$${row.sreembolsos.toFixed(2)}`
                            : row.sreembolsos || "-"}
                        </td>

                        {/* Columna 15 - Tarjeta Crédito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.starjetacredito === "number"
                            ? `$${row.starjetacredito.toFixed(2)}`
                            : row.starjetacredito || "-"}
                        </td>

                        {/* Columna 16 - Envío */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "100px", position: "sticky" }}
                        >
                          {typeof row.senvio === "number" ? `$${row.senvio.toFixed(2)}` : row.senvio || "-"}
                        </td>

                        {/* Columna 17 - Precio HL */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.spreciohl === "number" ? `$${row.spreciohl.toFixed(2)}` : row.spreciohl || "-"}
                        </td>

                        {/* Columna 18 - Porcentaje Costo */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.sporcentajecosto === "number"
                            ? `${row.sporcentajecosto.toFixed(2)}%`
                            : row.sporcentajecosto || "-"}
                        </td>

                        {/* Columna 19 - Total Costos */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "130px", position: "sticky" }}
                        >
                          {typeof row.stotalcostos === "number"
                            ? `$${row.stotalcostos.toFixed(2)}`
                            : row.stotalcostos || "-"}
                        </td>

                        {/* Columna 20 - Utilidad Marginal */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.sutilidadmarginal === "number"
                            ? `$${row.sutilidadmarginal.toFixed(2)}`
                            : row.sutilidadmarginal || "-"}
                        </td>

                        {/* Columna 21 - Precio Actual % Utilidad */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "180px", position: "sticky" }}
                        >
                          {typeof row.sprecioactualporcentajeutilidad === "number"
                            ? `${row.sprecioactualporcentajeutilidad.toFixed(2) * 100}%`
                            : row.sprecioactualporcentajeutilidad || "-"}
                        </td>

                        {/* Columna 22 - Utilidad Óptima */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right bg-[#56E3A6]/30 sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.sutilidadoptima === "number"
                            ? `${row.sutilidadoptima.toFixed(2)}%`
                            : row.sutilidadoptima || "-"}
                        </td>

                        {/* Columna 23 - Comisiones % */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "130px", position: "sticky" }}
                        >
                          {typeof row.scomisiones_porcentaje === "number"
                            ? `${row.scomisiones_porcentaje.toFixed(2)}%`
                            : row.scomisiones_porcentaje || "-"}
                        </td>

                        {/* Columna 24 - Costo % */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "100px", position: "sticky" }}
                        >
                          {typeof row.scosto_porcentaje === "number"
                            ? `${row.scosto_porcentaje.toFixed(2)}%`
                            : row.scosto_porcentaje || "-"}
                        </td>

                        {/* Columna 25 - Comisiones + Costo */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "160px", position: "sticky" }}
                        >
                          {typeof row.scomisionesmascosto === "number"
                            ? `${row.scomisionesmascosto.toFixed(2)}%`
                            : row.scomisionesmascosto || "-"}
                        </td>

                        {/* Columna 26 - Precio Sin IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.spreciosiniva === "number"
                            ? `$${row.spreciosiniva.toFixed(2)}`
                            : row.spreciosiniva || "-"}
                        </td>

                        {/* Columna 27 - Precio Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.sprecioconiva === "number"
                            ? `$${row.sprecioconiva.toFixed(2)}`
                            : row.sprecioconiva || "-"}
                        </td>

                        {/* Columna 28 - Precio Meta */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.spreciometa === "number"
                            ? `$${row.spreciometa.toFixed(2)}`
                            : row.spreciometa || "-"}
                        </td>

                        {/* Columna 29 - Precio Meta Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "170px", position: "sticky" }}
                        >
                          {typeof row.spreciometaconiva === "number"
                            ? `$${row.spreciometaconiva.toFixed(2)}`
                            : row.spreciometaconiva || "-"}
                        </td>

                        {/* Columna 30 - Diferencia Utilidad Esperada */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "200px", position: "sticky" }}
                        >
                          {typeof row.sdiferenciautilidadesperada === "number"
                            ? `$${row.sdiferenciautilidadesperada.toFixed(2)}`
                            : row.sdiferenciautilidadesperada || "-"}
                        </td>

                        {/* Columna 31 - Utilidad Óptima 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right bg-[#56E3A6]/30 sticky"
                          style={{ top: "0px", minWidth: "160px", position: "sticky" }}
                        >
                          {typeof row.sutilidadoptima30 === "number"
                            ? `${row.sutilidadoptima30.toFixed(2)}%`
                            : row.sutilidadoptima30 || "-"}
                        </td>

                        {/* Columna 32 - Comisiones % 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "150px", position: "sticky" }}
                        >
                          {typeof row.scomisiones_porcentaje30 === "number"
                            ? `${row.scomisiones_porcentaje30.toFixed(2)}%`
                            : row.scomisiones_porcentaje30 || "-"}
                        </td>

                        {/* Columna 33 - Costo % 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "120px", position: "sticky" }}
                        >
                          {typeof row.scosto_porcentaje30 === "number"
                            ? `${row.scosto_porcentaje30.toFixed(2)}%`
                            : row.scosto_porcentaje30 || "-"}
                        </td>

                        {/* Columna 34 - Comisiones + Costo 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "180px", position: "sticky" }}
                        >
                          {typeof row.scomisionesmascosto30 === "number"
                            ? `${row.scomisionesmascosto30.toFixed(2)}%`
                            : row.scomisionesmascosto30 || "-"}
                        </td>

                        {/* Columna 35 - Precio Sin IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "160px", position: "sticky" }}
                        >
                          {typeof row.spreciosiniva30 === "number"
                            ? `$${row.spreciosiniva30.toFixed(2)}`
                            : row.spreciosiniva30 || "-"}
                        </td>

                        {/* Columna 36 - Precio Con IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "160px", position: "sticky" }}
                        >
                          {typeof row.sprecioconiva30 === "number"
                            ? `$${row.sprecioconiva30.toFixed(2)}`
                            : row.sprecioconiva30 || "-"}
                        </td>

                        {/* Columna 37 - Precio Meta 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.spreciometa30 === "number"
                            ? `$${row.spreciometa30.toFixed(2)}`
                            : row.spreciometa30 || "-"}
                        </td>

                        {/* Columna 38 - Precio Meta Con IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "190px", position: "sticky" }}
                        >
                          {typeof row.spreciometaconiva30 === "number"
                            ? `$${row.spreciometaconiva30.toFixed(2)}`
                            : row.spreciometaconiva30 || "-"}
                        </td>

                        {/* Columna 39 - Diferencia Utilidad Esperada 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "220px", position: "sticky" }}
                        >
                          {typeof row.sdiferenciautilidadesperada30 === "number"
                            ? `$${row.sdiferenciautilidadesperada30.toFixed(2)}`
                            : row.sdiferenciautilidadesperada30 || "-"}
                        </td>

                        {/* Columna 40 - Costo Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "130px", position: "sticky" }}
                        >
                          {typeof row.scostoanual === "number"
                            ? `$${row.scostoanual.toFixed(2)}`
                            : row.scostoanual || "-"}
                        </td>

                        {/* Columna 41 - Utilidad Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "140px", position: "sticky" }}
                        >
                          {typeof row.sutilidadanual === "number"
                            ? `$${row.sutilidadanual.toFixed(2)}`
                            : row.sutilidadanual || "-"}
                        </td>

                        {/* Columna 42 - Costo Utilidad Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "180px", position: "sticky" }}
                        >
                          {typeof row.scostoutilidadanual === "number"
                            ? `${row.scostoutilidadanual.toFixed(2)}%`
                            : row.scostoutilidadanual || "-"}
                        </td>

                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right sticky"
                          style={{ top: "0px", minWidth: "180px", position: "sticky" }}
                        >
                          {typeof row.sforecast === "number" ? `${row.sforecast}` : row.sforecast || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="text-sm text-gray-600 font-medium">
                  Página {currentPage} de {totalPages}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 bg-transparent"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {hasSearched && reporteData.length === 0 && (
        <Card className="rounded-xs border bg-card text-card-foreground shadow">
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No se encontraron datos para los filtros seleccionados.</p>
          </CardContent>
        </Card>
      )}

      {showModalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Confirmar Actualización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                ¿Está seguro de actualizar {registrosModificados.size} registro(s) modificado(s)?
              </p>
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Advertencia: La actualización de costos afectará al costeo del producto.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModalConfirmacion(false)}>
                  Cancelar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={ejecutarActualizacion}>
                  Aceptar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showModalCargando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium">Actualizando registros...</p>
              <p className="text-sm text-gray-500 mt-2">Por favor espere</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
