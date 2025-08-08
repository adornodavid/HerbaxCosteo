'use client'

import { useState } from 'react'
import { insUsuario } from '@/app/actions/usuarios-actions' // Asegúrate de que esta ruta sea correcta
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NuevoUsuarioPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    // La solución: Pasar directamente el formData
    const result = await insUsuario(formData)

    if (result.success) {
      setMessage(result.message)
      setIsSuccess(true)
      event.currentTarget.reset() // Limpiar el formulario
    } else {
      setMessage(result.message)
      setIsSuccess(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Crear Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombrecompleto">Nombre Completo</Label>
              <Input id="nombrecompleto" name="nombrecompleto" type="text" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="rolid">ID de Rol</Label>
              <Input id="rolid" name="rolid" type="number" required />
            </div>
            <Button type="submit" className="w-full">
              Crear Usuario
            </Button>
          </form>
          {message && (
            <div className={`mt-4 text-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
