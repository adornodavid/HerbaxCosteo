"use client"
/* ==================================================
	  Imports
	================================================== */
// -- Interfaces, clases y objetos
import type React from "react"
import type { Cliente } from "@/types/clientes"
import type { ModalAlert, ModalError, ModalTutorial } from "@/types/common"
// -- Assets
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, PlusCircle, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"
// -- Configuraciones
import { RolesAdmin, arrActivoTrue, arrActivoFalse } from "@/lib/config"
// -- Components
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Frontend

// -- Backend
import { useAuth } from "@/contexts/auth-context"
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
  const resultadosPorPagina = 20

  // --- Estados ---
  // Cargar contenido en variables
  const [Listado, setListado] = useState<Cliente[]>([])
  //const [ListadoFiltrados, setListadoFiltrados] = useState<Cliente[]>([])
  const [TotalListado, setTotalListado] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ModalAlert, setModalAlert] = useState<ModalAlert>({ Titulo: "", Mensaje: "" })
  const [ModalError, setModalError] = useState<ModalError>({ Titulo: "", Mensaje: "" })
  const [ModalTutorial, setModalTutorial] = useState<ModalTutorial>({ Titulo: "", Subtitulo: "", VideoUrl: "" })
  const [ListadoSinResultados, setListadoSinResultados] = useState(false)
  // Mostrar/Ocultar contenido
  const [pageLoading, setPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showPageTituloMasNuevo, setShowPageTituloMasNuevo] = useState(false)
  // Cargar contenido en elementos
  const [PageTituloMasNuevo, setPageTituloMasNuevo] = PageTituloMasNuevo<ModalAlert>({ Titulo: "", Subtitulo: "", Visible: false, BotonTexto: "", Ruta: "" })
  const [filtroId, setFiltroId] = useState("")
  const [filtroClave, setFiltroClave] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState("-1")

  // --- Paginación ---
  const elementosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return Listado.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [Listado, paginaActual])

  // -- Funciones --
  // --- Función de búsqueda, no es la busqueda inicial ---
  const ejecutarBusqueda = async (id: number, nombre: string, clave: string, estatus: string) => {
    // Validar usuario activo
    if (!user) return

    // Actualizar estados
    setIsSearching(true)
    setPaginaActual(1)

    // Formatear variables a mandar como parametros
    const auxId = id != -1 ? id : -1
    const auxEstatus =
      estatus === "-1"
        ? "Todos"
        : arrActivoTrue.includes(estatus)
          ? true
          : arrActivoFalse.includes(estatus)
            ? false
            : "Todos"

    // Ejecutar Consulta principal
    try {
      const result = await obtenerClientes(auxId, nombre, clave, "", "", "", auxEstatus)

      if (result.success && result.data) {
        console.log(result.success, " - data: ", result.data)
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
        setListadoSinResultados(Listado.length === 0)

        return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
      } else {
        console.log("No hay datos o la consulta falló.")
        return { success: false, mensaje: "No hay datos o la consulta falló." }
      }

      if (!result.success) {
        console.error("Error en búsqueda del filtro de búsqueda:", result.error)
        console.log("Error en búsqueda del filtro de búsqueda:", result.error)
        setListado([])
        setListadoSinResultados(true)
        return { success: false, mensaje: "Error en búsqueda del filtro de búsqueda: " + result.error }
      }
    } catch (error) {
      console.log("Error inesperado al buscar productos:", error)
      setListado([])
      setListadoSinResultados(true)
      return { error: true, mensaje: "Error inesperado al buscar productos: " + error }
    } finally {
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      let auxAdminClienteId = -1
      if (!esAdmin) {
        auxAdminClienteId = user.ClienteId
      }

      setPageTituloMasNuevo({
        Titulo: "Clientes",
        Subtitulo: "Gestión completa de Clientes",
        Visible: esAdmin == true ? true : false,
        BotonTexto: "Crear NuevoCliente",
        Ruta: "/clientes/nuevo"
      })
      setShowPageTituloMasNuevo(true)      

      const Result = await ejecutarBusqueda(auxAdminClienteId, "", "", "True")
      if (!Result.success) {
        setModalAlert({
          Titulo: "En ejecucion de Busqueda de carga inicial",
          Mensaje: Result.mensaje,
        })
        setShowModalAlert(true)
      }

      /*
      const Result = await obtenerClientes(auxAdminClienteId, "", "", "", "", "", "True")
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
        setListadoSinResultados(Listado.length === 0)
      } else {
        console.log("No hay datos o la consulta falló")
      }
      */
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
      console.log("Error al cargar datos iniciales:", error)

      setModalError({
        Titulo: "Error al cargar datos iniciales",
        Mensaje: error,
      })
      setShowModalError(true)
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
    // Prevenir cambio de pagina
    e.preventDefault()

    // Variables auxiliares y formateadas para mandar como parametros
    const Id = filtroId === "" || filtroId === "0" ? -1 : Number.parseInt(filtroId, 10)
    const Nombre: string = filtroNombre.trim()
    const Clave: string = filtroClave.trim()
    const Estatus = filtroEstatus === "-1" ? "Todos" : filtroEstatus

    ejecutarBusqueda(Id, Nombre, Clave, Estatus)
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

  // ModalAlert
  if (showModalAlert) {
    return (
      <PageModalAlert
        Titulo={ModalAlert.Titulo}
        Mensaje={ModalAlert.Mensaje}
        isOpen={true}
        onClose={() => setShowModalAlert(false)}
      />
    )
  }

  // ModalError
  if (showModalError) {
    return (
      <PageModalError
        Titulo={ModalError.Titulo}
        Mensaje={ModalError.Mensaje}
        isOpen={true}
        onClose={() => setShowModalError(false)}
      />
    )
  }

  // ModalTutorial
  if (showModalTutorial) {
    return (
      <PageModalTutorial
        Titulo={ModalTutorial.Titulo}
        Subtitulo={ModalTutorial.Subtitulo}
        VideoUrl={ModalTutorial.VideoUrl}
        isOpen={true}
        onClose={() => setShowModalTutorial(false)}
      />
    )
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Título y Botón */}
      
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestión completa de Clientes</p>
        </div>
        <div className="flex justify-end">
          <Link href="/clientes/nuevo" passHref>
            <Button className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Nuevo Cliente
            </Button>
          </Link>
        </div>
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
                {isSearching && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>Buscando resultados.....</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching && Listado.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span>No se encontraron resultados con los parametros indicados, favor de verificar.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isSearching &&
                  Listado?.map((cliente) => (
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

      {/* {showModalAlert && (
        <PageModalAlert
          title={ModalAlert.Titulo || ""}
          message={ModalAlert.Mensaje || ""}
          onClose={() => setShowModalAlert(false)}
        />
      )} */}
    </div>
  )
}
