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
import { actualizarProducto, recalcularProducto } from "@/app/actions/productos"
import type { ddlItem } from "@/types/common.types"
import type { oProducto } from "@/types/common.types"

export default function ReporteProductosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { session, isLoading: sessionLoading } = useUserSession()

  // Estados principales
  const [reporteData, setReporteData] = useState<any[]>([])
  const [reporteDataOriginal, setReporteDataOriginal] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [productosModificados, setProductosModificados] = useState<Set<number>>(new Set())

  // Estados para modales de actualización
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultadoActualizacion, setResultadoActualizacion] = useState<{
    exitosos: number
    fallidos: number
    error?: string
  } | null>(null)

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

  const columns = [
    { header: "ID", field: "sid", width: "40px" },
    { header: "Código", field: "scodigo" },
    { header: "Producto", field: "sproducto" },
    { header: "Presentacion", field: "spresentacion", width: "190px" },
    { header: "Nombre", field: "snombreproducto" },
    { header: "Cliente", field: "scliente" },
    { header: "Zona", field: "szona" },
    { header: "Forma Farmacéutica", field: "sformafarmaceutica" },
    { header: "Porción", field: "sporcion" },
    { header: "Objetivo", field: "sobjetivo" },
    { header: "Unidad de Medida", field: "sunidadmedida" },
    { header: "Categoría", field: "scategoria" },
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
    { header: "Costo Total", field: "scostototal" },
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
    setLoading(true)

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
        setReporteDataOriginal(JSON.parse(JSON.stringify(result.data)))
        setCurrentPage(1) // Reset pagination when new data is loaded
      } else {
        alert("Error al obtener el reporte")
        setReporteData([])
      }
    } catch (error) {
      console.error("Error en búsqueda:", error)
      alert("Error al ejecutar la búsqueda")
      setReporteData([])
    } finally {
      setLoading(false)
    }
  }

  // Paginación
  const itemsPerPage = 30
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(reporteData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = reporteData.slice(startIndex, endIndex)

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

    import("xlsx").then((XLSX) => {
      // Crear los datos para el worksheet
      const wsData = [
        // Headers
        columns.map((column) => column.header),
        // Data rows
        ...reporteData.map((row) => columns.map((column) => row[column.field] ?? "")),
      ]

      // Crear worksheet y workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Productos")

      // Generar archivo XLSX como buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Crear blob y descargar
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte_productos_${new Date().getTime()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
  }

  // Actualizar productos en la base de datos
  const handleActualizarProductos = async () => {
    if (productosModificados.size === 0) {
      alert("No hay productos modificados para actualizar")
      return
    }

    setShowConfirmModal(true)
  }

  const ejecutarActualizacion = async () => {
    setShowConfirmModal(false)
    setShowLoadingModal(true)
    setActualizando(true)

    try {
      const productosParaActualizar = reporteData.filter((row) => productosModificados.has(row.sid))

      console.log("[v0] Productos a actualizar:", productosParaActualizar)

      let exitosos = 0
      let fallidos = 0

      for (const producto of productosParaActualizar) {
        try {
          // Crear FormData con los datos del producto
          const formData = new FormData()
          formData.append("productoid", String(producto.sid))
          formData.append("nombre", producto.snombreproducto || "")
          formData.append("codigo", producto.scodigo || "")
          formData.append("producto", producto.sproducto || "")
          formData.append("mp_porcentaje", String(producto.smp_porcentaje || 0))
          formData.append("mem_porcentaje", String(producto.smem_porcentaje || 0))
          formData.append("me_porcentaje", String(producto.sme_porcentaje || 0))
          formData.append("ms_porcentaje", String(producto.sms_porcentaje || 0))

          // Ejecutar actualizarProducto
          const resultadoActualizar = await actualizarProducto(formData)

          if (!resultadoActualizar.success) {
            console.error(`Error actualizando producto ${producto.sid}:`, resultadoActualizar.error)
            fallidos++
            continue
          }

          // Ejecutar recalcularProducto
          const resultadoRecalcular = await recalcularProducto(producto.sid)

          if (!resultadoRecalcular.success) {
            console.error(`Error recalculando producto ${producto.sid}:`, resultadoRecalcular.error)
            fallidos++
            continue
          }

          exitosos++
        } catch (error) {
          console.error(`Error procesando producto ${producto.sid}:`, error)
          fallidos++
        }
      }

      setResultadoActualizacion({ exitosos, fallidos })
      setShowLoadingModal(false)
      setShowResultModal(true)

      // Limpiar productos modificados si hubo éxitos
      if (exitosos > 0) {
        setProductosModificados(new Set())
        // Recargar el reporte
        ejecutarBusqueda()
      }
    } catch (error) {
      console.error("Error al actualizar productos:", error)
      setResultadoActualizacion({ exitosos: 0, fallidos: productosModificados.size, error: String(error) })
      setShowLoadingModal(false)
      setShowResultModal(true)
    } finally {
      setActualizando(false)
    }
  }

  const handlePorcentajeChange = (rowIndex: number, field: string, newValue: string) => {
    const value = Number.parseFloat(newValue) || 0

    setReporteData((prevData) => {
      const newData = [...prevData]
      const row = { ...newData[rowIndex] }

      // Actualizar el porcentaje modificado
      row[field] = value

      // Obtener valores actuales
      const mp = Number.parseFloat(row.smp) || 0
      const mem = Number.parseFloat(row.smem) || 0
      const me = Number.parseFloat(row.sme) || 0
      const ms = Number.parseFloat(row.sms) || 0

      const mp_porcentaje = (Number.parseFloat(row.smp_porcentaje) || 0) / 100
      const mem_porcentaje = (Number.parseFloat(row.smem_porcentaje) || 0) / 100
      const me_porcentaje = (Number.parseFloat(row.sme_porcentaje) || 0) / 100
      const ms_porcentaje = (Number.parseFloat(row.sms_porcentaje) || 0) / 100

      row.smp_costeado = mp_porcentaje !== 0 ? Number.parseFloat((mp / mp_porcentaje).toFixed(6)) : 0
      row.smem_costeado = mem_porcentaje !== 0 ? Number.parseFloat((mem / mem_porcentaje).toFixed(6)) : 0
      row.sme_costeado = me_porcentaje !== 0 ? Number.parseFloat((me / me_porcentaje).toFixed(6)) : 0
      row.sms_costeado = ms_porcentaje !== 0 ? Number.parseFloat((ms / ms_porcentaje).toFixed(6)) : 0

      const costoTotal = row.smp_costeado + row.smem_costeado + row.sme_costeado + row.sms_costeado
      row.scostototal = Number.parseFloat(costoTotal.toFixed(6))

      row.spreciohl = Number.parseFloat((costoTotal < 50 ? 50 : costoTotal).toFixed(6))

      newData[rowIndex] = row

      const originalRow = reporteDataOriginal[rowIndex]
      const hasChanged =
        Number.parseFloat(row.smp_porcentaje).toFixed(2) !== Number.parseFloat(originalRow.smp_porcentaje).toFixed(2) ||
        Number.parseFloat(row.smem_porcentaje).toFixed(2) !==
          Number.parseFloat(originalRow.smem_porcentaje).toFixed(2) ||
        Number.parseFloat(row.sme_porcentaje).toFixed(2) !== Number.parseFloat(originalRow.sme_porcentaje).toFixed(2) ||
        Number.parseFloat(row.sms_porcentaje).toFixed(2) !== Number.parseFloat(originalRow.sms_porcentaje).toFixed(2)

      setProductosModificados((prev) => {
        const newSet = new Set(prev)
        if (hasChanged) {
          newSet.add(row.sid)
        } else {
          newSet.delete(row.sid)
        }
        return newSet
      })

      return newData
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-orange-600">⚠️ Confirmar Actualización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                ¿Está seguro de actualizar <strong>{productosModificados.size}</strong> producto(s) modificado(s)?
              </p>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                <p className="text-sm text-orange-800 font-semibold">
                  ⚠️ ADVERTENCIA: La actualización de costos afectará también a aquellos productos que ya han sido
                  costeados.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                  Cancelar
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={ejecutarActualizacion}>
                  Aceptar y Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showLoadingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500" />
              </div>
              <h3 className="text-xl font-semibold">Actualizando productos...</h3>
              <p className="text-gray-600">Por favor espere mientras se procesan los cambios</p>
            </CardContent>
          </Card>
        </div>
      )}

      {showResultModal && resultadoActualizacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle
                className={`text-xl font-bold ${resultadoActualizacion.exitosos > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {resultadoActualizacion.exitosos > 0 ? "✓ Actualización Completada" : "✗ Error en Actualización"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultadoActualizacion.error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="text-sm text-red-800">{resultadoActualizacion.error}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>Productos actualizados exitosamente:</span>
                    <strong className="text-green-600">{resultadoActualizacion.exitosos}</strong>
                  </p>
                  {resultadoActualizacion.fallidos > 0 && (
                    <p className="flex justify-between">
                      <span>Productos con error:</span>
                      <strong className="text-red-600">{resultadoActualizacion.fallidos}</strong>
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setShowResultModal(false)
                    setResultadoActualizacion(null)
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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

      {reporteData.length > 0 && (
        <Card className="rounded-lg border-2 border-green-100 bg-gradient-to-br from-white to-green-50/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Resultados del Reporte
                {productosModificados.size > 0 && (
                  <span className="ml-4 text-yellow-300 font-semibold">
                    ({productosModificados.size} modificado{productosModificados.size !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                {productosModificados.size > 0 && (
                  <Button
                    onClick={handleActualizarProductos}
                    variant="secondary"
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    disabled={actualizando}
                  >
                    {actualizando ? "Actualizando..." : `Actualizar (${productosModificados.size})`}
                  </Button>
                )}
                <Button onClick={exportarExcel} variant="secondary" size="sm" className="bg-white text-green-700">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto" style={{ maxHeight: "600px", overflow: "auto" }}>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gradient-to-r from-gray-600 to-gray-700 text-white sticky top-0 z-20">
                  <tr>
                    {columns.map((column, index) => {
                      // Definir cuáles columnas son sticky y su posición left
                      const stickyColumns = [
                        { index: 0, left: "0px", width: "40px" }, // ID
                        { index: 1, left: "80px", width: "120px" }, // Código
                        { index: 2, left: "200px", width: "150px" }, // Producto
                        { index: 3, left: "350px", width: "190px" }, // Presentacion
                      ]
                      const stickyConfig = stickyColumns.find((s) => s.index === index)

                      return (
                        <th
                          key={index}
                          className={`border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide ${
                            stickyConfig ? "z-30" : ""
                          }`}
                          style={
                            stickyConfig
                              ? {
                                  position: "sticky",
                                  left: stickyConfig.left,
                                  minWidth: stickyConfig.width,
                                  maxWidth: stickyConfig.width,
                                  backgroundColor: "bg-gradient-to-r from-gray-600 to-gray-700",
                                  boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.3)",
                                }
                              : {}
                          }
                        >
                          {column.header}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-green-50 transition-colors">
                      {columns.map((column, cellIndex) => {
                        // Definir cuáles columnas son sticky y su posición left
                        const stickyColumns = [
                          { index: 0, left: "0px", width: "80px" }, // ID
                          { index: 1, left: "80px", width: "120px" }, // Código
                          { index: 2, left: "200px", width: "150px" }, // Producto
                          { index: 3, left: "350px", width: "150px" }, // Presentacion
                        ]
                        const stickyConfig = stickyColumns.find((s) => s.index === cellIndex)

                        const isEditable = [
                          "smp_porcentaje",
                          "smem_porcentaje",
                          "sme_porcentaje",
                          "sms_porcentaje",
                        ].includes(column.field)

                        return (
                          <td
                            key={cellIndex}
                            className={`border border-gray-300 p-3 text-sm text-gray-700 whitespace-nowrap ${
                              stickyConfig ? "bg-white z-10" : ""
                            }`}
                            style={
                              stickyConfig
                                ? {
                                    position: "sticky",
                                    left: stickyConfig.left,
                                    minWidth: stickyConfig.width,
                                    maxWidth: stickyConfig.width,
                                    boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.1)",
                                  }
                                : isEditable
                                  ? { minWidth: "120px" }
                                  : {}
                            }
                          >
                            {isEditable ? (
                              <input
                                type="number"
                                step="0.01"
                                value={row[column.field] || ""}
                                onBlur={(e) =>
                                  handlePorcentajeChange(
                                    (currentPage - 1) * itemsPerPage + rowIndex,
                                    column.field,
                                    e.target.value,
                                  )
                                }
                                onChange={(e) => {
                                  // Update display value immediately
                                  const newData = [...reporteData]
                                  newData[(currentPage - 1) * itemsPerPage + rowIndex][column.field] = e.target.value
                                  setReporteData(newData)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : row[column.field] !== null && row[column.field] !== undefined ? (
                              [
                                "smp_costeado",
                                "smem_costeado",
                                "sme_costeado",
                                "sms_costeado",
                                "scostototal",
                                "spreciohl",
                              ].includes(column.field) ? (
                                Number.parseFloat(row[column.field]).toFixed(6)
                              ) : (
                                String(row[column.field])
                              )
                            ) : (
                              "-"
                            )}
                          </td>
                        )
                      })}
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

      {reporteData.length === 0 && (
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
