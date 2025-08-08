'use server'

import { createClient } from '@/lib/supabase-server'

interface ProductoDetalle {
  id: number
  nombre: string
  descripcion: string
  costo: number
  imagen_url: string
  fecha_creacion: string
  ultima_actualizacion: string
  cliente_asociado: string
  catalogo_asociado: string
}

export async function getProductoDetalle(id: number): Promise<ProductoDetalle | null> {
  const supabase = createClient()
  // Simulación de retardo de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Datos de detalle de producto de ejemplo
  const mockDetalle: ProductoDetalle = {
    id: id,
    nombre: `Producto ${id}`,
    descripcion: `Descripción detallada del Producto ${id}. Este es un producto de salud de alta calidad.`,
    costo: 25.00 + id * 1.5,
    imagen_url: `/placeholder.svg?height=200&width=200&query=product+detail+${id}`,
    fecha_creacion: '2023-01-15',
    ultima_actualizacion: '2024-07-20',
    cliente_asociado: 'Cliente Ejemplo S.A.',
    catalogo_asociado: 'Catálogo General',
  }

  // En un caso real, harías una consulta a Supabase:
  // const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
  // if (error) { console.error(error); return null; }
  // return data;

  return mockDetalle
}
