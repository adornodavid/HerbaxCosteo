"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, TrendingUp, Activity, DollarSign, BarChart3, Bell, Settings, Info } from "lucide-react"
import {
  obtenerResumenesDashboard,
  obtenerEstadisticasEmpresariales,
  obtenerKPIsDashboard,
  consultarUtilidadActual,
  consultarVariacionPrecios,
  obtenerProductosPorZona, // Agregar nueva función
} from "@/app/actions/dashboard-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { obtenerReporteCosteo } from "@/app/actions/reportecosteo"
import type { ddlItem } from "@/types/common.types"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart,
  LabelList, // Agregar LabelList para mostrar valores en barras
} from "recharts"

/* ==================================================
  Interfaces, clases, objetos
================================================== */
interface ResumenesDashboard {
  hoteles: number
  restaurantes: number
  menus: number
  platillos: number
  ingredientes: number
}

interface EstadisticasEmpresariales {
  productosPorCliente: Array<{ cliente: string; cantidad: number }>
  formulasPorCliente: Array<{ cliente: string; cantidad: number }>
  ingredientesPorCategoria: Array<{ categoria: string; cantidad: number }>
  promediosCostos: {
    productos: number
    formulas: number
    ingredientes: number
  }
}

interface KPIsDashboard {
  clientesActivos: number
  catalogosActivos: number
  productosActivos: number
  formulasActivas: number
  ingredientesActivos: number
  valorTotalInventario: number
  costoTotalProductos: number
  costoTotalFormulas: number
  costoTotalIngredientes: number
}

interface DatosSesion {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
  ClienteId?: number
}

interface ReporteCosteoItem {
  snombre: string
  sporcentajecosto: number
}

interface UtilidadActualItem {
  snombre: string
  scliente: string
  szona: string
  stotalcostos: number
  sprecioventasiniva: number
  sutilidadmarginal: number
  sprecioactualporcentajeutilidad: number
}

interface VariacionPreciosItem {
  sproductoid: number
  snombre: string
  sprecioventasiniva: number
  sprecioventaconivaaa: number
  sdiferencia: number
  svaraa: number
}

interface ProductosPorZona {
  zona: string
  cantidad: number
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

/* ==================================================
  Principal - pagina
================================================== */
export default function DashboardPage() {
  /* ==================================================
    Estados
  ================================================== */
  const [resumenes, setResumenes] = useState<ResumenesDashboard | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasEmpresariales | null>(null)
  const [kpis, setKPIs] = useState<KPIsDashboard | null>(null)
  const [sesion, setSesion] = useState<DatosSesion | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [filtroClienteId, setFiltroClienteId] = useState("")
  const [filtroZonaId, setFiltroZonaId] = useState("-1")
  const [clientesOptions, setClientesOptions] = useState<ddlItem[]>([])
  const [zonasOptions, setZonasOptions] = useState<ddlItem[]>([])
  const [reporteCosteoData, setReporteCosteoData] = useState<ReporteCosteoItem[]>([])
  const [costoAnualTotal, setCostoAnualTotal] = useState(0)
  const [utilidadAnual, setUtilidadAnual] = useState(0)
  const [costoUtilidadAnual, setCostoUtilidadAnual] = useState(0)

  const [utilidadActualData, setUtilidadActualData] = useState<UtilidadActualItem[]>([])

  const [variacionPreciosData, setVariacionPreciosData] = useState<VariacionPreciosItem[]>([])

  const [topPreciosData, setTopPreciosData] = useState<UtilidadActualItem[]>([])

  const [productosPorZonaTab, setProductosPorZonaTab] = useState<"cliente" | "zona">("cliente")
  const [productosPorZonaData, setProductosPorZonaData] = useState<ProductosPorZona[]>([])

  const [costoanualTab, setCostoanualTab] = useState<"monto" | "promedio">("monto")
  const [utilidadTab, setUtilidadTab] = useState<"monto" | "promedio">("monto")
  const [costoUtilidadTab, setCostoUtilidadTab] = useState<"monto" | "promedio">("monto")
  const [cantidadRegistros, setCantidadRegistros] = useState(0)

  const formatearNumeroConComas = (numero: number): string => {
    return numero.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  /* ==================================================
    Al cargar la pagina
  ================================================== */
  useEffect(() => {
    const validarSeguridadYCargarDatos = async () => {
      try {
        if (authLoading || !user) {
          console.log("Esperando a que termine de cargar la autenticación...")
          return
        }

        if (user.SesionActiva !== true) {
          console.log("Variable de user: SesionActiva es falsa")
          router.push("/login")
          return
        }

        if (!user.RolId || user.RolId === "0" || user.RolId === "") {
          console.log("Variable de user: RolId es 0 o es ")
          router.push("/login")
          return
        }

        setSesion({
          UsuarioId: user.UsuarioId,
          Email: user.Email,
          NombreCompleto: user.NombreCompleto,
          HotelId: user.HotelId,
          RolId: user.RolId,
          Permisos: user.Permisos,
          SesionActiva: user.SesionActiva,
          ClienteId: user.ClienteId,
        })

        if (user.ClienteId) {
          setFiltroClienteId(user.ClienteId.toString())
        }

        const [resumenesData, estadisticasData, kpisData] = await Promise.all([
          obtenerResumenesDashboard(),
          obtenerEstadisticasEmpresariales(),
          obtenerKPIsDashboard(),
        ])

        if (resumenesData.success) {
          setResumenes(resumenesData.data)
        }

        if (estadisticasData.success) {
          setEstadisticas(estadisticasData.data)
        }

        if (kpisData.success) {
          setKPIs(kpisData.data)
        }
      } catch (error) {
        console.error("Error validando seguridad:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    validarSeguridadYCargarDatos()
  }, [router, authLoading, user])

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
    const cargarZonas = async () => {
      if (filtroClienteId) {
        const result = await listDesplegableZonas(-1, "", Number(filtroClienteId))
        if (result.success && result.data) {
          const todosOption: ddlItem = { value: "-1", text: "Todos" }
          setZonasOptions([todosOption, ...result.data])
        }
      } else {
        setZonasOptions([{ value: "-1", text: "Todos" }])
      }
    }
    cargarZonas()
  }, [filtroClienteId])

  useEffect(() => {
    const cargarReporteCosteo = async () => {
      if (filtroClienteId) {
        const result = await obtenerReporteCosteo(-1, Number(filtroClienteId), Number(filtroZonaId))
        if (result.success && result.data) {
          const filteredData = result.data

          const top5 = filteredData.sort((a: any, b: any) => b.sporcentajecosto - a.sporcentajecosto).slice(0, 5)

          setReporteCosteoData(top5)

          const totalCosto = filteredData.reduce((sum: number, item: any) => sum + (item.scostoanual || 0), 0)
          const totalUtilidad = filteredData.reduce((sum: number, item: any) => sum + (item.sutilidadanual || 0), 0)
          const totalCostoUtilidad = filteredData.reduce(
            (sum: number, item: any) => sum + (item.scostoutilidadanual || 0),
            0,
          )

          setCantidadRegistros(filteredData.length)
          setCostoAnualTotal(totalCosto)
          setUtilidadAnual(totalUtilidad)
          setCostoUtilidadAnual(totalCostoUtilidad)
        }
      }
    }
    cargarReporteCosteo()
  }, [filtroClienteId, filtroZonaId])

  useEffect(() => {
    const cargarProductosPorZona = async () => {
      if (filtroClienteId) {
        const result = await obtenerProductosPorZona(Number(filtroClienteId))
        if (result.success && result.data) {
          setProductosPorZonaData(result.data)
        }
      }
    }
    cargarProductosPorZona()
  }, [filtroClienteId])

  useEffect(() => {
    const cargarUtilidadActual = async () => {
      if (filtroClienteId) {
        const result = await consultarUtilidadActual(Number(filtroClienteId), Number(filtroZonaId))
        if (result.success && result.data) {
          const top5Utilidad = result.data
            .sort((a: any, b: any) => b.sprecioactualporcentajeutilidad - a.sprecioactualporcentajeutilidad)
            .slice(0, 5)
          setUtilidadActualData(top5Utilidad)

          const top5Precio = result.data
            .sort((a: any, b: any) => b.sprecioventasiniva - a.sprecioventasiniva)
            .slice(0, 5)
          setTopPreciosData(top5Precio)
        }
      }
    }
    cargarUtilidadActual()
  }, [filtroClienteId, filtroZonaId])

  useEffect(() => {
    const cargarVariacionPrecios = async () => {
      if (filtroClienteId) {
        const result = await consultarVariacionPrecios(Number(filtroClienteId), Number(filtroZonaId))
        if (result.success && result.data) {
          const top10 = result.data.sort((a: any, b: any) => b.svaraa - a.svaraa).slice(0, 10)
          setVariacionPreciosData(top10)
        }
      }
    }
    cargarVariacionPrecios()
  }, [filtroClienteId, filtroZonaId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/images/design-mode/cargando.gif"
              alt="Procesando..."
              width={300}
              height={300}
              unoptimized
              className="absolute inset-0 animate-bounce-slow"
            />
          </div>
          <p className="text-lg font-semibold text-slate-700">Cargando Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sistema de Costeo</h1>
                <p className="text-sm text-slate-600">Dashboard Empresarial</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3 bg-slate-100 rounded-full px-4 py-2">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {sesion.NombreCompleto.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{sesion.NombreCompleto}</p>
                  <p className="text-xs text-slate-600">Bienvenido de vuelta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ddlCliente" className="text-sm font-medium text-slate-700 mb-2 block">
                  Cliente
                </label>
                <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                  <SelectTrigger id="ddlCliente" className="border-slate-300">
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
                <label htmlFor="ddlZona" className="text-sm font-medium text-slate-700 mb-2 block">
                  Zona
                </label>
                <Select value={filtroZonaId} onValueChange={setFiltroZonaId}>
                  <SelectTrigger id="ddlZona" className="border-slate-300">
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
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-[10px] text-blue-700 font-medium">Costo Anual Total</p>
                </div>
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </div>

              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setCostoanualTab("monto")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    costoanualTab === "monto" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  Monto
                </button>
                <button
                  onClick={() => setCostoanualTab("promedio")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    costoanualTab === "promedio"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  Promedio
                </button>
              </div>

              <p className="text-xl font-bold text-blue-900">
                $
                {costoanualTab === "monto"
                  ? formatearNumeroConComas(costoAnualTotal)
                  : formatearNumeroConComas(cantidadRegistros > 0 ? costoAnualTotal / cantidadRegistros : 0)}
              </p>

              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ value: costoAnualTotal * 0.8 }, { value: costoAnualTotal }]}>
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-[10px] text-green-700 font-medium">Utilidad Anual</p>
                </div>
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>

              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setUtilidadTab("monto")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    utilidadTab === "monto"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  Monto
                </button>
                <button
                  onClick={() => setUtilidadTab("promedio")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    utilidadTab === "promedio"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  Promedio
                </button>
              </div>

              <p className="text-xl font-bold text-green-900">
                $
                {utilidadTab === "monto"
                  ? formatearNumeroConComas(utilidadAnual)
                  : formatearNumeroConComas(cantidadRegistros > 0 ? utilidadAnual / cantidadRegistros : 0)}
              </p>

              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[{ value: utilidadAnual * 0.7 }, { value: utilidadAnual * 0.9 }, { value: utilidadAnual }]}
                  >
                    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-[10px] text-purple-700 font-medium">Costo/Utilidad Anual</p>
                </div>
                <div className="bg-purple-100 p-1.5 rounded-lg">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
              </div>

              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setCostoUtilidadTab("monto")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    costoUtilidadTab === "monto"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  Monto
                </button>
                <button
                  onClick={() => setCostoUtilidadTab("promedio")}
                  className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    costoUtilidadTab === "promedio"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  Promedio
                </button>
              </div>

              <p className="text-xl font-bold text-purple-900">
                {costoUtilidadTab === "monto"
                  ? formatearNumeroConComas(costoUtilidadAnual * 100)
                  : formatearNumeroConComas(cantidadRegistros > 0 ? (costoUtilidadAnual / cantidadRegistros) * 100 : 0)}
                %
              </p>

              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { value: costoUtilidadAnual * 80 },
                      { value: costoUtilidadAnual * 90 },
                      { value: costoUtilidadAnual * 100 },
                    ]}
                  >
                    <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#EDE9FE" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Estadisticas de Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  % Costo Producto
                </h3>
                <div className="space-y-3">
                  {reporteCosteoData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-medium truncate max-w-[310px]">{item.snombre}</span>
                        <span className="text-slate-900 font-semibold">
                          {(item.sporcentajecosto * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
                          style={{ width: `${Math.min(item.sporcentajecosto * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {reporteCosteoData.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Seleccione un cliente para ver los datos</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  % Utilidad Producto
                </h3>
                <div className="space-y-3">
                  <TooltipProvider>
                    {utilidadActualData.map((item, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-700 font-medium truncate max-w-[310px]">
                                  {item.snombre}
                                </span>
                                <Info className="h-3.5 w-3.5 text-emerald-500" />
                              </div>
                              <span className="text-slate-900 font-semibold">
                                {item.sprecioactualporcentajeutilidad.toFixed(2)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 to-emerald-600"
                                style={{
                                  width: `${Math.min(item.sprecioactualporcentajeutilidad, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="w-80 p-0 border-0 shadow-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50"
                        >
                          <div className="p-5 space-y-4">
                            <div className="flex items-start gap-3 pb-3 border-b border-emerald-200">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-base mb-1">{item.snombre}</h4>
                                <p className="text-xs text-slate-600">Análisis de Rentabilidad</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <p className="text-xs font-medium text-blue-700 mb-1">Cliente</p>
                                <p className="text-sm font-semibold text-blue-900">{item.scliente}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                <p className="text-xs font-medium text-purple-700 mb-1">Zona</p>
                                <p className="text-sm font-semibold text-purple-900">{item.szona}</p>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                                <span className="text-xs font-medium text-slate-700">Total Costos</span>
                                <span className="text-sm font-bold text-slate-900">
                                  ${item.stotalcostos.toFixed(6)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2.5 bg-green-50 rounded-lg">
                                <span className="text-xs font-medium text-green-700">Precio Venta (sin IVA)</span>
                                <span className="text-sm font-bold text-green-900">
                                  ${item.sprecioventasiniva.toFixed(6)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg">
                                <span className="text-xs font-medium text-emerald-700">Utilidad Marginal</span>
                                <span className="text-sm font-bold text-emerald-900">
                                  ${item.sutilidadmarginal.toFixed(6)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border-2 border-emerald-300">
                                <span className="text-xs font-bold text-emerald-800">% Utilidad</span>
                                <span className="text-base font-bold text-emerald-900">
                                  {(item.sprecioactualporcentajeutilidad).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  {utilidadActualData.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Seleccione un cliente para ver los datos</p>
                  )}
                </div>
              </div>

              {/* Section 3 - Top 5 productos por precio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Top 5 Precio Venta
                </h3>
                <div className="space-y-3">
                  <TooltipProvider>
                    {topPreciosData.map((item, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                  #{index + 1}
                                </span>
                                <span className="text-slate-700 font-medium truncate max-w-[200px]">
                                  {item.snombre}
                                </span>
                                <Info className="h-3.5 w-3.5 text-amber-500" />
                              </div>
                              <span className="text-slate-900 font-semibold">
                                ${item.sprecioventasiniva.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-500"
                                style={{
                                  width: `${Math.min((item.sprecioventasiniva / (topPreciosData[0]?.sprecioventasiniva || 1)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="w-80 p-0 border-0 shadow-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50"
                        >
                          <div className="p-5 space-y-4">
                            <div className="flex items-start gap-3 pb-3 border-b border-amber-200">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-base mb-1">{item.snombre}</h4>
                                <p className="text-xs text-slate-600">Detalle de Precio</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <p className="text-xs font-medium text-blue-700 mb-1">Cliente</p>
                                <p className="text-sm font-semibold text-blue-900">{item.scliente}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                <p className="text-xs font-medium text-purple-700 mb-1">Zona</p>
                                <p className="text-sm font-semibold text-purple-900">{item.szona}</p>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                                <span className="text-xs font-medium text-slate-700">Total Costos</span>
                                <span className="text-sm font-bold text-slate-900">
                                  ${item.stotalcostos.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg border-2 border-amber-300">
                                <span className="text-xs font-bold text-amber-800">Precio Venta (sin IVA)</span>
                                <span className="text-base font-bold text-amber-900">
                                  ${item.sprecioventasiniva.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2.5 bg-green-50 rounded-lg">
                                <span className="text-xs font-medium text-green-700">Utilidad Marginal</span>
                                <span className="text-sm font-bold text-green-900">
                                  ${item.sutilidadmarginal.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg">
                                <span className="text-xs font-medium text-emerald-700">% Utilidad</span>
                                <span className="text-sm font-bold text-emerald-900">
                                  {item.sprecioactualporcentajeutilidad.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  {topPreciosData.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Seleccione un cliente para ver los datos</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Total Productos Registrados
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setProductosPorZonaTab("cliente")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      productosPorZonaTab === "cliente"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    onClick={() => setProductosPorZonaTab("zona")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      productosPorZonaTab === "zona"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    Zona
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {productosPorZonaTab === "cliente" ? (
                    <BarChart data={estadisticas?.productosPorCliente || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cliente" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                        {estadisticas?.productosPorCliente.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList dataKey="cantidad" position="top" fill="#374151" fontSize={12} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={productosPorZonaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="zona" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(139, 92, 246, 0.1)" }} />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                        {productosPorZonaData.map((entry, index) => (
                          <Cell key={`cell-zona-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                        <LabelList dataKey="cantidad" position="top" fill="#374151" fontSize={12} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Variación de Precios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50 z-10">
                    <tr>
                      <th className="text-left p-2 text-indigo-900 font-semibold text-xs border-b-2 border-indigo-200">
                        Producto
                      </th>
                      <th className="text-right p-2 text-indigo-900 font-semibold text-xs border-b-2 border-indigo-200">
                        Precio Actual(s/IVA)
                      </th>
                      <th className="text-right p-2 text-indigo-900 font-semibold text-xs border-b-2 border-indigo-200">
                        Precio AA(2025)
                      </th>
                      <th className="text-right p-2 text-indigo-900 font-semibold text-xs border-b-2 border-indigo-200">
                        Diferencia
                      </th>
                      <th className="text-center p-2 text-indigo-900 font-semibold text-xs border-b-2 border-indigo-200">
                        Var %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <TooltipProvider>
                      {variacionPreciosData.map((item, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <tr className="hover:bg-indigo-50 transition-colors cursor-help border-b border-slate-100">
                              <td className="p-2 text-slate-700 font-medium max-w-[200px] truncate">{item.snombre}</td>
                              <td className="text-right p-2 text-slate-700">${item.sprecioventasiniva.toFixed(2)}</td>
                              <td className="text-right p-2 text-slate-700">${item.sprecioventaconivaaa.toFixed(2)}</td>
                              <td className="text-right p-2 text-slate-700 font-semibold">
                                ${item.sdiferencia.toFixed(2)}
                              </td>
                              <td className="text-center p-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                    item.svaraa < 0
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : "bg-green-100 text-green-700 border border-green-200"
                                  }`}
                                >
                                  {item.svaraa < 0 ? "-" : "+"}
                                  {Math.abs(item.svaraa).toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="w-96 p-0 border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50"
                          >
                            <div className="p-6 space-y-4">
                              <div className="flex items-start gap-3 pb-4 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
                                <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm">
                                  <Package className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-lg mb-1">{item.snombre}</h4>
                                  <p className="text-xs text-slate-600 flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
                                    ID: {item.sproductoid}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Precio sin IVA
                                  </p>
                                  <p className="text-2xl font-bold text-blue-900">
                                    ${item.sprecioventasiniva.toFixed(2)}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                                  <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Precio con IVA
                                  </p>
                                  <p className="text-2xl font-bold text-purple-900">
                                    ${item.sprecioventaconivaaa.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      Diferencia
                                    </span>
                                    <span className="text-xl font-bold text-amber-900">
                                      ${item.sdiferencia.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`rounded-xl p-5 border-3 shadow-md ${
                                    item.svaraa < 0
                                      ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
                                      : "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span
                                      className={`text-sm font-bold flex items-center gap-2 ${
                                        item.svaraa < 0 ? "text-red-800" : "text-green-800"
                                      }`}
                                    >
                                      <Activity className="h-5 w-5" />
                                      Variación %
                                    </span>
                                    <span
                                      className={`text-3xl font-bold ${
                                        item.svaraa < 0 ? "text-red-900" : "text-green-900"
                                      }`}
                                    >
                                      {item.svaraa < 0 ? "-" : "+"}
                                      {Math.abs(item.svaraa).toFixed(2)}%
                                    </span>
                                  </div>
                                  <p className="text-xs mt-2 text-slate-600 text-center">
                                    {item.svaraa < 0 ? "⚠️ Precio por debajo del esperado" : "✓ Precio óptimo alcanzado"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </tbody>
                </table>
                {variacionPreciosData.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-sm text-slate-500 text-center font-medium">
                      Seleccione un cliente y zona para visualizar la variación de precios
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section for Products by Zone Chart */}
        {/*<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <PieChart className="h-5 w-5 text-blue-600" />
              Productos por Zona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setProductosPorZonaTab("zona")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    productosPorZonaTab === "zona"
                      ? "bg-white shadow text-slate-900"
                      : "text-slate-600 hover:bg-white hover:shadow"
                  }`}
                >
                  Por Zona
                </button>
                <button
                  onClick={() => setProductosPorZonaTab("cliente")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    productosPorZonaTab === "cliente"
                      ? "bg-white shadow text-slate-900"
                      : "text-slate-600 hover:bg-white hover:shadow"
                  }`}
                >
                  Por Cliente
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {productosPorZonaTab === "zona" ? (
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={productosPorZonaData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="cantidad"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {productosPorZonaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                ) : (
                  <BarChart data={estadisticas?.productosPorCliente || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="cliente" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                      {estadisticas?.productosPorCliente.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>*/}

        {/*<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-green-600" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/productos">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
                >
                  <Package className="h-8 w-8 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Productos</span>
                </Button>
              </Link>

              <Link href="/formulas">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300"
                >
                  <Beaker className="h-8 w-8 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Fórmulas</span>
                </Button>
              </Link>

              <Link href="/ingredientes">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300"
                >
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Ingredientes</span>
                </Button>
              </Link>

              <Link href="/catalogos">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300"
                >
                  <Package className="h-8 w-8 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Catálogos</span>
                </Button>
              </Link>

              <Link href="/clientes">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-300"
                >
                  <Users className="h-8 w-8 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">Clientes</span>
                </Button>
              </Link>

              <Link href="/analisis-costos">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:from-pink-100 hover:to-pink-200 transition-all duration-300"
                >
                  <BarChart3 className="h-8 w-8 text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">Análisis</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        */}

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-green-600" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">✓ Sistema Operativo</Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">✓ Base de Datos Conectada</Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">✓ Sesión Activa</Badge>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                Usuario: {sesion.Email}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="font-medium text-slate-800">Última actualización</p>
                <p>{new Date().toLocaleString("es-ES")}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="font-medium text-slate-800">Rol de Usuario</p>
                <p>ID: {sesion.RolId}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="font-medium text-slate-800">Hotel Asignado</p>
                <p>{sesion.HotelId || "No asignado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
