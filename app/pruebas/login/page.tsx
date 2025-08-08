'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { selUsuarioLogin } from '@/app/actions/usuarios-actions' // Importa la Server Action
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  // useActionState para manejar el estado de la acción del servidor
  const [state, formAction, isPending] = useActionState(selUsuarioLogin, {
    success: false,
    message: '',
  })

  // Efecto para redirigir cuando el estado de la acción cambia
  useEffect(() => {
    if (state.message) {
      const status = state.success ? 'success' : 'error'
      router.push(`/pruebas/login/resultado?status=${status}&message=${encodeURIComponent(state.message)}`)
    }
  }, [state, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      // Redirigir a la página de resultado con un mensaje de error de validación
      router.push(`/pruebas/login/resultado?status=error&message=${encodeURIComponent('Por favor, llena todos los campos.')}`)
      return
    }

    // Crear FormData para enviar a la Server Action
    const formData = new FormData(event.currentTarget)
    // La contraseña se envía en texto plano para que bcrypt.compare la procese en el servidor
    // No se encripta aquí en el cliente con bcrypt, ya que bcrypt.compare necesita el texto plano.
    // La seguridad se garantiza con HTTPS y el hashing en el servidor.

    formAction(formData) // Llama a la Server Action
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Login de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Usuario (Email)</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
