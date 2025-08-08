'use server'

import { createClient } from '@/lib/supabase-server'

interface Cliente {
  id: number
  nombre: string
}

export async function getClientes(): Promise<Cliente[]> {
  const supabase = createClient()
  // Simulación de retardo de red
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Datos de clientes de ejemplo
  return [
    { id: 1, nombre: 'Cliente A' },
    { id: 2, nombre: 'Cliente B' },
    { id: 3, nombre: 'Cliente C' },
  ]
  // En un caso real, harías una consulta a Supabase:
  // const { data, error } = await supabase.from('clientes').select('id, nombre');
  // if (error) { console.error(error); return []; }
  // return data;
}
