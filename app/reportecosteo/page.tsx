"use client"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import * as XLSX from "xlsx"
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

// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { useUserSession } from "@/hooks/use-user-session"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listaDesplegableProductosXClientes } from "@/app/actions/productos"
import { obtenerReporteCosteo } from "@/app/actions/reportecosteo"
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
  const [filtroProductoId, setFiltroProductoId] = useState("-1")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [productosCliente, setProductosCliente] = useState<oProducto[]>([])

  // Estados de reporte
  const [reporteData, setReporteData] = useState<any[]>([])
  const [reporteColumns, setReporteColumns] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 30

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([])

  // -- Funciones --

  useEffect(() => {
    if (!sessionLoading && sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }, [sessionLoading, sessionUser])

  useEffect(() => {
    const cargarProductosCliente = async () => {
      if (filtroClienteId) {
        const result = await listaDesplegableProductosXClientes(Number(filtroClienteId))
        if (result.success && result.data) {
          setProductosCliente(result.data)
        }
      } else {
        setProductosCliente([])
      }
    }
    cargarProductosCliente()
  }, [filtroClienteId])

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
      const result = await obtenerReporteCosteo(Number(filtroProductoId), Number(filtroClienteId))

      if (result.success && result.data) {
        setReporteData(result.data)

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

  const exportarExcel = () => {
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

    try {
      // Crear datos formateados para Excel con los mismos títulos y orden de la tabla
      const excelData = reporteData.map((row) => ({
        FOLIO: row.folio || "-",
        CÓDIGO: row.scodigo || "-",
        NOMBRE: row.snombre || "-",
        "PRECIO VENTA SIN IVA":
          typeof row.sprecioventasiniva === "number"
            ? row.sprecioventasiniva.toFixed(2)
            : row.sprecioventasiniva || "-",
        "PRECIO VENTA CON IVA":
          typeof row.sprecioventaconiva === "number"
            ? row.sprecioventaconiva.toFixed(2)
            : row.sprecioventaconiva || "-",
        "PLAN GENERACIONAL":
          typeof row.splangeneracional === "number" ? row.splangeneracional.toFixed(2) : row.splangeneracional || "-",
        "PLAN NIVEL": typeof row.splannivel === "number" ? row.splannivel.toFixed(2) : row.splannivel || "-",
        "PLAN INFINITO":
          typeof row.splaninfinito === "number" ? row.splaninfinito.toFixed(2) : row.splaninfinito || "-",
        "IVA PAGADO": typeof row.sivapagado === "number" ? row.sivapagado.toFixed(2) : row.sivapagado || "-",
        CDA: typeof row.scda === "number" ? row.scda.toFixed(2) : row.scda || "-",
        "BONO INICIO RÁPIDO":
          typeof row.sbonoiniciorapido === "number" ? row.sbonoiniciorapido.toFixed(2) : row.sbonoiniciorapido || "-",
        "CONSTRUCTOR INICIO RÁPIDO":
          typeof row.sconstructoriniciorapido === "number"
            ? row.sconstructoriniciorapido.toFixed(2)
            : row.sconstructoriniciorapido || "-",
        "RUTA ÉXITO": typeof row.srutaexito === "number" ? row.srutaexito.toFixed(2) : row.srutaexito || "-",
        REEMBOLSOS: typeof row.sreembolsos === "number" ? row.sreembolsos.toFixed(2) : row.sreembolsos || "-",
        "TARJETA CRÉDITO":
          typeof row.starjetacredito === "number" ? row.starjetacredito.toFixed(2) : row.starjetacredito || "-",
        ENVÍO: typeof row.senvio === "number" ? row.senvio.toFixed(2) : row.senvio || "-",
        "PRECIO HL": typeof row.spreciohl === "number" ? row.spreciohl.toFixed(2) : row.spreciohl || "-",
        "PORCENTAJE COSTO":
          typeof row.sporcentajecosto === "number" ? row.sporcentajecosto.toFixed(2) : row.sporcentajecosto || "-",
        "TOTAL COSTOS": typeof row.stotalcostos === "number" ? row.stotalcostos.toFixed(2) : row.stotalcostos || "-",
        "UTILIDAD MARGINAL":
          typeof row.sutilidadmarginal === "number" ? row.sutilidadmarginal.toFixed(2) : row.sutilidadmarginal || "-",
        "PRECIO ACTUAL % UTILIDAD":
          typeof row.sprecioactualporcentajeutilidad === "number"
            ? row.sprecioactualporcentajeutilidad.toFixed(2)
            : row.sprecioactualporcentajeutilidad || "-",
        "UTILIDAD ÓPTIMA":
          typeof row.sutilidadoptima === "number" ? row.sutilidadoptima.toFixed(2) : row.sutilidadoptima || "-",
        "COMISIONES %":
          typeof row.scomisiones_porcentaje === "number"
            ? row.scomisiones_porcentaje.toFixed(2)
            : row.scomisiones_porcentaje || "-",
        "COSTO %":
          typeof row.scosto_porcentaje === "number" ? row.scosto_porcentaje.toFixed(2) : row.scosto_porcentaje || "-",
        "COMISIONES + COSTO":
          typeof row.scomisionesmascosto === "number"
            ? row.scomisionesmascosto.toFixed(2)
            : row.scomisionesmascosto || "-",
        "PRECIO SIN IVA":
          typeof row.spreciosiniva === "number" ? row.spreciosiniva.toFixed(2) : row.spreciosiniva || "-",
        "PRECIO CON IVA":
          typeof row.sprecioconiva === "number" ? row.sprecioconiva.toFixed(2) : row.sprecioconiva || "-",
        "PRECIO META": typeof row.spreciometa === "number" ? row.spreciometa.toFixed(2) : row.spreciometa || "-",
        "PRECIO META CON IVA":
          typeof row.spreciometaconiva === "number" ? row.spreciometaconiva.toFixed(2) : row.spreciometaconiva || "-",
        "DIFERENCIA UTILIDAD ESPERADA":
          typeof row.sdiferenciautilidadesperada === "number"
            ? row.sdiferenciautilidadesperada.toFixed(2)
            : row.sdiferenciautilidadesperada || "-",
        "UTILIDAD ÓPTIMA 30":
          typeof row.sutilidadoptima30 === "number" ? row.sutilidadoptima30.toFixed(2) : row.sutilidadoptima30 || "-",
        "COMISIONES % 30":
          typeof row.scomisiones_porcentaje30 === "number"
            ? row.scomisiones_porcentaje30.toFixed(2)
            : row.scomisiones_porcentaje30 || "-",
        "COSTO % 30":
          typeof row.scosto_porcentaje30 === "number"
            ? row.scosto_porcentaje30.toFixed(2)
            : row.scosto_porcentaje30 || "-",
        "COMISIONES + COSTO 30":
          typeof row.scomisionesmascosto30 === "number"
            ? row.scomisionesmascosto30.toFixed(2)
            : row.scomisionesmascosto30 || "-",
        "PRECIO SIN IVA 30":
          typeof row.spreciosiniva30 === "number" ? row.spreciosiniva30.toFixed(2) : row.spreciosiniva30 || "-",
        "PRECIO CON IVA 30":
          typeof row.sprecioconiva30 === "number" ? row.sprecioconiva30.toFixed(2) : row.sprecioconiva30 || "-",
        "PRECIO META 30":
          typeof row.spreciometa30 === "number" ? row.spreciometa30.toFixed(2) : row.spreciometa30 || "-",
        "PRECIO META CON IVA 30":
          typeof row.spreciometaconiva30 === "number"
            ? row.spreciometaconiva30.toFixed(2)
            : row.spreciometaconiva30 || "-",
        "DIFERENCIA UTILIDAD ESPERADA 30":
          typeof row.sdiferenciautilidadesperada30 === "number"
            ? row.sdiferenciautilidadesperada30.toFixed(2)
            : row.sdiferenciautilidadesperada30 || "-",
        "COSTO ANUAL": typeof row.scostoanual === "number" ? row.scostoanual.toFixed(2) : row.scostoanual || "-",
        "UTILIDAD ANUAL":
          typeof row.sutilidadanual === "number" ? row.sutilidadanual.toFixed(2) : row.sutilidadanual || "-",
        "COSTO UTILIDAD ANUAL":
          typeof row.scostoutilidadanual === "number"
            ? row.scostoutilidadanual.toFixed(2)
            : row.scostoutilidadanual || "-",
        FORECAST: typeof row.sforecast === "number" ? row.sforecast : row.sforecast || "-",
      }))

      // Crear worksheet desde los datos formateados
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Crear workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Costeo")

      // Generar archivo con timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `reporte_costeo_${timestamp}.xlsx`

      // Escribir archivo (método compatible con navegador)
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error("Error exportando a Excel:", error)
      setModalError({
        Titulo: "Error al exportar",
        Mensaje: `Ocurrió un error al exportar: ${error}`,
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
            </div>
            <Button type="button" className="bg-green-600 text-white hover:bg-green-700" onClick={exportarExcel}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>

          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardHeader>
              <CardTitle>Reporte de Costeo de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto relative" style={{ maxHeight: "600px" }}>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {/* Columna 1 - Folio (Sticky) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "0px", minWidth: "80px", position: "sticky" }}
                      >
                        FOLIO
                      </th>

                      {/* Columna 2 - Código (Sticky) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "80px", minWidth: "120px", position: "sticky" }}
                      >
                        CÓDIGO
                      </th>

                      {/* Columna 3 - Nombre (Sticky) */}
                      <th
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-white bg-blue-700 sticky z-20"
                        style={{ left: "200px", minWidth: "250px", position: "sticky" }}
                      >
                        NOMBRE
                      </th>

                      {/* Columna 4 - Precio Venta Sin IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600"
                        style={{ minWidth: "150px" }}
                      >
                        PRECIO VENTA SIN IVA
                      </th>

                      {/* Columna 5 - Precio Venta Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-green-600"
                        style={{ minWidth: "150px" }}
                      >
                        PRECIO VENTA CON IVA
                      </th>

                      {/* Columna 6 - Plan Generacional */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-purple-600"
                        style={{ minWidth: "150px" }}
                      >
                        PLAN GENERACIONAL
                      </th>

                      {/* Columna 7 - Plan Nivel */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-purple-600"
                        style={{ minWidth: "120px" }}
                      >
                        PLAN NIVEL
                      </th>

                      {/* Columna 8 - Plan Infinito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-purple-600"
                        style={{ minWidth: "120px" }}
                      >
                        PLAN INFINITO
                      </th>

                      {/* Columna 9 - IVA Pagado */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-orange-600"
                        style={{ minWidth: "120px" }}
                      >
                        IVA PAGADO
                      </th>

                      {/* Columna 10 - CDA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-orange-600"
                        style={{ minWidth: "100px" }}
                      >
                        CDA
                      </th>

                      {/* Columna 11 - Bono Inicio Rápido */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-orange-600"
                        style={{ minWidth: "150px" }}
                      >
                        BONO INICIO RÁPIDO
                      </th>

                      {/* Columna 12 - Constructor Inicio Rápido */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-orange-600"
                        style={{ minWidth: "180px" }}
                      >
                        CONSTRUCTOR INICIO RÁPIDO
                      </th>

                      {/* Columna 13 - Ruta Éxito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-orange-600"
                        style={{ minWidth: "120px" }}
                      >
                        RUTA ÉXITO
                      </th>

                      {/* Columna 14 - Reembolsos */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600"
                        style={{ minWidth: "120px" }}
                      >
                        REEMBOLSOS
                      </th>

                      {/* Columna 15 - Tarjeta Crédito */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600"
                        style={{ minWidth: "140px" }}
                      >
                        TARJETA CRÉDITO
                      </th>

                      {/* Columna 16 - Envío */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-red-600"
                        style={{ minWidth: "100px" }}
                      >
                        ENVÍO
                      </th>

                      {/* Columna 17 - Precio HL */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-indigo-600"
                        style={{ minWidth: "120px" }}
                      >
                        PRECIO HL
                      </th>

                      {/* Columna 18 - Porcentaje Costo */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-indigo-600"
                        style={{ minWidth: "150px" }}
                      >
                        PORCENTAJE COSTO
                      </th>

                      {/* Columna 19 - Total Costos */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-indigo-600"
                        style={{ minWidth: "130px" }}
                      >
                        TOTAL COSTOS
                      </th>

                      {/* Columna 20 - Utilidad Marginal */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-teal-600"
                        style={{ minWidth: "150px" }}
                      >
                        UTILIDAD MARGINAL
                      </th>

                      {/* Columna 21 - Precio Actual % Utilidad */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-teal-600"
                        style={{ minWidth: "180px" }}
                      >
                        PRECIO ACTUAL % UTILIDAD
                      </th>

                      {/* Columna 22 - Utilidad Óptima */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-teal-600"
                        style={{ minWidth: "140px" }}
                      >
                        UTILIDAD ÓPTIMA
                      </th>

                      {/* Columna 23 - Comisiones % */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-pink-600"
                        style={{ minWidth: "130px" }}
                      >
                        COMISIONES %
                      </th>

                      {/* Columna 24 - Costo % */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-pink-600"
                        style={{ minWidth: "100px" }}
                      >
                        COSTO %
                      </th>

                      {/* Columna 25 - Comisiones + Costo */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-pink-600"
                        style={{ minWidth: "160px" }}
                      >
                        COMISIONES + COSTO
                      </th>

                      {/* Columna 26 - Precio Sin IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-cyan-600"
                        style={{ minWidth: "140px" }}
                      >
                        PRECIO SIN IVA
                      </th>

                      {/* Columna 27 - Precio Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-cyan-600"
                        style={{ minWidth: "140px" }}
                      >
                        PRECIO CON IVA
                      </th>

                      {/* Columna 28 - Precio Meta */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-cyan-600"
                        style={{ minWidth: "120px" }}
                      >
                        PRECIO META
                      </th>

                      {/* Columna 29 - Precio Meta Con IVA */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-cyan-600"
                        style={{ minWidth: "170px" }}
                      >
                        PRECIO META CON IVA
                      </th>

                      {/* Columna 30 - Diferencia Utilidad Esperada */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-cyan-600"
                        style={{ minWidth: "200px" }}
                      >
                        DIFERENCIA UTILIDAD ESPERADA
                      </th>

                      {/* Columna 31 - Utilidad Óptima 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-amber-600"
                        style={{ minWidth: "160px" }}
                      >
                        UTILIDAD ÓPTIMA 30
                      </th>

                      {/* Columna 32 - Comisiones % 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-amber-600"
                        style={{ minWidth: "150px" }}
                      >
                        COMISIONES % 30
                      </th>

                      {/* Columna 33 - Costo % 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-amber-600"
                        style={{ minWidth: "120px" }}
                      >
                        COSTO % 30
                      </th>

                      {/* Columna 34 - Comisiones + Costo 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-amber-600"
                        style={{ minWidth: "180px" }}
                      >
                        COMISIONES + COSTO 30
                      </th>

                      {/* Columna 35 - Precio Sin IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-lime-600"
                        style={{ minWidth: "160px" }}
                      >
                        PRECIO SIN IVA 30
                      </th>

                      {/* Columna 36 - Precio Con IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-lime-600"
                        style={{ minWidth: "160px" }}
                      >
                        PRECIO CON IVA 30
                      </th>

                      {/* Columna 37 - Precio Meta 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-lime-600"
                        style={{ minWidth: "140px" }}
                      >
                        PRECIO META 30
                      </th>

                      {/* Columna 38 - Precio Meta Con IVA 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-lime-600"
                        style={{ minWidth: "190px" }}
                      >
                        PRECIO META CON IVA 30
                      </th>

                      {/* Columna 39 - Diferencia Utilidad Esperada 30 */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-lime-600"
                        style={{ minWidth: "220px" }}
                      >
                        DIFERENCIA UTILIDAD ESPERADA 30
                      </th>

                      {/* Columna 40 - Costo Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-slate-600"
                        style={{ minWidth: "130px" }}
                      >
                        COSTO ANUAL
                      </th>

                      {/* Columna 41 - Utilidad Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-slate-600"
                        style={{ minWidth: "140px" }}
                      >
                        UTILIDAD ANUAL
                      </th>

                      {/* Columna 42 - Costo Utilidad Anual */}
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-slate-600"
                        style={{ minWidth: "180px" }}
                      >
                        COSTO UTILIDAD ANUAL
                      </th>
                      <th
                        className="border border-gray-300 p-3 text-right text-sm font-semibold text-white bg-slate-600"
                        style={{ minWidth: "180px" }}
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
                          style={{ left: "0px", minWidth: "80px", position: "sticky" }}
                        >
                          {row.folio || "-"}
                        </td>

                        {/* Columna 2 - Código (Sticky) */}
                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky z-10 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ left: "80px", minWidth: "120px", position: "sticky" }}
                        >
                          {row.scodigo || "-"}
                        </td>

                        {/* Columna 3 - Nombre (Sticky) */}
                        <td
                          className={`border border-gray-300 p-3 text-sm text-gray-700 sticky z-10 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          style={{ left: "200px", minWidth: "250px", position: "sticky" }}
                        >
                          {row.snombre || "-"}
                        </td>

                        {/* Columna 4 - Precio Venta Sin IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.sprecioventasiniva === "number"
                            ? `$${row.sprecioventasiniva.toFixed(2)}`
                            : row.sprecioventasiniva || "-"}
                        </td>

                        {/* Columna 5 - Precio Venta Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.sprecioventaconiva === "number"
                            ? `$${row.sprecioventaconiva.toFixed(2)}`
                            : row.sprecioventaconiva || "-"}
                        </td>

                        {/* Columna 6 - Plan Generacional */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.splangeneracional === "number"
                            ? `$${row.splangeneracional.toFixed(2)}`
                            : row.splangeneracional || "-"}
                        </td>

                        {/* Columna 7 - Plan Nivel */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.splannivel === "number" ? `$${row.splannivel.toFixed(2)}` : row.splannivel || "-"}
                        </td>

                        {/* Columna 8 - Plan Infinito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.splaninfinito === "number"
                            ? `$${row.splaninfinito.toFixed(2)}`
                            : row.splaninfinito || "-"}
                        </td>

                        {/* Columna 9 - IVA Pagado */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.sivapagado === "number" ? `$${row.sivapagado.toFixed(2)}` : row.sivapagado || "-"}
                        </td>

                        {/* Columna 10 - CDA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "100px" }}
                        >
                          {typeof row.scda === "number" ? `$${row.scda.toFixed(2)}` : row.scda || "-"}
                        </td>

                        {/* Columna 11 - Bono Inicio Rápido */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.sbonoiniciorapido === "number"
                            ? `$${row.sbonoiniciorapido.toFixed(2)}`
                            : row.sbonoiniciorapido || "-"}
                        </td>

                        {/* Columna 12 - Constructor Inicio Rápido */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "180px" }}
                        >
                          {typeof row.sconstructoriniciorapido === "number"
                            ? `$${row.sconstructoriniciorapido.toFixed(2)}`
                            : row.sconstructoriniciorapido || "-"}
                        </td>

                        {/* Columna 13 - Ruta Éxito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.srutaexito === "number" ? `$${row.srutaexito.toFixed(2)}` : row.srutaexito || "-"}
                        </td>

                        {/* Columna 14 - Reembolsos */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.sreembolsos === "number"
                            ? `$${row.sreembolsos.toFixed(2)}`
                            : row.sreembolsos || "-"}
                        </td>

                        {/* Columna 15 - Tarjeta Crédito */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.starjetacredito === "number"
                            ? `$${row.starjetacredito.toFixed(2)}`
                            : row.starjetacredito || "-"}
                        </td>

                        {/* Columna 16 - Envío */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "100px" }}
                        >
                          {typeof row.senvio === "number" ? `$${row.senvio.toFixed(2)}` : row.senvio || "-"}
                        </td>

                        {/* Columna 17 - Precio HL */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.spreciohl === "number" ? `$${row.spreciohl.toFixed(2)}` : row.spreciohl || "-"}
                        </td>

                        {/* Columna 18 - Porcentaje Costo */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.sporcentajecosto === "number"
                            ? `${row.sporcentajecosto.toFixed(2)}%`
                            : row.sporcentajecosto || "-"}
                        </td>

                        {/* Columna 19 - Total Costos */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "130px" }}
                        >
                          {typeof row.stotalcostos === "number"
                            ? `$${row.stotalcostos.toFixed(2)}`
                            : row.stotalcostos || "-"}
                        </td>

                        {/* Columna 20 - Utilidad Marginal */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.sutilidadmarginal === "number"
                            ? `$${row.sutilidadmarginal.toFixed(2)}`
                            : row.sutilidadmarginal || "-"}
                        </td>

                        {/* Columna 21 - Precio Actual % Utilidad */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "180px" }}
                        >
                          {typeof row.sprecioactualporcentajeutilidad === "number"
                            ? `${row.sprecioactualporcentajeutilidad.toFixed(2)}%`
                            : row.sprecioactualporcentajeutilidad || "-"}
                        </td>

                        {/* Columna 22 - Utilidad Óptima */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.sutilidadoptima === "number"
                            ? `${row.sutilidadoptima.toFixed(2)}%`
                            : row.sutilidadoptima || "-"}
                        </td>

                        {/* Columna 23 - Comisiones % */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "130px" }}
                        >
                          {typeof row.scomisiones_porcentaje === "number"
                            ? `${row.scomisiones_porcentaje.toFixed(2)}%`
                            : row.scomisiones_porcentaje || "-"}
                        </td>

                        {/* Columna 24 - Costo % */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "100px" }}
                        >
                          {typeof row.scosto_porcentaje === "number"
                            ? `${row.scosto_porcentaje.toFixed(2)}%`
                            : row.scosto_porcentaje || "-"}
                        </td>

                        {/* Columna 25 - Comisiones + Costo */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "160px" }}
                        >
                          {typeof row.scomisionesmascosto === "number"
                            ? `${row.scomisionesmascosto.toFixed(2)}%`
                            : row.scomisionesmascosto || "-"}
                        </td>

                        {/* Columna 26 - Precio Sin IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.spreciosiniva === "number"
                            ? `$${row.spreciosiniva.toFixed(2)}`
                            : row.spreciosiniva || "-"}
                        </td>

                        {/* Columna 27 - Precio Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.sprecioconiva === "number"
                            ? `$${row.sprecioconiva.toFixed(2)}`
                            : row.sprecioconiva || "-"}
                        </td>

                        {/* Columna 28 - Precio Meta */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.spreciometa === "number"
                            ? `$${row.spreciometa.toFixed(2)}`
                            : row.spreciometa || "-"}
                        </td>

                        {/* Columna 29 - Precio Meta Con IVA */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "170px" }}
                        >
                          {typeof row.spreciometaconiva === "number"
                            ? `$${row.spreciometaconiva.toFixed(2)}`
                            : row.spreciometaconiva || "-"}
                        </td>

                        {/* Columna 30 - Diferencia Utilidad Esperada */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "200px" }}
                        >
                          {typeof row.sdiferenciautilidadesperada === "number"
                            ? `$${row.sdiferenciautilidadesperada.toFixed(2)}`
                            : row.sdiferenciautilidadesperada || "-"}
                        </td>

                        {/* Columna 31 - Utilidad Óptima 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "160px" }}
                        >
                          {typeof row.sutilidadoptima30 === "number"
                            ? `${row.sutilidadoptima30.toFixed(2)}%`
                            : row.sutilidadoptima30 || "-"}
                        </td>

                        {/* Columna 32 - Comisiones % 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "150px" }}
                        >
                          {typeof row.scomisiones_porcentaje30 === "number"
                            ? `${row.scomisiones_porcentaje30.toFixed(2)}%`
                            : row.scomisiones_porcentaje30 || "-"}
                        </td>

                        {/* Columna 33 - Costo % 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "120px" }}
                        >
                          {typeof row.scosto_porcentaje30 === "number"
                            ? `${row.scosto_porcentaje30.toFixed(2)}%`
                            : row.scosto_porcentaje30 || "-"}
                        </td>

                        {/* Columna 34 - Comisiones + Costo 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "180px" }}
                        >
                          {typeof row.scomisionesmascosto30 === "number"
                            ? `${row.scomisionesmascosto30.toFixed(2)}%`
                            : row.scomisionesmascosto30 || "-"}
                        </td>

                        {/* Columna 35 - Precio Sin IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "160px" }}
                        >
                          {typeof row.spreciosiniva30 === "number"
                            ? `$${row.spreciosiniva30.toFixed(2)}`
                            : row.spreciosiniva30 || "-"}
                        </td>

                        {/* Columna 36 - Precio Con IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "160px" }}
                        >
                          {typeof row.sprecioconiva30 === "number"
                            ? `$${row.sprecioconiva30.toFixed(2)}`
                            : row.sprecioconiva30 || "-"}
                        </td>

                        {/* Columna 37 - Precio Meta 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.spreciometa30 === "number"
                            ? `$${row.spreciometa30.toFixed(2)}`
                            : row.spreciometa30 || "-"}
                        </td>

                        {/* Columna 38 - Precio Meta Con IVA 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "190px" }}
                        >
                          {typeof row.spreciometaconiva30 === "number"
                            ? `$${row.spreciometaconiva30.toFixed(2)}`
                            : row.spreciometaconiva30 || "-"}
                        </td>

                        {/* Columna 39 - Diferencia Utilidad Esperada 30 */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "220px" }}
                        >
                          {typeof row.sdiferenciautilidadesperada30 === "number"
                            ? `$${row.sdiferenciautilidadesperada30.toFixed(2)}`
                            : row.sdiferenciautilidadesperada30 || "-"}
                        </td>

                        {/* Columna 40 - Costo Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "130px" }}
                        >
                          {typeof row.scostoanual === "number"
                            ? `$${row.scostoanual.toFixed(2)}`
                            : row.scostoanual || "-"}
                        </td>

                        {/* Columna 41 - Utilidad Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "140px" }}
                        >
                          {typeof row.sutilidadanual === "number"
                            ? `$${row.sutilidadanual.toFixed(2)}`
                            : row.sutilidadanual || "-"}
                        </td>

                        {/* Columna 42 - Costo Utilidad Anual */}
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "180px" }}
                        >
                          {typeof row.scostoutilidadanual === "number"
                            ? `$${row.scostoutilidadanual.toFixed(2)}`
                            : row.scostoutilidadanual || "-"}
                        </td>

                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 text-right"
                          style={{ minWidth: "180px" }}
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
    </div>
  )
}
