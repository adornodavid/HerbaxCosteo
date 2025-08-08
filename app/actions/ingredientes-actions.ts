// Contenido asumido de app/actions/ingredientes-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getIngredientes() {
  const supabase = createClient()
  const { data, error } = await supabase.from('ingredientes').select('*')

  if (error) {
    console.error('Error al obtener ingredientes:', error)
    return []
  }
  return data
}
