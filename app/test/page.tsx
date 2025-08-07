'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Página de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg">
            Esta es una página de prueba accesible sin necesidad de iniciar sesión.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
