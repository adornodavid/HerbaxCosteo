'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getHistoricoCostos() {
  const supabase = createClient()
  const { data, error } = await supabase.from('HistoricoCostos').select('*')

  if (error) {
    console.error('Error al obtener histórico de costos:', error)
    return []
  }
  return data
}

export async function addHistoricoCosto(formData: FormData) {
  const supabase = createClient()
  const productoId = parseInt(formData.get('productoId') as string)
  const fecha = formData.get('fecha') as string
  const costo = parseFloat(formData.get('costo') as string)

  const { data, error } = await supabase.from('HistoricoCostos').insert([
    {
      ProductoId: productoId,
      Fecha: fecha,
      Costo: costo,
    },
  ])

  if (error) {
    console.error('Error al añadir histórico de costo:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/historico') // Ajusta la ruta según tu estructura
  return { success: true, message: 'Histórico de costo añadido correctamente' }
}
