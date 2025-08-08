"use client"

import { useState, useEffect, useRef } from "react" // Importar useRef
import { insUsuario, obtenerUsuarios, insUsuario2 } from "@/app/actions/usuarios-actions" // Importar insUsuario2
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
  const [manualInsertMessage, setManualInsertMessage] = useState<string | null>(null)
  const [manualInsertLoading, setManualInsertLoading] = useState(false)

  // Refs para acceder a los valores de los inputs
  const nombrecompletoRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const rolidRef = useRef<HTMLSelectElement>(null) // Para el Select

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

  const handleManualInsert = async () => {
    setManualInsertLoading(true)
    setManualInsertMessage(null)

    const nombrecompleto = nombrecompletoRef.current?.value
    const email = emailRef.current?.value
    const password = passwordRef.current?.value
    const rolid = parseInt(rolidRef.current?.value || "0") // Obtener valor del select

    // Validaciones básicas (similares a las del formulario con 'required')
    if (!nombrecompleto || !email || !password || !rolid) {
      setManualInsertMessage("Todos los campos son obligatorios.")
      setManualInsertLoading(false)
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setManualInsertMessage("Por favor, introduce un email válido.")
      setManualInsertLoading(false)
      return
    }

    if (password.length < 6) { // Ejemplo de validación de contraseña
      setManualInsertMessage("La contraseña debe tener al menos 6 caracteres.")
      setManualInsertLoading(false)
      return
    }

    try {
      const result = await insUsuario2(nombrecompleto, email, password, rolid, true) // activo: true

      if (result.success) {
        setManualInsertMessage("Usuario insertado correctamente con insUsuario2!")
        // Opcional: Limpiar los campos después de la inserción manual
        if (nombrecompletoRef.current) nombrecompletoRef.current.value = ""
        if (emailRef.current) emailRef.current.value = ""
        if (passwordRef.current) passwordRef.current.value = ""
        if (rolidRef.current) rolidRef.current.value = "" // Limpiar el select
        // Refrescar la lista de usuarios
        const { success: fetchSuccess, data: fetchedUsers } = await obtenerUsuarios()
        if (fetchSuccess && fetchedUsers) {
          setUsuarios(fetchedUsers)
        }
      } else {
        setManualInsertMessage(`Error al insertar con insUsuario2: ${result.error}`)
      }
    } catch (error) {
      console.error("Error en handleManualInsert:", error)
      setManualInsertMessage("Error interno del servidor al insertar usuario.")
    } finally {
      setManualInsertLoading(false)
    }
  }

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
              <Input id="nombrecompleto" name="nombrecompleto" type="text" required ref={nombrecompletoRef} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required ref={emailRef} />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required ref={passwordRef} />
            </div>
            <div>
              <Label htmlFor="rolid">Rol</Label>
              <Select name="rolid" required onValueChange={(value) => { if (rolidRef.current) rolidRef.current.value = value }}>
                <SelectTrigger id="rolid" ref={rolidRef as any}> {/* Cast para useRef en SelectTrigger */}
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
                "Insertar Usuario (Form Action)"
              )}
            </Button>
            {state?.message && (
              <p className={`mt-2 text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
                {state.message}
              </p>
            )}
          </form>

          {/* NUEVO BOTÓN DE INSERCIÓN MANUAL */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button onClick={handleManualInsert} disabled={manualInsertLoading}>
              {manualInsertLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Insertando (Manual)...
                </>
              ) : (
                "Insertar Usuario (Manual)"
              )}
            </Button>
            {manualInsertMessage && (
              <p className={`mt-2 text-sm ${manualInsertMessage.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                {manualInsertMessage}
              </p>
            )}
          </div>
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
