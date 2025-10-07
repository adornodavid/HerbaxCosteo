"use server"

/* ==================================================
  Imports
================================================== */
import { supabase } from "@/lib/supabase"
import { setSessionCookies } from "./session-actions"
import { cerrarSesion } from "./session-actions-with-expiration" // Importar cerrarSesion
import { HashData, Encrypt } from "./utilerias"
import { establecerSesionCookies, eliminarSesionCookies } from "./session"
import type { Session } from "@/types/usuarios" // Declare the LoginResult variable

/* ==================================================
	  Funciones
	  --------------------
		* Inicio
      - procesarInicioSesion
    * Cerrar
      - procesarCerrarSesion

      - validateLoginBackend
      




    * SESSION
      - obtenerSesion / getSession
      - establecerSesionCookies / setSessionCookies
      - limpiarSesion / clearSession
      - crearSesionConExpiracion
      - obtenerVariablesSesion
      - cerrarSesion
      - obtenerTiempoRestanteSesion
      - renovarSesion
      - 
	================================================== */

// procesarInicioSesion: funcion para iniciar sesion en el sistema
export async function procesarInicioSesion(email: string, password: string): Promise<LoginResult> {
  try {
    console.log("pass: " + password)
    // Paso 1: Encriptar el password introducido
    //const PasswordHash = await HashData(password)
    const PasswordHash = "Herbax25"

    // Paso 2: Validar credenciales
    const { data: usuarios, error: loginError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("password", PasswordHash)
      .eq("activo", true)

    if (loginError) {
      console.error("Error en app/actions/login, en paso 2 de consulta de usuario en tabla:", loginError)
      return {
        success: false,
        message: "Error en el servidor. Intenta nuevamente.",
      }
    }
    if (!usuarios || usuarios.length === 0) {
      return {
        success: false,
        message: "El correo o el password está incorrecto, favor de verificar.",
      }
    }

    // Paso 3: Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, nombrecompleto, clienteid, rolid")
      .eq("email", email)
      .single()

    if (userError || !userData) {
      console.error("Error obteniendo datos del usuario en app/actoins/login paso 3:", userError)
      return {
        success: false,
        message: "Error obteniendo datos del usuario, en actions/login paso 3.",
      }
    }

    // Paso 4: Obtener permisos del rol
    const { data: permisos, error: permisosError } = await supabase
      .from("permisosxrol")
      .select("permisoid")
      .eq("rolid", userData.rolid)
      .eq("activo", true)

    if (permisosError) {
      console.error("Error obteniendo permisos del rol, en actions/login paso 4:", permisosError)
    }

    // Crear string de permisos separados por _
    const permisosString = permisos?.map((p) => p.permisoid).join("_") || ""

    const sessionString = `UsuarioId:${userData.id}|Email:${userData.email}|NombreCompleto:${userData.nombrecompleto}|ClienteId:${userData.clienteid}|RolId:${userData.rolid}|Permisos:${permisosString}|SesionActiva:true`
    const sessionEncrypted = await Encrypt(sessionString)

    // Paso 5: Crear cookies de sesión
    /*
    await setSessionCookies({
      UsuarioId: userData.id,
      Email: userData.email,
      NombreCompleto: userData.nombrecompleto || "",
      ClienteId: userData.clienteid || 0,
      RolId: userData.rolid || 0,
      Permisos: permisosString,
      SesionActiva: true,
    })
    */
    await establecerSesionCookies(sessionEncrypted)

    return {
      success: true,
      message: "Validación correcta en un momento serás dirigido a la página inicial de la aplicación.",
      redirect: "/dashboard",
    }
  } catch (error) {
    console.error("Error en actions/login en procesarInicioSesion:", error)
    return {
      success: false,
      message: "Error inesperado. Intenta nuevamente.",
    }
  }
}

// Funcion: procesarCerrarSesion
export async function procesarCerrarSesion(): Promise<void> {
  await eliminarSesionCookies()
}
