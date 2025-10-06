"use server"

/* ==================================================
  Imports
================================================== */
import { cookies } from "next/headers"
import type { Session } from "@/types/usuarios"
import { Encrypt, Desencrypt } from "./utilerias"

/* ==================================================
  Interfaces, clases, objetos
================================================== */
export interface SessionData {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  ClienteId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

/* ==================================================
  Funciones
  --------------------
  * SESSION
    - crearSesion / setSession
    - obtenerSesion / getSession
    - establecerSesionCookies / setSessionCookies
    - limpiarSesion / clearSession
    - crearSesionConExpiracion
    - obtenerVariablesSesion
    - cerrarSesion
    - obtenerTiempoRestanteSesion
    - renovarSesion
  
	* 
    - getSession
    - clearSession

    - getUserSessionData
    - getSessionCookies    
    - validateSession
    - setSessionCookies
================================================== */

// Función: crearSesion / setSession: Funcion donde se crea la sesion


// Función: getSession: función para obtener las cookies de la sesion creada
export async function getSession(): Promise<Session | null> {
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

// Funcion: establecerSesionCookies / setSessionCookies: Función donde se crea la cookie/ticket
export async function establecerSesionCookies(string): Promise<void> {
  const cookieStore = cookies()

  // Configurar cookies con duración de 20 días
  const cookieOptions = {
    maxAge: 20 * 24 * 60 * 60, // 20 días en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  cookieStore.set("UsuarioId", Session.UsuarioId.toString(), cookieOptions)
  cookieStore.set("Email", Session.Email, cookieOptions)
  cookieStore.set("NombreCompleto", Session.NombreCompleto, cookieOptions)
  cookieStore.set("ClienteId", Session.ClienteId.toString(), cookieOptions)
  cookieStore.set("RolId", Session.RolId.toString(), cookieOptions)
  cookieStore.set("Permisos", Session.Permisos, cookieOptions)
  cookieStore.set("SesionActiva", Session.SesionActiva.toString(), cookieOptions)
}

// Función: setSessionCookies: función para definir variables de sesion
export async function setSessionCookies(sessionData: Session): Promise<void> {
  const cookieStore = cookies()

  // Configurar cookies con duración de 20 días
  const cookieOptions = {
    maxAge: 20 * 24 * 60 * 60, // 20 días en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  cookieStore.set("UsuarioId", Session.UsuarioId.toString(), cookieOptions)
  cookieStore.set("Email", Session.Email, cookieOptions)
  cookieStore.set("NombreCompleto", Session.NombreCompleto, cookieOptions)
  cookieStore.set("ClienteId", Session.ClienteId.toString(), cookieOptions)
  cookieStore.set("RolId", Session.RolId.toString(), cookieOptions)
  cookieStore.set("Permisos", Session.Permisos, cookieOptions)
  cookieStore.set("SesionActiva", Session.SesionActiva.toString(), cookieOptions)
}

// Función: clearSession: función para limpiar las cookies de la sesion creada
export async function clearSession(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.delete("UsuarioId")
  cookieStore.delete("Email")
  cookieStore.delete("NombreCompleto")
  cookieStore.delete("ClienteId")
  cookieStore.delete("RolId")
  cookieStore.delete("Permisos")
  cookieStore.delete("SesionActiva")
}

/*
//Función: getUserSessionData: función que devuelve la sessionData
export async function getUserSessionData(): Promise<SessionData | null> {
  return await getSession()
}

//Función: getSessionCookies: función que devuelve las cookies
export async function getSessionCookies(): Promise<SessionData | null> {
  return await getSession()
}

export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  return session !== null && session.SesionActiva === true
}
*/

// Nueva función para obtener variables de sesión (alias de getSession)
export const obtenerVariablesSesion = getSession
