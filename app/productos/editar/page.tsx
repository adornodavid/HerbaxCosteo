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

    setTimeout(() => {
      setShowSuccessAnimation(false)
      setCurrentStep(4)
      setTimeout(() => {
        router.push("/productos")
      }, 2000)
    }, 4000)
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
    <div className="space-y-6">
      {/* Inputs principales visibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre del Producto *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Ingresa el nombre del producto"
            required
          />
        </div>

        <div>
          <Label htmlFor="cliente">Cliente *</Label>
          <Select value={formData.clienteid.toString()} onValueChange={handleClienteChange}>
            <SelectTrigger>
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

        <div>
          <Label htmlFor="catalogo">Catálogo</Label>
          <Select
            value={formData.catalogoid?.toString() || ""}
            onValueChange={(value) => handleInputChange("catalogoid", value ? Number.parseInt(value) : null)}
          >
            <SelectTrigger>
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

        <div>
          <Label htmlFor="zona">Zona</Label>
          <Select
            value={formData.zonaid?.toString() || ""}
            onValueChange={(value) => handleInputChange("zonaid", value ? Number.parseInt(value) : null)}
          >
            <SelectTrigger>
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

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Describe el producto"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="imagen">Imagen del Producto</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Seleccionar Imagen
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imagePreview && (
            <div className="relative">
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-md object-cover"
              />
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
          )}
        </div>
      </div>

      {/* Sección Porciones */}
      <Collapsible open={porcionesOpen} onOpenChange={setPorcionesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            Porciones
            {porcionesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="presentacion">Presentación</Label>
              <Input
                id="presentacion"
                value={formData.presentacion}
                onChange={(e) => handleInputChange("presentacion", e.target.value)}
                placeholder="Ej: Botella, Caja, etc."
              />
            </div>
            <div>
              <Label htmlFor="porcion">Porción</Label>
              <Input
                id="porcion"
                value={formData.porcion}
                onChange={(e) => handleInputChange("porcion", e.target.value)}
                placeholder="Ej: 250ml, 100g, etc."
              />
            </div>
            <div>
              <Label htmlFor="porcionenvase">Porción por Envase</Label>
              <Input
                id="porcionenvase"
                value={formData.porcionenvase}
                onChange={(e) => handleInputChange("porcionenvase", e.target.value)}
                placeholder="Ej: 4 porciones"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sección Modo Uso */}
      <Collapsible open={modoUsoOpen} onOpenChange={setModoUsoOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            Modo Uso
            {modoUsoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modouso">Modo de Uso</Label>
              <Textarea
                id="modouso"
                value={formData.modouso}
                onChange={(e) => handleInputChange("modouso", e.target.value)}
                placeholder="Instrucciones de uso"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="categoriauso">Categoría de Uso</Label>
              <Input
                id="categoriauso"
                value={formData.categoriauso}
                onChange={(e) => handleInputChange("categoriauso", e.target.value)}
                placeholder="Ej: Suplemento, Alimento, etc."
              />
            </div>
            <div>
              <Label htmlFor="edadminima">Edad Mínima</Label>
              <Input
                id="edadminima"
                type="number"
                value={formData.edadminima}
                onChange={(e) => handleInputChange("edadminima", Number.parseInt(e.target.value) || 0)}
                placeholder="Edad mínima recomendada"
              />
            </div>
            <div>
              <Label htmlFor="instruccionesingesta">Instrucciones de Ingesta</Label>
              <Textarea
                id="instruccionesingesta"
                value={formData.instruccionesingesta}
                onChange={(e) => handleInputChange("instruccionesingesta", e.target.value)}
                placeholder="Cómo consumir el producto"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="advertencia">Advertencias</Label>
              <Textarea
                id="advertencia"
                value={formData.advertencia}
                onChange={(e) => handleInputChange("advertencia", e.target.value)}
                placeholder="Advertencias importantes"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="condicionesalmacenamiento">Condiciones de Almacenamiento</Label>
              <Textarea
                id="condicionesalmacenamiento"
                value={formData.condicionesalmacenamiento}
                onChange={(e) => handleInputChange("condicionesalmacenamiento", e.target.value)}
                placeholder="Cómo almacenar el producto"
                rows={3}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sección Detalles Adicionales */}
      <Collapsible open={detallesOpen} onOpenChange={setDetallesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            Detalles Adicionales
            {detallesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="vidaanaquelmeses">Vida de Anaquel (meses)</Label>
              <Input
                id="vidaanaquelmeses"
                type="number"
                value={formData.vidaanaquelmeses}
                onChange={(e) => handleInputChange("vidaanaquelmeses", Number.parseInt(e.target.value) || 0)}
                placeholder="Meses de vida útil"
              />
            </div>
            <div>
              <Label htmlFor="propositoprincipal">Propósito Principal</Label>
              <Input
                id="propositoprincipal"
                value={formData.propositoprincipal}
                onChange={(e) => handleInputChange("propositoprincipal", e.target.value)}
                placeholder="Objetivo principal del producto"
              />
            </div>
            <div>
              <Label htmlFor="propuestavalor">Propuesta de Valor</Label>
              <Input
                id="propuestavalor"
                value={formData.propuestavalor}
                onChange={(e) => handleInputChange("propuestavalor", e.target.value)}
                placeholder="Valor único del producto"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Sección Fórmulas */}
      <Card>
        <CardHeader>
          <CardTitle>Fórmula Asociada</CardTitle>
          <CardDescription>Selecciona y agrega fórmulas al producto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="formula">Fórmula</Label>
              <Select
                value={formData.formaid?.toString() || ""}
                onValueChange={(value) => {
                  const formulaId = value ? Number.parseInt(value) : null
                  handleInputChange("formaid", formulaId)
                  handleFormulaChange(value)
                }}
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="unidadmedida">Unidad de Medida</Label>
              <Input id="unidadmedida" value={formulaUnidadMedida} readOnly placeholder="Unidad automática" />
            </div>

            <div>
              <Label htmlFor="costo">Costo</Label>
              <Input id="costo" value={formulaCosto} readOnly placeholder="Costo automático" />
            </div>

            <div>
              <Label htmlFor="rangocantidad">Rango de Cantidad</Label>
              <div className="space-y-2">
                <Slider
                  value={[formulaRangoCantidad]}
                  onValueChange={(value) => setFormulaRangoCantidad(value[0])}
                  max={formulaCantidadMaxima}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-center">{formulaRangoCantidad}</div>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAgregarFormula} disabled={!formData.formaid} className="w-full">
                Agregar Fórmula
              </Button>
            </div>
          </div>

          {/* Tabla de fórmulas agregadas */}
          {formulasAgregadas.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Fórmulas Agregadas</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Fórmula</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Costo Parcial</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulasAgregadas.map((formula) => (
                      <tr key={formula.id} className="border-t">
                        <td className="px-4 py-2">{formula.nombre}</td>
                        <td className="px-4 py-2">{formula.cantidad}</td>
                        <td className="px-4 py-2">${formula.costoParcial.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteFormulaId(formula.id)
                              setShowDeleteFormulaModal(true)
                            }}
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
        </CardContent>
      </Card>

      {/* Sección Ingredientes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Adicionales</CardTitle>
          <CardDescription>Agrega ingredientes adicionales al producto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Label htmlFor="ingrediente">Ingrediente</Label>
              <Input
                id="ingrediente"
                value={ingredienteSearchTerm}
                onChange={(e) => handleIngredienteSearch(e.target.value)}
                placeholder="Buscar ingrediente..."
              />
              {showIngredienteDropdown && filteredIngredientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredIngredientes.map((ingrediente) => (
                    <div
                      key={ingrediente.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleIngredienteSelect(ingrediente)}
                    >
                      <div className="font-medium">{ingrediente.nombre}</div>
                      <div className="text-sm text-gray-500">Código: {ingrediente.codigo}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="ingredientecantidad">Cantidad</Label>
              <Input
                id="ingredientecantidad"
                type="number"
                value={selIngredienteCantidad}
                onChange={(e) => setSelIngredienteCantidad(e.target.value)}
                placeholder="Cantidad"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="ingredienteunidad">Unidad</Label>
              <Input id="ingredienteunidad" value={selIngredienteUnidad} readOnly placeholder="Unidad automática" />
            </div>

            <div>
              <Label htmlFor="ingredientecosto">Costo</Label>
              <Input id="ingredientecosto" value={selIngredienteCosto} readOnly placeholder="Costo automático" />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAgregarIngrediente}
                disabled={!selIngredienteId || !selIngredienteCantidad}
                className="w-full"
              >
                Agregar Ingrediente
              </Button>
            </div>
          </div>

          {/* Tabla de ingredientes agregados */}
          {ingredientesAgregados.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Ingredientes Agregados</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Ingrediente</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Unidad</th>
                      <th className="px-4 py-2 text-left">Costo Parcial</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientesAgregados.map((ingrediente) => (
                      <tr key={ingrediente.id} className="border-t">
                        <td className="px-4 py-2">{ingrediente.nombre}</td>
                        <td className="px-4 py-2">{ingrediente.cantidad}</td>
                        <td className="px-4 py-2">{ingrediente.unidad}</td>
                        <td className="px-4 py-2">${ingrediente.ingredientecostoparcial.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteIngredienteId(ingrediente.id)
                              setShowDeleteIngredienteModal(true)
                            }}
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
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Producto</CardTitle>
          <CardDescription>Revisa toda la información antes de finalizar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Información Básica</h4>
              <div className="space-y-2">
                <p>
                  <strong>Nombre:</strong> {formData.nombre}
                </p>
                <p>
                  <strong>Descripción:</strong> {formData.descripcion || "N/A"}
                </p>
                <p>
                  <strong>Cliente:</strong> {clientes.find((c) => c.id === formData.clienteid)?.nombre || "N/A"}
                </p>
                <p>
                  <strong>Catálogo:</strong> {catalogos.find((c) => c.id === formData.catalogoid)?.nombre || "N/A"}
                </p>
                <p>
                  <strong>Zona:</strong> {zonas.find((z) => z.id === formData.zonaid)?.nombre || "N/A"}
                </p>
              </div>
            </div>

            {imagePreview && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Imagen</h4>
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt="Producto"
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>

          {/* Fórmulas agregadas */}
          {formulasAgregadas.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Fórmulas Agregadas</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Fórmula</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulasAgregadas.map((formula) => (
                      <tr key={formula.id} className="border-t">
                        <td className="px-4 py-2">{formula.nombre}</td>
                        <td className="px-4 py-2">{formula.cantidad}</td>
                        <td className="px-4 py-2">${formula.costoParcial.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ingredientes agregados */}
          {ingredientesAgregados.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Ingredientes Agregados</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Ingrediente</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Unidad</th>
                      <th className="px-4 py-2 text-left">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientesAgregados.map((ingrediente) => (
                      <tr key={ingrediente.id} className="border-t">
                        <td className="px-4 py-2">{ingrediente.nombre}</td>
                        <td className="px-4 py-2">{ingrediente.cantidad}</td>
                        <td className="px-4 py-2">{ingrediente.unidad}</td>
                        <td className="px-4 py-2">${ingrediente.ingredientecostoparcial.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Costo total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Costo Total del Producto:</span>
              <span className="text-green-600">${costoTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
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
