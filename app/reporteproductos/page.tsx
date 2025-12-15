"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useUserSession } from "@/hooks/use-user-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, FileDown, ChevronLeft, ChevronRight } from "lucide-react"
import { PageModalAlert, type propsPageModalAlert } from "@/components/page-modal-alert"
import { PageModalError, type propsPageModalError } from "@/components/page-modal-error"
import { PageTitlePlusNew, type propsPageTitlePlusNew } from "@/components/page-title-plus-new"
import type { propsPageLoadingScreen } from "@/components/page-loading-screen"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { listaDesplegableProductosXClientes } from "@/app/actions/productos"
import {
  listaDesplegableProductosTiposComisiones,
  listaDesplegableEnvase,
  listaDesplegableFormasFarmaceuticas,
  listaDesplegableSistemas,
} from "@/app/actions/catalogos"
import { obtenerReporteCatalogoProductos } from "@/app/actions/reporteproductos"
import type { ddlItem } from "@/types/common.types"
import type { oProducto } from "@/types/common.types"

export default function ReporteProductosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { user: sessionUser, loading: sessionLoading } = useUserSession()

  // --- Estados ---
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("-1")
  const [filtroZonaId, setFiltroZonaId] = useState("-1")
  const [filtroProductoId, setFiltroProductoId] = useState("-1")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("-1")
  const [filtroFormaFarmaceutica, setFiltroFormaFarmaceutica] = useState<string>("-1")
  const [filtroObjetivo, setFiltroObjetivo] = useState<string>("-1")
  const [filtroTipoEnvase, setFiltroTipoEnvase] = useState<string>("-1")

  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])
  const [productosCliente, setProductosCliente] = useState<oProducto[]>([])
  const [categoriasOptions, setCateriasOptions] = useState<ddlItem[]>([])
  const [formasFarmaceuticasOptions, setFormasFarmaceuticasOptions] = useState<ddlItem[]>([])
  const [objetivosOptions, setObjetivosOptions] = useState<ddlItem[]>([])
  const [envasesOptions, setEnvasesOptions] = useState<ddlItem[]>([])

  // Estados de reporte
  const [reporteData, setReporteData] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 30

  // Variables para mostrar modales
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)

  const columns = [
    { header: "ID", field: "sid" },
    { header: "Código", field: "scodigo" },
    { header: "Producto", field: "sproducto" },
    { header: "Nombre", field: "snombreproducto" },
    { header: "Cliente", field: "scliente" },
    { header: "Zona", field: "szona" },
    { header: "Unidad de Medida", field: "sunidadmedida" },
    { header: "Categoría", field: "scategoria" },
    { header: "Objetivo", field: "sobjetivo" },
    { header: "Forma Farmacéutica", field: "sformafarmaceutica" },
    { header: "Porción", field: "sporcion" },
    { header: "Código Maestro", field: "scodigomaestro" },
    { header: "Envase", field: "senvase" },
    { header: "Envase ML", field: "senvaseml" },
    { header: "Costo", field: "scosto" },
    { header: "MP", field: "smp" },
    { header: "MEM", field: "smem" },
    { header: "ME", field: "sme" },
    { header: "MS", field: "sms" },
    { header: "MP %", field: "smp_porcentaje" },
    { header: "MEM %", field: "smem_porcentaje" },
    { header: "ME %", field: "sme_porcentaje" },
    { header: "MS %", field: "sms_porcentaje" },
    { header: "MP Costeado", field: "smp_costeado" },
    { header: "MEM Costeado", field: "smem_costeado" },
    { header: "ME Costeado", field: "sme_costeado" },
    { header: "MS Costeado", field: "sms_costeado" },
    { header: "Precio HL", field: "spreciohl" },
  ]

  // Cargar opciones iniciales
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        // Cargar clientes
        const resultClientes = await listaDesplegableClientes()
        console.log("[v0] Resultado clientes raw:", resultClientes)
        if (resultClientes.success && resultClientes.data) {
          const clientesMapeados = resultClientes.data.map((cliente: any) => ({
            value: cliente.id.toString(),
            text: cliente.nombre,
          }))
          console.log("[v0] Clientes mapeados:", clientesMapeados)
          setClientesOptions([{ value: "-1", text: "Todos" }, ...clientesMapeados])
        }

        // Cargar categorías
        const resultCategorias = await listaDesplegableProductosTiposComisiones()
        if (resultCategorias.success && resultCategorias.data) {
          setCateriasOptions([{ value: "-1", text: "Todos" }, ...resultCategorias.data])
        }

        // Cargar formas farmacéuticas
        const resultFormas = await listaDesplegableFormasFarmaceuticas()
        if (resultFormas.success && resultFormas.data) {
          setFormasFarmaceuticasOptions([{ value: "-1", text: "Todos" }, ...resultFormas.data])
        }

        // Cargar objetivos (sistemas)
        const resultObjetivos = await listaDesplegableSistemas()
        if (resultObjetivos.success && resultObjetivos.data) {
          setObjetivosOptions([{ value: "-1", text: "Todos" }, ...resultObjetivos.data])
        }

        // Cargar envases
        const resultEnvases = await listaDesplegableEnvase()
        if (resultEnvases.success && resultEnvases.data) {
          setEnvasesOptions([{ value: "-1", text: "Todos" }, ...resultEnvases.data])
        }
      } catch (error) {
        console.error("Error cargando opciones:", error)
      }
    }

    cargarOpciones()
  }, [])

  // Cargar zonas cuando cambia el cliente
  useEffect(() => {
    const cargarZonas = async () => {
      if (!filtroClienteId || filtroClienteId === "-1") {
        setZonasOptions([{ value: "-1", text: "Todos" }])
        setFiltroZonaId("-1")
        return
      }

      console.log("[v0] Calling listDesplegableZonas with clienteId:", filtroClienteId)
      const result = await listDesplegableZonas(-1, "", Number.parseInt(filtroClienteId))
      console.log("[v0] listDesplegableZonas result:", result)
      console.log("[v0] listDesplegableZonas result.data:", result.data)
      console.log("[v0] listDesplegableZonas result.data type:", typeof result.data, Array.isArray(result.data))

      if (result.success && result.data) {
        const zonasConTodos = [{ value: "-1", text: "Todos" }, ...result.data]
        console.log("[v0] Zonas with Todos:", zonasConTodos)
        setZonasOptions(zonasConTodos)
      } else {
        console.log("[v0] No se pudieron cargar las zonas, usando solo 'Todos'")
        setZonasOptions([{ value: "-1", text: "Todos" }])
      }
    }

    cargarZonas()
  }, [filtroClienteId])

  // Cargar productos cuando cambia cliente y zona
  useEffect(() => {
    const cargarProductos = async () => {
      if (!filtroClienteId || filtroClienteId === "-1" || !filtroZonaId || filtroZonaId === "-1") {
        setProductosCliente([])
        setFiltroProductoId("-1")
        return
      }

      const result = await listaDesplegableProductosXClientes(
        Number.parseInt(filtroClienteId),
        Number.parseInt(filtroZonaId),
      )
      if (result.success && result.data) {
        setProductosCliente(result.data)
      }
    }

    cargarProductos()
  }, [filtroClienteId, filtroZonaId])

  // Ejecutar búsqueda
  const ejecutarBusqueda = async () => {
    setIsSearching(true)
    setHasSearched(false)

    console.log("prod", Number.parseInt(filtroProductoId))
    console.log("clie", Number.parseInt(filtroClienteId))
    console.log("zon", Number.parseInt(filtroZonaId))
    console.log("cate", filtroCategoria)
    console.log("FF", Number.parseInt(filtroFormaFarmaceutica))
    console.log("obje", Number.parseInt(filtroObjetivo))
    console.log("enva", filtroTipoEnvase)

    try {
      const result = await obtenerReporteCatalogoProductos(
        filtroProductoId === "-1" ? -1 : Number.parseInt(filtroProductoId),
        filtroClienteId === "-1" ? -1 : Number.parseInt(filtroClienteId),
        filtroZonaId === "-1" ? -1 : Number.parseInt(filtroZonaId),
        filtroCategoria === "-1" ? "" : filtroCategoria,
        filtroFormaFarmaceutica === "-1" ? -1 : Number.parseInt(filtroFormaFarmaceutica),
        filtroObjetivo === "-1" ? -1 : Number.parseInt(filtroObjetivo),
        filtroTipoEnvase === "-1" ? "" : filtroTipoEnvase,
      )

      if (result.success && result.data) {
        setReporteData(result.data)
        setCurrentPage(1)
      } else {
        setModalError({
          Titulo: "Error",
          Mensaje: result.error || "Error al obtener el reporte",
        })
        setShowModalError(true)
        setReporteData([])
      }
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setModalError({
        Titulo: "Error",
        Mensaje: "Error al ejecutar la búsqueda",
      })
      setShowModalError(true)
      setReporteData([])
    } finally {
      setIsSearching(false)
      setHasSearched(true)
    }
  }

  // Paginación
  const totalPages = Math.ceil(reporteData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentData = reporteData.slice(startIndex, endIndex)

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

  // Exportar a Excel
  const exportarExcel = () => {
    if (reporteData.length === 0) return

    const headers = columns.map((column) => column.header).join(",")
    const csvContent = [
      headers,
      ...reporteData.map((row) => columns.map((column) => row[column.field] || "").join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_productos_${new Date().getTime()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Productos</h1>
        <p className="text-gray-600 mt-2">Consulta detallada del catálogo de productos</p>
      </div>

      <Card className="rounded-lg border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cliente */}
            <div>
              <label htmlFor="ddlCliente" className="text-sm font-medium text-gray-700 mb-1 block">
                Cliente
              </label>
              <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                <SelectTrigger id="ddlCliente" className="bg-white">
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

            {/* Zona */}
            <div>
              <label htmlFor="ddlZona" className="text-sm font-medium text-gray-700 mb-1 block">
                Zona
              </label>
              <Select value={filtroZonaId} onValueChange={setFiltroZonaId}>
                <SelectTrigger id="ddlZona" className="bg-white">
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

            {/* Producto */}
            <div className="md:col-span-2">
              <label htmlFor="ddlProducto" className="text-sm font-medium text-gray-700 mb-1 block">
                Producto
              </label>
              <Select value={filtroProductoId} onValueChange={setFiltroProductoId}>
                <SelectTrigger id="ddlProducto" className="bg-white">
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
                            {producto.codigo} - {producto.nombre}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="advanced-filters" className="border-t border-gray-200">
              <AccordionTrigger className="text-sm font-medium text-blue-700 hover:text-blue-800 py-3">
                Filtros Avanzados
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Categoría */}
                  <div>
                    <label htmlFor="ddlCategoria" className="text-sm font-medium text-gray-700 mb-1 block">
                      Categoría
                    </label>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger id="ddlCategoria" className="bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Forma Farmacéutica */}
                  <div>
                    <label htmlFor="ddlFormaFarmaceutica" className="text-sm font-medium text-gray-700 mb-1 block">
                      Forma Farmacéutica
                    </label>
                    <Select value={filtroFormaFarmaceutica} onValueChange={setFiltroFormaFarmaceutica}>
                      <SelectTrigger id="ddlFormaFarmaceutica" className="bg-white">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasFarmaceuticasOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Objetivos */}
                  <div>
                    <label htmlFor="ddlObjetivo" className="text-sm font-medium text-gray-700 mb-1 block">
                      Objetivo
                    </label>
                    <Select value={filtroObjetivo} onValueChange={setFiltroObjetivo}>
                      <SelectTrigger id="ddlObjetivo" className="bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        {objetivosOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo Envase */}
                  <div>
                    <label htmlFor="ddlTipoEnvase" className="text-sm font-medium text-gray-700 mb-1 block">
                      Tipo Envase
                    </label>
                    <Select value={filtroTipoEnvase} onValueChange={setFiltroTipoEnvase}>
                      <SelectTrigger id="ddlTipoEnvase" className="bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        {envasesOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Botón de buscar */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={ejecutarBusqueda}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && reporteData.length > 0 && (
        <Card className="rounded-lg border-2 border-green-100 bg-gradient-to-br from-white to-green-50/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Resultados del Reporte
              </span>
              <Button onClick={exportarExcel} variant="secondary" size="sm" className="bg-white text-green-700">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto" style={{ maxHeight: "600px", overflow: "auto" }}>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                      {columns.map((column, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-300 p-3 text-sm text-gray-700 whitespace-nowrap"
                        >
                          {row[column.field] !== null && row[column.field] !== undefined
                            ? String(row[column.field])
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 p-4 border-t bg-gray-50">
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
      )}

      {hasSearched && reporteData.length === 0 && (
        <Card className="rounded-lg border-2 border-gray-200 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-lg text-gray-600 font-medium">No se encontraron resultados</p>
            <p className="text-sm text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
