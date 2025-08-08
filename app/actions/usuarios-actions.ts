'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function insUsuario(formData: FormData) {
  const supabase = createClient()

  const nombrecompleto = formData.get('nombrecompleto') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rolid = parseInt(formData.get('rolid') as string)

  const { data, error } = await supabase.from('Usuarios').insert([
    {
      NombreCompleto: nombrecompleto,
      Email: email,
      Password: password,
      RolId: rolid,
      SesionActiva: true, // Asumiendo que la sesión está activa al crear
    },
  ])

  if (error) {
    console.error('Error al insertar usuario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/pruebas/usuarios')
  return { success: true, message: 'Usuario insertado correctamente' }
}

export async function getUsuarios() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Usuarios').select('*')

  if (error) {
    console.error('Error al obtener usuarios:', error)
    return []
  }
  return data
}

export async function deleteUsuario(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Usuarios').delete().eq('UsuarioId', id)

  if (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/pruebas/usuarios')
  return { success: true, message: 'Usuario eliminado correctamente' }
}
