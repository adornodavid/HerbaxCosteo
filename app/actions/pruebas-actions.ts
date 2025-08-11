'use server'

/* ==================================================
  Imports
================================================== */
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/types-sistema-costeo'

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */


type UsuarioTabla = Database['public']['Tables']['usuarios']['Row']
type UsuarioFuncion = Database['public']['Tables']['usuarios']['Row']

export async function fetchUsersFromTableServer(): Promise<{ data: UsuarioTabla[] | null; error: string | null }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from('usuarios').select('*')
    if (error) {
      console.error('Error fetching users from table (Server Action):', error)
      return { data: null, error: error.message }
    }
    return { data: data || [], error: null }
  } catch (err: any) {
    console.error('Exception fetching users from table (Server Action):', err)
    return { data: null, error: err.message || 'Error desconocido al cargar usuarios de la tabla (Server Action)' }
  }
}

export async function fetchUsersFromFunctionServer(usuario: string): Promise<{ data: UsuarioFuncion[] | null; error: string | null }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.rpc('selusuarios', { usuario })
    if (error) {
      console.error('Error fetching users from function (Server Action):', error)
      return { data: null, error: error.message }
    }
    return { data: data || [], error: null }
  } catch (err: any) {
    console.error('Exception fetching users from function (Server Action):', err)
    return { data: null, error: err.message || 'Error desconocido al cargar usuarios desde la función (Server Action)' }
  }
}

export async function performInsertServer(): Promise<{ status: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          id: 3, // Usar un ID diferente para evitar conflictos si el ID 2 ya fue insertado por el cliente
          email: 'server@example.com',
          nombrecompleto: 'Server Action User',
          password: 'ServerPassword',
          rolid: 1,
          hotelid: 13,
          activo: true,
          fechacreacion: new Date().toISOString(),
          prueba: 10
        }
      ])

    if (error) {
      console.error('Error performing insert (Server Action):', error)
      return { status: `Error al realizar INSERT (Server Action): ${error.message}` }
    }
    console.log('Insert successful (Server Action):', data)
    return { status: 'INSERT realizado con éxito (Server Action).' }
  } catch (err: any) {
    console.error('Exception performing insert (Server Action):', err)
    return { status: `Error al realizar INSERT (Server Action): ${err.message || 'Error desconocido'}` }
  }
}
