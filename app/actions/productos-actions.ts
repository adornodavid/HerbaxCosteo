// Contenido asumido de app/actions/productos-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getProductos(
  nombre: string | null,
  clienteId: number | null,
  catalogoId: number | null,
  page: number = 1,
  pageSize: number = 10
) {
  const supabase = createClient()
  let query = supabase.from('productos').select('*', { count: 'exact' })

  if (nombre) {
    query = query.ilike('nombre', `%${nombre}%`)
  }
  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }
  if (catalogoId) {
    query = query.eq('catalogo_id', catalogoId)
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize - 1

  const { data, error, count } = await query.range(startIndex, endIndex)

  if (error) {
    console.error('Error al obtener productos:', error)
    return { data: [], count: 0, error }
  }

  return { data, count: count || 0, error: null }
}

export async function deleteProducto(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from('productos').delete().eq('id', id)

  if (error) {
    console.error('Error al eliminar producto:', error)
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Producto eliminado correctamente' }
}
