"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Upload, ArrowLeft, ArrowRight, FileImage, Loader2, AlertTriangle } from "lucide-react"
import {
  crearProducto,
  obtenerClientes,
  obtenerFormulas,
  obtenerZonas,
  obtenerCatalogosPorCliente,
  obtenerUnidadMedidaFormula,
  agregarFormulaAProducto,
  obtenerFormulasAgregadas,
  eliminarFormulaDeProducto,
  agregarIngredienteAProducto,
  obtenerIngredientesAgregados,
  eliminarIngredienteDeProducto,
  verificarIngredienteDuplicadoProducto,
  obtenerIngredientes,
  getIngredientDetails,
  getUnidadMedidaFormula,
  obtenerCostoTotalProducto,
  finalizarProducto,
  eliminarProductoIncompleto,
} from "@/app/actions/productos-actions"
import Image from "next/image"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"

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
  cantidad?: number
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
  unidadMedidaId: number
}

export default function NuevoProducto() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setGuard } = useNavigationGuard()
  const resolveNavigationRef = useRef<((value: boolean) => void) | null>(null)

  // Estados para el formulario por etapas
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [costoTotal, setCostoTotal] = useState(0)

  const [imagePreview, setImagePreview] = useState<string>("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [formulaCantidad, setFormulaCantidad] = useState("")
  const [formulaUnidadMedida, setFormulaUnidadMedida] = useState("")
  const [formulasAgregadas, setFormulasAgregadas] = useState<FormulaAgregada[]>([])
  const [productoId, setProductoId] = useState<number | null>(null)

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

  const [showStep1ValidationModal, setShowStep1ValidationModal] = useState(false)
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false)
  const [nextPath, setNextPath] = useState("")

  const steps = [
    { number: 1, title: "Información Básica", description: "Datos generales del producto" },
    { number: 2, title: "Agregar Elementos", description: "Ingredientes y fórmulas" },
    { number: 3, title: "Resumen y Confirmación", description: "Revisar información" },
    { number: 4, title: "Finalización", description: "Producto creado" },
  ]

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientesResult, formulasResult, zonasResult, ingredientesResult] = await Promise.all([
          obtenerClientes(),
          obtenerFormulas(),
          obtenerZonas(),
          obtenerIngredientes(),
        ])

        if (clientesResult.success) setClientes(clientesResult.data)
        if (formulasResult.success) setFormulas(formulasResult.data)
        if (zonasResult.success) setZonas(zonasResult.data)
        if (ingredientesResult.success) setIngredientes(ingredientesResult.data)
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const loadCatalogos = async () => {
      if (formData.clienteid > 0) {
        try {
          const result = await obtenerCatalogosPorCliente(formData.clienteid)
          if (result.success) {
            setCatalogos(result.data)
          }
        } catch (error) {
          console.error("Error loading catalogs:", error)
        }
      } else {
        setCatalogos([])
        setFormData((prev) => ({ ...prev, catalogoid: null }))
      }
    }

    loadCatalogos()
  }, [formData.clienteid])

  useEffect(() => {
    const loadFormulaUnit = async () => {
      if (formData.formaid) {
        try {
          const result = await obtenerUnidadMedidaFormula(formData.formaid)
          if (result.success && result.data) {
            setFormulaUnidadMedida(result.data.descripcion)
          }
        } catch (error) {
          console.error("Error loading formula unit:", error)
        }
      } else {
        setFormulaUnidadMedida("")
      }
    }

    loadFormulaUnit()
  }, [formData.formaid])

  const cargarCostoTotal = async () => {
    if (productoId) {
      const result = await obtenerCostoTotalProducto(productoId)
      if (result.success) {
        setCostoTotal(result.total)
      }
    }
  }

  useEffect(() => {
    if (currentStep === 3 && productoId) {
      cargarCostoTotal()
    }
  }, [currentStep, productoId])

  useEffect(() => {
    const loadExistingElements = async () => {
      if (currentStep === 2 && productoId) {
        try {
          // Load existing formulas
          const formulasResult = await obtenerFormulasAgregadas(productoId)
          if (formulasResult.success && formulasResult.data) {
            setFormulasAgregadas(formulasResult.data)
          }

          // Load existing ingredients
          const ingredientesResult = await obtenerIngredientesAgregados(productoId)
          if (ingredientesResult.success && ingredientesResult.data) {
            setIngredientesAgregados(ingredientesResult.data)
          }
        } catch (error) {
          console.error("Error loading existing elements:", error)
        }
      }
    }

    loadExistingElements()
  }, [currentStep, productoId])

  const handleInputChange = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "formaid" && value) {
      const formula = formulas.find((f) => f.id === value)
      if (formula) {
        setFormulaCosto(formula.costo.toString())
        setFormulaCantidadMaxima(formula.cantidad || 1)
        setFormulaRangoCantidad(1)
        // Get unit of measure
        getUnidadMedidaFormula(value).then((result) => {
          if (result.success) {
            setFormulaUnidadMedida(result.data.descripcion)
          }
        })
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNextStep = async () => {
    console.log(currentStep)
    if (currentStep === 1) {
      console.log("etapa 1")

      if (!formData.nombre.trim() || !formData.clienteid || !formData.catalogoid || !formData.zonaid) {
        setShowStep1ValidationModal(true)
        return
      }

      // Create product in step 1
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

        const result = await crearProducto(formDataToSend)
        if (result.success) {
          setProductoId(result.data?.id || null)
          setCurrentStep((prev) => prev + 1)
        } else {
          alert("Error al crear el producto: " + result.error)
        }
      } catch (error) {
        console.error("Error creating product:", error)
        alert("Error al crear el producto")
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 2) {
      console.log("etapa 2")

      if (productoId) {
        try {
          const [formulasResult, ingredientesResult] = await Promise.all([
            obtenerFormulasAgregadas(productoId),
            obtenerIngredientesAgregados(productoId),
          ])

          const currentFormulas = formulasResult.success ? formulasResult.data : []
          const currentIngredientes = ingredientesResult.success ? ingredientesResult.data : []

          console.log("total de formulas actualizadas: ", currentFormulas.length)
          console.log("total de ingredientes actualizadas: ", currentIngredientes.length)

          if (currentFormulas.length === 0 && currentIngredientes.length === 0) {
            console.log("se pasa validacion - mostrando modal")
            setShowValidationModal(true)
            console.log("modal establecido, retornando para impedir avance")
            return // Impedir avance a la siguiente etapa
          }

          console.log("validacion pasada - avanzando a siguiente etapa")
          setCurrentStep((prev) => prev + 1)
        } catch (error) {
          console.error("Error validating step 2:", error)
          setShowValidationModal(true)
          return
        }
      } else {
        setShowValidationModal(true)
        return
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
    setShowConfirmModal(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false)
    setShowSuccessAnimation(true)

    try {
      const result = await finalizarProducto(productoId!, formData.catalogoid)
      if (!result.success) {
        setShowSuccessAnimation(false)
        alert(`Error al finalizar producto: ${result.error}`)
        return
      }
    } catch (error) {
      console.error("Error finalizando producto:", error)
      setShowSuccessAnimation(false)
      alert("Error al finalizar el producto")
    }
  }

  const handleAgregarFormula = async () => {
    if (!formData.formaid || !formulaRangoCantidad || formulaRangoCantidad <= 0) {
      alert("Favor de seleccionar una fórmula y agregar una cantidad válida")
      return
    }

    if (!productoId) {
      alert("Error: No se encontró el ID del producto")
      return
    }
    setIsSubmitting(true)
    try {
      const formula = formulas.find((f) => f.id === formData.formaid)
      if (!formula) {
        alert("Error: No se encontró la fórmula seleccionada")
        return
      }

      const cantidadAgregada = formulaRangoCantidad
      const costoUnitario = formula.costo
      const cantidadMaxima = formula.cantidad || 1

      // New cost calculation: (costo unitario) / ((cantidad máxima de la fórmula) / (cantidad agregada))
      const costoParcial = costoUnitario / (cantidadMaxima / cantidadAgregada)

      const result = await agregarFormulaAProducto(productoId, formData.formaid, cantidadAgregada, costoParcial)

      if (result.success) {
        // Reload formulas list
        const formulasResult = await obtenerFormulasAgregadas(productoId)
        if (formulasResult.success) {
          setFormulasAgregadas(formulasResult.data)
        }

        // Clear inputs
        setFormData((prev) => ({ ...prev, formaid: null }))
        setFormulaCantidad("")
        setFormulaUnidadMedida("")
        setFormulaCosto("")
        setFormulaRangoCantidad(1)
        setFormulaCantidadMaxima(1)
      } else {
        alert("Error al agregar la fórmula: " + result.error)
      }
    } catch (error) {
      console.error("Error adding formula:", error)
      alert("Error al agregar la fórmula")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDeleteFormula = (productoDetalleId: number) => {
    setDeleteFormulaId(productoDetalleId)
    setShowDeleteFormulaModal(true)
  }

  const handleDeleteFormula = async () => {
    if (!deleteFormulaId) return

    try {
      const result = await eliminarFormulaDeProducto(deleteFormulaId)

      if (result.success) {
        setFormulasAgregadas((prev) => prev.filter((f) => f.id !== deleteFormulaId))
        setShowDeleteFormulaModal(false)
        setDeleteFormulaId(null)
      } else {
        alert("Error al eliminar la fórmula: " + result.error)
      }
    } catch (error) {
      console.error("Error removing formula:", error)
      alert("Error al eliminar la fórmula")
    }
  }

  const handleConfirmDeleteIngrediente = (productoDetalleId: number) => {
    setDeleteIngredienteId(productoDetalleId)
    setShowDeleteIngredienteModal(true)
  }

  const handleDeleteIngrediente = async () => {
    if (!deleteIngredienteId) return

    try {
      const result = await eliminarIngredienteDeProducto(deleteIngredienteId)

      if (result.success) {
        setIngredientesAgregados((prev) => prev.filter((ing) => ing.id !== deleteIngredienteId))
        setShowDeleteIngredienteModal(false)
        setDeleteIngredienteId(null)
      } else {
        alert("Error al eliminar el ingrediente: " + result.error)
      }
    } catch (error) {
      console.error("Error removing ingredient:", error)
      alert("Error al eliminar el ingrediente")
    }
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)

    if (term.length >= 2) {
      const filtered = ingredientes.filter(
        (ing) =>
          ing.codigo.toLowerCase().includes(term.toLowerCase()) ||
          ing.nombre.toLowerCase().includes(term.toLowerCase()),
      )
      setFilteredIngredientes(filtered)
      setShowIngredienteDropdown(filtered.length > 0)
    } else {
      setFilteredIngredientes([])
      setShowIngredienteDropdown(false)
    }
  }

  const handleSelectIngredienteFromDropdown = (ing: any) => {
    setSelIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setShowIngredienteDropdown(false)
  }

  useEffect(() => {
    const getIngredientInfo = async () => {
      if (selIngredienteId) {
        try {
          const result = await getIngredientDetails(Number(selIngredienteId))
          if (result.success && result.data) {
            setSelIngredienteCosto(result.data.costo?.toString() || "0")
            setSelIngredienteUnidad(result.unidadMedidaId?.toString() || "")
          }
        } catch (error) {
          console.error("Error getting ingredient details:", error)
        }
      }
    }

    getIngredientInfo()
  }, [selIngredienteId])

  const handleAgregarIngrediente = async () => {
    if (!productoId) {
      setErrorMessage("Error: No se ha creado el producto base")
      setShowErrorModal(true)
      return
    }

    if (!selIngredienteId || !selIngredienteCantidad) {
      setErrorMessage("Favor de llenar la información faltante del ingrediente.")
      setShowErrorModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      // Check for duplicate ingredient
      const duplicateCheck = await verificarIngredienteDuplicadoProducto(Number(productoId), Number(selIngredienteId))

      if (duplicateCheck.exists) {
        const ingredienteNombre =
          ingredientes.find((i) => i.id.toString() === selIngredienteId)?.nombre || "Ingrediente"
        setDuplicateMessage(`El ingrediente "${ingredienteNombre}" ya está agregado a este producto.`)
        setShowDuplicateModal(true)
        setIsSubmitting(false)
        return
      }

      const result = await agregarIngredienteAProducto(
        productoId,
        Number(selIngredienteId),
        Number(selIngredienteCantidad),
        Number(selIngredienteCosto),
      )

      if (result.success) {
        // Reload ingredients list
        const ingredientesResult = await obtenerIngredientesAgregados(productoId)
        if (ingredientesResult.data) {
          setIngredientesAgregados(ingredientesResult.data)
        }

        // Clear inputs
        setSelIngredienteId("")
        setSelIngredienteCantidad("")
        setSelIngredienteUnidad("")
        setSelIngredienteCosto("")
        setIngredienteSearchTerm("")
      } else {
        setErrorMessage(result.error || "No se pudo agregar el ingrediente.")
        setShowErrorModal(true)
      }
    } catch (error) {
      setErrorMessage("Error inesperado al agregar ingrediente")
      setShowErrorModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        setShowSuccessAnimation(false)
        setCurrentStep(4)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [showSuccessAnimation])

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clienteid" className="text-slate-700 font-medium">
                Cliente *
              </Label>
              <Select
                value={formData.clienteid?.toString() || ""}
                onValueChange={(value) => handleInputChange("clienteid", value ? Number.parseInt(value) : null)}
              >
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

            <div className="space-y-2">
              <Label htmlFor="catalogoid" className="text-slate-700 font-medium">
                Catálogo
              </Label>
              <Select
                value={formData.catalogoid?.toString() || ""}
                onValueChange={(value) => handleInputChange("catalogoid", value ? Number.parseInt(value) : null)}
                disabled={!formData.clienteid || catalogos.length === 0}
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

            <div className="space-y-2">
              <Label htmlFor="zonaid" className="text-slate-700 font-medium">
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

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-slate-700 font-medium">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Descripción del producto..."
                rows={3}
                className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
              />
            </div>
          </div>
        </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Input
                      id="modouso"
                      value={formData.modouso}
                      onChange={(e) => handleInputChange("modouso", e.target.value)}
                      placeholder="Ej: Oral, Tópico"
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
                      placeholder="Ej: Suplemento alimenticio"
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
                      min="0"
                      value={formData.edadminima}
                      onChange={(e) => handleInputChange("edadminima", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instruccionesingesta" className="text-slate-700 font-medium">
                      Instrucciones de Ingesta
                    </Label>
                    <Textarea
                      id="instruccionesingesta"
                      value={formData.instruccionesingesta}
                      onChange={(e) => handleInputChange("instruccionesingesta", e.target.value)}
                      placeholder="Instrucciones de cómo tomar el producto..."
                      rows={2}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
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
                      placeholder="Advertencias y contraindicaciones..."
                      rows={2}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
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
                      placeholder="Condiciones de almacenamiento..."
                      rows={2}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vidaanaquelmeses" className="text-slate-700 font-medium">
                      Vida de Anaquel (meses)
                    </Label>
                    <Input
                      id="vidaanaquelmeses"
                      type="number"
                      min="0"
                      value={formData.vidaanaquelmeses}
                      onChange={(e) => handleInputChange("vidaanaquelmeses", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="propositoprincipal" className="text-slate-700 font-medium">
                      Propósito Principal
                    </Label>
                    <Textarea
                      id="propositoprincipal"
                      value={formData.propositoprincipal}
                      onChange={(e) => handleInputChange("propositoprincipal", e.target.value)}
                      placeholder="Propósito principal del producto..."
                      rows={2}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propuestavalor" className="text-slate-700 font-medium">
                      Propuesta de Valor
                    </Label>
                    <Textarea
                      id="propuestavalor"
                      value={formData.propuestavalor}
                      onChange={(e) => handleInputChange("propuestavalor", e.target.value)}
                      placeholder="Propuesta de valor del producto..."
                      rows={2}
                      className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
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
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
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

            {formData.imagen && (
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <FileImage className="h-3 w-3" />
                {formData.imagen.name}
              </Badge>
            )}
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
            {/*<h4 className="text-md font-medium text-slate-700">Fórmula Asociada</h4>*/}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="formaid" className="text-slate-700 font-medium">
                  Seleccionar Fórmula
                </Label>
                <Select
                  value={formData.formaid?.toString() || ""}
                  onValueChange={(value) => handleInputChange("formaid", value ? Number.parseInt(value) : null)}
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
                  Unidad Medida
                </Label>
                <Input
                  id="unidadmedida"
                  value={formulaUnidadMedida}
                  disabled
                  placeholder="Selecciona una fórmula"
                  className="bg-gray-100 border-slate-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo" className="text-slate-700 font-medium">
                  Costo
                </Label>
                <Input
                  id="costo"
                  value={formulaCosto}
                  disabled
                  placeholder="$0.00"
                  className="bg-gray-100 border-slate-200/60"
                />
              </div>

              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="rangocantidad" className="text-slate-700 font-medium">
                  Rango de Cantidad: {formulaRangoCantidad}
                </Label>
                <input
                  id="rangocantidad"
                  type="range"
                  min="1"
                  max={formulaCantidadMaxima}
                  value={formulaRangoCantidad}
                  onChange={(e) => setFormulaRangoCantidad(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={!formData.formaid}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1</span>
                  <span>{formulaCantidadMaxima}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleAgregarFormula}
                disabled={!formData.formaid || formulaRangoCantidad <= 0 || isSubmitting}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Fórmula
              </Button>
            </div>

            {formulasAgregadas.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-slate-700 mb-3">Fórmulas Agregadas</h5>
                <div className="bg-white rounded-xs border border-slate-200 overflow-hidden mb-12">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Costo Unitario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Costo Parcial
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {formulasAgregadas.map((formula) => (
                        <tr key={formula.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{formula.nombre}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{formula.cantidad}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${formula.costo.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${formula.costoParcial.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleConfirmDeleteFormula(formula.id)}
                            >
                              Eliminar
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-6 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-700">Ingredientes Adicionales</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="md:col-span-2 relative">
                <Label htmlFor="txtIngredienteSearch">Ingrediente</Label>
                <Input
                  id="txtIngredienteSearch"
                  name="txtIngredienteSearch"
                  value={ingredienteSearchTerm}
                  onChange={handleIngredienteSearchChange}
                  onFocus={() =>
                    ingredienteSearchTerm.length >= 2 &&
                    filteredIngredientes.length > 0 &&
                    setShowIngredienteDropdown(true)
                  }
                  onBlur={() => setTimeout(() => setShowIngredienteDropdown(false), 100)}
                  placeholder="Buscar por código o nombre..."
                  autoComplete="off"
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                />
                {showIngredienteDropdown && filteredIngredientes.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {filteredIngredientes.map((ing) => (
                      <div
                        key={ing.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onMouseDown={() => handleSelectIngredienteFromDropdown(ing)}
                      >
                        {ing.codigo} - {ing.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="txtCantidadIngrediente">Cantidad</Label>
                <Input
                  id="txtCantidadIngrediente"
                  name="txtCantidadIngrediente"
                  type="number"
                  value={selIngredienteCantidad}
                  onChange={(e) => setSelIngredienteCantidad(e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>
              <div>
                <Label htmlFor="ddlUnidadMedidaIng">Unidad</Label>
                <Input
                  id="ddlUnidadMedidaIng"
                  value={selIngredienteUnidad}
                  disabled
                  placeholder="Automático"
                  className="bg-gray-100 border-slate-200/60"
                />
              </div>
              <div>
                <Label htmlFor="txtCostoIngrediente">Costo Ingrediente</Label>
                <Input
                  id="txtCostoIngrediente"
                  name="txtCostoIngrediente"
                  value={selIngredienteCosto}
                  disabled
                  className="bg-white/80 backdrop-blur-sm border-slate-200/60"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                id="btnAgregarIngrediente"
                name="btnAgregarIngrediente"
                onClick={handleAgregarIngrediente}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Ingrediente
              </Button>
            </div>

            {ingredientesAgregados.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-slate-700 mb-3">Ingredientes Agregados</h5>
                <div className="bg-white rounded-xs border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Unidad
                        </th>
                        {/*<th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Costo Unitario
                        </th>*/}
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Costo Parcial
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {ingredientesAgregados.map((ingrediente) => (
                        <tr key={ingrediente.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{ingrediente.nombre}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{ingrediente.cantidad}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{ingrediente.unidad}</td>
                          {/*<td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                            ${ingrediente.costo.toFixed(2)}
                          </td>*/}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${ingrediente.ingredientecostoparcial.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleConfirmDeleteIngrediente(ingrediente.id)}
                            >
                              Eliminar
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

        <Dialog open={showDeleteFormulaModal} onOpenChange={setShowDeleteFormulaModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar esta fórmula del producto? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteFormulaModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteFormula}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteIngredienteModal} onOpenChange={setShowDeleteIngredienteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este ingrediente del producto? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteIngredienteModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteIngrediente}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ingrediente Duplicado</DialogTitle>
              <DialogDescription>{duplicateMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowDuplicateModal(false)}>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowErrorModal(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-white to-sky-50 p-6 border border-sky-100 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              Información Completa del Producto
            </h4>

            {/* Información Principal */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nombre del Producto:</span>{" "}
                  <span className="text-gray-900">{formData.nombre}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Cliente:</span>{" "}
                  <span className="text-gray-900">
                    {clientes.find((c) => c.id === formData.clienteid)?.nombre || "No seleccionado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Catálogo:</span>{" "}
                  <span className="text-gray-900">
                    {catalogos.find((c) => c.id === formData.catalogoid)?.nombre || "No seleccionado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Zona:</span>{" "}
                  <span className="text-gray-900">
                    {zonas.find((z) => z.id === formData.zonaid)?.nombre || "No seleccionada"}
                  </span>
                </div>
              </div>
              {formData.descripcion && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Descripción:</span>{" "}
                  <span className="text-gray-900">{formData.descripcion}</span>
                </div>
              )}
            </div>

            {/* Sección Porciones */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-sky-700 mb-2 border-b border-sky-200 pb-1">Porciones</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Presentación:</span>{" "}
                  <span className="text-gray-800">{formData.presentacion || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Porción:</span>{" "}
                  <span className="text-gray-800">{formData.porcion || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Porción por Envase:</span>{" "}
                  <span className="text-gray-800">{formData.porcionenvase || "No especificada"}</span>
                </div>
              </div>
            </div>

            {/* Sección Modo de Uso */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-sky-700 mb-2 border-b border-sky-200 pb-1">Modo de Uso</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Modo de Uso:</span>{" "}
                  <span className="text-gray-800">{formData.modouso || "No especificado"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Categoría de Uso:</span>{" "}
                  <span className="text-gray-800">{formData.categoriauso || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Edad Mínima:</span>{" "}
                  <span className="text-gray-800">{formData.edadminima || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Instrucciones de Ingesta:</span>{" "}
                  <span className="text-gray-800">{formData.instruccionesingesta || "No especificadas"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Advertencias:</span>{" "}
                  <span className="text-gray-800">{formData.advertencia || "No especificadas"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Condiciones de Almacenamiento:</span>{" "}
                  <span className="text-gray-800">{formData.condicionesalmacenamiento || "No especificadas"}</span>
                </div>
              </div>
            </div>

            {/* Sección Detalles Adicionales */}
            <div>
              <h5 className="text-sm font-semibold text-sky-700 mb-2 border-b border-sky-200 pb-1">
                Detalles Adicionales
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Vida de Anaquel (meses):</span>{" "}
                  <span className="text-gray-800">{formData.vidaanaquelmeses || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Propósito Principal:</span>{" "}
                  <span className="text-gray-800">{formData.propositoprincipal || "No especificado"}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Propuesta de Valor:</span>{" "}
                  <span className="text-gray-800">{formData.propuestavalor || "No especificada"}</span>
                </div>
              </div>
            </div>
          </div>

          {formulasAgregadas.length > 0 && (
            <div className="bg-gradient-to-br from-white to-emerald-50 p-3 border border-emerald-100 shadow-sm">
              <h4 className="text-lg font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Fórmulas Agregadas ({formulasAgregadas.length})
              </h4>
              <div className="space-y-3">
                {formulasAgregadas.map((formula) => (
                  <div
                    key={formula.id}
                    className="bg-white p-4 border border-emerald-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{formula.nombre}</p>
                      <p className="text-sm text-gray-600">Cantidad: {formula.cantidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-700">${formula.costoParcial.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Costo parcial</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ingredientesAgregados.length > 0 && (
            <div className="bg-gradient-to-br from-white to-orange-50 p-6 border border-orange-100 shadow-sm">
              <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Ingredientes Agregados ({ingredientesAgregados.length})
              </h4>
              <div className="space-y-3">
                {ingredientesAgregados.map((ingrediente) => (
                  <div
                    key={ingrediente.id}
                    className="bg-white p-4 border border-orange-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{ingrediente.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {ingrediente.cantidad} {ingrediente.unidad}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-700">${ingrediente.ingredientecostoparcial.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Costo parcial</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-white to-indigo-50 p-6 border border-indigo-100 shadow-sm">
            <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Costo Total del Producto
            </h4>
            <div className="bg-white p-4 border border-indigo-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-indigo-700">${costoTotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Suma de todos los costos parciales de fórmulas e ingredientes
              </p>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-purple-50 p-6 border border-purple-100 shadow-sm h-fit">
            <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Imagen del Producto
            </h4>

            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview del producto"
                  className="w-full h-48 object-cover border border-purple-200 shadow-sm"
                />
                <p className="text-sm text-gray-600 text-center">Imagen cargada correctamente</p>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2  2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Sin imagen</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Registro</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas registrar este producto? Una vez confirmado, el producto será creado en el
              sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmedSubmit}>Sí, Registrar Producto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center py-12">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">¡Producto Creado Exitosamente!</h3>
      <p className="text-gray-500 mb-6">El producto ha sido guardado correctamente en el sistema.</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => router.push("/productos")}>Ver Productos</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Crear Otro Producto
        </Button>
      </div>
    </div>
  )

  const handleLeavePage = useCallback(
    async (confirm: boolean) => {
      setShowExitConfirmModal(false)
      if (confirm) {
        if (productoId) {
          await eliminarProductoIncompleto(productoId)
        }
        resolveNavigationRef.current?.(true) // Allow navigation
      } else {
        resolveNavigationRef.current?.(false) // Cancel navigation
      }
      resolveNavigationRef.current = null
    },
    [productoId],
  )

  const checkLeaveAndConfirm = useCallback(
    async (targetPath: string): Promise<boolean> => {
      if (currentStep >= 2 && currentStep <= 3 && productoId) {
        return new Promise<boolean>((resolve) => {
          resolveNavigationRef.current = resolve
          setShowExitConfirmModal(true)
          setNextPath(targetPath)
        })
      }
      return true // Allow navigation if not in protected state
    },
    [currentStep, productoId],
  )

  useEffect(() => {
    if (currentStep >= 2 && currentStep <= 3 && productoId) {
      setGuard(checkLeaveAndConfirm)
    } else {
      setGuard(null)
    }

    return () => {
      setGuard(null)
    }
  }, [currentStep, productoId, setGuard, checkLeaveAndConfirm])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep >= 2 && currentStep <= 3 && productoId) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [currentStep, productoId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/productos")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Productos
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-600 mt-2">Crea un nuevo producto siguiendo los pasos del asistente</p>
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
            disabled={currentStep < 3}
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
                {isLoading ? "Finalizando..." : "Finalizar Producto"}
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
                  Creando Producto
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

                <p className="text-gray-600 animate-fade-in">Procesando información del producto...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Información Incompleta</AlertDialogTitle>
            <AlertDialogDescription>
              No es posible avanzar hasta que no agregues por lo menos una fórmula o un ingrediente al producto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationModal(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showStep1ValidationModal} onOpenChange={setShowStep1ValidationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Campos Requeridos
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Faltan campos por llenar. Por favor complete los siguientes campos obligatorios:
            </p>
            <ul className="mt-2 text-sm text-gray-800 list-disc list-inside">
              <li>Nombre del producto</li>
              <li>Cliente</li>
              <li>Catálogo</li>
              <li>Zona</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowStep1ValidationModal(false)} className="w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitConfirmModal} onOpenChange={setShowExitConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Salida
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Si sales del registro de producto, todos los datos ingresados se perderán y el registro será eliminado.
              ¿Realmente deseas salir?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => handleLeavePage(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleLeavePage(true)} className="bg-red-500 hover:bg-red-600">
              Sí, salir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
