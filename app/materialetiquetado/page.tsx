"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, X } from "lucide-react"

export default function MaterialEtiquetadoPage() {
  const [filtros, setFiltros] = useState({
    id: "",
    codigo: "",
    nombre: "",
    estatus: "Todos",
  })

  const handleLimpiar = () => {
    setFiltros({
      id: "",
      codigo: "",
      nombre: "",
      estatus: "Todos",
    })
  }

  const handleBuscar = () => {
    // Búsqueda se implementará más adelante
    console.log("Buscando con filtros:", filtros)
  }

  // Datos de ejemplo para la tabla
  const materialesEjemplo = [
    {
      id: 1,
      codigo: "ME001",
      nombre: "Etiqueta Adhesiva Premium",
      estatus: "Activo",
    },
    {
      id: 2,
      codigo: "ME002",
      nombre: "Etiqueta Térmica Estándar",
      estatus: "Activo",
    },
    {
      id: 3,
      codigo: "ME003",
      nombre: "Etiqueta Holográfica",
      estatus: "Inactivo",
    },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Etiquetado</h1>
          <p className="text-muted-foreground">Gestiona el catálogo de materiales de etiquetado</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Material Etiquetado
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-id">ID</Label>
              <Input
                id="filtro-id"
                placeholder="ID del material"
                value={filtros.id}
                onChange={(e) => setFiltros({ ...filtros, id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-codigo">Código</Label>
              <Input
                id="filtro-codigo"
                placeholder="Código del material"
                value={filtros.codigo}
                onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-nombre">Nombre</Label>
              <Input
                id="filtro-nombre"
                placeholder="Nombre del material"
                value={filtros.nombre}
                onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-estatus">Estatus</Label>
              <Select value={filtros.estatus} onValueChange={(value) => setFiltros({ ...filtros, estatus: value })}>
                <SelectTrigger id="filtro-estatus">
                  <SelectValue placeholder="Seleccionar estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleLimpiar}>
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
            <Button onClick={handleBuscar}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialesEjemplo.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.id}</TableCell>
                  <TableCell className="font-medium">{material.codigo}</TableCell>
                  <TableCell>{material.nombre}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        material.estatus === "Activo" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {material.estatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
