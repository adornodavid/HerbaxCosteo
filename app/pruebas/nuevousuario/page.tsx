'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { insUsuario } from '@/app/actions/usuarios' // Importa la Server Action existente

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(insUsuario, {
    message: '',
    errors: undefined,
    success: false,
  })

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (e.target.value !== confirmPassword) {
      setPasswordMatchError('Las contraseñas no coinciden.')
    } else {
      setPasswordMatchError(null)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (password !== e.target.value) {
      setPasswordMatchError('Las contraseñas no coinciden.')
    } else {
      setPasswordMatchError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setPasswordMatchError('Las contraseñas no coinciden.')
      return
    }
    setPasswordMatchError(null) // Clear any previous error

    const formData = new FormData(event.currentTarget)
    formAction(formData)
  }

  // Show dialog when state changes to success or error
  React.useEffect(() => {
    if (state.message) {
      setShowDialog(true)
    }
  }, [state])

  const handleDialogClose = () => {
    setShowDialog(false)
    if (state.success) {
      router.push('/usuarios') // Redirect on success
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
              {state.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="nombrecompleto">Nombre Completo</Label>
              <Input id="nombrecompleto" name="nombrecompleto" type="text" placeholder="John Doe" required />
              {state.errors?.nombrecompleto && <p className="text-red-500 text-sm mt-1">{state.errors.nombrecompleto}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
                minLength={6}
                value={password}
                onChange={handlePasswordChange}
              />
              {state.errors?.password && <p className="text-red-500 text-sm mt-1">{state.errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="********"
                required
                minLength={6}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {passwordMatchError && <p className="text-red-500 text-sm mt-1">{passwordMatchError}</p>}
            </div>
            <div>
              <Label htmlFor="rolid">Rol</Label>
              <Select name="rolid" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrador</SelectItem>
                  <SelectItem value="2">Usuario Estándar</SelectItem>
                  <SelectItem value="3">Invitado</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.rolid && <p className="text-red-500 text-sm mt-1">{state.errors.rolid}</p>}
            </div>
            <div>
              <Label htmlFor="hotelid">Hotel</Label>
              <Select name="hotelid" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Hotel A</SelectItem>
                  <SelectItem value="2">Hotel B</SelectItem>
                  <SelectItem value="13">Hotel C</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.hotelid && <p className="text-red-500 text-sm mt-1">{state.errors.hotelid}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="activo" name="activo" defaultChecked />
              <Label htmlFor="activo">Activo</Label>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !!passwordMatchError}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.success ? 'Éxito' : 'Error'}</DialogTitle>
            <DialogDescription>{state.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDialogClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
