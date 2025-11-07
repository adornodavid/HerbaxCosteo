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
import {
  Users,
  Package,
  Beaker,
  ShoppingCart,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  PieChart,
  Bell,
  Settings,
} from "lucide-react"
import {
  obtenerResumenesDashboard,
  obtenerEstadisticasEmpresariales,
  obtenerKPIsDashboard,
} from "@/app/actions/dashboard-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listDesplegableZonas } from "@/app/actions/zonas"
import { obtenerReporteCosteo } from "@/app/actions/reportecosteo"
import type { ddlItem } from "@/types/common.types"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart,
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
          let filteredData = result.data
          
          {/*if (filtroZonaId !== "-1") {
            filteredData = result.data.filter((item: any) => item.zonaid === Number(filtroZonaId))
            console.log("dataaa", filteredData)
          }
          */}

          const top5 = filteredData.sort((a: any, b: any) => b.sporcentajecosto - a.sporcentajecosto).slice(0, 5)

          setReporteCosteoData(top5)

          const totalCosto = filteredData.reduce((sum: number, item: any) => sum + (item.scostoanual || 0), 0)
          const totalUtilidad = filteredData.reduce((sum: number, item: any) => sum + (item.sutilidadanual || 0), 0)
          const totalCostoUtilidad = filteredData.reduce(
            (sum: number, item: any) => sum + (item.scostoutilidadanual || 0),
            0,
          )

          setCostoAnualTotal(totalCosto)
          setUtilidadAnual(totalUtilidad)
          setCostoUtilidadAnual(totalCostoUtilidad)
        }
      }
    }
    cargarReporteCosteo()
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-blue-200 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Costo Anual Total</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">${costoAnualTotal.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ value: costoAnualTotal * 0.8 }, { value: costoAnualTotal }]}>
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-green-700 font-medium">Utilidad Anual</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">${utilidadAnual.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="h-16">
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Costo/Utilidad Anual</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{(costoUtilidadAnual * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="h-16">
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
            <CardTitle className="text-slate-900">Análisis de Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">% Costo</h3>
                <div className="space-y-3">
                  {reporteCosteoData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-medium truncate max-w-[150px]">{item.snombre}</span>
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
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Sección 2</h3>
                <p className="text-sm text-slate-500">Contenido pendiente</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Sección 3</h3>
                <p className="text-sm text-slate-500">Contenido pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Productos por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadisticas?.productosPorCliente || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="cliente" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                    <Bar dataKey="cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <PieChart className="h-5 w-5 text-green-600" />
                Ingredientes por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {estadisticas?.ingredientesPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Análisis de Costos Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-blue-700">
                  ${(estadisticas?.promediosCostos.productos || 0).toFixed(2)}
                </p>
                <p className="text-sm text-blue-600 font-medium">Costo Promedio Productos</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <Beaker className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-green-700">
                  ${(estadisticas?.promediosCostos.formulas || 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 font-medium">Costo Promedio Fórmulas</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <ShoppingCart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-purple-700">
                  ${(estadisticas?.promediosCostos.ingredientes || 0).toFixed(2)}
                </p>
                <p className="text-sm text-purple-600 font-medium">Costo Promedio Ingredientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-indigo-600" />
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
