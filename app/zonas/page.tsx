"use client"

/* ==================================================
  Imports:
    - Assets
    - Configuraciones (variables)
    - Tipados (interfaces, clases, objetos)
    - Librerias
    - Componentes
    - Frontend
    - Bakcend
================================================== */
import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, PlusCircle, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"

/* ==================================================
	Principal (Pagina)
  - Variables especiales
  - Estados
  - Funciones
  - Inicio (carga inicial y seguridad)
  - Manejadores (Handles)
  - Renders (contenidos auxiliares)
  - Contenido
================================================== */
export default function ZonasPage() {
  const [filtroId, setFiltroId] = useState("")
  const [filtroClave, setFiltroClave] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  const [zonas] = useState([
    { id: 1, codigo: "ZON001", nombre: "Zona Norte", descripcion: "Zona Norte del país", activo: true },
    { id: 2, codigo: "ZON002", nombre: "Zona Sur", descripcion: "Zona Sur del país", activo: true },
    { id: 3, codigo: "ZON003", nombre: "Zona Centro", descripcion: "Zona Centro del país", activo: false },
  ])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Aquí irá la lógica de búsqueda
    console.log("Buscando con filtros:", { filtroId, filtroClave, filtroNombre, filtroEstatus })
  }

  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroClave("")
    setFiltroNombre("")
    setFiltroEstatus("-1")
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Título y Botón */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zonas</h1>
          <p className="text-muted-foreground">Gestión completa de Zonas</p>
        </div>
        <Link href="/zonas/nuevo" passHref>
          <Button className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva Zona
          </Button>
        </Link>
      </div>

      {/* 2. Filtros de Búsqueda */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleFormSubmit}>
            <div className="lg:col-span-2">
              <label htmlFor="txtZonaId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="txtZonaId"
                name="txtZonaId"
                type="text"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtZonaNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtZonaNombre"
                name="txtZonaNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtZonaClave" className="text-sm font-medium">
                Clave
              </label>
              <Input
                id="txtZonaClave"
                name="txtZonaClave"
                type="text"
                placeholder="Buscar por clave..."
                maxLength={50}
                value={filtroClave}
                onChange={(e) => setFiltroClave(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="ddlEstatus" className="text-sm font-medium">
                Estatus
              </label>
              <Select name="ddlEstatus" value={filtroEstatus} onValueChange={setFiltroEstatus}>
                <SelectTrigger id="ddlEstatus">
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Todos</SelectItem>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 col-span-full md:col-span-2 lg:col-span-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={handleLimpiar}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
              >
                <Search className="mr-2 h-3 w-3" /> Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Resultados - Listado */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Mostrando {zonas.length} zonas encontradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {zonas.map((zona) => (
                  <tr key={zona.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{zona.id}</td>
                    <td className="py-3 px-4">{zona.codigo}</td>
                    <td className="py-3 px-4">{zona.nombre}</td>
                    <td className="py-3 px-4">{zona.descripcion}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                          zona.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {zona.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Ver Detalles">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title={zona.activo ? "Inactivar" : "Activar"}>
                          {zona.activo ? (
                            <ToggleRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
