"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import Image from "next/image"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Upload, X, Trash2 } from "lucide-react"

import {
  obtenerProductoCompleto,
  actualizarProductoEtapa1,
  listaDesplegableClientesProductos,
  obtenerFormulas,
  obtenerZonas,
  obtenerCatalogosPorCliente,
  obtenerUnidadMedidaFormula,
  agregarFormulaAProducto,
  obtenerFormulasAgregadas,
  eliminarFormulaDeProducto,
  obtenerIngredientes,
  getIngredientDetails,
  verificarIngredienteDuplicadoProducto,
  agregarIngredienteAProducto,
  obtenerIngredientesAgregados,
  eliminarIngredienteDeProducto,
  obtenerCostoTotalProducto,
  actualizarCostoProducto, // Added import
} from "@/app/actions/productos-actions"

// Interfaces
interface FormData {
  nombre: string
  descripcion: string
  clienteid: number
  catalogoid: number | null
  presentacion: string
  porcion: string
  modouso: string
  porcionenvase: string
  formaid: number | null
  categoriauso: string
  propositoprincipal: string
  propuestavalor: string
  instruccionesingesta: string
  edadminima: number
  advertencia: string
  condicionesalmacenamiento: string
  vidaanaquelmeses: number
  activo: boolean
  zonaid: number | null
  imagen?: File
}

interface Cliente {
  id: number
  nombre: string
}

interface Formula {
  id: number
  nombre: string
  costo: number
  cantidad: number
}

interface Zona {
  id: number
  nombre: string
}

interface Catalogo {
  id: number
  nombre: string
}

interface FormulaAgregada {
  id: number
  formulaId: number
  nombre: string
  cantidad: number
  costo: number
  costoParcial: number
}

interface Ingrediente {
  id: number
  codigo: string
  nombre: string
  costo: number
  unidadmedidaid: number
}

function EditarProductoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const productoId = searchParams.get("getProductoId")

  // Estados para el formulario por etapas
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false)

  // Estados para los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    descripcion: "",
    clienteid: 0,
    catalogoid: null,
    presentacion: "",
    porcion: "",
    modouso: "",
    porcionenvase: "",
    formaid: null,
    categoriauso: "",
    propositoprincipal: "",
    propuestavalor: "",
    instruccionesingesta: "",
    edadminima: 0,
    advertencia: "",
    condicionesalmacenamiento: "",
    vidaanaquelmeses: 0,
    activo: true,
    zonaid: null,
    imagen: undefined,
  })

  const [showValidationModal, setShowValidationModal] = useState(false)
  const [showValidationStep2Modal, setShowValidationStep2Modal] = useState(false)
  const [costoTotal, setCostoTotal] = useState(0)

  const [imagePreview, setImagePreview] = useState<string>("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [formulaCantidad, setFormulaCantidad] = useState("")
  const [formulaUnidadMedida, setFormulaUnidadMedida] = useState("")
  const [formulasAgregadas, setFormulasAgregadas] = useState<FormulaAgregada[]>([])

  const [porcionesOpen, setPorcionesOpen] = useState(false)
  const [modoUsoOpen, setModoUsoOpen] = useState(false)
  const [detallesOpen, setDetallesOpen] = useState(false)

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [ingredientesAgregados, setIngredientesAgregados] = useState<any[]>([])
  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("")
  const [filteredIngredientes, setFilteredIngredientes] = useState<Ingrediente[]>([])
  const [showIngredienteDropdown, setShowIngredienteDropdown] = useState(false)
  const [selIngredienteId, setSelIngredienteId] = useState("")
  const [selIngredienteCantidad, setSelIngredienteCantidad] = useState("")
  const [selIngredienteUnidad, setSelIngredienteUnidad] = useState("")
  const [selIngredienteCosto, setSelIngredienteCosto] = useState("")
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState("")

  const [errorMessage, setErrorMessage] = useState("")
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formulaCosto, setFormulaCosto] = useState("")
  const [formulaRangoCantidad, setFormulaRangoCantidad] = useState(1)
  const [formulaCantidadMaxima, setFormulaCantidadMaxima] = useState(1)
  const [showDeleteFormulaModal, setShowDeleteFormulaModal] = useState(false)
  const [showDeleteIngredienteModal, setShowDeleteIngredienteModal] = useState(false)
  const [deleteFormulaId, setDeleteFormulaId] = useState<number | null>(null)
  const [deleteIngredienteId, setDeleteIngredienteId] = useState<number | null>(null)

  const steps = [
    { number: 1, title: "Información Básica", description: "Datos generales del producto" },
    { number: 2, title: "Agregar Elementos", description: "Ingredientes y fórmulas" },
    { number: 3, title: "Resumen y Confirmación", description: "Revisar información" },
    { number: 4, title: "Finalización", description: "Producto actualizado" },
  ]

  // Cargar datos del producto al inicializar
  useEffect(() => {
    const loadProductoData = async () => {
      if (!productoId) {
        toast.error("ID de producto no válido")
        router.push("/productos")
        return
      }

      try {
        setIsLoading(true)

        // Cargar datos del producto
        const productoResult = await obtenerProductoCompleto(Number.parseInt(productoId))
        if (!productoResult.success) {
          toast.error("Error al cargar el producto")
          router.push("/productos")
          return
        }

        const producto = productoResult.data
        setFormData({
          nombre: producto.nombre || "",
          descripcion: producto.descripcion || "",
          clienteid: producto.clienteid || 0,
          catalogoid: producto.catalogoid || null,
          presentacion: producto.presentacion || "",
          porcion: producto.porcion || "",
          modouso: producto.modouso || "",
          porcionenvase: producto.porcionenvase || "",
          formaid: producto.formaid || null,
          categoriauso: producto.categoriauso || "",
          propositoprincipal: producto.propositoprincipal || "",
          propuestavalor: producto.propuestavalor || "",
          instruccionesingesta: producto.instruccionesingesta || "",
          edadminima: producto.edadminima || 0,
          advertencia: producto.advertencia || "",
          condicionesalmacenamiento: producto.condicionesalmacenamiento || "",
          vidaanaquelmeses: producto.vidaanaquelmeses || 0,
          activo: producto.activo !== false,
          zonaid: producto.zonaid || null,
        })

        if (producto.imgurl) {
          setImagePreview(producto.imgurl)
        }

        // Cargar datos iniciales
        const [clientesResult, formulasResult, zonasResult, ingredientesResult] = await Promise.all([
          loadClientes(),
          obtenerFormulas(),
          obtenerZonas(),
          obtenerIngredientes(),
        ])

        if (clientesResult.success) setClientes(clientesResult.data)
        if (formulasResult.success) setFormulas(formulasResult.data)
        if (zonasResult.success) setZonas(zonasResult.data)
        if (ingredientesResult.success) {
          setIngredientes(ingredientesResult.data)
          setFilteredIngredientes(ingredientesResult.data)
        }

        // Cargar catálogos si hay cliente seleccionado
        if (producto.clienteid) {
          const catalogosResult = await obtenerCatalogosPorCliente(producto.clienteid)
          if (catalogosResult.success) setCatalogos(catalogosResult.data)
        }

        // Cargar elementos agregados
        const [formulasAgregadasResult, ingredientesAgregadosResult] = await Promise.all([
          obtenerFormulasAgregadas(Number.parseInt(productoId)),
          obtenerIngredientesAgregados(Number.parseInt(productoId)),
        ])

        if (formulasAgregadasResult.success) setFormulasAgregadas(formulasAgregadasResult.data)
        if (ingredientesAgregadosResult.success) setIngredientesAgregados(ingredientesAgregadosResult.data)
      } catch (error) {
        console.error("Error loading producto data:", error)
        toast.error("Error al cargar los datos del producto")
        router.push("/productos")
      } finally {
        setIsLoading(false)
      }
    }

    loadProductoData()
  }, [productoId, router])

  const loadClientes = async () => {
    try {
      const session = await getSession()
      let clienteIdParam = "-1"

      if (session?.RolId && [1, 2, 3].includes(session.RolId)) {
        clienteIdParam = "-1"
      } else if (session?.ClienteId) {
        clienteIdParam = session.ClienteId.toString()
      }

      return await listaDesplegableClientesProductos(clienteIdParam, "")
    } catch (error) {
      console.error("Error loading clientes:", error)
      return { success: false, data: [] }
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClienteChange = async (clienteId: string) => {
    const clienteIdNum = Number.parseInt(clienteId)
    handleInputChange("clienteid", clienteIdNum)
    handleInputChange("catalogoid", null)

    if (clienteIdNum > 0) {
      const catalogosResult = await obtenerCatalogosPorCliente(clienteIdNum)
      if (catalogosResult.success) {
        setCatalogos(catalogosResult.data)
      }
    } else {
      setCatalogos([])
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleInputChange("imagen", file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.nombre.trim()) {
        toast.error("El nombre del producto es requerido")
        return
      }

      setIsLoading(true)
      try {
        const formDataToSend = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (key === "imagen" && value instanceof File) {
            formDataToSend.append(key, value)
          } else if (value !== null && value !== undefined) {
            formDataToSend.append(key, value.toString())
          }
        })

        const result = await actualizarProductoEtapa1(Number.parseInt(productoId!), formDataToSend)
        if (result.success) {
          setCurrentStep((prev) => prev + 1)
          toast.success("Información básica actualizada")
        } else {
          toast.error("Error al actualizar el producto: " + result.error)
        }
      } catch (error) {
        console.error("Error updating product:", error)
        toast.error("Error al actualizar el producto")
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 2) {
      // Validar que tenga al menos una fórmula o ingrediente
      if (productoId) {
        try {
          const [formulasResult, ingredientesResult] = await Promise.all([
            obtenerFormulasAgregadas(Number.parseInt(productoId)),
            obtenerIngredientesAgregados(Number.parseInt(productoId)),
          ])

          const currentFormulas = formulasResult.success ? formulasResult.data : []
          const currentIngredientes = ingredientesResult.success ? ingredientesResult.data : []

          if (currentFormulas.length === 0 && currentIngredientes.length === 0) {
            setShowValidationStep2Modal(true)
            return
          }

          setCurrentStep((prev) => prev + 1)
        } catch (error) {
          console.error("Error validating step 2:", error)
          setShowValidationStep2Modal(true)
          return
        }
      }
    } else if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setShowUpdateConfirmModal(true)
  }

  const handleConfirmUpdate = async () => {
    setShowUpdateConfirmModal(false)
    setShowSuccessAnimation(true)

    try {
      // Update product cost with total from formulas and ingredients
      const result = await actualizarCostoProducto(Number.parseInt(productoId))

      if (!result.success) {
        alert("Error al actualizar el costo del producto: " + result.error)
        setShowSuccessAnimation(false)
        return
      }

      setTimeout(() => {
        setShowSuccessAnimation(false)
        setCurrentStep(4)
        setTimeout(() => {
          router.push("/productos")
        }, 2000)
      }, 4000)
    } catch (error) {
      console.error("Error actualizando producto:", error)
      alert("Error al actualizar el producto")
      setShowSuccessAnimation(false)
    }
  }

  // Funciones para fórmulas
  const handleFormulaChange = async (formulaId: string) => {
    if (formulaId) {
      const formula = formulas.find((f) => f.id === Number.parseInt(formulaId))
      if (formula) {
        setFormulaCosto(formula.costo.toString())
        setFormulaCantidadMaxima(formula.cantidad)
        setFormulaRangoCantidad(1)

        const unidadResult = await obtenerUnidadMedidaFormula(formula.id)
        if (unidadResult.success) {
          setFormulaUnidadMedida(unidadResult.data.descripcion)
        }
      }
    } else {
      setFormulaCosto("")
      setFormulaUnidadMedida("")
      setFormulaCantidadMaxima(1)
      setFormulaRangoCantidad(1)
    }
  }

  const handleAgregarFormula = async () => {
    if (!formData.formaid || !productoId) {
      toast.error("Selecciona una fórmula")
      return
    }

    try {
      const costoUnitario = Number.parseFloat(formulaCosto)
      const cantidadAgregada = formulaRangoCantidad
      const cantidadMaxima = formulaCantidadMaxima

      const costoParcial = costoUnitario / (cantidadMaxima / cantidadAgregada)

      const result = await agregarFormulaAProducto(
        Number.parseInt(productoId),
        formData.formaid,
        cantidadAgregada,
        costoParcial,
      )

      if (result.success) {
        const formulasResult = await obtenerFormulasAgregadas(Number.parseInt(productoId))
        if (formulasResult.success) {
          setFormulasAgregadas(formulasResult.data)
        }
        toast.success("Fórmula agregada correctamente")
        handleInputChange("formaid", null)
        setFormulaCosto("")
        setFormulaUnidadMedida("")
        setFormulaRangoCantidad(1)
      } else {
        toast.error("Error al agregar fórmula: " + result.error)
      }
    } catch (error) {
      console.error("Error adding formula:", error)
      toast.error("Error al agregar fórmula")
    }
  }

  const handleEliminarFormula = async () => {
    if (!deleteFormulaId || !productoId) return

    try {
      const result = await eliminarFormulaDeProducto(deleteFormulaId)
      if (result.success) {
        const formulasResult = await obtenerFormulasAgregadas(Number.parseInt(productoId))
        if (formulasResult.success) {
          setFormulasAgregadas(formulasResult.data)
        }
        toast.success("Fórmula eliminada correctamente")
      } else {
        toast.error("Error al eliminar fórmula")
      }
    } catch (error) {
      console.error("Error deleting formula:", error)
      toast.error("Error al eliminar fórmula")
    }

    setShowDeleteFormulaModal(false)
    setDeleteFormulaId(null)
  }

  // Funciones para ingredientes
  const handleIngredienteSearch = (searchTerm: string) => {
    setIngredienteSearchTerm(searchTerm)
    if (searchTerm.trim() === "") {
      setFilteredIngredientes(ingredientes)
      setShowIngredienteDropdown(false)
    } else {
      const filtered = ingredientes.filter(
        (ing) =>
          ing.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredIngredientes(filtered)
      setShowIngredienteDropdown(true)
    }
  }

  const handleIngredienteSelect = async (ingrediente: Ingrediente) => {
    setIngredienteSearchTerm(ingrediente.nombre)
    setSelIngredienteId(ingrediente.id.toString())
    setShowIngredienteDropdown(false)

    const details = await getIngredientDetails(ingrediente.id)
    if (details.success) {
      setSelIngredienteCosto(details.data.costo.toString())
      setSelIngredienteUnidad(details.data.unidadMedida)
    }
  }

  const handleAgregarIngrediente = async () => {
    if (!selIngredienteId || !selIngredienteCantidad || !productoId) {
      toast.error("Completa todos los campos del ingrediente")
      return
    }

    try {
      // Verificar duplicado
      const duplicateCheck = await verificarIngredienteDuplicadoProducto(
        Number.parseInt(productoId),
        Number.parseInt(selIngredienteId),
      )

      if (duplicateCheck.success && duplicateCheck.exists) {
        setDuplicateMessage("Este ingrediente ya está agregado al producto")
        setShowDuplicateModal(true)
        return
      }

      const result = await agregarIngredienteAProducto(
        Number.parseInt(productoId),
        Number.parseInt(selIngredienteId),
        Number.parseFloat(selIngredienteCantidad),
        Number.parseFloat(selIngredienteCosto),
      )

      if (result.success) {
        const ingredientesResult = await obtenerIngredientesAgregados(Number.parseInt(productoId))
        if (ingredientesResult.success) {
          setIngredientesAgregados(ingredientesResult.data)
        }
        toast.success("Ingrediente agregado correctamente")
        setIngredienteSearchTerm("")
        setSelIngredienteId("")
        setSelIngredienteCantidad("")
        setSelIngredienteUnidad("")
        setSelIngredienteCosto("")
      } else {
        toast.error("Error al agregar ingrediente: " + result.error)
      }
    } catch (error) {
      console.error("Error adding ingredient:", error)
      toast.error("Error al agregar ingrediente")
    }
  }

  const handleEliminarIngrediente = async () => {
    if (!deleteIngredienteId || !productoId) return

    try {
      const result = await eliminarIngredienteDeProducto(deleteIngredienteId)
      if (result.success) {
        const ingredientesResult = await obtenerIngredientesAgregados(Number.parseInt(productoId))
        if (ingredientesResult.success) {
          setIngredientesAgregados(ingredientesResult.data)
        }
        toast.success("Ingrediente eliminado correctamente")
      } else {
        toast.error("Error al eliminar ingrediente")
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error)
      toast.error("Error al eliminar ingrediente")
    }

    setShowDeleteIngredienteModal(false)
    setDeleteIngredienteId(null)
  }

  // Cargar costo total para el resumen
  useEffect(() => {
    const loadCostoTotal = async () => {
      if (currentStep === 3 && productoId) {
        const costoResult = await obtenerCostoTotalProducto(Number.parseInt(productoId))
        if (costoResult.success) {
          setCostoTotal(costoResult.total)
        }
      }
    }
    loadCostoTotal()
  }, [currentStep, productoId])

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left side - Form inputs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-slate-700 font-medium">
                Nombre del Producto *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ingresa el nombre del producto"
                className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente" className="text-slate-700 font-medium">
                Cliente *
              </Label>
              <Select value={formData.clienteid.toString()} onValueChange={handleClienteChange} disabled>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/*<div className="space-y-2">
              <Label htmlFor="catalogo" className="text-slate-700 font-medium">
                Catálogo
              </Label>
              <Select
                value={formData.catalogoid?.toString() || ""}
                onValueChange={(value) => handleInputChange("catalogoid", value ? Number.parseInt(value) : null)}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
                  <SelectValue placeholder="Selecciona un catálogo" />
                </SelectTrigger>
                <SelectContent>
                  {catalogos.map((catalogo) => (
                    <SelectItem key={catalogo.id} value={catalogo.id.toString()}>
                      {catalogo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            */}

            <div className="space-y-2">
              <Label htmlFor="zona" className="text-slate-700 font-medium">
                Zona
              </Label>
              <Select
                value={formData.zonaid?.toString() || ""}
                onValueChange={(value) => handleInputChange("zonaid", value ? Number.parseInt(value) : null)}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonas.map((zona) => (
                    <SelectItem key={zona.id} value={zona.id.toString()}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="descripcion" className="text-slate-700 font-medium">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Describe el producto"
              rows={3}
              className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>
        </div>

        {/* Sección Porciones */}
        <Collapsible open={porcionesOpen} onOpenChange={setPorcionesOpen}>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs shadow-sm">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors rounded-xs">
              <h3 className="text-lg font-semibold text-slate-700">Porciones</h3>
              {porcionesOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="presentacion" className="text-slate-700 font-medium">
                      Presentación
                    </Label>
                    <Input
                      id="presentacion"
                      value={formData.presentacion}
                      onChange={(e) => handleInputChange("presentacion", e.target.value)}
                      placeholder="Ej: Cápsulas, Polvo, Líquido"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="porcion" className="text-slate-700 font-medium">
                      Porción
                    </Label>
                    <Input
                      id="porcion"
                      value={formData.porcion}
                      onChange={(e) => handleInputChange("porcion", e.target.value)}
                      placeholder="Ej: 2 cápsulas, 1 cucharada"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="porcionenvase" className="text-slate-700 font-medium">
                      Porción por Envase
                    </Label>
                    <Input
                      id="porcionenvase"
                      value={formData.porcionenvase}
                      onChange={(e) => handleInputChange("porcionenvase", e.target.value)}
                      placeholder="Ej: 30 porciones"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Sección Modo Uso */}
        <Collapsible open={modoUsoOpen} onOpenChange={setModoUsoOpen}>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs shadow-sm">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors rounded-xs">
              <h3 className="text-lg font-semibold text-slate-700">Modo Uso</h3>
              {modoUsoOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="modouso" className="text-slate-700 font-medium">
                      Modo de Uso
                    </Label>
                    <Textarea
                      id="modouso"
                      value={formData.modouso}
                      onChange={(e) => handleInputChange("modouso", e.target.value)}
                      placeholder="Instrucciones de uso"
                      rows={3}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoriauso" className="text-slate-700 font-medium">
                      Categoría de Uso
                    </Label>
                    <Input
                      id="categoriauso"
                      value={formData.categoriauso}
                      onChange={(e) => handleInputChange("categoriauso", e.target.value)}
                      placeholder="Ej: Suplemento, Alimento, etc."
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edadminima" className="text-slate-700 font-medium">
                      Edad Mínima
                    </Label>
                    <Input
                      id="edadminima"
                      type="number"
                      value={formData.edadminima}
                      onChange={(e) => handleInputChange("edadminima", Number.parseInt(e.target.value) || 0)}
                      placeholder="Edad mínima recomendada"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instruccionesingesta" className="text-slate-700 font-medium">
                      Instrucciones de Ingesta
                    </Label>
                    <Textarea
                      id="instruccionesingesta"
                      value={formData.instruccionesingesta}
                      onChange={(e) => handleInputChange("instruccionesingesta", e.target.value)}
                      placeholder="Cómo consumir el producto"
                      rows={3}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advertencia" className="text-slate-700 font-medium">
                      Advertencias
                    </Label>
                    <Textarea
                      id="advertencia"
                      value={formData.advertencia}
                      onChange={(e) => handleInputChange("advertencia", e.target.value)}
                      placeholder="Advertencias importantes"
                      rows={3}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condicionesalmacenamiento" className="text-slate-700 font-medium">
                      Condiciones de Almacenamiento
                    </Label>
                    <Textarea
                      id="condicionesalmacenamiento"
                      value={formData.condicionesalmacenamiento}
                      onChange={(e) => handleInputChange("condicionesalmacenamiento", e.target.value)}
                      placeholder="Cómo almacenar el producto"
                      rows={3}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Sección Detalles Adicionales */}
        <Collapsible open={detallesOpen} onOpenChange={setDetallesOpen}>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs shadow-sm">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors rounded-xs">
              <h3 className="text-lg font-semibold text-slate-700">Detalles Adicionales</h3>
              {detallesOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vidaanaquelmeses" className="text-slate-700 font-medium">
                      Vida de Anaquel (meses)
                    </Label>
                    <Input
                      id="vidaanaquelmeses"
                      type="number"
                      value={formData.vidaanaquelmeses}
                      onChange={(e) => handleInputChange("vidaanaquelmeses", Number.parseInt(e.target.value) || 0)}
                      placeholder="Meses de vida útil"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propositoprincipal" className="text-slate-700 font-medium">
                      Propósito Principal
                    </Label>
                    <Input
                      id="propositoprincipal"
                      value={formData.propositoprincipal}
                      onChange={(e) => handleInputChange("propositoprincipal", e.target.value)}
                      placeholder="Objetivo principal del producto"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propuestavalor" className="text-slate-700 font-medium">
                      Propuesta de Valor
                    </Label>
                    <Input
                      id="propuestavalor"
                      value={formData.propuestavalor}
                      onChange={(e) => handleInputChange("propuestavalor", e.target.value)}
                      placeholder="Valor único del producto"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Right side - Image upload and preview */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-4 shadow-sm h-full">
          <div className="space-y-4">
            <Label className="text-slate-700 font-medium">Imagen del Producto</Label>

            {/* Image preview area */}
            <div className="relative">
              {imagePreview ? (
                <div className="relative group">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-xl border-2 border-slate-200/60 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 hover:bg-white text-slate-700"
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => {
                      setImagePreview("")
                      handleInputChange("imagen", undefined)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 text-center">
                    Haz clic para subir
                    <br />
                    una imagen
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-sky-400 hover:bg-sky-50/50"
            >
              <Upload className="h-4 w-4" />
              {formData.imagen ? "Cambiar Imagen" : "Subir Imagen"}
            </Button>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-6 shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-6">Agregar Elementos</h3>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-700">Fórmula Asociada</h4>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="formula" className="text-slate-700 font-medium">
                  Fórmula
                </Label>
                <Select
                  value={formData.formaid?.toString() || ""}
                  onValueChange={(value) => {
                    const formulaId = value ? Number.parseInt(value) : null
                    handleInputChange("formaid", formulaId)
                    handleFormulaChange(value)
                  }}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
                    <SelectValue placeholder="Selecciona una fórmula" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id.toString()}>
                        {formula.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidadmedida" className="text-slate-700 font-medium">
                  Unidad de Medida
                </Label>
                <Input
                  id="unidadmedida"
                  value={formulaUnidadMedida}
                  readOnly
                  placeholder="Unidad automática"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo" className="text-slate-700 font-medium">
                  Costo
                </Label>
                <Input
                  id="costo"
                  value={formulaCosto}
                  readOnly
                  placeholder="Costo automático"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rangocantidad" className="text-slate-700 font-medium">
                  Rango de Cantidad
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[formulaRangoCantidad]}
                    onValueChange={(value) => setFormulaRangoCantidad(value[0])}
                    max={formulaCantidadMaxima}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-center text-slate-600">{formulaRangoCantidad}</div>
                </div>
              </div>

              <div className="flex items-end col-span-2">
                <Button
                  onClick={handleAgregarFormula}
                  disabled={!formData.formaid}
                  className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
                >
                  Agregar Fórmula
                </Button>
              </div>
            </div>

            {/* Tabla de fórmulas agregadas */}
            {formulasAgregadas.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-slate-700">Fórmulas Agregadas</h4>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Fórmula</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Cantidad</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Costo Parcial</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulasAgregadas.map((formula) => (
                        <tr key={formula.id} className="border-t border-slate-200/60 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">{formula.nombre}</td>
                          <td className="px-4 py-3 text-slate-700">{formula.cantidad}</td>
                          <td className="px-4 py-3 text-slate-700">${formula.costoParcial.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteFormulaId(formula.id)
                                setShowDeleteFormulaModal(true)
                              }}
                              className="hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-700">Ingredientes Adicionales</h4>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative space-y-2">
                <Label htmlFor="ingrediente" className="text-slate-700 font-medium">
                  Ingrediente
                </Label>
                <Input
                  id="ingrediente"
                  value={ingredienteSearchTerm}
                  onChange={(e) => handleIngredienteSearch(e.target.value)}
                  placeholder="Buscar ingrediente..."
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                />
                {showIngredienteDropdown && filteredIngredientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredIngredientes.map((ingrediente) => (
                      <div
                        key={ingrediente.id}
                        className="px-4 py-2 hover:bg-slate-100/80 cursor-pointer transition-colors"
                        onClick={() => handleIngredienteSelect(ingrediente)}
                      >
                        <div className="font-medium text-slate-700">{ingrediente.nombre}</div>
                        <div className="text-sm text-slate-500">Código: {ingrediente.codigo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredientecantidad" className="text-slate-700 font-medium">
                  Cantidad
                </Label>
                <Input
                  id="ingredientecantidad"
                  type="number"
                  value={selIngredienteCantidad}
                  onChange={(e) => setSelIngredienteCantidad(e.target.value)}
                  placeholder="Cantidad"
                  step="0.01"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredienteunidad" className="text-slate-700 font-medium">
                  Unidad
                </Label>
                <Input
                  id="ingredienteunidad"
                  value={selIngredienteUnidad}
                  readOnly
                  placeholder="Unidad automática"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredientecosto" className="text-slate-700 font-medium">
                  Costo
                </Label>
                <Input
                  id="ingredientecosto"
                  value={selIngredienteCosto}
                  readOnly
                  placeholder="Costo automático"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleAgregarIngrediente}
                  disabled={!selIngredienteId || !selIngredienteCantidad}
                  className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
                >
                  Agregar Ingrediente
                </Button>
              </div>
            </div>

            {/* Tabla de ingredientes agregados */}
            {ingredientesAgregados.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-slate-700">Ingredientes Agregados</h4>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Ingrediente</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Cantidad</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Unidad</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Costo Parcial</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientesAgregados.map((ingrediente) => (
                        <tr key={ingrediente.id} className="border-t border-slate-200/60 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">{ingrediente.nombre}</td>
                          <td className="px-4 py-3 text-slate-700">{ingrediente.cantidad}</td>
                          <td className="px-4 py-3 text-slate-700">{ingrediente.unidad}</td>
                          <td className="px-4 py-3 text-slate-700">
                            ${ingrediente.ingredientecostoparcial.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteIngredienteId(ingrediente.id)
                                setShowDeleteIngredienteModal(true)
                              }}
                              className="hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Resumen del Producto
        </h3>
        <p className="text-gray-600 mt-2">Revisa toda la información antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-white to-sky-50 rounded-lg p-6 border border-sky-100 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              Información Básica
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nombre del Producto</Label>
                <p className="text-base font-medium text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formData.nombre}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {clientes.find((c) => c.id === formData.clienteid)?.nombre || "No seleccionado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Catálogo</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {catalogos.find((c) => c.id === formData.catalogoid)?.nombre || "No seleccionado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Zona</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {zonas.find((z) => z.id === formData.zonaid)?.nombre || "No seleccionada"}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formData.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>
          </div>

          {/* Fórmulas agregadas */}
          {formulasAgregadas.length > 0 && (
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-lg p-6 border border-emerald-100 shadow-sm">
              <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Fórmulas Agregadas
              </h4>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-emerald-800 font-medium">Fórmula</th>
                      <th className="px-4 py-3 text-left text-emerald-800 font-medium">Cantidad</th>
                      <th className="px-4 py-3 text-left text-emerald-800 font-medium">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulasAgregadas.map((formula) => (
                      <tr key={formula.id} className="border-t border-emerald-100">
                        <td className="px-4 py-3 text-gray-900">{formula.nombre}</td>
                        <td className="px-4 py-3 text-gray-900">{formula.cantidad}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">${formula.costoParcial.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ingredientes agregados */}
          {ingredientesAgregados.length > 0 && (
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-lg p-6 border border-amber-100 shadow-sm">
              <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Ingredientes Agregados
              </h4>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-amber-800 font-medium">Ingrediente</th>
                      <th className="px-4 py-3 text-left text-amber-800 font-medium">Cantidad</th>
                      <th className="px-4 py-3 text-left text-amber-800 font-medium">Unidad</th>
                      <th className="px-4 py-3 text-left text-amber-800 font-medium">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientesAgregados.map((ingrediente) => (
                      <tr key={ingrediente.id} className="border-t border-amber-100">
                        <td className="px-4 py-3 text-gray-900">{ingrediente.nombre}</td>
                        <td className="px-4 py-3 text-gray-900">{ingrediente.cantidad}</td>
                        <td className="px-4 py-3 text-gray-900">{ingrediente.unidad}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          ${ingrediente.ingredientecostoparcial.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Costo total */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-green-800">Costo Total del Producto:</h4>
              <span className="text-2xl font-bold text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                ${costoTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Image */}
        {imagePreview && (
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm h-fit">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                Imagen del Producto
              </h4>
              <div className="relative">
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt="Producto"
                  width={300}
                  height={300}
                  className="w-full h-64 object-cover rounded-xl border-2 border-slate-200 shadow-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">¡Producto Actualizado Exitosamente!</h3>
      <p className="text-gray-600">El producto ha sido actualizado correctamente en el sistema.</p>
      <Button onClick={() => router.push("/productos")} className="mt-4">
        Volver a Productos
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/cargar.gif"
                alt="Cargando..."
                width={300}
                height={300}
                unoptimized
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Cargando producto...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-gray-600 mt-2">Modifica la información del producto siguiendo los pasos del asistente</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="relative">
          <div className="w-full h-3 bg-gradient-to-r from-slate-200/60 to-slate-300/60 rounded-full backdrop-blur-sm border border-slate-200/40 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 rounded-full shadow-lg backdrop-blur-sm border border-sky-300/30 transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep >= step.number
                      ? "bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg backdrop-blur-sm border border-sky-300/30"
                      : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 backdrop-blur-sm border border-slate-200/60"
                  }`}
                >
                  {step.number}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${currentStep >= step.number ? "text-sky-700" : "text-slate-600"}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <Card className="rounded-xs border text-card-foreground bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 backdrop-blur-sm">
          <CardTitle className="text-slate-800">{steps[currentStep - 1].title}</CardTitle>
          <CardDescription className="text-slate-600">{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-sky-400 hover:bg-sky-50/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep === 3 ? (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg"
              >
                {isLoading ? "Actualizando..." : "Actualizar Producto"}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg"
              >
                {isLoading ? "Procesando..." : "Siguiente"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AlertDialog open={showValidationStep2Modal} onOpenChange={setShowValidationStep2Modal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Información Faltante</AlertDialogTitle>
            <AlertDialogDescription>
              Debes agregar al menos una fórmula o un ingrediente al producto antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationStep2Modal(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUpdateConfirmModal} onOpenChange={setShowUpdateConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Actualización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas actualizar este producto con la información proporcionada?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>Sí, Actualizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteFormulaModal} onOpenChange={setShowDeleteFormulaModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta fórmula del producto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteFormulaId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminarFormula}>Sí, Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteIngredienteModal} onOpenChange={setShowDeleteIngredienteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este ingrediente del producto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteIngredienteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminarIngrediente}>Sí, Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ingrediente Duplicado</AlertDialogTitle>
            <AlertDialogDescription>{duplicateMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDuplicateModal(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Animation Modal */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-32 h-32">
                <Image
                  src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/productos.gif"
                  alt="matraz"
                  width={200}
                  height={200}
                  className="absolute inset-0 animate-bounce-slow"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 animate-pulse">
                  Actualizando Producto
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce" style={{ animationDelay: "0s" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                      .
                    </span>
                  </span>
                </h3>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-cyan-500 h-2 rounded-full animate-pulse"
                    style={{ width: "100%", animation: "progressFill 4s ease-in-out" }}
                  ></div>
                </div>

                <p className="text-gray-600 animate-fade-in">Procesando cambios del producto...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EditarProducto() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <EditarProductoContent />
    </Suspense>
  )
}
