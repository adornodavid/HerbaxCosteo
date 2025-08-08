// Contenido asumido de app/actions/utilerias-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getUtilerias() {
  const supabase = createClient()
  const { data, error } = await supabase.from('utilerias').select('*')

  if (error) {
    console.error('Error al obtener utilerías:', error)
    return []
  }
  return data
}
