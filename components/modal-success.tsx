"use client"

import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModalSuccessProps {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export function ModalSuccess({ Titulo, Mensaje, isOpen, onClose }: ModalSuccessProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Éxito</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white hover:text-green-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{Titulo}</h3>
          <p className="text-gray-600">{Mensaje}</p>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
