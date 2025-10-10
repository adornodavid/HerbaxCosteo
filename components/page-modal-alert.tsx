"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageModalAlertProps {
  title: string
  message: string
  isOpen: boolean
  onClose: () => void
}

export function PageModalAlert({ title, message, isOpen, onClose }: PageModalAlertProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-xl border-4 border-yellow-500 max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header: Icon + "Alerta" */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-yellow-900">Alerta</h2>
        </div>

        {/* Title */}
        <div className="px-6 pb-2">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Footer with close button */}
        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={onClose} variant="default">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
