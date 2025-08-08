'use client'

import { useState, useEffect } from 'react'
import { insUsuario, getUsuarios, deleteUsuario } from '@/app/actions/usuarios-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Usuario {
  UsuarioId: number
  NombreCompleto: string
  Email: string
  RolId: number
  SesionActiva: boolean
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState<string>('')

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    const data = await getUsuarios()
    setUsuarios(data as Usuario[])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('nombrecompleto', nombreCompleto)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('rolid', rolId)

    const result = await insUsuario(formData) // Corrected call
    if (result.success) {
      alert(result.message)
      setNombreCompleto('')
      setEmail('')
      setPassword('')
      setRolId('')
      fetchUsuarios()
    } else {
      alert(`Error: ${result.message}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      const result = await deleteUsuario(id)
      if (result.success) {
        alert(result.message)
        fetchUsuarios()
      } else {
        alert(`Error: ${result.message}`)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Crear Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombreCompleto">Nombre Completo</Label>
              <Input
                id="nombreCompleto"
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="rolId">Rol</Label>
              <Select value={rolId} onValueChange={setRolId} required>
                <SelectTrigger id="rolId">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrador</SelectItem>
                  <SelectItem value="2">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Crear Usuario</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sesión Activa</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.UsuarioId}>
                  <TableCell>{usuario.UsuarioId}</TableCell>
                  <TableCell>{usuario.NombreCompleto}</TableCell>
                  <TableCell>{usuario.Email}</TableCell>
                  <TableCell>{usuario.RolId === 1 ? 'Administrador' : 'Usuario'}</TableCell>
                  <TableCell>{usuario.SesionActiva ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Button variant="destructive" onClick={() => handleDelete(usuario.UsuarioId)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
