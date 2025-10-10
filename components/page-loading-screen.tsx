"use client"

import Image from "next/image"

export function PageLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative h-24 w-24">
            <Image src="/loading-spinner.png" alt="Loading" width={96} height={96} className="animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Cargando...</h2>
        <p className="text-gray-600">Por favor espere un momento</p>
      </div>
    </div>
  )
}
