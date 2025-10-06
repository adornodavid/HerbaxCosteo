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
  Permisos: string[]
  SesionActiva: boolean
}

/* ==================================================
  Funciones
  --------------------
  * Session
    - crearSesion / setSession
    - obtenerSesion / getSession

  * Cookies
    - establecerSesionCookies / setSessionCookies
    - obtenerSesionCookies / getSessionCookies
    - borrarCookies / deleteCookies

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

// Función: obtenerSesion / getSession: función para obtener las cookies de la sesion creada
export async function obtenerSesion(): Promise<Session | null> {
  try {
    // Paso 1: Obtener la cooki desencriptada
    const CookiesDesencryptadas = await obtenerSesionCookies()

    // Paso 2: dividir string de cookie desencriptada, dividir por | y guardar en un array
    const CookiesArray = CookiesDesencryptadas?.split("|") || []

    // Paso 3: recorrer array y volver a dividir cada 1 por : y crear su variable de acuerdo al caso, excepto permisos, alli se vuelve a dividir por _ y se crea otro array para guardar en su variable
    let UsuarioId = ""
    let Email = ""
    let NombreCompleto = ""
    let ClienteId = ""
    let RolId = ""
    let Permisos: string[] = []
    let SesionActiva = ""

    for (const elemento of CookiesArray) {
      const [clave, valor] = elemento.split(":")

      switch (clave) {
        case "UsuarioId":
          UsuarioId = valor
          break
        case "Email":
          Email = valor
          break
        case "NombreCompleto":
          NombreCompleto = valor
          break
        case "ClienteId":
          ClienteId = valor
          break
        case "RolId":
          RolId = valor
          break
        case "Permisos":
          Permisos = valor.split("_")
          break
        case "SesionActiva":
          SesionActiva = valor
          break
      }
    }

    if (!UsuarioId || !Email || SesionActiva !== "true") {
      return null
    }

    return {
      UsuarioId: Number.parseInt(UsuarioId),
      Email: Email,
      NombreCompleto: NombreCompleto || "",
      ClienteId: Number.parseInt(ClienteId || "0"),
      RolId: Number.parseInt(RolId || "0"),
      Permisos: Permisos || [],
      SesionActiva: SesionActiva === "true",
    }
  } catch (error) {
    console.error("Error en obtenersesion de actions/session:", error)
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
      console.error(
        "Error: No se pudo obtener la cookie encriptada HealthyLabCosteo, en obtenerSesionCookies de actions/session",
      )
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

// Función: borrarCookies / deleteCookies: función para limpiar las cookies de la sesion creada
export async function borrarCookies(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.delete("HealthyLabCosteo")
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
  cookieStore.set("Permisos", sessionData.Permisos.join("_"), cookieOptions)
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
export const obtenerVariablesSesion = obtenerSesion
