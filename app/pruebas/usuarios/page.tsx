'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { insUsuario, obtenerUsuarios } from '@/app/actions/usuarios-actions' // Update the import path for insUsuario and obtenerUsuarios

export default function UsuariosPage() {
  const [nombrecompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rolid, setRolid] = useState('')
  const [isPending, startTransition] = useTransition()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalSuccess, setModalSuccess] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await obtenerUsuarios()
      if (result.success) {
        setUsers(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Client-side validation
    if (!nombrecompleto || !email || !password || !rolid) {
      setModalTitle('Error de Validación')
      setModalMessage('Por favor, completa todos los campos obligatorios (Nombre Completo, Email, Contraseña, Rol ID).')
      setModalSuccess(false)
      setShowModal(true)
      return
    }

    if (password !== confirmPassword) {
      setModalTitle('Error de Validación')
      setModalMessage('Las contraseñas no coinciden. Por favor, verifica.')
      setModalSuccess(false)
      setShowModal(true)
      return
    }

    if (isNaN(parseInt(rolid))) {
      setModalTitle('Error de Validación')
      setModalMessage('El Rol ID debe ser un número entero válido.')
      setModalSuccess(false)
      setShowModal(true)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', 4)
      formData.append('nombrecompleto', nombrecompleto)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('rolid', rolid)
      // Añadir valores por defecto para hotelid y activo, ya que la acción insUsuario los espera
      formData.append('hotelid', '1') // Valor por defecto para pruebas
      formData.append('activo', 'on') // Valor por defecto para pruebas (checkbox checked)

      const result = await insUsuario(formData) // Pasar un estado inicial vacío y formData

      if (result.success) {
        setModalTitle('Éxito')
        setModalMessage(result.message)
        setModalSuccess(true)
        // Clear form fields on success
        setNombreCompleto('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setRolid('')
      } else {
        setModalTitle('Error')
        setModalMessage(result.message || 'Ocurrió un error inesperado.')
        setModalSuccess(false)
      }
      setShowModal(true)
    })
  }

  if (loading) return <div>Cargando usuarios...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Nuevo Usuario (Pruebas)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombrecompleto">Nombre Completo</Label>
              <Input
                id="nombrecompleto"
                type="text"
                placeholder="John Doe"
                required
                value={nombrecompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rolid">Rol ID</Label>
              <Input
                id="rolid"
                type="number" // Usar type="number" para restringir a números
                placeholder="Ej: 1"
                required
                value={rolid}
                onChange={(e) => setRolid(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Usuario'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-4">Lista de Usuarios</h1>
        <ul className="list-disc list-inside">
          {users.map((user: any) => (
            <li key={user.id}>{user.nombre} - {user.email}</li>
          ))}
        </ul>
      </div>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={modalSuccess ? 'text-green-600' : 'text-red-600'}>
              {modalTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>{modalMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setShowModal(false)}>Cerrar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
