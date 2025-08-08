// Contenido asumido de app/actions/usuarios-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
import { createClient } from "@/lib/supabase-server"

export async function insUsuario(formData: FormData) {
  const supabase = createClient()

  const nombrecompleto = formData.get('nombrecompleto') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rolid = parseInt(formData.get('rolid') as string);

  const { data, error } = await supabase.from('usuarios').insert([
    { nombrecompleto, email, password, rolid }
  ])

  if (error) {
    console.error('Error al insertar usuario:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Usuario insertado correctamente', data }
}

export async function getUsuarios() {
  const supabase = createClient()
  const { data, error } = await supabase.from('usuarios').select('*')

  if (error) {
    console.error('Error al obtener usuarios:', error)
    return []
  }
  return data
}
