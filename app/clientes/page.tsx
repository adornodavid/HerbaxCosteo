"use client"

/* ==================================================
	  Imports
	================================================== */
// -- Interfaces, clases y objetos
import type React from "react"
import type { oCliente, Cliente, ClientesListado, ClientesEstadisticas } from "@/types/clientes"
// -- Assets
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, PlusCircle, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"
// -- Frontend
import { RolesAdmin } from "@/app/actions/configuraciones"
// -- Backend
import { obtenerClientes } from "@/app/actions/clientes"

/* ==================================================
	  Componente Principal, Pagina
	================================================== */
export default function ClientesPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdmin = useMemo(() => user && RolesAdmin.includes(user.RolId), [user])
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const resultadosPorPagina = 20 

  // --- Estados ---
  const [pageLoading, setPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [Listado, setListado] = useState<Cliente[]>([])
  const [ListadoFiltrados, setListadoFiltrados] = useState<Cliente[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  
  // Estados para filtros
  const [filtroId, setFiltroId] = useState("")
  const [filtroClave, setFiltroClave] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1") 

  // Datos de ejemplo para el listado
  const [clientes] = useState([
    { id: 1, codigo: "CLI001", nombre: "Cliente 1", direccion: "Dirección 1", activo: true },
    { id: 2, codigo: "CLI002", nombre: "Cliente 2", direccion: "Dirección 2", activo: true },
    { id: 3, codigo: "CLI003", nombre: "Cliente 3", direccion: "Dirección 3", activo: false },
  ])

   // --- Paginación ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return ListadoFiltrados.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [ListadoFiltrados, paginaActual])
  
  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      let auxAdmin = -1
      if(!esAdmin){
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
          ClienteClave: c.clave || "Sin clave"
          ClienteDireccion: c.direccion || "Sin dirección",
          ClienteTelefono: c.telefono || "Sin telefono",
          ClienteEmail: c.email || "Sin email",
          ClienteImgUrl: c.imgurl || "Sin imagen",
          ClienteFechaCreacion: c.fechacreacion,
          ClienteActivo: c.activo === true,
        }))

        setListado(Listado)
        setListadoFiltrados(Listado)
        setTotalListado(Listado.length)
      } else {
        console.log("[v0] No hay datos o la consulta falló")
      }

      const userClienteId = [1, 2, 3, 4].includes(Number(user.RolId)) ? -1 : Number(user.ClienteId)
      // -- Cargar clientes
      const { data: clientesData, error: clientesError } = await listaDesplegableClientes(userClienteId,"")
      if (!clientesError) {
        const clientesConTodos = [1, 2, 3, 4].includes(Number(user.RolId))
          ? [{ id: -1, nombre: "Todos" }, ...(clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))]
          : (clientesData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }))
        setClientes(clientesConTodos)

        if ([1, 2, 3, 4].includes(Number(user.RolId))) {
          setFiltroCliente("-1")
        } else {
          const aux = clientesData.id
          setFiltroCliente(aux)
        }
        //setFiltroCliente("-1")
      } else {
        console.error("Error cargando clientes:", clientesError)
      }

      // -- Cargar catalogos
      const catalogosResult = await listaDesplegableCatalogos(-1, "", userClienteId)
      if (!catalogosResult.error) {
        const catalogosConTodos = [1, 2, 3, 4].includes(Number(user.RolId))
          ? [
              { id: -1, nombre: "Todos" },
              ...(catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
            ]
          : (catalogosResult.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre }))

        setCatalogos(catalogosConTodos)

        if ([1, 2, 3, 4].includes(Number(user.RolId))) {
          setFiltroCatalogo("-1") // Set to "Todos" for admin roles
        } else {
          // Set to first available catalog for restricted users
          if (catalogosResult.data && catalogosResult.data.length > 0) {
            setFiltroCatalogo(catalogosResult.data[0].id.toString())
          }
        }
      } else {
        console.error("Error cargando catálogos iniciales:", catalogosResult.error)
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
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }

      const inicializar = async () => {
        setPageLoading(true)
        await cargarDatosIniciales()
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin])

  // -- Handles
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
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleFormSubmit}>
            <div className="lg:col-span-2">
              <label htmlFor="txtClienteId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="txtClienteId"
                name="txtClienteId"
                type="text"
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
          <CardDescription>Mostrando {clientes.length} clientes encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Dirección</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{cliente.id}</td>
                    <td className="py-3 px-4">{cliente.codigo}</td>
                    <td className="py-3 px-4">{cliente.nombre}</td>
                    <td className="py-3 px-4">{cliente.direccion}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                          cliente.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {cliente.activo ? "Activo" : "Inactivo"}
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
                        <Button variant="ghost" size="icon" title={cliente.activo ? "Inactivar" : "Activar"}>
                          {cliente.activo ? (
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
