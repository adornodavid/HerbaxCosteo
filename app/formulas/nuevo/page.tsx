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
    { number: 1, title: "Información Básica", description: "Datos de fórmula" },
    { number: 2, title: "Agregar Elementos", description: "Carga Ingredientes" },
    { number: 3, title: "Resumen y Confirmación", description: "Resumen información" },
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
    return formData.nombre.trim() !== ""
  }

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      setErrorMessage("Por favor completa el nombre de la fórmula")
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
                  className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-colors duration-200"
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-6">Detalles de Cantidad y Costo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="costo" className="text-slate-700 font-medium">
              Costo *
            </Label>
            <Input
              id="costo"
              type="number"
              step="0.01"
              min="0"
              value={formData.costo}
              onChange={(e) => handleInputChange("costo", Number.parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
            />
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
              className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="unidadmedida" className="text-slate-700 font-medium">
              Unidad de Medida
            </Label>
            <Select
              value={formData.unidadmedidaid.toString()}
              onValueChange={(value) => handleInputChange("unidadmedidaid", Number.parseInt(value))}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-sky-400 focus:ring-sky-400/20">
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
      </div>

      <div className="text-center py-8">
        <h4 className="text-lg font-medium text-slate-700 mb-2">Agregar Ingredientes</h4>
        <p className="text-slate-500">Esta funcionalidad se implementará en la siguiente fase del desarrollo.</p>
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
      <div className="mb-5">
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
                    className={`text-sm font-medium ${currentStep >= step.number ? "text-sky-700" : "text-slate-600"}`}
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
        <CardContent className="p-6">
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
                {isLoading ? "Creando..." : "Crear Fórmula"}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg"
              >
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
