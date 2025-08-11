"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Upload, ArrowLeft, ArrowRight, FileImage } from "lucide-react"
import { crearFormula } from "@/app/actions/formulas-actions"

interface FormData {
  nombre: string
  notaspreparacion: string
  costo: number
  activo: boolean
  cantidad: number
  unidadmedidaid: number
  imagen?: File
}

export default function NuevaFormulaPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para el formulario por etapas
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estados para los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    notaspreparacion: "",
    costo: 0,
    activo: true,
    cantidad: 0,
    unidadmedidaid: 1,
    imagen: undefined,
  })

  const [imagePreview, setImagePreview] = useState<string>("")

  const steps = [
    { number: 1, title: "Información Básica", description: "Datos generales de la fórmula" },
    { number: 2, title: "Agregar Elementos", description: "Ingredientes y componentes" },
    { number: 3, title: "Resumen y Confirmación", description: "Verificar información" },
    { number: 4, title: "Finalización", description: "Proceso completado" },
  ]

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
    return formData.nombre.trim() !== "" && formData.costo > 0 && formData.cantidad > 0
  }

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      setErrorMessage("Por favor completa todos los campos obligatorios")
      setShowErrorModal(true)
      return
    }

    if (currentStep < 4) {
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
      const result = await crearFormula(formData)

      if (result.success) {
        setCurrentStep(4)
        setShowSuccessModal(true)
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
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre de la Fórmula *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Ingresa el nombre de la fórmula"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costo">Costo *</Label>
          <Input
            id="costo"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo}
            onChange={(e) => handleInputChange("costo", Number.parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad"
            type="number"
            min="0"
            value={formData.cantidad}
            onChange={(e) => handleInputChange("cantidad", Number.parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidadmedida">Unidad de Medida</Label>
          <Select
            value={formData.unidadmedidaid.toString()}
            onValueChange={(value) => handleInputChange("unidadmedidaid", Number.parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Gramos</SelectItem>
              <SelectItem value="2">Kilogramos</SelectItem>
              <SelectItem value="3">Litros</SelectItem>
              <SelectItem value="4">Mililitros</SelectItem>
              <SelectItem value="5">Piezas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notaspreparacion">Notas de Preparación</Label>
        <Textarea
          id="notaspreparacion"
          value={formData.notaspreparacion}
          onChange={(e) => handleInputChange("notaspreparacion", e.target.value)}
          placeholder="Instrucciones de preparación..."
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <Label>Imagen de la Fórmula</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Subir Imagen
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          {formData.imagen && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileImage className="h-3 w-3" />
              {formData.imagen.name}
            </Badge>
          )}
        </div>

        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Agregar Ingredientes</h3>
        <p className="text-gray-500">Esta funcionalidad se implementará en la siguiente fase del desarrollo.</p>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Resumen de la Fórmula</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Nombre</Label>
            <p className="text-sm">{formData.nombre}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Costo</Label>
            <p className="text-sm">${formData.costo.toFixed(2)}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Cantidad</Label>
            <p className="text-sm">{formData.cantidad}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Estado</Label>
            <Badge variant={formData.activo ? "default" : "secondary"}>{formData.activo ? "Activo" : "Inactivo"}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          {imagePreview && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Imagen</Label>
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border mt-2"
              />
            </div>
          )}

          {formData.notaspreparacion && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Notas de Preparación</Label>
              <p className="text-sm">{formData.notaspreparacion}</p>
            </div>
          )}
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

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.number}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-4 mt-5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
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
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep === 3 ? (
              <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
                {isLoading ? "Creando..." : "Crear Fórmula"}
              </Button>
            ) : (
              <Button onClick={handleNextStep} className="flex items-center gap-2">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ¡Éxito!
            </DialogTitle>
            <DialogDescription>La fórmula ha sido creada exitosamente.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
