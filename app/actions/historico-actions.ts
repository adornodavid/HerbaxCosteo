// Contenido asumido de app/actions/historico-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getHistorico() {
  const supabase = createClient()
  const { data, error } = await supabase.from('historico').select('*')

  if (error) {
    console.error('Error al obtener histórico:', error)
    return []
  }
  return data
}
