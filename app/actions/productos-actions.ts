'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getProductos(
  nombre: string | null,
  clienteId: number | null,
  catalogoId: number | null
) {
  const supabase = createClient()
  let query = supabase.from('Productos').select('*')

  if (nombre) {
    query = query.ilike('Nombre', `%${nombre}%`)
  }
  if (clienteId) {
    // Asumiendo que hay una relación entre Productos y Clientes
    // Esto es un placeholder, la lógica real dependerá de tu esquema de DB
    query = query.eq('ClienteId', clienteId)
  }
  if (catalogoId) {
    // Asumiendo que hay una relación entre Productos y Catalogos
    // Esto es un placeholder, la lógica real dependerá de tu esquema de DB
    query = query.eq('CatalogoId', catalogoId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener productos:', error)
    return []
  }
  return data
}

export async function deleteProducto(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('Productos').delete().eq('ProductoId', id)

  if (error) {
    console.error('Error al eliminar producto:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/productos')
  return { success: true, message: 'Producto eliminado correctamente' }
}

// Placeholder para obtener clientes (anteriormente restaurantes)
export async function getClientes() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Clientes').select('ClienteId, NombreCliente') // Ajusta los campos según tu tabla de clientes

  if (error) {
    console.error('Error al obtener clientes:', error)
    return []
  }
  return data
}

// Placeholder para obtener catálogos (anteriormente menús)
export async function getCatalogos(clienteId: number | null) {
  const supabase = createClient()
  let query = supabase.from('Catalogos').select('CatalogoId, NombreCatalogo') // Ajusta los campos según tu tabla de catálogos

  if (clienteId) {
    query = query.eq('ClienteId', clienteId) // Asumiendo que los catálogos están relacionados con los clientes
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener catálogos:', error)
    return []
  }
  return data
}
