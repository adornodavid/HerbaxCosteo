"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cotizacionProducto, cotizacionOptima25, cotizacionOptima30 } from "@/app/actions/productos-cotizaciones"
import type { ProductoXClienteN, ProductoXClienteOptimoN, ProductoXClienteOptimo } from "@/types/productos.types"

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
    | "informacion"
    | "caracteristicas"
    | "formulas"
    | "materialetiquetado"
    | "elaboracion"
    | "costeo"
    | "costeooptimo"
    | "cotizar"
  >("elaboracion")
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)

  const [productoXCliente, setProductoXCliente] = useState<ProductoXClienteN | null>(null)
  const [productoXClienteOptimo25, setProductoXClienteOptimo25] = useState<ProductoXClienteOptimoN | null>(null)
  const [productoXClienteOptimo30, setProductoXClienteOptimo30] = useState<ProductoXClienteOptimo | null>(null)

  const [porcentajeGeneracional, setPorcentajeGeneracional] = useState("")
  const [porcentajeNivel, setPorcentajeNivel] = useState("")
  const [porcentajeInfinito, setPorcentajeInfinito] = useState("")
  const [porcentajeIva, setPorcentajeIva] = useState("")
  const [porcentajeBonoRapido, setPorcentajeBonoRapido] = useState("")
  const [porcentajeCDA, setPorcentajeCDA] = useState("")
  const [porcentajeConstructor, setPorcentajeConstructor] = useState("")
  const [porcentajeRuta, setPorcentajeRuta] = useState("")
  const [porcentajeReembolsos, setPorcentajeReembolsos] = useState("")
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState("")
  const [porcentajeEnvio, setPorcentajeEnvio] = useState("")

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
            console.log("datapro", result.data[0])

            const productoData = result.data[0]
            if (productoData.clienteid && productoData.zonaid) {
              const [resultCotizacion, resultOptima25, resultOptima30] = await Promise.all([
                cotizacionProducto(productoId, productoData.clienteid, productoData.zonaid),
                cotizacionOptima25(productoId, productoData.clienteid),
                cotizacionOptima30(productoId, productoData.clienteid),
              ])

              if (resultCotizacion.success && resultCotizacion.data) {
                setProductoXCliente(resultCotizacion.data[0] || null)

                // Set percentage values
                if (resultCotizacion.data[0]?.sporcentajegeneracional !== undefined) {
                  setPorcentajeGeneracional(resultCotizacion.data[0].sporcentajegeneracional.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajenivel !== undefined) {
                  setPorcentajeNivel(resultCotizacion.data[0].sporcentajenivel.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajeinfinito !== undefined) {
                  setPorcentajeInfinito(resultCotizacion.data[0].sporcentajeinfinito.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajeiva !== undefined) {
                  setPorcentajeIva(resultCotizacion.data[0].sporcentajeiva.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajebonorapido !== undefined) {
                  setPorcentajeBonoRapido(resultCotizacion.data[0].sporcentajebonorapido.toString())
                }
                if (resultCotizacion.data[0]?.scda !== undefined) {
                  setPorcentajeCDA(resultCotizacion.data[0].scda.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajeconstructor !== undefined) {
                  setPorcentajeConstructor(resultCotizacion.data[0].sporcentajeconstructor.toString())
                }
                if (resultCotizacion.data[0]?.porcentajeruta !== undefined) {
                  setPorcentajeRuta(resultCotizacion.data[0].porcentajeruta.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajereembolsos !== undefined) {
                  setPorcentajeReembolsos(resultCotizacion.data[0].sporcentajereembolsos.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajetarjeta !== undefined) {
                  setPorcentajeTarjeta(resultCotizacion.data[0].sporcentajetarjeta.toString())
                }
                if (resultCotizacion.data[0]?.sporcentajeenvio !== undefined) {
                  setPorcentajeEnvio(resultCotizacion.data[0].sporcentajeenvio.toString())
                }
              }

              if (resultOptima25.success && resultOptima25.data) {
                setProductoXClienteOptimo25(resultOptima25.data[0] || null)
              }

              if (resultOptima30.success && resultOptima30.data) {
                setProductoXClienteOptimo30(resultOptima30.data[0] || null)
              }
            }
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
              <div className="flex flex-row">
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200 flex-shrink-0">
                  <img
                    src={producto.imgurl || "/placeholder.svg?height=200&width=200&text=Producto"}
                    alt={producto.nombre}
                    className="h-[200px] w-auto"
                  />
                </div>

                <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-sky-700 border-b pb-1">Información Básica</h3>
                    <div className="space-y-1 text-sm">
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
                      <div>
                        <span className="font-semibold text-sky-700">Cliente:</span>
                        <span className="ml-2 text-gray-900">{producto.clientes?.nombre || "Sin cliente"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Zona:</span>
                        <span className="ml-2 text-gray-900">{producto.zonas?.nombre || "Sin zona"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Unidad de Medida:</span>
                        <span className="ml-2 text-gray-900">
                          {producto.unidadesmedida?.descripcion || "Sin unidad"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-sky-700">Estatus:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                            producto.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-green-700 border-b pb-1">Composición y Costo</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-green-700">MP:</span>
                        <span className="ml-2 text-gray-900">${(producto.mp || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">ME:</span>
                        <span className="ml-2 text-gray-900">${(producto.me || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">MS:</span>
                        <span className="ml-2 text-gray-900">${(producto.ms || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">Costo:</span>
                        <span className="ml-2 text-gray-900">${producto.costo?.toFixed(6) || "0.000000"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-purple-700 border-b pb-1">Porcentajes</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-purple-700">MP %:</span>
                        <span className="ml-2 text-gray-900">{((producto.mp_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">ME %:</span>
                        <span className="ml-2 text-gray-900">{((producto.me_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">MS %:</span>
                        <span className="ml-2 text-gray-900">{((producto.ms_porcentaje || 0) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-amber-700 border-b pb-1">Costos en Moneda</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold text-amber-700">MP $:</span>
                        <span className="ml-2 text-gray-900">${(producto.mp_costeado || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">ME $:</span>
                        <span className="ml-2 text-gray-900">${(producto.me_costeado || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">MS $:</span>
                        <span className="ml-2 text-gray-900">${(producto.ms_costeado || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Precio Healthy Lab:</span>
                        <span className="ml-2 text-gray-900">${(producto.preciohl || 0).toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-amber-700">Utilidad:</span>
                        <span className="ml-2 text-gray-900">${(producto.utilidadhl || 0).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 border-b border-gray-200">
            {/*<button
              onClick={() => setActiveTab("caracteristicas")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "caracteristicas"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Características
            </button>*/}

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
              Material de empaque
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

            {/* <button
              onClick={() => setActiveTab("costeooptimo")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "costeooptimo"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Costeo Optimo
            </button> */}

            {/* <button
              onClick={() => setActiveTab("cotizar")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "cotizar"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cotizar
            </button> */}
          </div>

          {/*{activeTab === "caracteristicas" && (
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
          )}*/}

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

          {activeTab === "materialetiquetado" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Material de Empaque</h2>
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
                                ${materialRel.materialesetiquetado?.costo?.toFixed(6) || "0.000000"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay material de empaque asignado</p>
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
                          <th className="text-left p-3 font-semibold"></th>
                          <th className="text-left p-3 font-semibold">Tipo</th>
                          <th className="text-left p-3 font-semibold">Código</th>
                          <th className="text-left p-3 font-semibold">Nombre</th>
                          <th className="text-left p-3 font-semibold">Costo</th>
                          <th className="text-left p-3 font-semibold">Unidad de Medida</th>
                          <th className="text-left p-3 font-semibold text-green-600 border-l-2 border-gray-300">
                            Cantidad
                          </th>
                          <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Formulas */}
                        {producto.formulasxproducto?.map((formulaRel, index) => (
                          <tr key={`formula-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <Flask className="h-5 w-5 text-blue-600" />
                            </td>
                            <td className="p-3">Fórmula</td>
                            <td className="p-3">{formulaRel.formulas?.codigo || "N/A"}</td>
                            <td className="p-3">{formulaRel.formulas?.nombre || "N/A"}</td>
                            <td className="p-3">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                            <td className="p-3">{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</td>
                            <td className="p-3 text-green-600 border-l-2 border-gray-300">
                              {formulaRel.cantidad || 0}
                            </td>
                            <td className="p-3 text-green-600">${formulaRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                          </tr>
                        ))}

                        {/* Material de Etiquetado */}
                        {producto.materialesetiquetadoxproducto?.map((materialRel, index) => (
                          <tr key={`material-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <Package className="h-5 w-5 text-orange-600" />
                            </td>
                            <td className="p-3">Material de empaque</td>
                            <td className="p-3">{materialRel.materialesetiquetado?.codigo || "N/A"}</td>
                            <td className="p-3">{materialRel.materialesetiquetado?.nombre || "N/A"}</td>
                            <td className="p-3">
                              ${materialRel.materialesetiquetado?.costo?.toFixed(6) || "0.000000"}
                            </td>
                            <td className="p-3">
                              {materialRel.materialesetiquetado?.unidadesmedida?.descripcion || "N/A"}
                            </td>
                            <td className="p-3 text-green-600 border-l-2 border-gray-300">
                              {materialRel.cantidad || 0}
                            </td>
                            <td className="p-3 text-green-600">
                              ${materialRel.costoparcial?.toFixed(6) || "0.000000"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t-2 border-blue-500 mt-4 pt-4 flex justify-end">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MP:</span>
                            <span>${(producto.mp || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">ME:</span>
                            <span>${(producto.me || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MS:</span>
                            <span>${(producto.ms || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-bold">Costo:</span>
                            <span className="text-green-600">${(producto.costo || 0).toFixed(6)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MP %:</span>
                            <span>{((producto.mp_porcentaje || 0) * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">ME %:</span>
                            <span>{((producto.me_porcentaje || 0) * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MS %:</span>
                            <span>{((producto.ms_porcentaje || 0) * 100).toFixed(2)}%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MP Costo:</span>
                            <span>${(producto.mp_costeado || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">ME Costo:</span>
                            <span>${(producto.me_costeado || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-semibold">MS Costo:</span>
                            <span>${(producto.ms_costeado || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-bold">Precio Healthy Lab:</span>
                            <span className="text-green-600">${(producto.preciohl || 0).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-bold">Utilidad:</span>
                            <span className="text-green-600">${(producto.utilidadhl || 0).toFixed(6)}</span>
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

          {activeTab === "costeo" && (
            <>
              {productoXCliente ? (
                <>
                  <Card className="rounded-xs border bg-card text-card-foreground shadow">
                    <CardHeader>
                      <CardTitle>Calculo del Producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <label
                          htmlFor="txtfechamodificacion"
                          className="justify-Right text-sm font-medium text-righ mb-2"
                        >
                          Fecha Ultima Modificacion: {productoXCliente.sfechaultimamodificacion}
                        </label>

                        <div className="mb-6 mt-4">
                          <h4 className="text-sm font-semibold mb-3 text-gray-700">Configuración de Porcentajes</h4>
                        </div>

                        <table className="w-full border-collapse">
                          <thead>
                            {/*<tr className="bg-gray-100 text-xs">
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[130px]">
                                % Generacional
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[90px]">
                                % Nivel
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                % Infinito
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                % IVA
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                CDA
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                % Bono Rápido
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[120px]">
                                % Constructor
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                % Ruta
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[120px]">
                                % Reembolsos
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                % Tarjeta
                              </th>
                              <th className="border p-2 text-left font-semibold bg-blue-500 text-white w-[100px]">
                                Envio
                              </th>
                            </tr>
                            <tr>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeGeneracional}
                                  onChange={(e) => setPorcentajeGeneracional(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeNivel}
                                  onChange={(e) => setPorcentajeNivel(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeInfinito}
                                  onChange={(e) => setPorcentajeInfinito(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeIva}
                                  onChange={(e) => setPorcentajeIva(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeCDA}
                                  onChange={(e) => setPorcentajeCDA(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeBonoRapido}
                                  onChange={(e) => setPorcentajeBonoRapido(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeConstructor}
                                  onChange={(e) => setPorcentajeConstructor(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeRuta}
                                  onChange={(e) => setPorcentajeRuta(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeReembolsos}
                                  onChange={(e) => setPorcentajeReembolsos(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeTarjeta}
                                  onChange={(e) => setPorcentajeTarjeta(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="border p-1">
                                <Input
                                  type="text"
                                  step="0.01"
                                  value={porcentajeEnvio}
                                  onChange={(e) => setPorcentajeEnvio(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </td>
                            </tr>*/}
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Plan Generacional
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Plan Nivel
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Plan Infinito
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Iva Pagado
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">CDA</th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Bono Inicio Rapido
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Constructor Inicio Rapido
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Ruta Exito
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Reembolsos
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Tarjeta Credito
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Envio
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                Costo Producto
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                % Costo
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">
                                Total Costos
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                Utilidad Marginal
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                Precio Actual % Utilidad
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.splangeneracional?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.splannivel?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.splaninfinito?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sivapagado?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">${productoXCliente.scda?.toFixed(2) || "0.00"}</td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sbonoiniciorapido?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sconstructoriniciorapido?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.srutaexito?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sreembolsos?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.starjetacredito?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">${productoXCliente.senvio?.toFixed(2) || "0.00"}</td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.spreciohl?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                {productoXCliente.sporcentajecosto?.toFixed(2) || "0.00"}%
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.stotalcostos?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sutilidadmarginal?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                {productoXCliente.sprecioactualporcentajeutilidad?.toFixed(2) || "0.00"}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {productoXClienteOptimo25 && (
                    <Card className="rounded-xs border bg-card text-card-foreground shadow">
                      <CardHeader>
                        <CardTitle>Costeo Óptimo 25%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Utilidad Óptima Minima
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  % Comisiones
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  % Costo
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  Comisiones + costo
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Sin IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Con IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Meta
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                  Precio Meta Con IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                  Diferencia Utilidad Minima
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo25.sutilidadoptima?.toFixed(2) || "0.00"}%
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo25.scomisiones_porcentaje
                                    ? (productoXClienteOptimo25.scomisiones_porcentaje * 100).toFixed(2)
                                    : "0.00"}
                                  %
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo25.scosto_porcentaje
                                    ? (productoXClienteOptimo25.scosto_porcentaje * 100).toFixed(2)
                                    : "0.00"}
                                  %
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo25.scomisionesmascosto?.toFixed(2) || "0.00"}%
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXCliente.sprecioventasiniva?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXCliente.sprecioventaconiva?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo25.spreciometa?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo25.spreciometaconiva?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo25.sdiferenciautilidadesperada?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {productoXClienteOptimo30 && (
                    <Card className="rounded-xs border bg-card text-card-foreground shadow">
                      <CardHeader>
                        <CardTitle>Costeo Óptimo 30%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Utilidad Óptima Minima
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  % Comisiones
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  % Costo
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-red-500 text-white">
                                  Comisiones + costo
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Sin IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Con IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                  Precio Meta
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                  Precio Meta Con IVA
                                </th>
                                <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                  Diferencia Utilidad Minima
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo30.sutilidadoptima30?.toFixed(2) || "0.00"}%
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo30.scomisiones_porcentaje30
                                    ? (productoXClienteOptimo30.scomisiones_porcentaje30 * 100).toFixed(2)
                                    : "0.00"}
                                  %
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo30.scosto_porcentaje30
                                    ? (productoXClienteOptimo30.scosto_porcentaje30 * 100).toFixed(2)
                                    : "0.00"}
                                  %
                                </td>
                                <td className="border p-2 text-sm">
                                  {productoXClienteOptimo30.scomisionesmascosto30?.toFixed(2) || "0.00"}%
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXCliente.sprecioventasiniva?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXCliente.sprecioventaconiva?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo30.spreciometa30?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo30.spreciometaconiva30?.toFixed(2) || "0.00"}
                                </td>
                                <td className="border p-2 text-sm">
                                  ${productoXClienteOptimo30.sdiferenciautilidadesperada30?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="rounded-xs border bg-card text-card-foreground shadow">
                    <CardHeader>
                      <CardTitle>Costeo Anual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left text-sm font-semibold bg-red-800 text-white">
                                Costo Anual
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-green-500 text-white">
                                Utilidad Anual
                              </th>
                              <th className="border p-2 text-left text-sm font-semibold bg-emerald-500 text-white">
                                Costo/Utilidad
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.scostoanual?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                ${productoXCliente.sutilidadanual?.toFixed(2) || "0.00"}
                              </td>
                              <td className="border p-2 text-sm">
                                {productoXCliente.scostoutilidadanual
                                  ? (productoXCliente.scostoutilidadanual * 100).toFixed(2)
                                  : "0.00"}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        const params = new URLSearchParams({
                          productoid: producto.id.toString(),
                          clienteid: producto.clienteid?.toString() || "",
                          zonaid: producto.zonaid?.toString() || "",
                        })
                        router.push(`/costear?${params.toString()}`)
                      }}
                    >
                      Modificar Costeo
                    </Button>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500">
                      No hay información de costeo disponible para este producto. El producto debe estar relacionado con
                      un cliente y zona para mostrar el costeo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
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

                {/*<Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => router.push(`/productos/${productoId}/eliminar`)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>*/}
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
