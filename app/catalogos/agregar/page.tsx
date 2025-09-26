"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { getSession } from "@/app/actions/session-actions"
import { ArrowLeft, Plus, ShoppingCart, Edit, Trash2 } from "lucide-react"
import { Loader2 } from "@/components/ui/loader2"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  obtenerProductosCatalogo,
  obtenerProductosDisponiblesParaCatalogo,
  asociarProductoACatalogo,
  obtenerDetalleCatalogo,
  eliminarProductoDeCatalogo,
  actualizarPrecioProductoCatalogo,
} from "@/app/actions/catalogos-actions"
import {
  obtenerProductoDetalladoCompleto,
  obtenerFormulasAsociadasProducto,
  obtenerIngredientesAsociadosProducto,
  getProductoDetailsForModal,
} from "@/app/actions/productos-actions"

interface Producto {
  id: string
  nombre: string
  descripcion: string
  presentacion: string
  imgurl: string | null
  costo: number
  precioventa?: number // Added precio venta to interface
}

interface CatalogoInfo {
  id: string
  nombre: string
  descripcion: string | null
  cliente: {
    id: string
    nombre: string
  } | null
}

interface ProductoDetalleCompleto {
  id: number
  nombre: string
  descripcion: string
  presentacion: string
  porcion: string
  porcionenvase: string
  modouso: string
  categoriauso: string
  edadminima: number
  instruccionesingesta: string
  advertencia: string
  condicionesalmacenamiento: string
  vidaanaquelmeses: number
  propositoprincipal: string
  propuestavalor: string
  costo: number
  activo: boolean
  imgurl: string
}

interface FormulaAsociada {
  formula: string
  cantidad: number
  costoparcial: number
}

interface IngredienteAsociado {
  ingrediente: string
  cantidad: number
  costoparcial: number
}

interface ProductoDetail {
  Cliente: string
  Catalogo: string
  precioventa: number
  margenutilidad: number | null
}

export default function CatalogosAgregarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const catalogoId = searchParams.get("getCatalogoId")

  const [catalogoInfo, setCatalogoInfo] = useState<CatalogoInfo | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([])
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [precioVenta, setPrecioVenta] = useState("")

  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loadingModal, setLoadingModal] = useState(false)
  const [associating, setAssociating] = useState(false)

  const [showProductoDetailsModal, setShowProductoDetailsModal] = useState(false)
  const [selectedProductoCompleto, setSelectedProductoCompleto] = useState<ProductoDetalleCompleto | null>(null)
  const [selectedFormulasAsociadas, setSelectedFormulasAsociadas] = useState<FormulaAsociada[]>([])
  const [selectedIngredientesAsociados, setSelectedIngredientesAsociados] = useState<IngredienteAsociado[]>([])
  const [selectedProductoDetails, setSelectedProductoDetails] = useState<ProductoDetail[] | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [editPrecioVenta, setEditPrecioVenta] = useState("")
  const [updating, setUpdating] = useState(false)

  // Security validation
  useEffect(() => {
    const validateSession = async () => {
      const session = await getSession()
      if (!session || session.SesionActiva !== true) {
        router.push("/login")
        return
      }

      if (!catalogoId) {
        toast({
          title: "Error",
          description: "ID de catálogo no proporcionado",
          variant: "destructive",
        })
        router.push("/catalogos")
        return
      }
    }

    validateSession()
  }, [router, catalogoId, toast])

  // Load catalog info and products
  const cargarDatos = useCallback(async () => {
    if (!catalogoId) return

    setLoading(true)
    try {
      // Load catalog info
      const { catalogo, error: catalogoError } = await obtenerDetalleCatalogo(catalogoId)
      if (catalogoError) throw new Error(catalogoError)
      setCatalogoInfo(catalogo)

      // Load catalog products
      const { data: productosData, error: productosError } = await obtenerProductosCatalogo(catalogoId)
      if (productosError) throw new Error(productosError)
      setProductos(productosData)
    } catch (error: any) {
      console.error("Error cargando datos:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del catálogo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [catalogoId, toast])

  // Load available products for modal
  const cargarProductosDisponibles = useCallback(async () => {
    if (!catalogoId) return

    setLoadingModal(true)
    try {
      const { data, error } = await obtenerProductosDisponiblesParaCatalogo(catalogoId)
      if (error) throw new Error(error)
      setProductosDisponibles(data)
    } catch (error: any) {
      console.error("Error cargando productos disponibles:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingModal(false)
    }
  }, [catalogoId, toast])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleOpenAddModal = () => {
    setShowAddModal(true)
    cargarProductosDisponibles()
  }

  const handleSelectProducto = (producto: Producto) => {
    setSelectedProducto(producto)
    setPrecioVenta("")
  }

  const handleAsociarProducto = async () => {
    if (!selectedProducto || !precioVenta || !catalogoId) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    const precio = Number.parseFloat(precioVenta)
    if (isNaN(precio) || precio <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese un precio válido",
        variant: "destructive",
      })
      return
    }

    setAssociating(true)
    try {
      const { success, error } = await asociarProductoACatalogo(
        catalogoId,
        selectedProducto.id,
        precio,
        selectedProducto.costo,
      )

      if (error) throw new Error(error)

      toast({
        title: "Éxito",
        description: "Producto asociado al catálogo correctamente",
      })

      // Reset and refresh
      setShowAddModal(false)
      setSelectedProducto(null)
      setPrecioVenta("")
      cargarDatos()
    } catch (error: any) {
      console.error("Error asociando producto:", error.message)
      toast({
        title: "Error",
        description: "No se pudo asociar el producto al catálogo",
        variant: "destructive",
      })
    } finally {
      setAssociating(false)
    }
  }

  const handleViewProductoDetails = async (productoId: string) => {
    setIsDetailsLoading(true)
    setShowProductoDetailsModal(true)
    setSelectedProductoCompleto(null)
    setSelectedFormulasAsociadas([])
    setSelectedIngredientesAsociados([])
    setSelectedProductoDetails(null)

    try {
      const productoIdNum = Number.parseInt(productoId)

      // Get complete product information
      const productoResult = await obtenerProductoDetalladoCompleto(productoIdNum)
      if (productoResult.success && productoResult.data) {
        setSelectedProductoCompleto(productoResult.data)
      }

      // Get associated formulas
      const formulasResult = await obtenerFormulasAsociadasProducto(productoIdNum)
      if (formulasResult.success && formulasResult.data) {
        setSelectedFormulasAsociadas(formulasResult.data)
      }

      // Get associated ingredients
      const ingredientesResult = await obtenerIngredientesAsociadosProducto(productoIdNum)
      if (ingredientesResult.success && ingredientesResult.data) {
        setSelectedIngredientesAsociados(ingredientesResult.data)
      }

      // Get catalog associations
      const { success, data, error } = await getProductoDetailsForModal(productoIdNum)
      if (success && data) {
        setSelectedProductoDetails(data)
      }
    } catch (error) {
      console.error("Error loading detailed product information:", error)
      toast({
        title: "Error",
        description: "Error al cargar detalles del producto",
        variant: "destructive",
      })
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleEliminarProducto = async (productoId: string) => {
    if (!catalogoId) return

    if (!confirm("¿Está seguro de que desea eliminar este producto del catálogo?")) {
      return
    }

    try {
      const { success, error } = await eliminarProductoDeCatalogo(catalogoId, productoId)

      if (error) throw new Error(error)

      toast({
        title: "Éxito",
        description: "Producto eliminado del catálogo correctamente",
      })

      // Refresh the products list
      cargarDatos()
    } catch (error: any) {
      console.error("Error eliminando producto:", error.message)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del catálogo",
        variant: "destructive",
      })
    }
  }

  const handleEditarProducto = (producto: Producto) => {
    setEditingProducto(producto)
    setEditPrecioVenta(producto.precioventa?.toString() || "")
    setShowEditModal(true)
  }

  const handleActualizarPrecio = async () => {
    if (!editingProducto || !editPrecioVenta || !catalogoId) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    const precio = Number.parseFloat(editPrecioVenta)
    if (isNaN(precio) || precio <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese un precio válido",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const { success, error } = await actualizarPrecioProductoCatalogo(
        catalogoId,
        editingProducto.id,
        precio,
        editingProducto.costo,
      )

      if (error) throw new Error(error)

      toast({
        title: "Éxito",
        description: "Precio actualizado correctamente",
      })

      // Reset and refresh
      setShowEditModal(false)
      setEditingProducto(null)
      setEditPrecioVenta("")
      cargarDatos()
    } catch (error: any) {
      console.error("Error actualizando precio:", error.message)
      toast({
        title: "Error",
        description: "No se pudo actualizar el precio",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
          <p className="text-lg font-semibold text-gray-800">Cargando Catálogo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/catalogos")}
              className="hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catálogo: {catalogoInfo?.nombre}</h1>
              <p className="text-gray-600">Cliente: {catalogoInfo?.cliente?.nombre || "N/A"}</p>
            </div>
          </div>
          <Button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg backdrop-blur-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Productos
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 gap-6">
          {productos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos en este catálogo</h3>
                <p className="text-gray-500">Comienza agregando productos usando el botón "Agregar Productos"</p>
              </div>
            </div>
          ) : (
            productos.map((producto) => (
              <Card
                key={producto.id}
                className="rounded-xs text-card-foreground group relative overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-2 left-2 z-20 flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 bg-blue-500/80 hover:bg-blue-600/90 text-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditarProducto(producto)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600/90 text-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEliminarProducto(producto.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative z-10">
                  <div
                    className="aspect-square relative overflow-hidden cursor-pointer"
                    onClick={() => handleViewProductoDetails(producto.id)}
                  >
                    <Image
                      src={producto.imgurl || "/placeholder.svg?height=300&width=300&query=producto"}
                      alt={producto.nombre}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                        ${producto.costo.toFixed(2)}
                      </Badge>
                    </div>*/}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {producto.descripcion || "Sin descripción"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                        <span className="text-lg font-bold text-green-600">
                          ${producto.precioventa?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add Products Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] backdrop-blur-md bg-white/10 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Agregar Productos al Catálogo</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
              {/* Available Products */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Productos Disponibles</h3>
                <ScrollArea className="h-full">
                  {loadingModal ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : productosDisponibles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay productos disponibles para agregar</div>
                  ) : (
                    <div className="grid gap-3">
                      {productosDisponibles.map((producto) => (
                        <Card
                          key={producto.id}
                          className={`cursor-pointer transition-all duration-200 backdrop-blur-sm bg-white/20 border border-white/30 hover:bg-white/30 ${
                            selectedProducto?.id === producto.id ? "ring-2 ring-purple-500 bg-purple-100/30" : ""
                          }`}
                          onClick={() => handleSelectProducto(producto)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                <Image
                                  src={producto.imgurl || "/placeholder.svg?height=48&width=48&query=producto"}
                                  alt={producto.nombre}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{producto.nombre}</h4>
                                <p className="text-sm text-gray-600 truncate">${producto.costo.toFixed(2)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Product Details and Association */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Detalles del Producto</h3>
                {selectedProducto ? (
                  <div className="space-y-4">
                    <Card className="backdrop-blur-sm bg-white/20 border border-white/30">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <Image
                              src={selectedProducto.imgurl || "/placeholder.svg"}
                              alt={selectedProducto.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{selectedProducto.nombre}</h4>
                            <p className="text-gray-600 mb-2">{selectedProducto.descripcion}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Presentación:</span>
                                <p className="text-gray-600">{selectedProducto.presentacion}</p>
                              </div>
                              <div>
                                <span className="font-medium">Costo:</span>
                                <p className="text-gray-600">${selectedProducto.costo.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precioVenta}
                          onChange={(e) => setPrecioVenta(e.target.value)}
                          placeholder="Ingrese el precio de venta"
                          className="backdrop-blur-sm bg-white/20 border border-white/30"
                        />
                      </div>

                      <Button
                        onClick={handleAsociarProducto}
                        disabled={!precioVenta || associating}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        {associating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Asociando...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Asociar Producto
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Selecciona un producto para ver sus detalles</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showProductoDetailsModal} onOpenChange={setShowProductoDetailsModal}>
          <DialogContent className="max-w-6xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Detalles del Producto</DialogTitle>
              <DialogDescription>Información completa del producto seleccionado.</DialogDescription>
            </DialogHeader>
            {isDetailsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando detalles...</span>
              </div>
            ) : selectedProductoCompleto ? (
              <div className="grid gap-6 py-4">
                {/* Información Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Imagen y datos básicos */}
                  <div className="space-y-4">
                    {selectedProductoCompleto.imgurl && (
                      <img
                        src={selectedProductoCompleto.imgurl || "/placeholder.svg"}
                        alt={selectedProductoCompleto.nombre}
                        className="w-full h-64 object-cover rounded-xs shadow-md"
                      />
                    )}
                    <div className="bg-gray-50 p-4 rounded-xs">
                      <h3 className="text-xl font-bold mb-2">{selectedProductoCompleto.nombre}</h3>
                      <p className="text-gray-600 mb-3">{selectedProductoCompleto.descripcion}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <span className="font-medium">Costo:</span> {formatCurrency(selectedProductoCompleto.costo)}
                        </p>
                        <p>
                          <span className="font-medium">Estado:</span>{" "}
                          {selectedProductoCompleto.activo ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información detallada */}
                  <div className="space-y-4">
                    {/* Porciones */}
                    <div className="bg-blue-50 p-4 rounded-xs">
                      <h4 className="font-semibold text-blue-800 mb-2">Información de Porciones</h4>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <p>
                          <span className="font-medium">Presentación:</span>{" "}
                          {selectedProductoCompleto.presentacion || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Porción:</span> {selectedProductoCompleto.porcion || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Porción por envase:</span>{" "}
                          {selectedProductoCompleto.porcionenvase || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Modo de Uso */}
                    <div className="bg-green-50 p-4 rounded-xs">
                      <h4 className="font-semibold text-green-800 mb-2">Modo de Uso</h4>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <p>
                          <span className="font-medium">Modo de uso:</span> {selectedProductoCompleto.modouso || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Categoría de uso:</span>{" "}
                          {selectedProductoCompleto.categoriauso || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Edad mínima:</span>{" "}
                          {selectedProductoCompleto.edadminima || "N/A"} años
                        </p>
                        <p>
                          <span className="font-medium">Instrucciones:</span>{" "}
                          {selectedProductoCompleto.instruccionesingesta || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Advertencias:</span>{" "}
                          {selectedProductoCompleto.advertencia || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Almacenamiento:</span>{" "}
                          {selectedProductoCompleto.condicionesalmacenamiento || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Detalles Adicionales */}
                    <div className="bg-purple-50 p-4 rounded-xs">
                      <h4 className="font-semibold text-purple-800 mb-2">Detalles Adicionales</h4>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <p>
                          <span className="font-medium">Vida de anaquel:</span>{" "}
                          {selectedProductoCompleto.vidaanaquelmeses || "N/A"} meses
                        </p>
                        <p>
                          <span className="font-medium">Propósito principal:</span>{" "}
                          {selectedProductoCompleto.propositoprincipal || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Propuesta de valor:</span>{" "}
                          {selectedProductoCompleto.propuestavalor || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fórmulas Asociadas */}
                {selectedFormulasAsociadas.length > 0 && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 mb-3">Fórmulas Asociadas</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-emerald-200">
                            <th className="text-left py-2 font-medium">Fórmula</th>
                            <th className="text-left py-2 font-medium">Cantidad</th>
                            <th className="text-left py-2 font-medium">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFormulasAsociadas.map((formula, idx) => (
                            <tr key={idx} className="border-b border-emerald-100">
                              <td className="py-2">{formula.formula}</td>
                              <td className="py-2">{formula.cantidad}</td>
                              <td className="py-2">{formatCurrency(formula.costoparcial)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Ingredientes Asociados */}
                {selectedIngredientesAsociados.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-3">Ingredientes Asociados</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-orange-200">
                            <th className="text-left py-2 font-medium">Ingrediente</th>
                            <th className="text-left py-2 font-medium">Cantidad</th>
                            <th className="text-left py-2 font-medium">Costo Parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedIngredientesAsociados.map((ingrediente, idx) => (
                            <tr key={idx} className="border-b border-orange-100">
                              <td className="py-2">{ingrediente.ingrediente}</td>
                              <td className="py-2">{ingrediente.cantidad}</td>
                              <td className="py-2">{formatCurrency(ingrediente.costoparcial)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Asociaciones con Catálogos */}
                {selectedProductoDetails && selectedProductoDetails.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Asociaciones con Catálogos</h4>
                    <div className="grid gap-3">
                      {selectedProductoDetails.map((detail, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p>
                              <span className="font-medium">Cliente:</span> {detail.Cliente}
                            </p>
                            <p>
                              <span className="font-medium">Catálogo:</span> {detail.Catalogo}
                            </p>
                            <p>
                              <span className="font-medium">Precio de Venta:</span> {formatCurrency(detail.precioventa)}
                            </p>
                            <p>
                              <span className="font-medium">Margen:</span>{" "}
                              {detail.margenutilidad !== null ? `${detail.margenutilidad}%` : "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron detalles para este producto.
              </div>
            )}
            <DialogFooter>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogPrimitive.Close>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Price Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md backdrop-blur-md bg-white/10 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Editar Precio del Producto</DialogTitle>
            </DialogHeader>

            {editingProducto && (
              <div className="space-y-4">
                <Card className="backdrop-blur-sm bg-white/20 border border-white/30">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={editingProducto.imgurl || "/placeholder.svg"}
                          alt={editingProducto.nombre}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{editingProducto.nombre}</h4>
                        <p className="text-sm text-gray-600 mb-2">{editingProducto.descripcion}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Presentación:</span>
                            <p className="text-gray-600">{editingProducto.presentacion}</p>
                          </div>
                          <div>
                            <span className="font-medium">Costo:</span>
                            <p className="text-gray-600">${editingProducto.costo.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrecioVenta}
                    onChange={(e) => setEditPrecioVenta(e.target.value)}
                    placeholder="Ingrese el nuevo precio de venta"
                    className="backdrop-blur-sm bg-white/20 border border-white/30"
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="backdrop-blur-sm bg-white/20 border border-white/30"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleActualizarPrecio}
                    disabled={!editPrecioVenta || updating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar Precio"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
