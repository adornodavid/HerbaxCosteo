"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import bcrypt from 'bcryptjs' // Asegúrate de que bcryptjs esté instalado: npm install bcryptjs

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Funciones
  --------------------
	* INSERTS
		- insXXXXX
	* SELECTS
		- selXXXXX
	* UPDATES
		- updXXXXX
	* DELETES
		- delXXXXX
	* SPECIALS
		- xxxXXXXX
================================================== */
//  Función: insUsuario
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
          email: email,
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

    revalidatePath('/pruebas/usuarios') // Revalidar la ruta de usuarios para mostrar el nuevo usuario
    return { success: true, message: 'Usuario insertado exitosamente.' }
  } catch (error: any) {
    console.error('Error en insUsuario:', error.message)
    return { success: false, message: `Error en el servidor: ${error.message}` }
  }
}

//Función: insUsuario2
export async function insUsuario2(
  nombrecompleto: string,
  email: string,
  password: string,
  rolid: number,
  activo: boolean, // Recibe 'activo' directamente
) {
  try {
    // Hash de la contraseña antes de insertarla
    const hashedPassword = await bcrypt.hash(password, 10) // 10 es el costo del salt

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert({
        nombrecompleto: nombrecompleto,
        email: email,
        password: hashedPassword, // Guarda la contraseña hasheada
        rolid: rolid,
        activo: activo, // Usa el valor de 'activo' recibido
        fechacreacion: new Date().toISOString(),
        fechaactualizacion: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error al insertar usuario con insUsuario2:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/pruebas/usuarios")
    return { success: true, data }
  } catch (error) {
    console.error("Error en insUsuario2:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

//Función: selUsuarioLogin: Función para autenticar un usuario
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

//Función: obtenerUsuarios
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
