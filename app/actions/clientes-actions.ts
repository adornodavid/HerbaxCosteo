// Contenido asumido de app/actions/clientes-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getClientes() {
  const supabase = createClient()
  const { data, error } = await supabase.from('clientes').select('*')

  if (error) {
    console.error('Error al obtener clientes:', error)
    return { data: [], error }
  }
  return { data, error: null }
}
