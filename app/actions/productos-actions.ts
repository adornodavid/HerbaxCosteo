import { createClient } from "@/lib/supabase-server";

export async function getProductos(
  nombre: string | null,
  clienteId: number | null,
  catalogoId: number | null
) {
  const supabase = createClient();
  let query = supabase.from('Productos').select('*');

  if (nombre) {
    query = query.ilike('Nombre', `%${nombre}%`);
  }
  if (clienteId) {
    // Asumiendo que hay una tabla de unión o una relación directa para filtrar por cliente
    // Esto es un placeholder, la lógica real dependerá de tu esquema de DB
    query = query.eq('ClienteId', clienteId); 
  }
  if (catalogoId) {
    // Asumiendo que hay una tabla de unión o una relación directa para filtrar por catálogo
    // Esto es un placeholder, la lógica real dependerá de tu esquema de DB
    query = query.eq('CatalogoId', catalogoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
  return data;
}

export async function getClientes() {
  const supabase = createClient();
  const { data, error } = await supabase.from('Clientes').select('id, nombre'); // Asume una tabla Clientes

  if (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
  return data;
}

export async function getCatalogosByCliente(clienteId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from('Catalogos').select('id, nombre').eq('cliente_id', clienteId); // Asume una tabla Catalogos con cliente_id

  if (error) {
    console.error('Error al obtener catálogos por cliente:', error);
    return [];
  }
  return data;
}
