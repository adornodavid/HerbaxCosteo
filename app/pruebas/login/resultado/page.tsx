'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

export default function ResultadoLoginPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const message = searchParams.get('message')

  const isSuccess = status === 'success'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className={`text-3xl font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccess ? (
              <CheckCircle className="mx-auto h-16 w-16 mb-4" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 mb-4" />
            )}
            {isSuccess ? 'Operación Exitosa' : 'Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-gray-700">
            {message ? decodeURIComponent(message) : 'No se proporcionó un mensaje.'}
          </p>
          <Button asChild>
            <Link href="/pruebas/login">Volver al Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
