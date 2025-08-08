'use server'

import { createClient } from '@/lib/supabase-server'

interface Catalogo {
  id: number
  nombre: string
  clienteId: number // Para simular la dependencia
}

export async function getCatalogos(clienteId: string): Promise<Catalogo[]> {
  const supabase = createClient()
  // Simulación de retardo de red
  await new Promise((resolve) => setTimeout(resolve, 300))

  const parsedClienteId = parseInt(clienteId)

  // Datos de catálogos de ejemplo, dependientes del cliente
  const mockCatalogos: Catalogo[] = [
    { id: 101, nombre: 'Catálogo General A', clienteId: 1 },
    { id: 102, nombre: 'Catálogo Especial A', clienteId: 1 },
    { id: 201, nombre: 'Catálogo General B', clienteId: 2 },
    { id: 202, nombre: 'Catálogo Premium B', clienteId: 2 },
    { id: 301, nombre: 'Catálogo Único C', clienteId: 3 },
  ]

  if (isNaN(parsedClienteId)) {
    return mockCatalogos // Si no hay cliente seleccionado, devuelve todos o ninguno según tu lógica
  }

  return mockCatalogos.filter(c => c.clienteId === parsedClienteId)
  // En un caso real, harías una consulta a Supabase:
  // const { data, error } = await supabase.from('catalogos').select('id, nombre').eq('cliente_id', clienteId);
  // if (error) { console.error(error); return []; }
  // return data;
}
