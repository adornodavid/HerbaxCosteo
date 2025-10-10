"use client"
console.log("inicia archivo")
/* ==================================================
	  Imports
	================================================== */
// -- Interfaces, clases y objetos
import type React from "react"
import type { Cliente } from "@/types/clientes"
// -- Assets

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, PlusCircle, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"
// -- Components
import { PageLoadingScreen } from "@/components/page-loading-screen"
// -- Frontend

// -- Backend
import { useAuth } from "@/contexts/auth-context"
import { obtenerClientes } from "@/app/actions/clientes"
console.log("fin de imports")

/* ==================================================
	  Componente Principal, Pagina
	================================================== */
export default function ClientesPage() {
  console.log("iniciar principal")
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.RolId), [user])
  // Paginación
  const resultadosPorPagina = 20
  console.log("Variables")

  // --- Estados ---
  const [pageLoading, setPageLoading] = useState(true)
  const [Listado, setListado] = useState<Cliente[]>([])
  //const [ListadoFiltrados, setListadoFiltrados] = useState<Cliente[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)

  // Estados para filtros
  const [filtroId, setFiltroId] = useState("")
  const [filtroClave, setFiltroClave] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Paginación ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])
  console.log("funciones")
  // -- Funciones --
  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (id: number, nombre: string, clave: string, estatus: string) => {
    if (!user) return
    setIsSearching(true)
    setPaginaActual(1)

    let listadoTransformado: Cliente[] = []
    console.log("filtros: id: " + id + " _ nombre: " + nombre + " _ clave: " + clave + " _ estatus: " + estatus)
    try {
    console.log("inicia try deEjecutar busqued")
      let auxAdmin = id === -1 ? -1 : id
      if (!esAdmin) {
        auxAdmin = user.ClienteId
      }
      console.log("se determino auxAdmin: ", auxAdmin)
      const result = await obtenerClientes(
        auxAdmin, // id, filtro si es admin
        nombre, // nombre
        clave, // clave
        "", // direccion
        "", // telefono
        "", // email
        estatus === "-1" ? "Todos" : estatus === "true" ? "true" : "false", // activo
      )
console.log("result: ", result.success, " - data: ", result.data)
      if (result.success && result.data) {
        const transformedData: Cliente[] = result.data.map((c: Cliente) => ({
          id: c.id,
          nombre: c.nombre,
          clave: c.clave,
          direccion: c.direccion,
          telefono: c.telefono,
          email: c.email,
          imgurl: c.imgurl,
          fechacreacion: c.fechacreacion,
          activo: c.activo,
        }))

        listadoTransformado = transformedData.map((c: Cliente) => ({
          ClienteId: c.id,
          ClienteNombre: c.nombre || "Sin nombre",
          ClienteClave: c.clave || "Sin clave", // Added missing comma
          ClienteDireccion: c.direccion || "Sin dirección",
          ClienteTelefono: c.telefono || "Sin telefono",
          ClienteEmail: c.email || "Sin email",
          ClienteImgUrl: c.imgurl || "Sin imagen",
          ClienteFechaCreacion: c.fechacreacion,
          ClienteActivo: c.activo === true,
        }))

        setListado(listadoTransformado)
        //setListadoFiltrados(Listado)
        setTotalListado(listadoTransformado.length)
      } else {
        console.log("No hay datos o la consulta falló.")
      }

      if (!result.success) {
        console.error("Error en búsqueda del filtro de búsqueda:", result.error)
        setListado([])
        return { success: false, message: "Error en búsqueda del filtro de búsqueda:", error: result.error }
      }

      return { success: true, data: listadoTransformado }
    } catch (error) {
      console.log("Error inesperado al realizar la busqueda:", error)
      setListado([])
      return { success: false, message: "Error inesperado al realizar la busqueda:", error }
    } finally {
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      let auxAdmin = -1
      if (!esAdmin) {
        auxAdmin = user.ClienteId
      }
      const Result = await obtenerClientes(auxAdmin, "", "", "", "", "", "True")
      if (Result.success && Result.data) {
        const transformedData: Cliente[] = Result.data.map((c: Cliente) => ({
          id: c.id,
          nombre: c.nombre,
          clave: c.clave,
          direccion: c.direccion,
          telefono: c.telefono,
          email: c.email,
          imgurl: c.imgurl,
          fechacreacion: c.fechacreacion,
          activo: c.activo,
        }))

        const Listado: Cliente[] = transformedData.map((c: Cliente) => ({
          ClienteId: c.id,
          ClienteNombre: c.nombre || "Sin nombre",
          ClienteClave: c.clave || "Sin clave", // Added missing comma
          ClienteDireccion: c.direccion || "Sin dirección",
          ClienteTelefono: c.telefono || "Sin telefono",
          ClienteEmail: c.email || "Sin email",
          ClienteImgUrl: c.imgurl || "Sin imagen",
          ClienteFechaCreacion: c.fechacreacion,
          ClienteActivo: c.activo === true,
        }))

        setListado(Listado)
        //setListadoFiltrados(Listado)
        setTotalListado(Listado.length)
      } else {
        console.log("No hay datos o la consulta falló")
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
    } finally {
      setPageLoading(false)
    }
  }

  // --- Carga Inicial y Seguridad ---
  useEffect(() => {
    if (!authLoading) {
      // Validar
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      // Iniciar
      const inicializar = async () => {
        setPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin])

  // -- Handles --
  // Busqueda - Ejecutar
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Buscando con filtros:", { filtroId, filtroClave, filtroNombre, filtroEstatus })

    const Id = filtroId === "" || filtroId === "0" ? -1 : Number.parseInt(filtroId, 10)
    const Result = ejecutarBusqueda(Id, filtroClave, filtroNombre, filtroEstatus)
  }
  // Busqueda - Limpiar o Resetear
  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroClave("")
    setFiltroNombre("")
    setFiltroEstatus("-1")

    cargarDatosIniciales()
  }

  // --- Renderizado ---
  // Loading
  if (pageLoading) {
    return <PageLoadingScreen message="Cargando Clientes..." />
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Título y Botón */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestión completa de Clientes</p>
        </div>
        <Link href="/clientes/nuevo" passHref>
          <Button className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* 2. Filtros de Búsqueda */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleBuscar}>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="txtClienteId"
                name="txtClienteId"
                type="number"
                min="0"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtClienteNombre"
                name="txtClienteNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteClave" className="text-sm font-medium">
                Clave
              </label>
              <Input
                id="txtClienteClave"
                name="txtClienteClave"
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
          <CardDescription>Mostrando {Listado?.length || 0} elementos encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Clave</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Dirección</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Listado?.map((cliente) => (
                  <tr key={cliente.ClienteId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{cliente.ClienteId}</td>
                    <td className="py-3 px-4">{cliente.ClienteClave}</td>
                    <td className="py-3 px-4">{cliente.ClienteNombre}</td>
                    <td className="py-3 px-4">{cliente.ClienteDireccion}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                          cliente.ClienteActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {cliente.ClienteActivo ? "Activo" : "Inactivo"}
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
                        <Button variant="ghost" size="icon" title={cliente.ClienteActivo ? "Inactivar" : "Activar"}>
                          {cliente.ClienteActivo ? (
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
