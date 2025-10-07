"use client"

import type React from "react"

/* ==================================================
  Imports
================================================== */
import { useState } from "react"
import { useUserSession } from "@/hooks/use-user-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Key, Shield } from "lucide-react"

/* ==================================================
  Principal - página
================================================== */
export default function PerfilPage() {
  const { user, loading } = useUserSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar lógica de cambio de contraseña
    console.log("Cambiar contraseña:", { currentPassword, newPassword, confirmPassword })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-slate-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <User className="h-5 w-5 text-blue-600" />
                Información del Usuario
              </CardTitle>
              <CardDescription>Datos de tu cuenta en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user?.NombreCompleto?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{user?.NombreCompleto || "Usuario"}</h3>
                  <p className="text-sm text-slate-600">{user?.Email || "email@ejemplo.com"}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">ID: {user?.UsuarioId || "N/A"}</Badge>
                    {user?.SesionActiva && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Cliente ID:</span>
                  <span className="text-sm text-slate-900">{user?.ClienteId || "No asignado"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Rol ID:</span>
                  <span className="text-sm text-slate-900">{user?.RolId || "No asignado"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="h-5 w-5 text-green-600" />
                Variables de Sesión
              </CardTitle>
              <CardDescription>Valores almacenados en la cookie de sesión activa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-1">Usuario ID</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.UsuarioId || "N/A"}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-1">Email</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">{user?.Email || "N/A"}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-xs font-medium text-purple-700 mb-1">Nombre Completo</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.NombreCompleto || "N/A"}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                  <p className="text-xs font-medium text-orange-700 mb-1">Cliente ID</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.ClienteId || "N/A"}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg">
                  <p className="text-xs font-medium text-indigo-700 mb-1">Rol ID</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.RolId || "N/A"}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
                  <p className="text-xs font-medium text-teal-700 mb-1">Permisos</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user?.Permisos && user.Permisos.length > 0 ? (
                      user.Permisos.map((permiso, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permiso}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Sin permisos asignados</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-1">Sesión Activa</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.SesionActiva ? "Sí" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Key className="h-5 w-5 text-purple-600" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>Actualiza tu contraseña de acceso al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Actualizar Contraseña
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
