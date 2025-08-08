'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getClientes() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Clientes').select('*')

  if (error) {
    console.error('Error al obtener clientes:', error)
    return []
  }
  return data
}

export async function createCliente(formData: FormData) {
  const supabase = createClient()
  const nombre = formData.get('nombre') as string
  const contacto = formData.get('contacto') as string

  const { data, error } = await supabase.from('Clientes').insert([
    {
      NombreCliente: nombre,
      Contacto: contacto,
    },
  ])

  if (error) {
    console.error('Error al crear cliente:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/clientes') // Ajusta la ruta según tu estructura
  return { success: true, message: 'Cliente creado correctamente' }
}

export async function deleteCliente(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Clientes').delete().eq('ClienteId', id)

  if (error) {
    console.error('Error al eliminar cliente:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/clientes')
  return { success: true, message: 'Cliente eliminado correctamente' }
}
