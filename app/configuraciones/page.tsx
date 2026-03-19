"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Search,
  Save,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import {
  obtenerConfiguracionesXCliente,
  actualizarConfiguracion,
  type ConfiguracionXCliente,
} from "@/app/actions/configuraciones"
import { useUserSession } from "@/hooks/use-user-session"

interface ddlItem {
  value: string
  text: string
}

export default function ConfiguracionesPage() {
  const router = useRouter()
  const { session: sessionUser, loading: sessionLoading } = useUserSession()

  // Estados de filtros
  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroZonaId, setFiltroZonaId] = useState("")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])

  // Estados de datos
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionXCliente[]>([])
  const [valoresEditados, setValoresEditados] = useState<{ [key: number]: string }>({})

  // Estados de UI
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [modalValidacion, setModalValidacion] = useState(false)
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([])
  const [modalExito, setModalExito] = useState(false)
  const [modalConfirmacion, setModalConfirmacion] = useState(false)

  // Cargar cliente del usuario al inicio
  useEffect(() => {
    if (!sessionLoading && sessionUser?.ClienteId) {
      setFiltroClienteId(sessionUser.ClienteId.toString())
    }
  }, [sessionLoading, sessionUser])

  // Cargar clientes
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

  // Cargar zonas cuando cambia el cliente
  useEffect(() => {
    const cargarZonas = async () => {
      if (filtroClienteId) {
        const result = await listDesplegableZonas(-1, "", Number(filtroClienteId))
        if (result.success && result.data) {
          setZonasOptions(result.data)
          setFiltroZonaId("")
        }
      } else {
        setZonasOptions([])
        setFiltroZonaId("")
      }
    }
    cargarZonas()
  }, [filtroClienteId])

  // Función para buscar configuraciones
  const handleBuscar = async () => {
    if (!filtroClienteId || !filtroZonaId) {
      return
    }

    setIsSearching(true)
    setHasSearched(false)

    try {
      const result = await obtenerConfiguracionesXCliente(Number(filtroClienteId), Number(filtroZonaId))

      if (result.success && result.data) {
        setConfiguraciones(result.data)
        // Inicializar valores editados
        const valores: { [key: number]: string } = {}
        result.data.forEach((config) => {
          valores[config.id] = config.valor || ""
        })
        setValoresEditados(valores)
      }
    } catch (error) {
      console.error("Error al buscar configuraciones:", error)
    } finally {
      setIsSearching(false)
      setHasSearched(true)
    }
  }

  // Función para actualizar valor en el estado local
  const handleValorChange = (id: number, nuevoValor: string) => {
    setValoresEditados((prev) => ({
      ...prev,
      [id]: nuevoValor,
    }))
  }

  const handleClickGuardar = () => {
    // Primero validar que todos los inputs tengan valor
    const faltantes: string[] = []
    configuraciones.forEach((config) => {
      const valor = valoresEditados[config.id]
      if (!valor || valor.trim() === "") {
        faltantes.push(config.descripcion)
      }
    })

    if (faltantes.length > 0) {
      setCamposFaltantes(faltantes)
      setModalValidacion(true)
      return
    }

    // Si pasa la validación, mostrar modal de confirmación
    setModalConfirmacion(true)
  }

  const handleConfirmarGuardar = async () => {
    setModalConfirmacion(false)
    setIsSaving(true)
    try {
      const promises = Object.entries(valoresEditados).map(([id, valor]) => actualizarConfiguracion(Number(id), valor))
      await Promise.all(promises)
      // Recargar datos después de guardar
      await handleBuscar()
      // Mostrar modal de éxito
      setModalExito(true)
    } catch (error) {
      console.error("Error al guardar configuraciones:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Configuraciones</h1>
              <p className="text-slate-500">Gestiona las configuraciones por cliente y zona</p>
            </div>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-500" />
              Búsqueda de Configuraciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Input Cliente */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Cliente
                </Label>
                <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                  <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400">
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

              {/* Input Zona */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Zona
                </Label>
                <Select value={filtroZonaId} onValueChange={setFiltroZonaId} disabled={!filtroClienteId}>
                  <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400">
                    <SelectValue
                      placeholder={filtroClienteId ? "Selecciona una zona" : "Primero selecciona un cliente"}
                    />
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
                <Button
                  onClick={handleBuscar}
                  disabled={!filtroClienteId || !filtroZonaId || isSearching}
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
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

        {/* Tabla de Configuraciones */}
        {hasSearched && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                Configuraciones Encontradas
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                  {configuraciones.length} registros
                </span>
              </CardTitle>
              {configuraciones.length > 0 && (
                <Button
                  onClick={handleClickGuardar}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {configuraciones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Settings className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">No se encontraron configuraciones</p>
                  <p className="text-slate-400 text-sm mt-1">Intenta con otro cliente o zona</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 w-1/2">Descripción</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 w-1/2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {configuraciones.map((config, index) => (
                        <tr
                          key={config.id}
                          className={`transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          } hover:bg-indigo-50/50`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                              <span className="text-sm font-medium text-slate-700">{config.descripcion}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              value={valoresEditados[config.id] || ""}
                              onChange={(e) => handleValorChange(config.id, e.target.value)}
                              className="h-10 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 bg-white"
                              placeholder="Ingresa un valor"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Confirmar Cambios</h3>
              </div>
              <button
                onClick={() => setModalConfirmacion(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-700 text-base font-medium mb-2">
                    ¿Desea realizar los cambios en los porcentajes para este cliente y zona?
                  </p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                      Esta será la nueva configuración para los próximos costeos.
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      Los productos costeados anteriormente no se verán afectados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <Button
                onClick={() => setModalConfirmacion(false)}
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarGuardar}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Sí, Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalValidacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Campos Requeridos</h3>
              </div>
              <button
                onClick={() => setModalValidacion(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-slate-600 mb-4">Los siguientes campos deben tener un valor asignado:</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {camposFaltantes.map((campo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-sm text-red-700">{campo}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end">
              <Button
                onClick={() => setModalValidacion(false)}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Actualización Exitosa</h3>
              </div>
              <button onClick={() => setModalExito(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-cyan-500" />
              </div>
              <p className="text-slate-700 text-lg font-medium">
                Las configuraciones han sido actualizadas correctamente
              </p>
              <p className="text-slate-500 text-sm mt-2">Todos los cambios se han guardado exitosamente</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-center">
              <Button
                onClick={() => setModalExito(false)}
                className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white px-8"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
