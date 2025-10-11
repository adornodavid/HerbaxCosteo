"use client"

import { X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageModalErrorProps {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export function PageModalError({ Titulo, Mensaje, isOpen, onClose }: PageModalErrorProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-gradient-to-br from-red-900 to-red-600 rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-white/80 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-10 w-10 text-white" />
            <h2 className="text-3xl font-bold text-white">Error</h2>
          </div>

          <div className="mb-3">
            <h3 className="text-xl font-semibold text-white">{Titulo}</h3>
          </div>

          <div className="mb-6">
            <p className="text-white/90 leading-relaxed">{Mensaje}</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-white text-black hover:bg-white/90">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
