"use client"

import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModalConfirmationProps {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ModalConfirmation({ Titulo, Mensaje, isOpen, onConfirm, onCancel }: ModalConfirmationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex items-center gap-3">
          <AlertCircle className="h-7 w-7 text-white flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white">Confirmación</h2>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 text-white hover:text-blue-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{Titulo}</h3>
          <p className="text-gray-600">{Mensaje}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}
