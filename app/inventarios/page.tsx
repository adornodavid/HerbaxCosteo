"use client"

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
import { Loader2 } from "lucide-react"
import { PageModalSuccess } from "@/components/page-modal-success"

// Componentes
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"

// Backend
import { useAuth } from "@/contexts/auth-context"
import { useUserSession } from "@/hooks/use-user-session"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { obtenerInventario } from "@/app/actions/inventarios"
import { actualizarInventarios } from "@/app/actions/inventarios"

export default function InventarioPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { user: sessionUser, loading: sessionLoading } = useUserSession()

  // Estados
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [showModalError, setShowModalError] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = useState<propsPageTitlePlusNew>({
    Titulo: "",
    Subtitulo: "",
    Visible: false,
    BotonTexto: "",
    Ruta: "",
  })
  const [ModalSuccess, setModalSuccess] = useState<any>()
  const [showModalSuccess, setShowModalSuccess] = useState(false)

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroZonaId, setFiltroZonaId] = useState("")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])

  // Estados de inventario
  const [inventarioData, setInventarioData] = useState<any[]>([])
  const [inventarioOriginal, setInventarioOriginal] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estados para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingModifiedRecords, setPendingModifiedRecords] = useState<any[]>([])

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 30

  // Cargar cliente de sesión
  useEffect(() => {
    if (!sessionLoading && sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }, [sessionLoading, sessionUser])

  // Cargar zonas cuando cambia el cliente
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

  // Cargar clientes al inicio
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

  // Cargar página inicial
  useEffect(() => {
    const init = async () => {
      setPageLoading({
        Activo: false,
        Titulo: "",
        Mensaje: "",
      })
      setShowPageLoading(false)

      setPageTituloMasNuevo({
        Titulo: "Inventario",
        Subtitulo: "Consulta el inventario de productos",
        Visible: true,
        BotonTexto: "",
        Ruta: "",
      })
      setShowPageTituloMasNuevo(true)
    }
    init()
  }, [])

  // Ejecutar búsqueda
  const ejecutarBusqueda = async () => {
    if (!filtroClienteId || !filtroZonaId) {
      setModalAlert({
        Titulo: "Campos requeridos",
        Mensaje: "Por favor seleccione un cliente y una zona para buscar.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    setIsSearching(true)

    try {
      const result = await obtenerInventario(Number(filtroClienteId), Number(filtroZonaId))

      if (result.success && result.data) {
        setInventarioData(result.data)
        setInventarioOriginal(JSON.parse(JSON.stringify(result.data)))
        setCurrentPage(1)
        setHasSearched(true)

        if (result.data.length === 0) {
          setModalAlert({
            Titulo: "Sin resultados",
            Mensaje: "No se encontraron datos de inventario con los filtros seleccionados.",
            isOpen: true,
            onClose: () => setShowModalAlert(false),
          })
          setShowModalAlert(true)
        }
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

  // Exportar a Excel
  const exportarExcel = () => {
    try {
      if (inventarioData.length === 0) {
        setModalAlert({
          Titulo: "Sin datos",
          Mensaje: "No hay datos para exportar. Por favor realice una búsqueda primero.",
          isOpen: true,
          onClose: () => setShowModalAlert(false),
        })
        setShowModalAlert(true)
        return
      }

      const wb = XLSX.utils.book_new()

      const wsData = [
        [
          "ID",
          "CÓDIGO",
          "PRODUCTO",
          "PRESENTACIÓN",
          "NOMBRE",
          "CLIENTE",
          "ZONA",
          "TOTAL",
          "INVENTARIO",
          "APROBADO",
          "PROCESO",
          "CUARENTENA",
          "PICKING",
          "EN PROGRAMA",
          "VENTA DE HOY",
          "VENTA MENSUAL",
          "PORCENTAJE MES",
          "LOTE PROCESO",
          "LOTE CUARENTENA",
          "LOTE PROGRAMA",
          "OBSERVACIONES",
        ],
        ...inventarioData.map((row) => [
          row.id || "-",
          row.codigo || "-",
          row.producto || "-",
          row.presentacion || "-",
          row.nombre || "-",
          row.cliente || "-",
          row.zona || "-",
          row.total || 0,
          row.inventario || 0,
          row.aprobado || 0,
          row.proceso || 0,
          row.cuarentaa || 0,
          row.picking || 0,
          row.enprograma || 0,
          row.ventadehoy || 0,
          row.ventamensual || 0,
          typeof row.porcentajemes === "number" ? row.porcentajemes.toFixed(2) : row.porcentajemes || "-",
          row.loteproceso || "-",
          row.lotecuarentaa || "-",
          row.loteprograma || "-",
          row.observaciones || "-",
        ]),
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "Inventario")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Create blob and download
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Inventario_${new Date().toISOString().split("T")[0]}.xlsx`
      link.click()
      URL.revokeObjectURL(url)

      setModalAlert({
        Titulo: "Exportación exitosa",
        Mensaje: "El archivo Excel se ha descargado correctamente.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
    } catch (error) {
      console.error("Error al exportar:", error)
      setModalError({
        Titulo: "Error al exportar",
        Mensaje: "Ocurrió un error al generar el archivo Excel.",
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    }
  }

  // Handle input changes in editable fields
  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const globalIndex = indexOfFirstRecord + rowIndex
    const updatedData = [...inventarioData]

    // Convert to number for numeric fields, keep as string for text fields
    let finalValue: any
    if (field === "loteproceso" || field === "loteprograma" || field === "lotecuarentaa" || field === "observaciones") {
      finalValue = value
    } else {
      finalValue = value === "" ? 0 : Number.parseFloat(value) || 0
    }

    updatedData[globalIndex] = {
      ...updatedData[globalIndex],
      [field]: finalValue,
    }

    const row = updatedData[globalIndex]
    const aprobado = Number(row.aprobado) || 0
    const picking = Number(row.picking) || 0
    const proceso = Number(row.proceso) || 0
    const enprograma = Number(row.enprograma) || 0
    const cuarentaa = Number(row.cuarentaa) || 0

    updatedData[globalIndex].total = aprobado + picking + proceso + enprograma + cuarentaa

    const total = updatedData[globalIndex].total
    const ventadehoy = Number(row.ventadehoy) || 0
    updatedData[globalIndex].inventario = total - ventadehoy

    const inventario = updatedData[globalIndex].inventario
    const ventamensual = Number(row.ventamensual) || 0
    updatedData[globalIndex].porcentajemes = ventamensual !== 0 ? inventario / ventamensual : 0

    setInventarioData(updatedData)
  }

  // Detect modified records
  const getModifiedRecords = () => {
    const modified: any[] = []

    // Helper function to normalize values for comparison
    const normalize = (val: any) => {
      if (val === null || val === undefined || val === "") return null
      if (typeof val === "string" && val.trim() === "") return null
      return val
    }

    inventarioData.forEach((current, index) => {
      const original = inventarioOriginal[index]
      if (!original) return

      // Check if any editable field has changed using normalized values
      const hasChanges =
        normalize(current.aprobado) !== normalize(original.aprobado) ||
        normalize(current.picking) !== normalize(original.picking) ||
        normalize(current.proceso) !== normalize(original.proceso) ||
        normalize(current.loteproceso) !== normalize(original.loteproceso) ||
        normalize(current.enprograma) !== normalize(original.enprograma) ||
        normalize(current.loteprograma) !== normalize(original.loteprograma) ||
        normalize(current.cuarentaa) !== normalize(original.cuarentaa) ||
        normalize(current.lotecuarentaa) !== normalize(original.lotecuarentaa) ||
        normalize(current.ventadehoy) !== normalize(original.ventadehoy) ||
        normalize(current.ventamensual) !== normalize(original.ventamensual) ||
        normalize(current.observaciones) !== normalize(original.observaciones)

      if (hasChanges) {
        modified.push(current)
      }
    })

    return modified
  }

  // Save modified records
  const guardarReporte = async () => {
    const modifiedRecords = getModifiedRecords()

    if (modifiedRecords.length === 0) {
      setModalAlert({
        Titulo: "Sin cambios",
        Mensaje: "No hay cambios para guardar.",
        isOpen: true,
        onClose: () => setShowModalAlert(false),
      })
      setShowModalAlert(true)
      return
    }

    // Show confirmation modal
    setPendingModifiedRecords(modifiedRecords)
    setShowConfirmModal(true)
  }

  const confirmarGuardado = async () => {
    setShowConfirmModal(false)
    setIsSaving(true)

    try {
      const result = await actualizarInventarios(pendingModifiedRecords)

      if (result.success) {
        // Update original data with current data
        setInventarioOriginal(JSON.parse(JSON.stringify(inventarioData)))

        setModalSuccess({
          Titulo: "Guardado exitoso",
          Mensaje: `Se actualizaron ${pendingModifiedRecords.length} registro(s) correctamente.`,
          isOpen: true,
          onClose: () => setShowModalSuccess(false),
        })
        setShowModalSuccess(true)
      } else {
        setModalError({
          Titulo: "Error al guardar",
          Mensaje: result.error || "No se pudieron actualizar los registros",
          isOpen: true,
          onClose: () => setShowModalError(false),
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error al guardar:", error)
      setModalError({
        Titulo: "Error al guardar",
        Mensaje: `Ocurrió un error: ${error}`,
        isOpen: true,
        onClose: () => setShowModalError(false),
      })
      setShowModalError(true)
    } finally {
      setIsSaving(false)
      setPendingModifiedRecords([])
    }
  }

  // Paginación
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = inventarioData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(inventarioData.length / recordsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const modifiedCount = inventarioData.filter((item) => {
    const original = inventarioOriginal.find((orig) => orig.id === item.id)
    if (!original) return false

    // Helper function to normalize values for comparison
    const normalize = (val: any) => {
      if (val === null || val === undefined || val === "") return null
      if (typeof val === "string" && val.trim() === "") return null
      return val
    }

    return (
      normalize(item.aprobado) !== normalize(original.aprobado) ||
      normalize(item.picking) !== normalize(original.picking) ||
      normalize(item.proceso) !== normalize(original.proceso) ||
      normalize(item.loteproceso) !== normalize(original.loteproceso) ||
      normalize(item.enprograma) !== normalize(original.enprograma) ||
      normalize(item.loteprograma) !== normalize(original.loteprograma) ||
      normalize(item.cuarentaa) !== normalize(original.cuarentaa) ||
      normalize(item.lotecuarentaa) !== normalize(original.lotecuarentaa) ||
      normalize(item.total) !== normalize(original.total) ||
      normalize(item.ventadehoy) !== normalize(original.ventadehoy) ||
      normalize(item.inventario) !== normalize(original.inventario) ||
      normalize(item.ventamensual) !== normalize(original.ventamensual) ||
      normalize(item.porcentajemes) !== normalize(original.porcentajemes) ||
      normalize(item.observaciones) !== normalize(original.observaciones)
    )
  }).length

  if (showPageLoading) {
    return (
      <PageLoadingScreen
        Activo={pageLoading?.Activo || true}
        Titulo={pageLoading?.Titulo || ""}
        Mensaje={pageLoading?.Mensaje || ""}
      />
    )
  }

  return (
    <div className="w-full mx-auto p-6">
      {showPageTituloMasNuevo && PageTituloMasNuevo.Visible && (
        <PageTitlePlusNew
          Titulo={PageTituloMasNuevo.Titulo}
          Subtitulo={PageTituloMasNuevo.Subtitulo}
          Visible={PageTituloMasNuevo.Visible}
          BotonTexto={PageTituloMasNuevo.BotonTexto}
          Ruta={PageTituloMasNuevo.Ruta}
        />
      )}

      {showModalAlert && ModalAlert && (
        <PageModalAlert
          isOpen={ModalAlert.isOpen}
          onClose={ModalAlert.onClose}
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
        />
      )}

      {showModalSuccess && ModalSuccess && (
        <PageModalSuccess
          isOpen={ModalSuccess.isOpen}
          onClose={ModalSuccess.onClose}
          Titulo={ModalSuccess.Titulo}
          Mensaje={ModalSuccess.Mensaje}
        />
      )}

      {showModalError && ModalError && (
        <PageModalError
          isOpen={ModalError.isOpen}
          onClose={ModalError.onClose}
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
        />
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar cambios</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Está seguro que desea guardar los cambios realizados en {pendingModifiedRecords.length} producto(s)?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Esta acción actualizará los registros en la base de datos de forma permanente.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingModifiedRecords([])
                }}
              >
                Cancelar
              </Button>
              <Button onClick={confirmarGuardado} className="bg-green-600 hover:bg-green-700">
                Sí, guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro Cliente */}
            <div className="space-y-2">
              <label htmlFor="filtroCliente" className="text-sm font-medium">
                Cliente
              </label>
              <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                <SelectTrigger id="filtroCliente">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesOptions.map((cliente) => (
                    <SelectItem key={cliente.value} value={cliente.value}>
                      {cliente.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Zona */}
            <div className="space-y-2">
              <label htmlFor="filtroZona" className="text-sm font-medium">
                Zona
              </label>
              <Select value={filtroZonaId} onValueChange={setFiltroZonaId} disabled={!filtroClienteId}>
                <SelectTrigger id="filtroZona">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonasOptions.map((zona) => (
                    <SelectItem key={zona.value} value={zona.value}>
                      {zona.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón Buscar */}
            <div className="flex items-end">
              <Button onClick={ejecutarBusqueda} className="w-full" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && inventarioData.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Mostrando {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, inventarioData.length)} de{" "}
              {inventarioData.length} registros
            </p>
            <div className="flex gap-2">
              <Button onClick={guardarReporte} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar Reporte
                    {modifiedCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {modifiedCount}
                      </span>
                    )}
                  </>
                )}
              </Button>
              <Button onClick={exportarExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto" style={{ maxHeight: "600px", overflow: "auto" }}>
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gradient-to-r from-gray-600 to-gray-700 text-white sticky top-0 z-20">
                    <tr>
                      <th
                        className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide bg-gradient-to-r from-gray-600 to-gray-700 z-30"
                        style={{
                          position: "sticky",
                          left: "0px",
                          minWidth: "80px",
                          maxWidth: "80px",
                          boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        ID
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide bg-gradient-to-r from-gray-600 to-gray-700 z-30"
                        style={{
                          position: "sticky",
                          left: "80px",
                          minWidth: "120px",
                          maxWidth: "120px",
                          boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        CÓDIGO
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide bg-gradient-to-r from-gray-600 to-gray-700 z-30"
                        style={{
                          position: "sticky",
                          left: "200px",
                          minWidth: "150px",
                          maxWidth: "150px",
                          boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        PRODUCTO
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide bg-gradient-to-r from-gray-600 to-gray-700 z-30"
                        style={{
                          position: "sticky",
                          left: "350px",
                          minWidth: "190px",
                          maxWidth: "190px",
                          boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        PRESENTACIÓN
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        NOMBRE
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        CLIENTE
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        ZONA
                      </th>
                      <th className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide">
                        APROBADO
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "90px" }}
                      >
                        PICKING
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "90px" }}
                      >
                        PROCESO
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        LOTE PROCESO
                      </th>
                      <th className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide">
                        EN PROGRAMA
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        LOTE PROGRAMA
                      </th>
                      <th className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide">
                        CUARENTENA
                      </th>
                      <th className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide">
                        LOTE CUARENTENA
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "100px" }}
                      >
                        TOTAL
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "100px" }}
                      >
                        VENTA DE HOY
                      </th>
                      <th className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide">
                        INVENTARIO
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "100px" }}
                      >
                        VENTA MENSUAL
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-right font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "140px" }}
                      >
                        % MES
                      </th>
                      <th
                        className="border border-gray-500 p-3 text-left font-semibold uppercase text-xs tracking-wide"
                        style={{ minWidth: "300px" }}
                      >
                        OBSERVACIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-green-50 transition-colors">
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 bg-white z-10 whitespace-nowrap"
                          style={{
                            position: "sticky",
                            left: "0px",
                            minWidth: "80px",
                            maxWidth: "80px",
                            boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {row.id || "-"}
                        </td>
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 bg-white z-10 whitespace-nowrap"
                          style={{
                            position: "sticky",
                            left: "80px",
                            minWidth: "120px",
                            maxWidth: "120px",
                            boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {row.codigo || "-"}
                        </td>
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 bg-white z-10 whitespace-nowrap"
                          style={{
                            position: "sticky",
                            left: "200px",
                            minWidth: "150px",
                            maxWidth: "150px",
                            boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {row.producto || "-"}
                        </td>
                        <td
                          className="border border-gray-300 p-3 text-sm text-gray-700 bg-white z-10 whitespace-nowrap"
                          style={{
                            position: "sticky",
                            left: "350px",
                            minWidth: "190px",
                            maxWidth: "190px",
                            boxShadow: "2px 0 5px -2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {row.presentacion || "-"}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-gray-700 whitespace-nowrap">
                          {row.nombre || "-"}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-gray-700 whitespace-nowrap">
                          {row.cliente || "-"}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-gray-700 whitespace-nowrap">
                          {row.zona || "-"}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.aprobado || 0}
                            onChange={(e) => handleCellChange(rowIndex, "aprobado", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.picking || 0}
                            onChange={(e) => handleCellChange(rowIndex, "picking", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.proceso || 0}
                            onChange={(e) => handleCellChange(rowIndex, "proceso", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm whitespace-nowrap">
                          <input
                            type="text"
                            value={row.loteproceso || ""}
                            onChange={(e) => handleCellChange(rowIndex, "loteproceso", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.enprograma || 0}
                            onChange={(e) => handleCellChange(rowIndex, "enprograma", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm whitespace-nowrap">
                          <input
                            type="text"
                            value={row.loteprograma || ""}
                            onChange={(e) => handleCellChange(rowIndex, "loteprograma", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.cuarentaa || 0}
                            onChange={(e) => handleCellChange(rowIndex, "cuarentaa", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm whitespace-nowrap">
                          <input
                            type="text"
                            value={row.lotecuarentaa || ""}
                            onChange={(e) => handleCellChange(rowIndex, "lotecuarentaa", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td
                          className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap"
                          style={{ minWidth: "140px" }}
                        >
                          <input
                            type="number"
                            value={row.total || 0}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.ventadehoy || 0}
                            onChange={(e) => handleCellChange(rowIndex, "ventadehoy", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.inventario || 0}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.ventamensual || 0}
                            onChange={(e) => handleCellChange(rowIndex, "ventadehoy", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-right whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={
                              typeof row.porcentajemes === "number"
                                ? row.porcentajemes.toFixed(2)
                                : row.porcentajemes || 0
                            }
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td
                          className="border border-gray-300 p-3 text-sm whitespace-nowrap"
                          style={{ minWidth: "300px" }}
                        >
                          <input
                            type="text"
                            value={row.observaciones || ""}
                            onChange={(e) => handleCellChange(rowIndex, "observaciones", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button onClick={prevPage} disabled={currentPage === 1} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button onClick={nextPage} disabled={currentPage === totalPages} variant="outline" size="sm">
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
