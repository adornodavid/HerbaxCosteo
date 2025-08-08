"use client"

import { useState, useEffect } from "react"
import { insUsuario, obtenerUsuarios } from "@/app/actions/usuarios-actions" // Importación corregida
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useActionState } from "react"
import { Loader2 } from 'lucide-react'

interface Usuario {
  id: number
  nombrecompleto: string
  email: string
  rolid: number
  activo: boolean
}

const initialState = {
  message: "",
  success: false,
  errors: undefined,
}

export default function UsuariosPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const nombrecompleto = formData.get("nombrecompleto") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const rolid = parseInt(formData.get("rolid") as string)

      // Llama a la Server Action con los argumentos correctos
      const result = await insUsuario(nombrecompleto, email, password, rolid)

      if (!result.success) {
        return { message: result.error, success: false }
      }
      setUsuarios((prev) => (result.data ? [...prev, result.data] : prev))
      return { message: "Usuario insertado correctamente!", success: true }
    },
    initialState,
  )

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true)
      const { success, data, error } = await obtenerUsuarios()
      if (success && data) {
        setUsuarios(data)
      } else {
        console.error("Error al cargar usuarios:", error)
      }
      setLoading(false)
    }
    fetchUsuarios()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Insertar Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
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
              <Label htmlFor="rolid">Rol</Label>
              <Select name="rolid" required>
                <SelectTrigger id="rolid">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrador</SelectItem>
                  <SelectItem value="2">Gerente</SelectItem>
                  <SelectItem value="3">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Insertando...
                </>
              ) : (
                "Insertar Usuario"
              )}
            </Button>
            {state?.message && (
              <p className={`mt-2 text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
                {state.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando usuarios...</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {usuarios.map((usuario) => (
                <li key={usuario.id} className="border p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{usuario.nombrecompleto}</p>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${usuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
