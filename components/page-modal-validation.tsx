"use client"

import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageModalValidationProps {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export function PageModalValidation({ Titulo, Mensaje, isOpen, onClose }: PageModalValidationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-gradient-to-br from-sky-400 to-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <button onClick={onClose} className="absolute top-2 right-2 text-black hover:text-gray-800" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 p-6 pb-4">
          <CheckCircle className="h-8 w-8 text-black" />
          <h2 className="text-2xl font-bold text-black">Validación</h2>
        </div>

        <div className="px-6 pb-2">
          <h3 className="text-lg font-semibold text-black">{Titulo}</h3>
        </div>

        <div className="px-6 pb-6">
          <p className="text-black">{Mensaje}</p>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={onClose} variant="default">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
