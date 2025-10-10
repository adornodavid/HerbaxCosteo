"use client"

import { X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageModalErrorProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  mensaje: string
}

export function PageModalError({ isOpen, onClose, titulo, mensaje }: PageModalErrorProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border-4 border-red-500">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Contenido del modal */}
        <div className="p-6">
          {/* Primera fila: Icono y texto "Error" */}
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-10 w-10 text-red-500" />
            <h2 className="text-3xl font-bold text-red-900">Error</h2>
          </div>

          {/* Segunda fila: Título del error */}
          <div className="mb-3">
            <h3 className="text-xl font-semibold text-gray-800">{titulo}</h3>
          </div>

          {/* Tercera fila: Mensaje del error */}
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed">{mensaje}</p>
          </div>

          {/* Botón de cerrar */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="destructive">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
