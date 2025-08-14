"use server"

import { cookies } from "next/headers"

export interface UserSession {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  ClienteId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

export async function createSession(sessionData: UserSession) {
  const cookieOptions = {
    maxAge: 20 * 24 * 60 * 60, // 20 días en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  const cookieStore = cookies()
  cookieStore.set("UsuarioId", sessionData.UsuarioId.toString(), cookieOptions)
  cookieStore.set("Email", sessionData.Email, cookieOptions)
  cookieStore.set("NombreCompleto", sessionData.NombreCompleto, cookieOptions)
  cookieStore.set("ClienteId", sessionData.ClienteId.toString(), cookieOptions)
  cookieStore.set("RolId", sessionData.RolId.toString(), cookieOptions)
  cookieStore.set("Permisos", sessionData.Permisos, cookieOptions)
  cookieStore.set("SesionActiva", sessionData.SesionActiva.toString(), cookieOptions)
}

export async function deleteSession() {
  const cookieStore = cookies()
  cookieStore.delete("UsuarioId")
  cookieStore.delete("Email")
  cookieStore.delete("NombreCompleto")
  cookieStore.delete("ClienteId")
  cookieStore.delete("RolId")
  cookieStore.delete("Permisos")
  cookieStore.delete("SesionActiva")
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies()

    const usuarioId = cookieStore.get("UsuarioId")?.value
    const email = cookieStore.get("Email")?.value
    const nombreCompleto = cookieStore.get("NombreCompleto")?.value
    const clienteId = cookieStore.get("ClienteId")?.value
    const rolId = cookieStore.get("RolId")?.value
    const permisos = cookieStore.get("Permisos")?.value
    const sesionActiva = cookieStore.get("SesionActiva")?.value

    if (!usuarioId || !email || sesionActiva !== "true") {
      return null
    }

    return {
      UsuarioId: Number.parseInt(usuarioId),
      Email: email,
      NombreCompleto: nombreCompleto || "",
      ClienteId: Number.parseInt(clienteId || "0"),
      RolId: Number.parseInt(rolId || "0"),
      Permisos: permisos || "",
      SesionActiva: sesionActiva === "true",
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}
