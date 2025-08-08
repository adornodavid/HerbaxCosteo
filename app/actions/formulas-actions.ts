'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getFormulas() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Formulas').select('*')

  if (error) {
    console.error('Error al obtener fórmulas:', error)
    return []
  }
  return data
}

export async function createFormula(formData: FormData) {
  const supabase = createClient()
  const nombre = formData.get('nombre') as string
  const productoId = parseInt(formData.get('productoId') as string)
  const ingredientes = JSON.parse(formData.get('ingredientes') as string) // Asume que los ingredientes se envían como JSON

  const { data, error } = await supabase.from('Formulas').insert([
    {
      Nombre: nombre,
      ProductoId: productoId,
      Ingredientes: ingredientes, // Asegúrate de que tu columna de DB soporte JSONB o un tipo similar
    },
  ])

  if (error) {
    console.error('Error al crear fórmula:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/formulas') // Ajusta la ruta según tu estructura
  return { success: true, message: 'Fórmula creada correctamente' }
}

export async function deleteFormula(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Formulas').delete().eq('FormulaId', id)

  if (error) {
    console.error('Error al eliminar fórmula:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/formulas')
  return { success: true, message: 'Fórmula eliminada correctamente' }
}
