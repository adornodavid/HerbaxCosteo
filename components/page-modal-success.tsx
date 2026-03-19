"use client"

import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { propsPageModalAlert } from "@/types/common"

export function PageModalSuccess({ Titulo, Mensaje, isOpen, onClose }: propsPageModalAlert) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg shadow-xl max-w-md w-full mx-4">
        <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-gray-200" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 p-6 pb-4">
          <CheckCircle className="h-8 w-8 text-white" />
          <h2 className="text-2xl font-bold text-white">Éxito</h2>
        </div>

        <div className="px-6 pb-2">
          <h3 className="text-lg font-semibold text-white">{Titulo}</h3>
        </div>

        <div className="px-6 pb-6">
          <p className="text-white">{Mensaje}</p>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={onClose} variant="default" className="bg-white text-green-600 hover:bg-gray-100">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
