'use server'

import { createClient } from '@/lib/supabase-server'

export async function insUsuario(formData: FormData) {
  const supabase = createClient()

  const nombrecompleto = formData.get('nombrecompleto') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rolid = parseInt(formData.get('rolid') as string)

  try {
    const { data, error } = await supabase.from('usuarios').insert([
      {
        nombre_completo: nombrecompleto,
        email: email,
        password: password, // Considera hashear la contraseña en el backend
        rol_id: rolid,
      },
    ])

    if (error) {
      console.error('Error al insertar usuario:', error.message)
      return { success: false, message: error.message }
    }

    return { success: true, message: 'Usuario insertado correctamente', data }
  } catch (error: any) {
    console.error('Excepción al insertar usuario:', error.message)
    return { success: false, message: 'Error interno del servidor' }
  }
}
