'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase' // Importa la función para crear el cliente Supabase
import { Database } from '@/lib/types-sistema-costeo' // Importa los tipos de tu base de datos
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  fetchUsersFromTableServer,
  fetchUsersFromFunctionServer,
  performInsertServer
} from '@/app/actions/pruebas-actions' // Importa las nuevas Server Actions

// Define el tipo de usuario basado en la tabla 'usuarios'
type UsuarioTabla = Database['public']['Tables']['usuarios']['Row']
// Define el tipo de usuario basado en lo que la función 'selUsuarios' retorna
type UsuarioFuncion = Database['public']['Tables']['usuarios']['Row']

export default function PruebasPage() {
  // Estado para el listado de la tabla 'usuarios' (Cliente)
  const [tableUsuarios, setTableUsuarios] = useState<UsuarioTabla[]>([])
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)

  // Estado para el listado de la función 'selUsuarios' (Cliente)
  const [functionUsuarios, setFunctionUsuarios] = useState<UsuarioFuncion[]>([])
  const [functionLoading, setFunctionLoading] = useState(true)
  const [functionError, setFunctionError] = useState<string | null>(null)

  // Estado para la verificación de SESSION_SECRET (Cliente)
  const [sessionSecretStatus, setSessionSecretStatus] = useState<string>('Verificando SESSION_SECRET...');

  // Estado para la operación INSERT (Cliente)
  const [insertStatus, setInsertStatus] = useState<string>('Esperando para realizar INSERT...');
  const [insertLoading, setInsertLoading] = useState(false);

  // Estado para el listado de la tabla 'usuarios' (Server Action)
  const [serverTableUsuarios, setServerTableUsuarios] = useState<UsuarioTabla[]>([])
  const [serverTableLoading, setServerTableLoading] = useState(true)
  const [serverTableError, setServerTableError] = useState<string | null>(null)

  // Estado para el listado de la función 'selUsuarios' (Server Action)
  const [serverFunctionUsuarios, setServerFunctionUsuarios] = useState<UsuarioFuncion[]>([])
  const [serverFunctionLoading, setServerFunctionLoading] = useState(true)
  const [serverFunctionError, setServerFunctionError] = useState<string | null>(null)

  // Estado para la operación INSERT (Server Action)
  const [serverInsertStatus, setServerInsertStatus] = useState<string>('Esperando para realizar INSERT (Server Action)...');
  const [serverInsertLoading, setServerInsertLoading] = useState(false);

  const [dbName, setDbName] = useState<string>('');

  useEffect(() => {
    const supabase = createClient(); // Crea una instancia del cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'URL de Supabase no configurada';
    
    try {
      setDbName(new URL(supabaseUrl).hostname); // Extrae el hostname de la URL para el "nombre de la base de datos"
    } catch (e) {
      setDbName('URL de Supabase inválida');
    }

    // Verificar SESSION_SECRET
    if (process.env.SESSION_SECRET) {
      setSessionSecretStatus('SESSION_SECRET está definido en el proyecto.');
    } else {
      setSessionSecretStatus('SESSION_SECRET NO está definido en el proyecto.');
    }

    // Función para obtener usuarios de la tabla 'usuarios' (Cliente)
    async function fetchTableUsuarios() {
      setTableLoading(true);
      setTableError(null);
      try {
        const { data, error } = await supabase.from('usuarios').select('*');

        if (error) {
          throw error;
        }
        setTableUsuarios(data || []);
      } catch (err: any) {
        setTableError(err.message || 'Error al cargar usuarios de la tabla');
        console.error('Error fetching table usuarios:', err);
      } finally {
        setTableLoading(false);
      }
    }

    // Función para obtener usuarios de la función RPC 'selUsuarios' (Cliente)
    async function fetchFunctionUsuarios() {
      setFunctionLoading(true);
      setFunctionError(null);
      try {
        const { data, error } = await supabase.rpc('selusuarios', { usuario: "herb" });

        if (error) {
          throw error;
        }
        setFunctionUsuarios(data || []);
      } catch (err: any) {
        setFunctionError(err.message || 'Error al cargar usuarios desde la función selUsuarios');
        console.error('Error fetching users from function:', err);
      } finally {
        setFunctionLoading(false);
      }
    }

    // Función para realizar la operación INSERT (Cliente)
    async function performInsert() {
      setInsertLoading(true);
      setInsertStatus('Realizando INSERT...');
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert([
            { 
              id: 2, 
              email: 'admin@example.com', 
              nombrecompleto: 'Admin User', 
              password: 'Admin', 
              rolid: 1, 
              hotelid: 13, 
              activo: true,
              fechacreacion: new Date().toISOString(),
              prueba: 5
            }
          ]);

        if (error) {
          throw error;
        }
        setInsertStatus('INSERT realizado con éxito.');
        console.log('Insert successful:', data);
      } catch (err: any) {
        setInsertStatus(`Error al realizar INSERT: ${err.message}`);
        console.error('Error performing insert:', err);
      } finally {
        setInsertLoading(false);
      }
    }

    // Funciones para obtener datos desde Server Actions
    async function fetchServerData() {
      // Fetch de tabla desde Server Action
      setServerTableLoading(true);
      const tableResult = await fetchUsersFromTableServer();
      if (tableResult.error) {
        setServerTableError(tableResult.error);
      } else {
        setServerTableUsuarios(tableResult.data || []);
      }
      setServerTableLoading(false);

      // Fetch de función desde Server Action
      setServerFunctionLoading(true);
      const functionResult = await fetchUsersFromFunctionServer("herb");
      if (functionResult.error) {
        setServerFunctionError(functionResult.error);
      } else {
        setServerFunctionUsuarios(functionResult.data || []);
      }
      setServerFunctionLoading(false);

      // Realizar INSERT desde Server Action
      setServerInsertLoading(true);
      const insertResult = await performInsertServer();
      setServerInsertStatus(insertResult.status);
      setServerInsertLoading(false);
    }

    fetchTableUsuarios(); // Ejecuta las funciones del cliente
    fetchFunctionUsuarios(); // Ejecuta las funciones del cliente
    performInsert(); // Ejecuta el INSERT del cliente
    fetchServerData(); // Ejecuta las funciones del servidor
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pruebas de Conexión a Supabase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-lg">
            Conexión a la base de datos es correcta: <span className="font-semibold">{dbName}</span>
          </p>
          <Separator className="my-4" />

          {/* Sección para el estado de SESSION_SECRET */}
          <h2 className="text-xl font-semibold mb-3">Estado de SESSION_SECRET:</h2>
          <p className={`text-center text-lg ${sessionSecretStatus.includes('NO está') ? 'text-red-500' : 'text-green-600'} mb-6`}>
            {sessionSecretStatus}
          </p>
          <Separator className="my-4" />

          {/* Sección para la operación INSERT (Cliente) */}
          <h2 className="text-xl font-semibold mb-3">Resultado de la Operación INSERT (Cliente):</h2>
          {insertLoading && <p className="text-center">Realizando INSERT...</p>}
          <p className={`text-center text-lg ${insertStatus.includes('Error') ? 'text-red-500' : 'text-green-600'} mb-6`}>
            {insertStatus}
          </p>
          <Separator className="my-4" />

          {/* Sección para el listado de la tabla 'usuarios' (Cliente) */}
          <h2 className="text-xl font-semibold mb-3">Listado de Usuarios (tabla 'usuarios' - Cliente):</h2>
          {tableLoading && <p className="text-center">Cargando usuarios de la tabla...</p>}
          {tableError && <p className="text-center text-red-500">Error: {tableError}</p>}
          {!tableLoading && !tableError && tableUsuarios.length === 0 && (
            <p className="text-center text-gray-600">No se encontraron usuarios en la tabla.</p>
          )}
          {!tableLoading && !tableError && tableUsuarios.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 mb-6">
              <ul className="space-y-2">
                {tableUsuarios.map((usuario) => (
                  <li key={usuario.id} className="p-2 border rounded-md bg-gray-50">
                    <p className="font-medium">ID: {usuario.id}</p>
                    <p>Email: {usuario.email || 'N/A'}</p>
                    <p>Nombre: {usuario.nombrecompleto || 'N/A'}</p>
                    <p>Rol ID: {usuario.rolid || 'N/A'}</p>
                    <p>Hotel ID: {usuario.hotelid || 'N/A'}</p>
                    <p>Pruebas: {usuario.prueba?.toString() || 'N/A'}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          <Separator className="my-4" />

          {/* Sección para el listado de la función 'selUsuarios' (Cliente) */}
          <h2 className="text-xl font-semibold mb-3">Listado de Usuarios (desde función 'selUsuarios' con "herb" - Cliente):</h2>
          {functionLoading && <p className="text-center">Cargando usuarios desde la función...</p>}
          {functionError && <p className="text-center text-red-500">Error: {functionError}</p>}
          {!functionLoading && !functionError && functionUsuarios.length === 0 && (
            <p className="text-center text-gray-600">No se encontraron usuarios desde la función.</p>
          )}
          {!functionLoading && !functionError && functionUsuarios.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 mb-6">
              <ul className="space-y-2">
                {functionUsuarios.map((usuario) => (
                  <li key={usuario.id} className="p-2 border rounded-md bg-gray-50">
                    <p className="font-medium">ID: {usuario.id}</p>
                    <p>Email: {usuario.email || 'N/A'}</p>
                    <p>Nombre: {usuario.nombrecompleto || 'N/A'}</p>
                    <p>Rol ID: {usuario.rolid || 'N/A'}</p>
                    <p>Hotel ID: {usuario.hotelid || 'N/A'}</p>
                    <p>Pruebas: {usuario.prueba?.toString() || 'N/A'}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          <Separator className="my-4" />
          <h1 className="text-2xl font-bold text-center mb-6">
            Resultados de Pruebas con Server Actions (Backend)
          </h1>
          <Separator className="my-4" />

          {/* Sección para la operación INSERT (Server Action) */}
          <h2 className="text-xl font-semibold mb-3">Resultado de la Operación INSERT (Server Action):</h2>
          {serverInsertLoading && <p className="text-center">Realizando INSERT (Server Action)...</p>}
          <p className={`text-center text-lg ${serverInsertStatus.includes('Error') ? 'text-red-500' : 'text-green-600'} mb-6`}>
            {serverInsertStatus}
          </p>
          <Separator className="my-4" />

          {/* Sección para el listado de la tabla 'usuarios' (Server Action) */}
          <h2 className="text-xl font-semibold mb-3">Listado de Usuarios (tabla 'usuarios' - Server Action):</h2>
          {serverTableLoading && <p className="text-center">Cargando usuarios de la tabla (Server Action)...</p>}
          {serverTableError && <p className="text-center text-red-500">Error: {serverTableError}</p>}
          {!serverTableLoading && !serverTableError && serverTableUsuarios.length === 0 && (
            <p className="text-center text-gray-600">No se encontraron usuarios en la tabla (Server Action).</p>
          )}
          {!serverTableLoading && !serverTableError && serverTableUsuarios.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 mb-6">
              <ul className="space-y-2">
                {serverTableUsuarios.map((usuario) => (
                  <li key={usuario.id} className="p-2 border rounded-md bg-gray-50">
                    <p className="font-medium">ID: {usuario.id}</p>
                    <p>Email: {usuario.email || 'N/A'}</p>
                    <p>Nombre: {usuario.nombrecompleto || 'N/A'}</p>
                    <p>Rol ID: {usuario.rolid || 'N/A'}</p>
                    <p>Hotel ID: {usuario.hotelid || 'N/A'}</p>
                    <p>Pruebas: {usuario.prueba?.toString() || 'N/A'}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          <Separator className="my-4" />

          {/* Sección para el listado de la función 'selUsuarios' (Server Action) */}
          <h2 className="text-xl font-semibold mb-3">Listado de Usuarios (desde función 'selUsuarios' con "herb" - Server Action):</h2>
          {serverFunctionLoading && <p className="text-center">Cargando usuarios desde la función (Server Action)...</p>}
          {serverFunctionError && <p className="text-center text-red-500">Error: {serverFunctionError}</p>}
          {!serverFunctionLoading && !serverFunctionError && serverFunctionUsuarios.length === 0 && (
            <p className="text-center text-gray-600">No se encontraron usuarios desde la función (Server Action).</p>
          )}
          {!serverFunctionLoading && !serverFunctionError && serverFunctionUsuarios.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <ul className="space-y-2">
                {serverFunctionUsuarios.map((usuario) => (
                  <li key={usuario.id} className="p-2 border rounded-md bg-gray-50">
                    <p className="font-medium">ID: {usuario.id}</p>
                    <p>Email: {usuario.email || 'N/A'}</p>
                    <p>Nombre: {usuario.nombrecompleto || 'N/A'}</p>
                    <p>Rol ID: {usuario.rolid || 'N/A'}</p>
                    <p>Hotel ID: {usuario.hotelid || 'N/A'}</p>
                    <p>Pruebas: {usuario.prueba?.toString() || 'N/A'}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
