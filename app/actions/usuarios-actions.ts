"use server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from 'bcrypt'
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para insertar un nuevo usuario
export async function insUsuario(formData: FormData) {
  // Extraer los valores del FormData
  const nombrecompleto = formData.get('nombrecompleto') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rolid = parseInt(formData.get('rolid') as string); // Convertir a número
  
  try {
    // Hashear la contraseña antes de insertarla
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nombrecompleto: nombrecompleto,
          email: p_email,
          password: hashedPassword, // Guardar la contraseña hasheada
          rolid: rolid,
          activo: true, // Asumimos que el usuario está activo por defecto
        },
      ])
      .select()

    if (error) {
      console.error('Error inserting user:', error.message)
      return { success: false, message: `Error al insertar usuario: ${error.message}` }
    }

    revalidatePath('/usuarios') // Revalidar la ruta de usuarios para mostrar el nuevo usuario
    return { success: true, message: 'Usuario insertado exitosamente.' }
  } catch (error: any) {
    console.error('Error en insUsuario:', error.message)
    return { success: false, message: `Error en el servidor: ${error.message}` }
  }
}

// Función para autenticar un usuario
export async function selUsuarioLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: users, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, email, password, activo')
      .eq('email', email)
      .single()

    if (fetchError || !users) {
      console.error('Error fetching user or user not found:', fetchError?.message || 'User not found')
      return { success: false, message: 'Credenciales inválidas.' }
    }

    if (!users.activo) {
      return { success: false, message: 'Usuario inactivo. Contacte al administrador.' }
    }

    // Comparar la contraseña ingresada con el hash almacenado
    const passwordMatch = await bcrypt.compare(password, users.password)

    if (!passwordMatch) {
      return { success: false, message: 'Credenciales inválidas.' }
    }

    // Si las credenciales son correctas, puedes devolver información del usuario o un mensaje de éxito
    return { success: true, message: 'Login exitoso.' }
  } catch (error: any) {
    console.error('Error en selUsuarioLogin:', error.message)
    return { success: false, message: `Error en el servidor: ${error.message}` }
  }
}

export async function obtenerUsuarios() {
  try {
    const { data, error } = await supabaseAdmin.from("usuarios").select("*")
    if (error) {
      console.error("Error obteniendo usuarios:", error)
      return { success: false, error: error.message }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerUsuarios:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
