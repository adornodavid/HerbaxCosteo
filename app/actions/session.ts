"use server"

/* ==================================================
  Imports
================================================== */
import { cookies } from "next/headers"
import type { Session } from "@/types/usuarios"
import { Desencrypt } from "./utilerias"

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
    - obtenerSesionCookies / getSessionCookies

    - limpiarSesion / clearSession
    - crearSesionConExpiracion x
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
export async function establecerSesionCookies(SesionEncriptada: string): Promise<void> {
  const cookieStore = cookies()

  // Configurar cookies con duración de 1 día
  const cookieOptions = {
    maxAge: 1 * 24 * 60 * 60, // 1 días en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  cookieStore.set("HealthyLabCosteo", SesionEncriptada.toString(), cookieOptions)
}

// Función: obtenerSesionCookies / getSessionCookies: Función para obtener las cookies de la sesion, cookies/ticket/cookiencriptda
export async function obtenerSesionCookies(): Promise<string | null> {
  try {
    const cookieStore = cookies()

    const CookieEncriptada = cookieStore.get("HealthyLabCosteo")?.value

    if (!CookieEncriptada) {
      console.error("Error: No se pudo obtener la cookie encriptada HealthyLabCosteo")
      return null
    }

    // Desencriptar la cookie
    const CookieDesencriptada = await Desencrypt(CookieEncriptada)

    return CookieDesencriptada
  } catch (error) {
    console.error("Error obteniendo las cookies encriptadas en app/actions/session:", error)
    return null
  }
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

  cookieStore.set("UsuarioId", sessionData.UsuarioId.toString(), cookieOptions)
  cookieStore.set("Email", sessionData.Email, cookieOptions)
  cookieStore.set("NombreCompleto", sessionData.NombreCompleto, cookieOptions)
  cookieStore.set("ClienteId", sessionData.ClienteId.toString(), cookieOptions)
  cookieStore.set("RolId", sessionData.RolId.toString(), cookieOptions)
  cookieStore.set("Permisos", sessionData.Permisos, cookieOptions)
  cookieStore.set("SesionActiva", sessionData.SesionActiva.toString(), cookieOptions)
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
