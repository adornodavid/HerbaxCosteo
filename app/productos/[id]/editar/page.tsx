"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type { Cliente } from "@/types/clientes"
import type { Formula } from "@/types/formulas"
import type { oProducto } from "@/types/productos"
import type { ddlItem } from "@/types/common"
import type {
  propsPageLoadingScreen,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
  propsPageModalValidation, // Declare the variable here
} from "@/types/common"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs } from "@/lib/config"
// -- Componentes --
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalError } from "@/components/page-modal-error"
import { PageModalAlert } from "@/components/page-modal-alert"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerProductos, actualizarProducto, recalcularProducto } from "@/app/actions/productos"
import { obtenerClientes } from "@/app/actions/clientes"
import {
  obtenerFormulas,
  listaDesplegableFormulasBuscar,
  crearFormulaXProducto,
  eliminarFormulaXProducto,
} from "@/app/actions/formulas"
import {
  listaDesplegableMaterialesEtiquetadosBuscar,
  crearMaterialEtiquetadoXProducto,
  eliminarMaterialEtiquetadoXProducto,
} from "@/app/actions/material-etiquetado"
import { listaDesplegableUnidadesMedida } from "@/app/actions/catalogos"
import { listDesplegableZonas } from "@/app/actions/zonas"
// -- Backend --
import { createClient } from "@/lib/supabase/client"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function EditarProductoPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const productoId = Number(params.id)

  // --- Estados ---
  // Cargar contenido en variables
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [zonas, setZonas] = useState<ddlItem[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<ddlItem[]>([])
  const [activeTab, setActiveTab] = useState<"informacion" | "caracteristicas" | "elaboracion" | "cotizacion">(
    "informacion",
  )
  const [producto, setProducto] = useState<oProducto | null>(null)

  const [formulaBuscar, setFormulaBuscar] = useState("")
  const [formulasResultados, setFormulasResultados] = useState<ddlItem[]>([])
  const [formulaSeleccionada, setFormulaSeleccionada] = useState<{
    id: number
    codigo: string
    nombre: string
    unidadmedida: string
    costo: number
  } | null>(null)
  const [formulaCantidad, setFormulaCantidad] = useState("")
  const [showFormulasDropdown, setShowFormulasDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formulaToDelete, setFormulaToDelete] = useState<{ formulaid: number; nombre: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const formulaSearchRef = useRef<HTMLDivElement>(null)

  const [materialEtiquetadoBuscar, setMaterialEtiquetadoBuscar] = useState("")
  const [materialesEtiquetadoResultados, setMaterialesEtiquetadoResultados] = useState<any[]>([])
  const [materialEtiquetadoSeleccionado, setMaterialEtiquetadoSeleccionado] = useState<{
    id: number
    codigo: string
    nombre: string
    unidadmedida: string
    costo: number
  } | null>(null)
  const [materialEtiquetadoCantidad, setMaterialEtiquetadoCantidad] = useState("")
  const [showMaterialesEtiquetadoDropdown, setShowMaterialesEtiquetadoDropdown] = useState(false)
  const [showDeleteMaterialEtiquetadoModal, setShowDeleteMaterialEtiquetadoModal] = useState(false)
  const [materialEtiquetadoToDelete, setMaterialEtiquetadoToDelete] = useState<{
    materialetiquetadoid: number
    nombre: string
  } | null>(null)
  const [showAddMaterialEtiquetadoModal, setShowAddMaterialEtiquetadoModal] = useState(false)
  const materialEtiquetadoSearchRef = useRef<HTMLDivElement>(null)

  // Mostrar/Ocultar contenido
  const [isLoading, setIsLoading] = useState(true)
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    clienteid: "",
    zonaid: "",
  })

  useEffect(() => {
    const cargarCatalogos = async () => {
      // Cargar unidades de medida
      const unidadesResult = await listaDesplegableUnidadesMedida()
      if (unidadesResult.success && unidadesResult.data) {
        setUnidadesMedida(unidadesResult.data)
      }
    }
    cargarCatalogos()
  }, [])

  useEffect(() => {
    const cargarZonas = async () => {
      if (formData.clienteid && formData.clienteid !== "") {
        const zonasResult = await listDesplegableZonas(-1, "", Number(formData.clienteid))
        if (zonasResult.success && zonasResult.data) {
          setZonas(zonasResult.data)
        }
      }
    }
    cargarZonas()
  }, [formData.clienteid])

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || "",
        codigo: producto.codigo || "",
        clienteid: producto.clienteid?.toString() || "",
        zonaid: producto.zonaid?.toString() || "",
      })
      setExistingImageUrl(producto.imgurl || "")
      setImagePreview(producto.imgurl || null)
    }
  }, [producto])

  useEffect(() => {
    const buscarFormulas = async () => {
      if (formulaBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableFormulasBuscar(formulaBuscar)
        setFormulasResultados(resultados)
        setShowFormulasDropdown(true)
      } else {
        setFormulasResultados([])
        setShowFormulasDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarFormulas, 300)
    return () => clearTimeout(timeoutId)
  }, [formulaBuscar])

  useEffect(() => {
    const buscarMaterialesEtiquetado = async () => {
      if (materialEtiquetadoBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(materialEtiquetadoBuscar)
        setMaterialesEtiquetadoResultados(resultados)
        setShowMaterialesEtiquetadoDropdown(true)
      } else {
        setMaterialesEtiquetadoResultados([])
        setShowMaterialesEtiquetadoDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMaterialesEtiquetado, 300)
    return () => clearTimeout(timeoutId)
  }, [materialEtiquetadoBuscar])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formulaSearchRef.current && !formulaSearchRef.current.contains(event.target as Node)) {
        setShowFormulasDropdown(false)
      }
      if (materialEtiquetadoSearchRef.current && !materialEtiquetadoSearchRef.current.contains(event.target as Node)) {
        setShowMaterialesEtiquetadoDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // -- Funciones --
  /*
  const handleActualizarCaracteristicas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!producto) {
      setModalError({
        Titulo: "Error",
        Mensaje: "No se ha cargado la información del producto",
      })
      setShowModalError(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Execute first function: recalculoproductoporcentaje
      const { data: data1, error: error1 } = await supabase.rpc("recalculoproductoporcentaje", {
        productosid: producto.id,
        clientesid: producto.clienteid,
        mpporcentaje: producto.mp_porcentaje,
        meporcentaje: producto.me_porcentaje,
        msporcentaje: producto.ms_porcentaje,
      })

      if (error1) {
        throw new Error(`Error en recalculoproductoporcentaje: ${error1.message}`)
      }

      // Execute second function: recalcularcosteopreciohl
      const { data: data2, error: error2 } = await supabase.rpc("recalcularcosteopreciohl", {
        productosid: producto.id,
        clientesid: producto.clienteid,
      })

      if (error2) {
        throw new Error(`Error en recalcularcosteopreciohl: ${error2.message}`)
      }

      // Refresh product data
      await cargarDatosIniciales()

      setShowProcessing(false)
      setModalAlert({
        Titulo: "Éxito",
        Mensaje: "Características actualizadas exitosamente",
      })
      setShowModalAlert(true)
    } catch (error) {
      setShowProcessing(false)
      setModalError({
        Titulo: "Error al actualizar características",
        Mensaje: String(error),
      })
      setShowModalError(true)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  */

  const ejecutarActualizacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Variables necesarias para el proceso
    const formDataToSend = new FormData(e.currentTarget)
    const nombre = formDataToSend.get("nombre") as string
    const codigo = formDataToSend.get("codigo") as string

    // Validar variables obligatorias
    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "Completa los datos obligatorios, no se pueden quedar en blanco.",
      })
      setShowModalValidation(true)
      return
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await actualizarProducto(formDataToSend)

      if (result.success) {
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setShowProcessing(false)
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Producto actualizado y recalculado exitosamente",
          })
          setShowModalAlert(true)

          await cargarDatosIniciales()
          // Force page refresh with new data
          router.refresh()
        } else {
          setShowProcessing(false)
          setModalError({
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "Error desconocido",
          })
          setShowModalError(true)
        }
      } else {
        setShowProcessing(false)
        setModalError({
          Titulo: "Error al actualizar producto",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      setModalError({
        Titulo: "Error inesperado al actualizar producto",
        Mensaje: String(error),
      })
      setShowModalError(true)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormulaSelect = async (formulaId: string, formulaText: string) => {
    setFormulaBuscar(formulaText)
    setShowFormulasDropdown(false)

    // Get formula details
    const formulasResult = await obtenerFormulas(Number(formulaId), "", "", "True", -1, -1)
    if (formulasResult.success && formulasResult.data && formulasResult.data.length > 0) {
      const formula = formulasResult.data[0]
      setFormulaSeleccionada({
        id: formula.id,
        codigo: formula.codigo || "",
        nombre: formula.nombre || "",
        unidadmedida: formula.unidadesmedida?.descripcion || "",
        costo: formula.costo || 0,
      })
    }
  }

  const handleAgregarFormula = () => {
    // Validate formula selected
    if (!formulaSeleccionada) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe seleccionar una fórmula para proceder.",
      })
      setShowModalAlert(true)
      return
    }

    // Validate cantidad
    if (!formulaCantidad || Number(formulaCantidad) <= 0) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe agregar una cantidad válida para proceder.",
      })
      setShowModalAlert(true)
      return
    }

    // Show confirmation modal
    setShowAddModal(true)
  }

  const confirmarAgregarFormula = async () => {
    setShowAddModal(false)
    setShowProcessing(true)

    try {
      const result = await crearFormulaXProducto(formulaSeleccionada!.id, productoId, Number(formulaCantidad))

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Fórmula agregada exitosamente",
        })
        setShowModalAlert(true)

        // Reset form
        setFormulaBuscar("")
        setFormulaSeleccionada(null)
        setFormulaCantidad("")

        // Reload product data
        await cargarDatosIniciales()
      } else {
        setModalError({
          Titulo: "Error al agregar fórmula",
          Mensaje: result.error || "Error desconocido",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: String(error),
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
    }
  }

  const handleEliminarFormula = (formulaid: number, nombre: string) => {
    setFormulaToDelete({ formulaid, nombre })
    setShowDeleteModal(true)
  }

  const confirmarEliminarFormula = async () => {
    if (!formulaToDelete) return

    setShowDeleteModal(false)
    setShowProcessing(true)

    try {
      const result = await eliminarFormulaXProducto(formulaToDelete.formulaid, productoId)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Fórmula eliminada exitosamente",
        })
        setShowModalAlert(true)

        // Reload product data
        await cargarDatosIniciales()
      } else {
        setModalError({
          Titulo: "Error al eliminar fórmula",
          Mensaje: result.error || "Error desconocido",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: String(error),
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
      setFormulaToDelete(null)
    }
  }

  const handleMaterialEtiquetadoSelect = (material: any) => {
    setMaterialEtiquetadoBuscar(`${material.codigo} - ${material.nombre}`)
    setShowMaterialesEtiquetadoDropdown(false)
    setMaterialEtiquetadoSeleccionado({
      id: material.id,
      codigo: material.codigo || "",
      nombre: material.nombre || "",
      unidadmedida: material.unidadesmedida?.descripcion || "",
      costo: material.costo || 0,
    })
  }

  const handleAgregarMaterialEtiquetado = () => {
    // Validate material etiquetado selected
    if (!materialEtiquetadoSeleccionado) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe seleccionar un material de etiquetado para proceder.",
      })
      setShowModalAlert(true)
      return
    }

    // Validate cantidad
    if (!materialEtiquetadoCantidad || Number(materialEtiquetadoCantidad) <= 0) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe agregar una cantidad válida para proceder.",
      })
      setShowModalAlert(true)
      return
    }

    // Show confirmation modal
    setShowAddMaterialEtiquetadoModal(true)
  }

  const confirmarAgregarMaterialEtiquetado = async () => {
    setShowAddMaterialEtiquetadoModal(false)
    setShowProcessing(true)

    try {
      const costoparcial = Number(materialEtiquetadoCantidad) * materialEtiquetadoSeleccionado!.costo
      const result = await crearMaterialEtiquetadoXProducto(
        materialEtiquetadoSeleccionado!.id,
        productoId,
        Number(materialEtiquetadoCantidad),
      )

      console.log("result", result.data)

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Material de etiquetado agregado exitosamente",
        })
        setShowModalAlert(true)

        // Reset form
        setMaterialEtiquetadoBuscar("")
        setMaterialEtiquetadoSeleccionado(null)
        setMaterialEtiquetadoCantidad("")

        // Reload product data
        await cargarDatosIniciales()
      } else {
        setModalError({
          Titulo: "Error al agregar material de etiquetado",
          Mensaje: result.error || "Error desconocido",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: String(error),
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
    }
  }

  const handleEliminarMaterialEtiquetado = (materialetiquetadoid: number, nombre: string) => {
    setMaterialEtiquetadoToDelete({ materialetiquetadoid, nombre })
    setShowDeleteMaterialEtiquetadoModal(true)
  }

  const confirmarEliminarMaterialEtiquetado = async () => {
    if (!materialEtiquetadoToDelete) return

    setShowDeleteMaterialEtiquetadoModal(false)
    setShowProcessing(true)

    try {
      const result = await eliminarMaterialEtiquetadoXProducto(
        materialEtiquetadoToDelete.materialetiquetadoid,
        productoId,
      )

      if (result.success) {
        setModalAlert({
          Titulo: "Éxito",
          Mensaje: "Material de etiquetado eliminado exitosamente",
        })
        setShowModalAlert(true)

        // Reload product data
        await cargarDatosIniciales()
      } else {
        setModalError({
          Titulo: "Error al eliminar material de etiquetado",
          Mensaje: result.error || "Error desconocido",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: String(error),
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
      setMaterialEtiquetadoToDelete(null)
    }
  }

  // -- Carga inicial --
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      // Ejecutar funcion de busqueda para carga inicial
      const cargarDatos = async () => {
        try {
          setShowPageLoading(true)

          // Cargar clientes
          const clientesResult = await obtenerClientes(-1, "", "", "", "", "", "True")
          if (clientesResult.success && clientesResult.data) {
            setClientes(clientesResult.data)
          }

          // Cargar formulas
          const formulasResult = await obtenerFormulas(-1, "", "", "True", -1, -1)
          if (formulasResult.success && formulasResult.data) {
            setFormulas(formulasResult.data)
          }

          // Cargar producto
          const result = await obtenerProductos(productoId, "", -1, -1, -1, "Todos")
          if (result.success && result.data && result.data.length > 0) {
            const oProductoData: oProducto = result.data[0]
            setProducto(oProductoData)

            // Retorno de información
            return { success: true, mensaje: "Se ejecuto correctamente cada proceso." }
          } else {
            // Retorno de información
            return { success: false, mensaje: "No hay datos o la consulta falló." }
          }
        } catch (error) {
          console.error("Error cargando datos del producto:", error)
          setModalError({
            Titulo: "Error al cargar producto",
            Mensaje: "Ocurrió un error al cargar los datos del producto",
          })
          setShowModalError(true)
        } finally {
          setShowPageLoading(false)
        }
      }

      await cargarDatos()
    } catch (error) {
      console.error("Error al cargar datos iniciales: ", error)
      setModalError({
        Titulo: "Error al cargar datos iniciales",
        Mensaje: String(error),
      })
      setShowModalError(true)
    } finally {
      setShowPageLoading(false)
    }
  }

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    // Validar
    if (!user || user.RolId === 0) {
      router.push("/login")
      return
    }
    // Iniciar
    const inicializar = async () => {
      setPageLoading({ message: "Cargando Producto..." })
      setShowPageLoading(true)
      await cargarDatosIniciales()
    }
    if (productoId) {
      inicializar()
    } else {
      setModalError({
        Titulo: "Error en el inicio",
        Mensaje: "El id del producto no se establecio.",
      })
      setShowModalError(true)
    }
  }, [authLoading, user, router, esAdminDOs, productoId])

  // Manejadores (Handles)
  // Manejador: Cambiar imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(existingImageUrl || null)
    }
  }

  // Manejador cambio de input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejador cambio de select
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // --- Renders ---
  // Contenidos auxiliares
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

  // Si no se cargo el elemento principal
  if (!esAdminDOs) {
    return (
      <div className="container mx-auto py-6">
        <p>
          No tiene permisos para utilizar esta herramienta, si necesita ayuda solicitela con el personal encargado del
          sitio.
        </p>
      </div>
    )
  }

  // Contenido principal
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageProcessing isOpen={showProcessing} />

      {showModalValidation && (
        <PageModalValidation
          Titulo={ModalValidation?.Titulo || ""}
          Mensaje={ModalValidation?.Mensaje || ""}
          isOpen={true}
          onClose={() => setShowModalValidation(false)}
        />
      )}

      {showModalError && (
        <PageModalError
          Titulo={ModalError?.Titulo || ""}
          Mensaje={ModalError?.Mensaje || ""}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

      {showModalAlert && (
        <PageModalAlert
          Titulo={ModalAlert?.Titulo || ""}
          Mensaje={ModalAlert?.Mensaje || ""}
          isOpen={true}
          onClose={() => setShowModalAlert(false)}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">
              ¿Está seguro que desea eliminar la fórmula <strong>{formulaToDelete?.nombre}</strong> del producto?
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmarEliminarFormula}>
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Agregar Fórmula</h3>
            <p className="mb-6">
              ¿Está seguro que desea agregar la fórmula <strong>{formulaSeleccionada?.nombre}</strong> con cantidad{" "}
              <strong>{formulaCantidad}</strong> al producto?
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmarAgregarFormula}>
                Sí, Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMaterialEtiquetadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">
              ¿Está seguro que desea eliminar el material de etiquetado{" "}
              <strong>{materialEtiquetadoToDelete?.nombre}</strong> del producto?
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteMaterialEtiquetadoModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmarEliminarMaterialEtiquetado}>
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddMaterialEtiquetadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Agregar Material Etiquetado</h3>
            <p className="mb-6">
              ¿Está seguro que desea agregar el material de etiquetado{" "}
              <strong>{materialEtiquetadoSeleccionado?.nombre}</strong> con cantidad{" "}
              <strong>{materialEtiquetadoCantidad}</strong> al producto?
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowAddMaterialEtiquetadoModal(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={confirmarAgregarMaterialEtiquetado}
              >
                Sí, Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageTitlePlusNew
        Titulo="Actualización de producto"
        Subtitulo="Formulario para actualizar un producto"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("informacion")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "informacion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Información
        </button>
        {/*
        <button
          type="button"
          onClick={() => setActiveTab("caracteristicas")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "caracteristicas"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Características
        </button>
        */}
        {/* </CHANGE> */}
        <button
          type="button"
          onClick={() => setActiveTab("elaboracion")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "elaboracion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Elaboración
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cotizacion")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "cotizacion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Costeo
        </button>
      </div>

      {activeTab === "informacion" && (
        <Card>
          <CardContent className="pt-6">
            <form id="formInformacion" onSubmit={ejecutarActualizacion} className="space-y-4">
              <input type="hidden" name="productoid" value={productoId} />
              {/* </CHANGE> */}

              <input type="hidden" name="id" value={productoId} />

              {existingImageUrl && <input type="hidden" name="imgurl" value={existingImageUrl} />}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: All inputs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="txtNombre">
                      <span className="text-red-500">*</span> Nombre
                    </Label>
                    <Input
                      id="txtNombre"
                      name="nombre"
                      type="text"
                      placeholder="Ingrese el nombre del producto"
                      value={formData.nombre}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtCodigo">
                      <span className="text-red-500">*</span> Código
                    </Label>
                    <Input
                      id="txtCodigo"
                      name="codigo"
                      type="text"
                      placeholder="Código del producto"
                      value={formData.codigo}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlCliente">
                      <span className="text-red-500">*</span> Cliente
                    </Label>
                    <Select
                      name="clienteid"
                      value={formData.clienteid}
                      onValueChange={(value) => handleSelectChange("clienteid", value)}
                    >
                      <SelectTrigger id="ddlCliente">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlZona">Zona</Label>
                    <Select
                      name="zonaid"
                      value={formData.zonaid}
                      onValueChange={(value) => handleSelectChange("zonaid", value)}
                    >
                      <SelectTrigger id="ddlZona">
                        <SelectValue placeholder="Selecciona una zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonas.map((zona) => (
                          <SelectItem key={zona.value} value={zona.value}>
                            {zona.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageImg">Imagen</Label>
                    <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>
                </div>

                {/* Right column: Image preview only */}
                <div className="space-y-2">
                  <Label>Previsualización de Imagen</Label>
                  <div className="border rounded-md flex items-center justify-center bg-muted max-h-[350px] h-[350px]">
                    {imagePreview ? (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-auto object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin imagen seleccionada</span>
                    )}
                  </div>
                </div>
              </div>

              {producto && (
                <>
                  <Card className="rounded-xs border bg-card text-card-foreground shadow mt-6">
                    <CardContent className="p-0">
                      <div className="flex flex-row">
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-200 flex-shrink-0">
                          <img
                            src={producto.imgurl || "/placeholder.svg?height=200&width=200&text=Producto"}
                            alt={producto.nombre || "Producto"}
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
                                <span className="ml-2 text-gray-900">{producto.mp || "0"}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-green-700">ME:</span>
                                <span className="ml-2 text-gray-900">{producto.me || "0"}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-green-700">MS:</span>
                                <span className="ml-2 text-gray-900">{producto.ms || "0"}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-green-700">Costo de elaboración:</span>
                                <span className="ml-2 text-gray-900">${producto.costo?.toFixed(2) || "0.00"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-lg text-purple-700 border-b pb-1">Porcentajes</h3>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-semibold text-purple-700">MP %:</span>
                                <span className="ml-2 text-gray-900">
                                  {((producto.mp_porcentaje || 0) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-purple-700">ME %:</span>
                                <span className="ml-2 text-gray-900">
                                  {((producto.me_porcentaje || 0) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-purple-700">MS %:</span>
                                <span className="ml-2 text-gray-900">
                                  {((producto.ms_porcentaje || 0) * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-lg text-amber-700 border-b pb-1">Costos en Moneda</h3>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-semibold text-amber-700">MP $:</span>
                                <span className="ml-2 text-gray-900">${(producto.mp_costeado || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-amber-700">ME $:</span>
                                <span className="ml-2 text-gray-900">${(producto.me_costeado || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-amber-700">MS $:</span>
                                <span className="ml-2 text-gray-900">${(producto.ms_costeado || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-amber-700">Precio Healthy Lab:</span>
                                <span className="ml-2 text-gray-900">${(producto.preciohl || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Información de Costos</h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-3 text-left font-semibold">Tipo</th>
                            <th className="border p-3 text-left font-semibold">Costo</th>
                            <th className="border p-3 text-left font-semibold">Porcentaje</th>
                            <th className="border p-3 text-left font-semibold">Costeado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* MP Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="border p-3 font-medium">MP</td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.mp?.toFixed(2) || "0.00"}</span>
                            </td>
                            <td className="border p-3">
                              <Input
                                type="text"
                                name="mp_porcentaje"
                                value={
                                  producto?.mp_porcentaje ? `${(producto.mp_porcentaje * 100).toFixed(2)}` : "0.00"
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace("%", "")
                                  const numValue = Number.parseFloat(value) / 100
                                  setProducto((prev) => (prev ? { ...prev, mp_porcentaje: numValue } : null))
                                }}
                                className="bg-white"
                              />
                            </td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.mp_costeado?.toFixed(2) || "0.00"}</span>
                            </td>
                          </tr>

                          {/* ME Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="border p-3 font-medium">ME</td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.me?.toFixed(2) || "0.00"}</span>
                            </td>
                            <td className="border p-3">
                              <Input
                                type="text"
                                name="me_porcentaje"
                                value={
                                  producto?.me_porcentaje ? `${(producto.me_porcentaje * 100).toFixed(2)}` : "0.00"
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace("%", "")
                                  const numValue = Number.parseFloat(value) / 100
                                  setProducto((prev) => (prev ? { ...prev, me_porcentaje: numValue } : null))
                                }}
                                className="bg-white"
                              />
                            </td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.me_costeado?.toFixed(2) || "0.00"}</span>
                            </td>
                          </tr>

                          {/* MS Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="border p-3 font-medium">MS</td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.ms?.toFixed(2) || "0.00"}</span>
                            </td>
                            <td className="border p-3">
                              <Input
                                type="text"
                                name="ms_porcentaje"
                                value={
                                  producto?.ms_porcentaje ? `${(producto.ms_porcentaje * 100).toFixed(2)}` : "0.00"
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace("%", "")
                                  const numValue = Number.parseFloat(value) / 100
                                  setProducto((prev) => (prev ? { ...prev, ms_porcentaje: numValue } : null))
                                }}
                                className="bg-white"
                              />
                            </td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.ms_costeado?.toFixed(2) || "0.00"}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {/* </CHANGE> */}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                  Guardar
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/productos")}>
                  Regresar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/*
      {activeTab === "caracteristicas" && (
        <Card>
          <CardContent className="pt-6">
            ... características content ...
          </CardContent>
        </Card>
      )}
      */}
      {/* </CHANGE> */}

      {activeTab === "elaboracion" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agregar Fórmula</h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Formula search input with autocomplete */}
                  <div className="space-y-2 relative" ref={formulaSearchRef}>
                    <Label htmlFor="txtFormula">Fórmula</Label>
                    <Input
                      id="txtFormula"
                      type="text"
                      placeholder="Buscar fórmula..."
                      value={formulaBuscar}
                      onChange={(e) => setFormulaBuscar(e.target.value)}
                      onFocus={() => formulasResultados.length > 0 && setShowFormulasDropdown(true)}
                    />
                    {showFormulasDropdown && formulasResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {formulasResultados.map((formula) => (
                          <button
                            key={formula.value}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleFormulaSelect(formula.value, formula.text)}
                          >
                            {formula.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cantidad input */}
                  <div className="space-y-2">
                    <Label htmlFor="txtCantidad">Cantidad</Label>
                    <Input
                      id="txtCantidad"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formulaCantidad}
                      onChange={(e) => setFormulaCantidad(e.target.value)}
                    />
                  </div>

                  {/* Unidad de medida (disabled, auto-populated) */}
                  <div className="space-y-2">
                    <Label htmlFor="txtUnidadMedida">Unidad de Medida</Label>
                    <Input id="txtUnidadMedida" type="text" value={formulaSeleccionada?.unidadmedida || ""} disabled />
                  </div>

                  {/* Costo (disabled, auto-populated) */}
                  <div className="space-y-2">
                    <Label htmlFor="txtCosto">Costo Unitario</Label>
                    <Input
                      id="txtCosto"
                      type="text"
                      value={formulaSeleccionada ? `$${formulaSeleccionada.costo.toFixed(5)}` : ""}
                      disabled
                    />
                  </div>

                  {/* Agregar button */}
                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAgregarFormula}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fórmulas del Producto</h3>

                {producto?.formulasxproducto && producto.formulasxproducto.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#6DBAC2] text-white">
                          <th className="border p-2 text-left text-sm font-semibold">Código</th>
                          <th className="border p-2 text-left text-sm font-semibold">Nombre</th>
                          <th className="border p-2 text-left text-sm font-semibold">Costo</th>
                          <th className="border p-2 text-left text-sm font-semibold">Unidad de Medida</th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1] font-semibold border-l-2 border-gray-300 ">
                            Cantidad
                          </th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1] ">Costo Parcial</th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1] font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producto.formulasxproducto.map((formulaRel, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{formulaRel.formulas?.codigo || "N/A"}</td>
                            <td className="p-2 text-sm">{formulaRel.formulas?.nombre || "N/A"}</td>
                            <td className="p-2 text-sm">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                            <td className="p-2 text-sm">{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</td>
                            <td className="border-l-2 p-2 text-sm">{formulaRel?.cantidad || "0"}</td>
                            <td className="text-sm">${formulaRel?.costoparcial?.toFixed(6) || "0.000000"}</td>

                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleEliminarFormula(formulaRel.formulaid || 0, formulaRel.formulas?.nombre || "")
                                }
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay fórmulas asignadas a este producto.</p>
                )}
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold mt-20">Agregar Material de Empaque</h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Material Etiquetado search input with autocomplete */}
                  <div className="space-y-2 relative" ref={materialEtiquetadoSearchRef}>
                    <Label htmlFor="txtMaterialEtiquetado">Material de Empaque</Label>
                    <Input
                      id="txtMaterialEtiquetado"
                      type="text"
                      placeholder="Buscar material de empaque..."
                      value={materialEtiquetadoBuscar}
                      onChange={(e) => setMaterialEtiquetadoBuscar(e.target.value)}
                      onFocus={() =>
                        materialesEtiquetadoResultados.length > 0 && setShowMaterialesEtiquetadoDropdown(true)
                      }
                    />
                    {showMaterialesEtiquetadoDropdown && materialesEtiquetadoResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {materialesEtiquetadoResultados.map((material) => (
                          <button
                            key={material.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleMaterialEtiquetadoSelect(material)}
                          >
                            {material.codigo} - {material.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cantidad input */}
                  <div className="space-y-2">
                    <Label htmlFor="txtMECantidad">Cantidad</Label>
                    <Input
                      id="txtMECantidad"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={materialEtiquetadoCantidad}
                      onChange={(e) => setMaterialEtiquetadoCantidad(e.target.value)}
                    />
                  </div>

                  {/* Unidad de medida (disabled, auto-populated) */}
                  <div className="space-y-2">
                    <Label htmlFor="txtMEUnidadMedida">Unidad de Medida</Label>
                    <Input
                      id="txtMEUnidadMedida"
                      type="text"
                      value={materialEtiquetadoSeleccionado?.unidadmedida || ""}
                      disabled
                    />
                  </div>

                  {/* Costo (disabled, auto-populated) */}
                  <div className="space-y-2">
                    <Label htmlFor="txtMECosto">Costo Unitario</Label>
                    <Input
                      id="txtMECosto"
                      type="text"
                      value={
                        // Changed from toFixed(5) to toFixed(6) for 6 decimals
                        materialEtiquetadoSeleccionado ? `$${materialEtiquetadoSeleccionado.costo.toFixed(6)}` : ""
                      }
                      disabled
                    />
                  </div>

                  {/* Agregar button */}
                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAgregarMaterialEtiquetado}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Materiales de Empaque del Producto</h3>

                {producto?.materialesetiquetadoxproducto && producto.materialesetiquetadoxproducto.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#6DBAC2] text-white">
                          <th className="border p-2 text-left text-sm font-semibold">Código</th>
                          <th className="border p-2 text-left text-sm font-semibold">Nombre</th>
                          <th className="border p-2 text-left text-sm font-semibold">Costo</th>
                          <th className="border p-2 text-left text-sm font-semibold">Unidad de Medida</th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1] font-semibold border-l-2 border-gray-300">
                            Cantidad
                          </th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1]">Costo Parcial</th>
                          <th className="border p-2 text-left text-sm bg-[#68BAA1] font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producto.materialesetiquetadoxproducto.map((materialRel, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.codigo || "N/A"}</td>
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.nombre || "N/A"}</td>
                            <td className="p-2 text-sm">
                              ${materialRel.materialesetiquetado?.costo?.toFixed(6) || "0.000000"}
                            </td>
                            <td className="p-2 text-sm">
                              {materialRel.materialesetiquetado?.unidadesmedida?.descripcion || "N/A"}
                            </td>
                            <td className="border-l-2 p-2 text-sm">{materialRel?.cantidad || "0"}</td>
                            <td className="text-sm">${materialRel?.costoparcial?.toFixed(6) || "0.000000"}</td>

                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleEliminarMaterialEtiquetado(
                                    materialRel.materialetiquetadoid || 0,
                                    materialRel.materialesetiquetado?.nombre || "",
                                  )
                                }
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Renamed from "materiales de etiquetado" to "materiales de empaque"
                  <p className="text-gray-500">No hay materiales de empaque asignados a este producto.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
