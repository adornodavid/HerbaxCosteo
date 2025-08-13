"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Upload, ArrowLeft, ArrowRight, FileImage, Loader2 } from "lucide-react"
import {
  crearFormula,
  crearFormulaEtapa2,
  obtenerIngredientesPorCliente,
  obtenerUnidadesMedida,
  eliminarIngredienteFormula,
  getIngredientDetails, // Added import for moved function
  obtenerIngredientesFormula, // Added import for missing function
  verificarIngredienteDuplicado,
} from "@/app/actions/formulas-actions"
import { listaDesplegableClientes } from "@/app/actions/clientes-actions"
import { getSession } from "@/app/actions/session-actions"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"
import Image from "next/image" // Importar Image de next/image

interface FormData {
  nombre: string
  notaspreparacion: string
  costo: number
  activo: boolean
  cantidad: number
  unidadmedidaid: number
  imagen?: File
  clienteId: number
}

interface Cliente {
  id: number
  nombre: string
}

interface Ingrediente {
  id: number
  codigo: string
  nombre: string
  costo: number
  clienteid: number
  tipounidadesmedida: {
    id: number
    descripcion: string
  }
}

interface UnidadMedida {
  id: number
  descripcion: string
}

interface IngredienteAgregado {
  id: number
  nombre: string
  cantidad: number
  unidad: string
  ingredientecostoparcial: number
}

export default function NuevaFormulaPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setGuard } = useNavigationGuard()

  // Estados para el formulario por etapas
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [formulaId, setFormulaId] = useState<number | null>(null)

  // Estados para los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    notaspreparacion: "",
    costo: 0,
    activo: true,
    cantidad: 0,
    unidadmedidaid: 1,
    imagen: undefined,
    clienteId: 0,
  })

  const [imagePreview, setImagePreview] = useState<string>("")
  const [costoTotal, setCostoTotal] = useState(0)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState("")
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])
  const [ingredientesAgregados, setIngredientesAgregados] = useState<IngredienteAgregado[]>([])

  // Estados para el formulario de ingredientes
  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("")
  const [filteredIngredientes, setFilteredIngredientes] = useState<Ingrediente[]>([])
  const [showIngredienteDropdown, setShowIngredienteDropdown] = useState(false)
  const [selIngredienteId, setSelIngredienteId] = useState("")
  const [selIngredienteCantidad, setSelIngredienteCantidad] = useState("")
  const [selIngredienteUnidad, setSelIngredienteUnidad] = useState("")
  const [selIngredienteCosto, setSelIngredienteCosto] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New states for validation modals
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  const [nextPath, setNextPath] = useState("")
  const resolveNavigationRef = useRef<((value: boolean) => void) | null>(null)

  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState("")

  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const steps = [
    { number: 1, title: "Información Básica" },
    { number: 2, title: "Agregar Elementos" },
    { number: 3, title: "Resumen y Confirmación" },
    { number: 4, title: "Finalización" },
  ]

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const session = await getSession()
        let clienteIdParam = "-1"

        if (session && session.RolId && ![1, 2, 3].includes(session.RolId)) {
          clienteIdParam = session.ClienteId.toString()
        }

        const [clientesResult, unidadesResult] = await Promise.all([
          listaDesplegableClientes(clienteIdParam, ""),
          obtenerUnidadesMedida(),
        ])

        if (clientesResult.data) {
          setClientes(clientesResult.data)
        }

        if (unidadesResult.data) {
          setUnidadesMedida(unidadesResult.data)
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const loadIngredientes = async () => {
      if (selectedClienteId) {
        try {
          const result = await obtenerIngredientesPorCliente(Number(selectedClienteId), Number(selIngredienteCantidad))
          if (result.data) {
            setIngredientes(result.data)
          }
        } catch (error) {
          console.error("Error loading ingredients:", error)
        }
      } else {
        setIngredientes([])
      }
    }

    loadIngredientes()
  }, [selectedClienteId])

  useEffect(() => {
    if (ingredienteSearchTerm.length >= 2) {
      const filtered = ingredientes.filter(
        (ing) =>
          ing.codigo.toLowerCase().includes(ingredienteSearchTerm.toLowerCase()) ||
          ing.nombre.toLowerCase().includes(ingredienteSearchTerm.toLowerCase()),
      )
      setFilteredIngredientes(filtered)
      setShowIngredienteDropdown(filtered.length > 0)
    } else {
      setFilteredIngredientes([])
      setShowIngredienteDropdown(false)
    }
  }, [ingredienteSearchTerm, ingredientes])

  useEffect(() => {
    if (selIngredienteId) {
      const selectedIng = ingredientes.find((i) => i.id.toString() === selIngredienteId)
      if (selectedIng) {
        setSelIngredienteCosto(selectedIng.costo.toString())
        // Get ingredient details including unit of measure
        getIngredientDetails(selectedIng.id)
      }
    } else {
      setSelIngredienteCosto("")
      setSelIngredienteUnidad("")
    }
  }, [selIngredienteId, ingredientes])

  useEffect(() => {
    if (!selIngredienteId) {
      setIngredienteSearchTerm("")
    }
  }, [selIngredienteId])

  useEffect(() => {
    const loadIngredientesFormula = async () => {
      if (formulaId) {
        try {
          const result = await obtenerIngredientesFormula(formulaId)
          if (result.data) {
            setIngredientesAgregados(result.data)
          }
        } catch (error) {
          console.error("Error loading formula ingredients:", error)
        }
      }
    }

    loadIngredientesFormula()
  }, [formulaId])

  useEffect(() => {
    const total = ingredientesAgregados.reduce((sum, ingrediente) => {
      return sum + (Number.parseFloat(ingrediente.ingredientecostoparcial) || 0)
    }, 0)
    setCostoTotal(total)
  }, [ingredientesAgregados])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }))

      // Crear preview de la imagen
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep1 = () => {
    return formData.nombre.trim() !== ""
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    const selectedIng = ingredientes.find((i) => i.id.toString() === selIngredienteId)
    if (selIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setSelIngredienteId("")
    }
  }

  const handleSelectIngredienteFromDropdown = (ing: Ingrediente) => {
    setSelIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setShowIngredienteDropdown(false)
  }

  const handleAgregarIngrediente = async () => {
    if (!formulaId) {
      setErrorMessage("Error: No se ha creado la fórmula base")
      setShowErrorModal(true)
      return
    }

    if (!selIngredienteId || !selIngredienteCantidad || !selIngredienteUnidad) {
      setErrorMessage("Favor de llenar la información faltante del ingrediente.")
      setShowErrorModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      // Check for duplicate ingredient
      const duplicateCheck = await verificarIngredienteDuplicado(Number(formulaId), Number(selIngredienteId))

      if (duplicateCheck.exists) {
        const ingredienteNombre =
          ingredientes.find((i) => i.id.toString() === selIngredienteId)?.nombre || "Ingrediente"
        setDuplicateMessage(`El ingrediente "${ingredienteNombre}" ya está agregado a esta fórmula.`)
        setShowDuplicateModal(true)
        setIsSubmitting(false)
        return
      }

      const result = await crearFormulaEtapa2(
        formulaId,
        Number(selIngredienteId),
        Number(selIngredienteCantidad),
        Number(selIngredienteCosto),
      )

      if (result.success) {
        // Reload ingredients list
        const ingredientesResult = await obtenerIngredientesFormula(formulaId)
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

  const handleEliminarIngrediente = async (ingredienteFormulaId: number) => {
    try {
      const result = await eliminarIngredienteFormula(ingredienteFormulaId)

      if (result.success && formulaId) {
        // Reload ingredients list
        const ingredientesResult = await obtenerIngredientesFormula(formulaId)
        if (ingredientesResult.data) {
          setIngredientesAgregados(ingredientesResult.data)
        }
      } else {
        setErrorMessage(result.error || "No se pudo eliminar el ingrediente.")
        setShowErrorModal(true)
      }
    } catch (error) {
      setErrorMessage("Error inesperado al eliminar ingrediente")
      setShowErrorModal(true)
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        setErrorMessage("Por favor completa el nombre de la fórmula")
        //setShowErrorModal(true)
        return
      }

      // Create formula before going to step 2
      setIsLoading(true)
      try {
        const result = await crearFormula({
          nombre: formData.nombre,
          notaspreparacion: formData.notaspreparacion,
          costo: null, // Will be calculated later
          activo: formData.activo,
          cantidad: null, // Will be set in step 2
          unidadmedidaid: null, // Will be set in step 2
          imagen: formData.imagen,
        })

        if (result.success && result.data) {
          setFormulaId(result.data.id)
          setCurrentStep(2)
        } else {
          setErrorMessage(result.error || "Error al crear la fórmula")
          setShowErrorModal(true)
        }
      } catch (error) {
        setErrorMessage("Error inesperado al crear la fórmula")
        setShowErrorModal(true)
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        return
      }
      setCurrentStep(currentStep + 1)
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Formula is already created, just show success
      setCurrentStep(4)
      setShowSuccessModal(true)
    } catch (error) {
      setErrorMessage("Error inesperado")
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left side - Form inputs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-4 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-slate-700 font-medium">
                Nombre de la Fórmula *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ingresa el nombre de la fórmula"
                className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notaspreparacion" className="text-slate-700 font-medium">
                Notas de Preparación
              </Label>
              <Textarea
                id="notaspreparacion"
                value={formData.notaspreparacion}
                onChange={(e) => handleInputChange("notaspreparacion", e.target.value)}
                placeholder="Instrucciones de preparación..."
                rows={4}
                className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image upload and preview */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-4 shadow-sm h-full">
          <div className="space-y-4">
            <Label className="text-slate-700 font-medium">Imagen de la Fórmula</Label>

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
      {/* Client Selection */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4">
          <h3 className="col-span-2 text-lg font-medium text-slate-800 mb-4">Seleccionar Cliente</h3>
          <h3 className="col-span-2 text-lg font-medium text-slate-800 mb-4">Detalles de Porcion</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2 mb-4 col-span-2">
            <Label htmlFor="cliente" className="text-slate-700 font-medium">
              Cliente *
            </Label>
            <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
              <SelectTrigger className="w-64 bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
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
            <Label htmlFor="cantidad" className="text-slate-700 font-medium">
              Cantidad *
            </Label>
            <Input
              id="cantidad"
              type="number"
              min="0"
              value={formData.cantidad}
              onChange={(e) => handleInputChange("cantidad", Number.parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-32 bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidadmedida" className="text-slate-700 font-medium">
              Unidad de Medida
            </Label>
            <Select
              value={formData.unidadmedidaid.toString()}
              onValueChange={(value) => handleInputChange("unidadmedidaid", Number.parseInt(value))}
            >
              <SelectTrigger className="w-64 bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
                <SelectValue placeholder="Selecciona unidad" />
              </SelectTrigger>
              <SelectContent>
                {unidadesMedida.map((unidad) => (
                  <SelectItem key={unidad.id} value={unidad.id.toString()}>
                    {unidad.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Agregar Ingredientes */}
      {selectedClienteId && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xs p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-800 mb-6">Agregar Ingredientes</h3>

          <div className="space-y-4">
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
                <Label htmlFor="ddlUnidadMedida">Unidad</Label>
                <Select value={selIngredienteUnidad} onValueChange={setSelIngredienteUnidad} disabled>
                  <SelectTrigger
                    id="ddlUnidadMedida"
                    name="ddlUnidadMedida"
                    className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                  >
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Ingrediente
              </Button>
            </div>

            {/* Tabla de ingredientes agregados */}
            {ingredientesAgregados.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-slate-800 mb-4">Ingredientes Agregados</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Costo Parcial</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesAgregados.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.nombre}</TableCell>
                        <TableCell>{i.cantidad}</TableCell>
                        <TableCell>{i.unidad}</TableCell>
                        <TableCell className="text-right">${i.ingredientecostoparcial.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEliminarIngrediente(i.id)}
                            disabled={isSubmitting}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-50/80 to-slate-100/50 backdrop-blur-sm">
          Resumen de la Fórmula
        </h3>
        <p className="text-gray-600">Revisa toda la información antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-white to-sky-50 rounded-xs p-6 border border-sky-100 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              Información Básica
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nombre de la Fórmula</Label>
                <p className="text-base font-medium text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formData.nombre}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {clientes.find((c) => c.id === Number.parseInt(selectedClienteId))?.nombre || "No seleccionado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Cantidad</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formData.cantidad}{" "}
                  {unidadesMedida.find((u) => u.id === Number.parseInt(formData.unidadmedidaid))?.descripcion || ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Estado</Label>
                <Badge
                  variant={formData.activo ? "default" : "secondary"}
                  className="bg-white border px-3 py-2 text-base"
                >
                  {formData.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            {formData.notaspreparacion && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium text-gray-600">Notas de Preparación</Label>
                <p className="text-base text-gray-900 bg-white px-3 py-2 rounded-lg border min-h-[60px]">
                  {formData.notaspreparacion}
                </p>
              </div>
            )}
          </div>

          {/* Ingredientes */}
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xs p-6 border border-emerald-100 shadow-sm">
            <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Ingredientes ({ingredientesAgregados.length})
            </h4>

            {ingredientesAgregados.length > 0 ? (
              <div className="space-y-3">
                {ingredientesAgregados.map((ingrediente, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-emerald-100 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Ingrediente</Label>
                        <p className="text-sm font-medium text-gray-900">{ingrediente.nombre}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Cantidad</Label>
                        <p className="text-sm text-gray-900">{ingrediente.cantidad}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Unidad</Label>
                        <p className="text-sm text-gray-900">{ingrediente.unidad}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Costo</Label>
                        <p className="text-sm font-semibold text-emerald-600">
                          ${Number.parseFloat(ingrediente.ingredientecostoparcial.toString()).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Costo Total */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Costo Total de la Fórmula:</span>
                    <span className="text-2xl font-bold">${costoTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No se han agregado ingredientes</p>
            )}
          </div>
        </div>

        {/* Imagen */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xs p-6 border border-purple-100 shadow-sm h-fit">
            <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Imagen de la Fórmula
            </h4>

            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview de la fórmula"
                  className="w-full h-48 object-cover rounded-lg border border-purple-200 shadow-sm"
                />
                <p className="text-sm text-gray-600 text-center">Imagen cargada correctamente</p>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center py-12">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">¡Fórmula Creada Exitosamente!</h3>
      <p className="text-gray-500 mb-6">La fórmula ha sido guardada correctamente en el sistema.</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => router.push("/formulas")}>Ver Fórmulas</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Crear Otra Fórmula
        </Button>
      </div>
    </div>
  )

  const fetchIngredientDetails = async () => {
    if (selIngredienteId) {
      const result = await getIngredientDetails(Number.parseInt(selIngredienteId))
      if (result.success && result.unidadMedidaId) {
        setSelIngredienteUnidad(result.unidadMedidaId.toString())
      }
    }
  }

  useEffect(() => {
    fetchIngredientDetails()
  }, [selIngredienteId])

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false)
        // Redirect to formulas list
        window.location.href = "/formulas"
      }, 4000) // 4 seconds

      return () => clearTimeout(timer)
    }
  }, [showSuccessModal])

  const validateStep2 = () => {
    // Check if at least 2 ingredients are added
    if (ingredientesAgregados.length < 2) {
      setValidationMessage("Debes agregar al menos 2 ingredientes a la fórmula")
      setShowValidationModal(true)
      return false
    }

    // Check if cantidad is greater than 0
    if (!formData.cantidad || formData.cantidad <= 0) {
      setValidationMessage("Debes ingresar una cantidad mayor a 0")
      setShowValidationModal(true)
      return false
    }

    // Check if unidad de medida is selected
    if (!formData.unidadmedidaid || formData.unidadmedidaid <= 0) {
      setValidationMessage("Debes seleccionar una unidad de medida")
      setShowValidationModal(true)
      return false
    }

    return true
  }

  const handleLeavePage = (confirm: boolean) => {
    if (confirm && resolveNavigationRef.current) {
      resolveNavigationRef.current(true)
    } else {
      resolveNavigationRef.current?.(false)
    }
    setShowExitConfirmModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/formulas")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Fórmulas
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Nueva Fórmula</h1>
        <p className="text-gray-600 mt-2">Crea una nueva fórmula siguiendo los pasos del asistente</p>
      </div>

      <div className="mb-3">
        <div className="relative">
          {/* Progress bar background */}
          <div className="w-full h-3 bg-gradient-to-r from-slate-200/60 to-slate-300/60 rounded-full backdrop-blur-sm border border-slate-200/40 shadow-inner">
            {/* Progress bar fill with liquid-glass effect */}
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 rounded-full shadow-lg backdrop-blur-sm border border-sky-300/30 transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            >
              {/* Liquid glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
            </div>
          </div>

          {/* Step indicators */}
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
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
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
                {isLoading ? "Finalizando..." : "Finalizar Fórmula"}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Laboratory Animation */}
              <div className="relative mx-auto w-32 h-32">
                {/* Flask 
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">*/}
                {/* Flask body */}
                <div>
                  <Image
                    src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/matraz.gif"
                    alt="matraz"
                    width={200}
                    height={200}
                    className="absolute inset-0 animate-bounce-slow" // Animación de rebote lento
                  />
                  {/* Liquid animation */}
                  {/*<div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-b-full animate-pulse"
                        style={{ height: "60%", animation: "liquidFill 2s ease-in-out infinite alternate" }}
                      ></div>*/}
                  {/* Bubbles */}
                  <div
                    className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="absolute bottom-4 right-6 w-1 h-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="absolute bottom-6 left-3 w-0.5 h-0.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "1s" }}
                  ></div>
                </div>
                {/* Flask neck 
                    <div ></div>*/}
                {/* Flask mouth
                    <div className="w-6 h-2 bg-sky-200 border-2 border-sky-300 border-b-0 rounded-t-lg mx-auto -mt-1"></div> */}
                {/*</div>
                </div>*/}

                {/* Particles around flask */}
                <div className="absolute inset-0">
                  <div
                    className="absolute top-4 left-4 w-1 h-1 bg-emerald-400 rounded-full animate-ping"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="absolute top-8 right-6 w-1 h-1 bg-sky-400 rounded-full animate-ping"
                    style={{ animationDelay: "0.7s" }}
                  ></div>
                  <div
                    className="absolute bottom-8 left-6 w-1 h-1 bg-purple-400 rounded-full animate-ping"
                    style={{ animationDelay: "1.4s" }}
                  ></div>
                  <div
                    className="absolute bottom-4 right-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                    style={{ animationDelay: "2.1s" }}
                  ></div>
                </div>
              </div>

              {/* Loading text with laboratory style animation */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 animate-pulse">
                  Creando Fórmula
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

                {/* Loading progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 rounded-full animate-pulse"
                    style={{
                      width: "100%",
                      animation: "progressFill 4s ease-in-out forwards",
                    }}
                  ></div>
                </div>

                <p className="text-gray-600 animate-pulse">
                  Procesando ingredientes y calculando fórmula en el laboratorio...
                </p>
              </div>
            </div>

            {/* Custom CSS animations */}
            <style jsx>{`
              @keyframes liquidFill {
                0% { height: 40%; }
                100% { height: 80%; }
              }
              
              @keyframes progressFill {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Duplicate Ingredient Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Ingrediente Duplicado</DialogTitle>
            <DialogDescription className="text-slate-600">{duplicateMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowDuplicateModal(false)} className="bg-sky-500 hover:bg-sky-600">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitConfirmModal} onOpenChange={setShowExitConfirmModal}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
          <DialogHeader>
            <DialogTitle className="text-slate-800">¿Salir del registro?</DialogTitle>
            <DialogDescription className="text-slate-600">
              Si sales del registro de fórmula, todos los datos ingresados se perderán y el registro será eliminado.
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

      {/* Validation Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Información faltante</DialogTitle>
            <DialogDescription className="text-slate-600">{validationMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowValidationModal(false)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
