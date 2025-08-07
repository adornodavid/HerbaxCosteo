import { createClient } from '@/lib/supabase'
import bcrypt from 'bcrypt'
import { revalidatePath } from 'next/cache'

// Función para insertar un nuevo usuario
export async function insUsuario(
  nombrecompleto: string,
  p_email: string,
  password: string,
  rolid: number
) {
  const supabase = createClient()

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

  const supabase = createClient()

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
