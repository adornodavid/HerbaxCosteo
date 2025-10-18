"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/*
export async function insUsuario(formData: FormData) {
  // Extraer los valores del FormData
  const nombrecompleto = formData.get("nombrecompleto") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rolid = Number.parseInt(formData.get("rolid") as string)

  try {
    // Hashear la contraseña antes de insertarla
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          nombrecompleto: nombrecompleto,
          email: email,
          password: hashedPassword,
          rolid: rolid,
          activo: true,
        },
      ])
      .select()

    if (error) {
      console.error("Error inserting user:", error.message)
      return { success: false, message: `Error al insertar usuario: ${error.message}` }
    }

    revalidatePath("/pruebas/usuarios")
    return { success: true, message: "Usuario insertado exitosamente." }
  } catch (error: any) {
    console.error("Error en insUsuario:", error.message)
    return { success: false, message: `Error en el servidor: ${error.message}` }
  }
}
*/
