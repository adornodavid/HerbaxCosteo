"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft, Package, Flag as Flask, ShoppingBag } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type { oFormula } from "@/types/formulas.types"
import type {
  propsPageLoadingScreen,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageModalAlert } from "@/components/page-modal-alert"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalTutorial } from "@/components/page-modal-tutorial"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { objetoFormula, obtenerProductosXFormulas } from "@/app/actions/formulas"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function VerFormulaPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const formulaId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [formula, setFormula] = useState<oFormula | null>(null)
  const [productosRelacionados, setProductosRelacionados] = useState<any[]>([])
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [activeTab, setActiveTab] = useState<"materiasprima" | "formulas" | "elaboracion" | "productos">("elaboracion")
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    if (!authLoading) {
      // Validar
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      // Iniciar
      const cargarFormula = async () => {
        try {
          setShowPageLoading(true)

          const result = await objetoFormula(formulaId, "", "", "Todos", -1, -1)
          if (result.success && result.data) {
            setFormula(result.data)
          }

          const resultProductos = await obtenerProductosXFormulas(formulaId)
          if (resultProductos.success && resultProductos.data) {
            setProductosRelacionados(resultProductos.data)
          }
        } catch (error) {
          console.error("Error al cargar información: ", error)
          setModalError({
            Titulo: "Error al cargar información",
            Mensaje: error,
          })
          setShowModalError(true)
        } finally {
          setShowPageLoading(false)
        }
      }
      // Si se obtuvo el id
      if (formulaId) {
        cargarFormula()
      }
    }
  }, [authLoading, user, router, esAdminDOs, formulaId])

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!formula) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró la fórmula.</p>
      </div>
    )
  }

  // Contenido principal
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* -- Componentes -- */}
      {showModalAlert && (
        <PageModalAlert
          Titulo={ModalAlert.Titulo}
          Mensaje={ModalAlert.Mensaje}
          isOpen={true}
          onClose={() => setShowModalAlert(false)}
        />
      )}

      {showModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      {showModalTutorial && (
        <PageModalTutorial
          Titulo={ModalTutorial.Titulo}
          Subtitulo={ModalTutorial.Subtitulo}
          VideoUrl={ModalTutorial.VideoUrl}
          isOpen={true}
          onClose={() => setShowModalTutorial(false)}
        />
      )}

      <PageTitlePlusNew
        Titulo="Información de fórmula"
        Subtitulo="Información completa de la fórmula"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card className="overflow-hidden mb-6">
        <CardContent className="p-0">
          <div className="flex flex-row h-[200px]">
            {/* Image on left with gray background */}
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200">
              <img
                src={
                  formula.imgurl && formula.imgurl !== "Sin imagen"
                    ? formula.imgurl
                    : "/placeholder.svg?height=200&width=200&text=Formula"
                }
                alt={formula.nombre}
                className="h-[200px] w-auto"
              />
            </div>

            {/* Formula info on right - compact layout */}
            <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
              {/* Line 1: ID, Código, Nombre */}
              <div className="flex gap-6 items-center">
                <div>
                  <span className="font-semibold text-sky-700">ID:</span>
                  <span className="ml-2 text-gray-900">{formula.id}</span>
                </div>
                <div>
                  <span className="font-semibold text-sky-700">Código:</span>
                  <span className="ml-2 text-gray-900">{formula.codigo || "Sin código"}</span>
                </div>
                <div>
                  <span className="font-semibold text-sky-700">Nombre:</span>
                  <span className="ml-2 text-gray-900">{formula.nombre || "Sin nombre"}</span>
                </div>
              </div>

              {/* Line 2: Unidad de medida, Costo */}
              <div className="flex gap-6 items-center">
                <div>
                  <span className="font-semibold text-sky-700">Unidad de Medida:</span>
                  <span className="ml-2 text-gray-900">{formula.unidadesmedida?.descripcion || "Sin unidad"}</span>
                </div>
                <div>
                  <span className="font-semibold text-sky-700">Costo:</span>
                  <span className="ml-2 text-gray-900">
                    {formula.costo ? `$${Number(formula.costo).toFixed(2)}` : "$0.00"}
                  </span>
                </div>
              </div>

              {/* Line 3: Estatus, Fecha de Creación */}
              <div className="flex gap-6 items-center">
                <div>
                  <span className="font-semibold text-sky-700">Estatus:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                      formula.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {formula.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-sky-700">Fecha de Creación:</span>
                  <span className="ml-2 text-gray-900">
                    {formula.fechacreacion ? new Date(formula.fechacreacion).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("materiasprima")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "materiasprima"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Materias Prima
        </button>

        <button
          onClick={() => setActiveTab("formulas")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "formulas" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Fórmulas
        </button>

        <button
          onClick={() => setActiveTab("elaboracion")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "elaboracion"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Elaboración
        </button>

        <button
          onClick={() => setActiveTab("productos")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "productos"
              ? "border-b-2 border-purple-500 text-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Productos
        </button>
      </div>

      {activeTab === "materiasprima" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Materias Prima</h2>
            <div className="space-y-2">
              {formula.materiasprimasxformula && formula.materiasprimasxformula.length > 0 ? (
                <div className="space-y-3">
                  {formula.materiasprimasxformula.map((mpRel, index) => (
                    <div key={index} className="flex items-center gap-4 border rounded p-3 max-h-20">
                      {/* Icon on left */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="h-7 w-7 text-green-600" />
                        </div>
                      </div>

                      {/* Info on right */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: ID, Código, Nombre */}
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500">ID: {mpRel.materiaprimaid}</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {mpRel.materiasprima?.codigo || "N/A"}
                          </span>
                          <span className="text-sm text-gray-900 truncate">{mpRel.materiasprima?.nombre || "N/A"}</span>
                        </div>

                        {/* Line 2: Unidad de medida, Costo */}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{mpRel.materiasprima?.unidadesmedida?.descripcion || "N/A"}</span>
                          <span className="font-semibold text-green-600">
                            ${mpRel.materiasprima?.costo?.toFixed(6) || "0.000000"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay materias prima asignadas</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "formulas" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Fórmulas</h2>
            <div className="space-y-2">
              {formula.formulasxformula && formula.formulasxformula.length > 0 ? (
                <div className="space-y-3">
                  {formula.formulasxformula.map((formulaRel, index) => (
                    <div key={index} className="flex items-center gap-4 border rounded p-3 max-h-20">
                      {/* Icon on left */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Flask className="h-7 w-7 text-blue-600" />
                        </div>
                      </div>

                      {/* Info on right */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: ID, Código, Nombre */}
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500">ID: {formulaRel.secundarioid}</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {formulaRel.formulas?.codigo || "N/A"}
                          </span>
                          <span className="text-sm text-gray-900 truncate">{formulaRel.formulas?.nombre || "N/A"}</span>
                        </div>

                        {/* Line 2: Unidad de medida, Costo */}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</span>
                          <span className="font-semibold text-green-600">
                            ${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay fórmulas asignadas</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "elaboracion" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Elaboración de la Fórmula</h2>

            {(formula.materiasprimasxformula && formula.materiasprimasxformula.length > 0) ||
            (formula.formulasxformula && formula.formulasxformula.length > 0) ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold"></th>
                      <th className="text-left p-3 font-semibold">Tipo</th>
                      <th className="text-left p-3 font-semibold">Código</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Costo</th>
                      <th className="text-left p-3 font-semibold">Unidad de medida</th>
                      <th className="text-left p-3 font-semibold">Factor Importación</th>
                      <th className="text-left p-3 font-semibold">Costo con FI</th>
                      <th className="text-left p-3 font-semibold border-l-2 border-gray-300 text-green-600">
                        Cantidad
                      </th>
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Materias Prima */}
                    {formula.materiasprimasxformula?.map((mpRel, index) => (
                      <tr key={`mp-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <Package className="h-5 w-5 text-green-600" />
                        </td>
                        <td className="p-3">Materia Prima</td>
                        <td className="p-3">{mpRel.materiasprima?.codigo || "N/A"}</td>
                        <td className="p-3">{mpRel.materiasprima?.nombre || "N/A"}</td>
                        <td className="p-3">${mpRel.materiasprima?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3">{mpRel.materiasprima?.unidadesmedida?.descripcion || "N/A"}</td>
                        <td className="p-3">{mpRel.materiasprima?.factorimportacion?.toFixed(2) || "0.00"}</td>
                        <td className="p-3">
                          ${mpRel.materiasprima?.costoconfactorimportacion?.toFixed(6) || "0.000000"}
                        </td>
                        <td className="p-3 border-l-2 border-gray-300 text-green-600">{mpRel.cantidad || 0}</td>
                        <td className="p-3 text-green-600">${mpRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                      </tr>
                    ))}

                    {/* Formulas */}
                    {formula.formulasxformula?.map((formulaRel, index) => (
                      <tr key={`formula-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <Flask className="h-5 w-5 text-blue-600" />
                        </td>
                        <td className="p-3">Fórmula</td>
                        <td className="p-3">{formulaRel.formulas?.codigo || "N/A"}</td>
                        <td className="p-3">{formulaRel.formulas?.nombre || "N/A"}</td>
                        <td className="p-3">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3">{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</td>
                        <td className="p-3">No aplica</td>
                        <td className="p-3">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3 border-l-2 border-gray-300 text-green-600">{formulaRel.cantidad || 0}</td>
                        <td className="p-3 text-green-600">${formulaRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 border-blue-500 mt-4 pt-4">
                  <div className="flex justify-end">
                    <div className="w-2/5">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-bold">Costo total:</span>
                        <span className="font-bold">${formula.costo?.toFixed(6) || "0.000000"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No hay materias prima ni fórmulas asociadas a esta fórmula.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "productos" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
              Productos que utilizan esta Fórmula
            </h2>
            <div className="space-y-2">
              {productosRelacionados && productosRelacionados.length > 0 ? (
                <div className="space-y-3">
                  {productosRelacionados.map((producto, index) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/productos/${producto.productoid}/ver`)}
                      className="flex items-center gap-4 border rounded-lg p-3 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all duration-200"
                    >
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {producto.imagen && producto.imagen !== "Sin imagen" ? (
                            <img
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.producto || "Producto"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-8 w-8 text-purple-400" />
                          )}
                        </div>
                      </div>

                      {/* Info del producto */}
                      <div className="flex-1 min-w-0">
                        {/* Línea 1: ID, Código, Nombre */}
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            ID: {producto.productoid}
                          </span>
                          <span className="text-sm font-semibold text-purple-700">
                            {producto.codigoproducto || "N/A"}
                          </span>
                          <span className="text-sm text-gray-900 truncate font-medium">
                            {producto.producto || "N/A"}
                          </span>
                        </div>

                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>
                            <span className="font-semibold">Producto:</span> {producto.producto || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Presentación:</span> {producto.presentacionp || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Código:</span> {producto.codigoproducto || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Cliente:</span> {producto.clientenombre || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Zona:</span> {producto.zonanombre || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay productos que utilicen esta fórmula</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        {esAdminDOs && (
          <>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              onClick={() => router.push(`/formulas/${formulaId}/editar`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Actualizar
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => router.push(`/formulas/${formulaId}/eliminar`)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </>
        )}

        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => router.push("/formulas")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar a listado
        </Button>
      </div>
    </div>
  )
}
