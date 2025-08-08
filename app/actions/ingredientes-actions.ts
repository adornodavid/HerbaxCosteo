'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getIngredientes() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Ingredientes').select('*')

  if (error) {
    console.error('Error al obtener ingredientes:', error)
    return []
  }
  return data
}

export async function createIngrediente(formData: FormData) {
  const supabase = createClient()
  const nombre = formData.get('nombre') as string
  const unidadMedida = formData.get('unidadMedida') as string
  const costo = parseFloat(formData.get('costo') as string)

  const { data, error } = await supabase.from('Ingredientes').insert([
    {
      Nombre: nombre,
      UnidadMedida: unidadMedida,
      Costo: costo,
    },
  ])

  if (error) {
    console.error('Error al crear ingrediente:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/ingredientes')
  return { success: true, message: 'Ingrediente creado correctamente' }
}

export async function deleteIngrediente(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Ingredientes').delete().eq('IngredienteId', id)

  if (error) {
    console.error('Error al eliminar ingrediente:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/ingredientes')
  return { success: true, message: 'Ingrediente eliminado correctamente' }
}
