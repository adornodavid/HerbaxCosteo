"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, RotateCcw, Eye, EyeOff, Edit, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { obtenerMateriasPrima, estatusActivoMateriaPrima } from "@/app/actions/materia-prima"
import type { MateriaPrima } from "@/types/materia-prima"
import { obtenerUsuarioActual } from "@/app/actions/auth-actions"
import PageLoading from "@/components/page-loading"
import PageTitlePlusNew from "@/components/page-title-plus-new"

export default function MateriaPrimaPage() {
  const router = useRouter()

  // PASO 1: ESTADOS PARA AUTENTICACIÓN Y AUTORIZACIÓN
  const [esAdmin, setEsAdmin] = useState(false)
  const [esAdminDOs, setEsAdminDOs] = useState(false)
  const [cargando, setCargando] = useState(true)

  // PASO 2: ESTADOS PARA FILTROS
  const [filtroId, setFiltroId] = useState("")
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroActivo, setFiltroActivo] = useState("Todos")

  // PASO 3: ESTADOS PARA DATOS
  const [materiasPrima, setMateriasPrima] = useState<MateriaPrima[]>([])
  const [elementoDetalles, setElementoDetalles] = useState<MateriaPrima | null>(null)

  // PASO 4: ESTADOS PARA MODALES Y LOADING
  const [showElementoDetallesModal, setShowElementoDetallesModal] = useState(false)
  const [pageLoading, setPageLoading] = useState({ show: false, message: "" })

  // PASO 5: VERIFICAR AUTENTICACIÓN Y AUTORIZACIÓN AL CARGAR
  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        const usuario = await obtenerUsuarioActual()

        if (!usuario) {
          router.push("/login")
          return
        }

        // Verificar roles
        const admin = usuario.rol === "Administrador"
        const adminDOs = usuario.rol === "Administrador" || usuario.rol === "Director de Operaciones"

        setEsAdmin(admin)
        setEsAdminDOs(adminDOs)

        // Si no es admin ni director, redirigir
        if (!adminDOs) {
          router.push("/dashboard")
          return
        }

        setCargando(false)
      } catch (error) {
        console.error("Error verificando autenticación:", error)
        router.push("/login")
      }
    }

    verificarAutenticacion()
  }, [router])

  // PASO 6: CARGAR DATOS INICIALES
  useEffect(() => {
    if (!cargando && esAdminDOs) {
      cargarMateriasPrima()
    }
  }, [cargando, esAdminDOs])

  // PASO 7: FUNCIÓN PARA CARGAR MATERIAS PRIMA
  const cargarMateriasPrima = async () => {
    setPageLoading({ show: true, message: "Cargando Materias Prima..." })

    try {
      const resultado = await obtenerMateriasPrima(
        Number(filtroId) || -1,
        filtroCodigo,
        filtroNombre,
        filtroActivo,
        -1, // clienteid
        -1, // productoid
      )

      if (resultado.success && resultado.data) {
        setMateriasPrima(resultado.data)
      } else {
        console.error("Error cargando materias prima:", resultado.error)
        setMateriasPrima([])
      }
    } catch (error) {
      console.error("Error en cargarMateriasPrima:", error)
      setMateriasPrima([])
    } finally {
      setPageLoading({ show: false, message: "" })
    }
  }

  // PASO 8: MANEJAR BÚSQUEDA
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    cargarMateriasPrima()
  }

  // PASO 9: LIMPIAR FILTROS
  const handleLimpiar = () => {
    setFiltroId("")
    setFiltroCodigo("")
    setFiltroNombre("")
    setFiltroActivo("Todos")
  }

  // PASO 10: MANEJAR VER DETALLES
  const handleVerDetalles = (elemento: MateriaPrima) => {
    setElementoDetalles(elemento)
    setShowElementoDetallesModal(true)
  }

  // PASO 11: MANEJAR CAMBIO DE ESTATUS
  const handleToggleEstatus = async (id: number, activoActual: boolean) => {
    try {
      const resultado = await estatusActivoMateriaPrima(id, !activoActual)

      if (resultado) {
        // Recargar datos
        cargarMateriasPrima()
      } else {
        console.error("Error cambiando estatus de materia prima")
      }
    } catch (error) {
      console.error("Error en handleToggleEstatus:", error)
    }
  }

  // PASO 12: MOSTRAR LOADING SI ESTÁ CARGANDO
  if (cargando) {
    return <PageLoading message="Verificando permisos..." />
  }

  // PASO 13: MOSTRAR LOADING SI HAY OPERACIÓN EN CURSO
  if (pageLoading.show) {
    return <PageLoading message={pageLoading.message} />
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* PASO 14: TÍTULO Y BOTÓN CREAR */}
      <PageTitlePlusNew
        Titulo="Materia Prima"
        Descripcion="Gestión completa de Materia Prima"
        TextoBoton="Crear Nueva Materia Prima"
        Ruta="/materiaprima/crear"
      />

      {/* PASO 15: FILTROS DE BÚSQUEDA */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 items-end" onSubmit={handleFormSubmit}>
            <div className="lg:col-span-2">
              <Label htmlFor="txtMateriaPrimaId">ID</Label>
              <Input
                id="txtMateriaPrimaId"
                name="txtMateriaPrimaId"
                type="text"
                placeholder="Buscar por ID..."
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="txtMateriaPrimaCodigo">Código</Label>
              <Input
                id="txtMateriaPrimaCodigo"
                name="txtMateriaPrimaCodigo"
                type="text"
                placeholder="Buscar por código..."
                maxLength={50}
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="txtMateriaPrimaNombre">Nombre</Label>
              <Input
                id="txtMateriaPrimaNombre"
                name="txtMateriaPrimaNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="ddlActivo">Estatus</Label>
              <Select name="ddlActivo" value={filtroActivo} onValueChange={setFiltroActivo}>
                <SelectTrigger id="ddlActivo">
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="True">Activo</SelectItem>
                  <SelectItem value="False">Inactivo</SelectItem>
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

      {/* PASO 16: RESULTADOS - LISTADO */}
      <Card className="rounded-xs border bg-card text-card-foreground shadow">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Mostrando {materiasPrima.length} materias prima encontradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Costo</th>
                  <th className="text-left py-3 px-4 font-medium">Estatus</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materiasPrima.map((elemento) => (
                  <tr key={elemento.MateriaPrimaId} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{elemento.MateriaPrimaId}</td>
                    <td className="py-3 px-4">{elemento.MateriaPrimaCodigo}</td>
                    <td className="py-3 px-4">{elemento.MateriaPrimaNombre}</td>
                    <td className="py-3 px-4">
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(elemento.MateriaPrimaCosto)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                          elemento.MateriaPrimaActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {elemento.MateriaPrimaActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {/* PASO 17: BOTÓN VER DETALLES (MODAL) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Detalles"
                          onClick={() => handleVerDetalles(elemento)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>

                        {/* PASO 18: BOTÓN VER (PÁGINA COMPLETA) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver"
                          onClick={() => router.push(`/materiaprima/${elemento.MateriaPrimaId}/ver`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* PASO 19: BOTÓN EDITAR */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => router.push(`/materiaprima/${elemento.MateriaPrimaId}/editar`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* PASO 20: BOTÓN TOGGLE ESTATUS */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={elemento.MateriaPrimaActivo ? "Inactivar" : "Activar"}
                          onClick={() => handleToggleEstatus(elemento.MateriaPrimaId, elemento.MateriaPrimaActivo)}
                        >
                          {elemento.MateriaPrimaActivo ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-red-500" />
                          )}
                        </Button>

                        {/* PASO 21: BOTÓN ELIMINAR */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          onClick={() => router.push(`/materiaprima/${elemento.MateriaPrimaId}/eliminar`)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* PASO 22: MODAL DE DETALLES */}
      {elementoDetalles && (
        <Dialog open={showElementoDetallesModal} onOpenChange={setShowElementoDetallesModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Materia Prima</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="text-base">{elementoDetalles.MateriaPrimaId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Código</Label>
                  <p className="text-base">{elementoDetalles.MateriaPrimaCodigo}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                  <p className="text-base">{elementoDetalles.MateriaPrimaNombre}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Costo</Label>
                  <p className="text-base">
                    {new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(elementoDetalles.MateriaPrimaCosto)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unidad de Medida</Label>
                  <p className="text-base">{elementoDetalles.UnidadMedidaDescripcion || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                  <p className="text-base">
                    {elementoDetalles.MateriaPrimaFechaCreacion
                      ? new Date(elementoDetalles.MateriaPrimaFechaCreacion).toLocaleDateString("es-MX")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estatus</Label>
                  <p className="text-base">
                    <span
                      className={`px-2 py-1 text-xs rounded-xs font-semibold ${
                        elementoDetalles.MateriaPrimaActivo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {elementoDetalles.MateriaPrimaActivo ? "Activo" : "Inactivo"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Imagen */}
              {elementoDetalles.MateriaPrimaImgUrl && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Imagen</Label>
                  <div className="mt-2 border rounded-md p-4 bg-gray-100 flex items-center justify-center">
                    <img
                      src={elementoDetalles.MateriaPrimaImgUrl || "/placeholder.svg"}
                      alt={elementoDetalles.MateriaPrimaNombre}
                      className="w-full h-auto object-cover max-h-[300px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
