"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function insUsuario(
  nombrecompleto: string,
  p_email: string,
  password: string,
  rolid: number,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert({
        nombrecompleto: nombrecompleto,
        email: p_email,
        password: password,
        rolid: rolid,
        activo: true,
        fechacreacion: new Date().toISOString(),
        fechaactualizacion: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error al insertar usuario:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/pruebas/usuarios")
    return { success: true, data }
  } catch (error) {
    console.error("Error en insUsuario:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function obtenerUsuarios() {
  try {
    const { data, error } = await supabaseAdmin.from("usuarios").select("*")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerUsuarios:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
