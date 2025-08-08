'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getCatalogos() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Catalogos').select('*')

  if (error) {
    console.error('Error al obtener catálogos:', error)
    return []
  }
  return data
}

export async function createCatalogo(formData: FormData) {
  const supabase = createClient()
  const nombre = formData.get('nombre') as string

  const { data, error } = await supabase.from('Catalogos').insert([{ NombreCatalogo: nombre }])

  if (error) {
    console.error('Error al crear catálogo:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/categorias') // O la ruta donde se listan los catálogos
  return { success: true, message: 'Catálogo creado correctamente' }
}

export async function deleteCatalogo(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Catalogos').delete().eq('CatalogoId', id)

  if (error) {
    console.error('Error al eliminar catálogo:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/categorias')
  return { success: true, message: 'Catálogo eliminada correctamente' }
}
