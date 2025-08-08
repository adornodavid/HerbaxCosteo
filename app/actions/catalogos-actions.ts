// Contenido asumido de app/actions/catalogos-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getCatalogosByCliente(clienteId: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from('catalogos').select('*').eq('cliente_id', clienteId)

  if (error) {
    console.error('Error al obtener catálogos por cliente:', error)
    return { data: [], error }
  }
  return { data, error: null }
}

export async function getCatalogos() {
  const supabase = createClient()
  const { data, error } = await supabase.from('catalogos').select('*')

  if (error) {
    console.error('Error al obtener catálogos:', error)
    return { data: [], error }
  }
  return { data, error: null }
}
