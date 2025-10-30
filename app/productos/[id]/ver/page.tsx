"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft, Flag as Flask, Package } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type { oProducto } from "@/types/productos.types"
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
import { obtenerProductos } from "@/app/actions/productos"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function VerProductoPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const productoId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [producto, setProducto] = useState<oProducto | null>(null)
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [activeTab, setActiveTab] = useState<
    "informacion" | "caracteristicas" | "formulas" | "materialetiquetado" | "elaboracion" | "costeo" | "costeooptimo" | "cotizar" >("caracteristicas")
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
      const cargarProducto = async () => {
        try {
          setShowPageLoading(true)

          const result = await obtenerProductos(productoId, "", -1, -1, -1, "Todos")
          if (result.success && result.data && result.data.length > 0) {
            console.log(result.data[0])
            setProducto(result.data[0])
          } else {
            console.log("error en cargar producto. " + " productoid: " + productoId + " error: " + result.error)
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
      if (productoId) {
        cargarProducto()
      }
    }
  }, [authLoading, user, router, esAdminDOs, productoId])

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!producto) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró el producto.</p>
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
        Titulo="Información de producto"
        Subtitulo="Información completa del producto"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      {producto && (
        <>
          <Card className="overflow-hidden mb-6">
            <CardContent className="p-0">
              <div className="flex flex-row h-[200px]">
                {/* Image on left with gray background */}
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200">
                  <img
                    src={producto.imgurl || "/placeholder.svg?height=300&width=300&text=Producto"}
                    alt={producto.nombre}
                    className="h-[200px] w-auto"
                  />
                </div>

                {/* Product info on right - compact layout */}
                <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
                  {/* Line 1: ID, Código, Nombre */}
                  <div className="flex gap-6 items-center">
                    <div>
                      <span className="font-semibold text-sky-700">ID:</span>
                      <span className="ml-2 text-gray-900">{producto.id}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Código:</span>
                      <span className="ml-2 text-gray-900">{producto.codigo || "Sin código"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Nombre:</span>
                      <span className="ml-2 text-gray-900">{producto.nombre || "Sin nombre"}</span>
                    </div>
                  </div>

                  {/* Line 2: Cliente, Zona */}
                  <div className="flex gap-6 items-center">
                    <div>
                      <span className="font-semibold text-sky-700">Cliente:</span>
                      <span className="ml-2 text-gray-900">{producto.clientes?.nombre || "Sin cliente"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Zona:</span>
                      <span className="ml-2 text-gray-900">{producto.zonas?.nombre || "Sin zona"}</span>
                    </div>
                  </div>

                  {/* Line 3: Unidad de medida, Costo de elaboración, Estatus */}
                  <div className="flex gap-6 items-center">
                    <div>
                      <span className="font-semibold text-sky-700">Unidad de Medida:</span>
                      <span className="ml-2 text-gray-900">{producto.unidadesmedida?.descripcion || "Sin unidad"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Costo de elaboración:</span>
                      <span className="ml-2 text-gray-900">${producto.costo?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-700">Estatus:</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                          producto.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {producto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("caracteristicas")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "caracteristicas"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Características
            </button>

            <button
              onClick={() => setActiveTab("formulas")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "formulas"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Fórmulas
            </button>

            <button
              onClick={() => setActiveTab("materialetiquetado")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "materialetiquetado"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Material de etiquetado
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
              onClick={() => setActiveTab("costeo")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "costeo"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Costeo
            </button>

            <button
              onClick={() => setActiveTab("costeooptimo")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "costeooptimo"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Costeo Optimo
            </button>

            <button
              onClick={() => setActiveTab("cotizar")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "cotizar"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cotizar
            </button>
          </div>

          {activeTab === "caracteristicas" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Características del Producto</h2>
                <div className="space-y-4">
                  {producto.productoscaracteristicas ? (
                    <>
                      <div>
                        <span className="font-semibold text-gray-700">Descripción:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.descripcion || "Sin descripción"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Presentación:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.presentacion || "Sin presentación"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Porción:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.porcion || "Sin porción"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Modo de Uso:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.modouso || "Sin modo de uso"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Porción por Envase:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.porcionenvase || "Sin información"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Categoría de Uso:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.categoriauso || "Sin categoría"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Propósito Principal:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.propositoprincipal || "Sin propósito"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Propuesta de Valor:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.propuestavalor || "Sin propuesta"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Instrucciones de Ingesta:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.instruccionesingesta || "Sin instrucciones"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Edad Mínima:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.edadminima || "Sin edad mínima"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Advertencia:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.advertencia || "Sin advertencia"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Condiciones de Almacenamiento:</span>
                        <p className="ml-2 text-gray-900">
                          {producto.productoscaracteristicas.condicionesalmacenamiento || "Sin condiciones"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">No hay características registradas para este producto.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "formulas" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Fórmulas Asignadas</h2>
                <div className="space-y-2">
                  {producto.formulasxproducto && producto.formulasxproducto.length > 0 ? (
                    <div className="space-y-3">
                      {producto.formulasxproducto.map((formulaRel, index) => (
                        <div key={index} className="flex items-center gap-4 border rounded p-3 max-h-20">
                          {/* Icon on left */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Flask className="h-7 w-7 text-blue-600" />
                            </div>
                          </div>

                          {/* Info on right */}
                          <div className="flex-1 min-w-0">
                            {/* Line 1: Código, Nombre */}
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-gray-700">
                                {formulaRel.formulas?.codigo || "N/A"}
                              </span>
                              <span className="text-sm text-gray-900 truncate">
                                {formulaRel.formulas?.nombre || "N/A"}
                              </span>
                            </div>

                            {/* Line 2: Unidad de medida, Costo */}
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</span>
                              <span className="font-semibold text-green-600">
                                ${formulaRel.formulas?.costo?.toFixed(2) || "0.00"}
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

          {activeTab === "materialetiquetado" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Material de Etiquetado</h2>
                <div className="space-y-2">
                  {producto.materialesetiquetadoxproducto && producto.materialesetiquetadoxproducto.length > 0 ? (
                    <div className="space-y-3">
                      {producto.materialesetiquetadoxproducto.map((materialRel, index) => (
                        <div key={index} className="flex items-center gap-4 border rounded p-3 max-h-20">
                          {/* Icon on left */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Package className="h-7 w-7 text-orange-600" />
                            </div>
                          </div>

                          {/* Info on right */}
                          <div className="flex-1 min-w-0">
                            {/* Line 1: Código, Nombre */}
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-gray-700">
                                {materialRel.materialesetiquetado?.codigo || "N/A"}
                              </span>
                              <span className="text-sm text-gray-900 truncate">
                                {materialRel.materialesetiquetado?.nombre || "N/A"}
                              </span>
                            </div>

                            {/* Line 2: Unidad de medida, Costo */}
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>{materialRel.materialesetiquetado?.unidadesmedida?.descripcion || "N/A"}</span>
                              <span className="font-semibold text-green-600">
                                ${materialRel.materialesetiquetado?.costo?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay material de etiquetado asignado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "elaboracion" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Elaboración del Producto</h2>

                {(producto.formulasxproducto && producto.formulasxproducto.length > 0) ||
                (producto.materialesetiquetadoxproducto && producto.materialesetiquetadoxproducto.length > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left p-3 font-semibold">Acciones</th>
                          <th className="text-left p-3 font-semibold"></th>
                          <th className="text-left p-3 font-semibold">Tipo</th>
                          <th className="text-left p-3 font-semibold">Código</th>
                          <th className="text-left p-3 font-semibold">Nombre</th>
                          <th className="text-left p-3 font-semibold">Cantidad</th>
                          <th className="text-left p-3 font-semibold">Costo Parcial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Formulas */}
                        {producto.formulasxproducto?.map((formulaRel, index) => (
                          <tr key={`formula-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3">
                              <Flask className="h-5 w-5 text-blue-600" />
                            </td>
                            <td className="p-3">Fórmula</td>
                            <td className="p-3">{formulaRel.formulas?.codigo || "N/A"}</td>
                            <td className="p-3">{formulaRel.formulas?.nombre || "N/A"}</td>
                            <td className="p-3">{formulaRel.cantidad || 0}</td>
                            <td className="p-3">${formulaRel.costoparcial?.toFixed(2) || "0.00"}</td>
                          </tr>
                        ))}

                        {/* Material de Etiquetado */}
                        {producto.materialesetiquetadoxproducto?.map((materialRel, index) => (
                          <tr key={`material-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3">
                              <Package className="h-5 w-5 text-orange-600" />
                            </td>
                            <td className="p-3">Material de etiquetado</td>
                            <td className="p-3">{materialRel.materialesetiquetado?.codigo || "N/A"}</td>
                            <td className="p-3">{materialRel.materialesetiquetado?.nombre || "N/A"}</td>
                            <td className="p-3">{materialRel.cantidad || 0}</td>
                            <td className="p-3">${materialRel.costoparcial?.toFixed(2) || "0.00"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t-2 border-blue-500 mt-4 pt-4">
                      <div className="flex justify-end">
                        <div className="w-2/5">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-bold">Costo de elaboración:</span>
                            <span>${producto.costo?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span>Variación de precios:</span>
                            <span>5%</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-bold">Costo total:</span>
                            <span className="font-bold">
                              ${((producto.costo || 0) + (producto.costo || 0) * 0.05).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="font-bold">Precio Mínimo sugerido:</span>
                            <span className="font-bold text-green-600">
                              ${(((producto.costo || 0) + (producto.costo || 0) * 0.05) * 1.3).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay fórmulas ni material de etiquetado asociados a este producto.</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-center">
            {esAdminDOs && (
              <>
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => router.push(`/productos/${productoId}/editar`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>

                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => router.push(`/productos/${productoId}/eliminar`)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </>
            )}

            <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => router.push("/productos")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar a listado
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
