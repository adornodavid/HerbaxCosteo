"use client"

import { Loader2 } from "lucide-react"

interface PageProcessingProps {
  isOpen: boolean
}

export function PageProcessing({ isOpen }: PageProcessingProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-lg flex flex-col items-center justify-center p-6"
        style={{ width: "300px", height: "120px" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#5d8f72]" />
        <p className="mt-3 text-sm text-center text-gray-700">
          Espera un momento, se esta procesando la solicitud.......
        </p>
      </div>
    </div>
  )
}
