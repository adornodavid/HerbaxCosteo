// Contenido asumido de app/actions/formulas-actions.ts
// Este archivo no se modifica en esta interacción, solo se asume su contenido.
'use server'

import { createClient } from "@/lib/supabase-server"

export async function getFormulas() {
  const supabase = createClient()
  const { data, error } = await supabase.from('formulas').select('*')

  if (error) {
    console.error('Error al obtener fórmulas:', error)
    return []
  }
  return data
}
