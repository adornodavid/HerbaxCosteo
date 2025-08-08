"use client"

import { useState, useEffect } from 'react';
import { insUsuario, getUsuarios } from '@/app/actions/usuarios-actions'; // Importar desde el nuevo nombre
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Usuario {
  UsuarioId: number;
  NombreCompleto: string;
  Email: string;
  RolId: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const data = await getUsuarios();
    setUsuarios(data);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Asegúrate de que los nombres de los campos en el formulario coincidan con los esperados por la Server Action
    const result = await insUsuario(formData); // Pasar directamente el FormData

    if (result.success) {
      setFormMessage(result.message);
      fetchUsuarios(); // Recargar la lista de usuarios
    } else {
      setFormMessage(`Error: ${result.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombrecompleto">Nombre Completo</Label>
              <Input id="nombrecompleto" name="nombrecompleto" type="text" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="rolid">ID de Rol</Label>
              <Input id="rolid" name="rolid" type="number" required />
            </div>
            <Button type="submit">Crear Usuario</Button>
            {formMessage && <p className="mt-2 text-sm text-red-500">{formMessage}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            <ul className="space-y-2">
              {usuarios.map((usuario) => (
                <li key={usuario.UsuarioId} className="border p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{usuario.NombreCompleto}</p>
                    <p className="text-sm text-gray-600">{usuario.Email}</p>
                    <p className="text-xs text-gray-500">Rol ID: {usuario.RolId}</p>
                  </div>
                  {/* Aquí podrías añadir botones de editar/eliminar */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
