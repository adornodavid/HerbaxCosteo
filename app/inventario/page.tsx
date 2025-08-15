"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package,
  AlertTriangle,
  Clock,
  FlaskConical,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react"
import {
  obtenerEstadisticasInventario,
  obtenerInventarioDetallado,
  obtenerAlertasInventario,
  obtenerMovimientosRecientes,
} from "@/app/actions/inventario-actions"

interface EstadisticasInventario {
  totalProductos: number
  valorTotal: number
  enStock: number
  proximosVencer: number
  enRevision: number
  enProceso: number
  categorias: Record<string, number>
}

interface ProductoInventario {
  id: number
  nombre: string
  descripcion: string
  presentacion: string
  costo: number
  imgurl: string
  categoriauso: string
  cantidadStock: number
  cantidadProximaVencer: number
  cantidadEnRevision: number
  cantidadEnProceso: number
  estadoPrincipal: string
  diasParaVencer: number
  loteNumero: string
  ubicacion: string
}

interface Alerta {
  id: number
  nombre: string
  imgurl: string
  tipoAlerta: string
  nivel: string
  mensaje: string
}

interface Movimiento {
  id: number
  productoNombre: string
  productoImagen: string
  tipo: string
  cantidad: number
  fecha: string
  usuario: string
}

export default function InventarioPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null)
  const [productos, setProductos] = useState<ProductoInventario[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [vistaActual, setVistaActual] = useState("general")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatosInventario()
  }, [])

  const cargarDatosInventario = async () => {
    setLoading(true)
    try {
      const [estadisticasRes, productosRes, alertasRes, movimientosRes] = await Promise.all([
        obtenerEstadisticasInventario(),
        obtenerInventarioDetallado(),
        obtenerAlertasInventario(),
        obtenerMovimientosRecientes(),
      ])

      if (estadisticasRes.success) setEstadisticas(estadisticasRes.data)
      if (productosRes.success) setProductos(productosRes.data)
      if (alertasRes.success) setAlertas(alertasRes.data)
      if (movimientosRes.success) setMovimientos(movimientosRes.data)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const productosFiltrados = productos.filter((producto) => {
    const coincideTexto = producto.nombre.toLowerCase().includes(filtroTexto.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || producto.estadoPrincipal === filtroEstado
    return coincideTexto && coincideEstado
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "stock":
        return "bg-green-500"
      case "proximo_vencer":
        return "bg-yellow-500"
      case "revision":
        return "bg-blue-500"
      case "proceso":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "stock":
        return "En Stock"
      case "proximo_vencer":
        return "Próximo a Vencer"
      case "revision":
        return "En Revisión"
      case "proceso":
        return "En Proceso"
      default:
        return "Desconocido"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Inventario Inteligente
            </h1>
            <p className="text-gray-600 mt-2">Gestión avanzada de productos y stock en tiempo real</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={vistaActual === "general" ? "default" : "outline"}
              onClick={() => setVistaActual("general")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              General
            </Button>
            <Button
              variant={vistaActual === "detalle" ? "default" : "outline"}
              onClick={() => setVistaActual("detalle")}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Detalle
            </Button>
          </div>
        </div>
      </div>

      {vistaActual === "general" && (
        <>
          {/* Estadísticas Principales */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Productos</p>
                      <p className="text-3xl font-bold text-blue-600">{estadisticas.totalProductos}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Total</p>
                      <p className="text-3xl font-bold text-green-600">${estadisticas.valorTotal.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Próximos a Vencer</p>
                      <p className="text-3xl font-bold text-yellow-600">{estadisticas.proximosVencer}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-3xl font-bold text-purple-600">{estadisticas.enProceso}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FlaskConical className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertas y Movimientos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Alertas Críticas */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas Críticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <img
                        src={alerta.imgurl || "/placeholder.svg?height=40&width=40"}
                        alt={alerta.nombre}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alerta.nombre}</p>
                        <p className="text-sm text-red-600">{alerta.mensaje}</p>
                      </div>
                      <Badge variant={alerta.nivel === "critico" ? "destructive" : "secondary"}>{alerta.nivel}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Movimientos Recientes */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  Movimientos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {movimientos.slice(0, 8).map((movimiento) => (
                    <div
                      key={movimiento.id}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <img
                        src={movimiento.productoImagen || "/placeholder.svg?height=40&width=40"}
                        alt={movimiento.productoNombre}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{movimiento.productoNombre}</p>
                        <p className="text-sm text-gray-600">
                          {movimiento.tipo === "entrada" && (
                            <TrendingUp className="w-4 h-4 inline text-green-500 mr-1" />
                          )}
                          {movimiento.tipo === "salida" && (
                            <TrendingDown className="w-4 h-4 inline text-red-500 mr-1" />
                          )}
                          {movimiento.cantidad} unidades
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{movimiento.tipo}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{new Date(movimiento.fecha).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {vistaActual === "detalle" && (
        <>
          {/* Filtros */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-0 shadow-lg"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-md"
            >
              <option value="todos">Todos los estados</option>
              <option value="stock">En Stock</option>
              <option value="proximo_vencer">Próximo a Vencer</option>
              <option value="revision">En Revisión</option>
              <option value="proceso">En Proceso</option>
            </select>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => (
              <Card
                key={producto.id}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={producto.imgurl || "/placeholder.svg?height=200&width=300"}
                      alt={producto.nombre}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getEstadoColor(producto.estadoPrincipal)} text-white`}>
                        {getEstadoTexto(producto.estadoPrincipal)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {producto.loteNumero}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{producto.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{producto.descripcion}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">En Stock:</span>
                        <span className="font-medium text-green-600">{producto.cantidadStock}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Por Vencer:</span>
                        <span className="font-medium text-yellow-600">{producto.cantidadProximaVencer}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">En Revisión:</span>
                        <span className="font-medium text-blue-600">{producto.cantidadEnRevision}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">En Proceso:</span>
                        <span className="font-medium text-purple-600">{producto.cantidadEnProceso}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Costo:</span>
                        <span className="font-bold text-gray-900">${producto.costo?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{producto.ubicacion}</span>
                        <Calendar className="w-3 h-3 ml-2" />
                        <span>{producto.diasParaVencer} días</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
