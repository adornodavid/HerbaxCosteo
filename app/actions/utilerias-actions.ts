'use server'

import { createClient } from '@/lib/supabase-server'

export async function getUnidadesMedida() {
  const supabase = createClient()
  const { data, error } = await supabase.from('UnidadesMedida').select('*') // Asume que tienes una tabla de unidades de medida

  if (error) {
    console.error('Error al obtener unidades de medida:', error)
    return []
  }
  return data
}

export async function getTiposProducto() {
  const supabase = createClient()
  const { data, error } = await supabase.from('TiposProducto').select('*') // Asume que tienes una tabla de tipos de producto

  if (error) {
    console.error('Error al obtener tipos de producto:', error)
    return []
  }
  return data
}
