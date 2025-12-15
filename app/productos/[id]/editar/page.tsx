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
import { Trash2, HelpCircle } from "lucide-react"
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
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { obtenerProductos, actualizarProducto, recalcularProducto } from "@/app/actions/productos"
import { obtenerClientes } from "@/app/actions/clientes"
import {
  listaDesplegableUnidadesMedida,
  listaDesplegableFormasFarmaceuticas,
  listaDesplegableSistemas,
} from "@/app/actions/catalogos"
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
import { listDesplegableZonas } from "@/app/actions/zonas"

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
  const [modalSuccess, setModalSuccess] = useState<propsPageModalAlert>()
  // </CHANGE>
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [zonas, setZonas] = useState<ddlItem[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<ddlItem[]>([])
  const [formasFarmaceuticas, setFormasFarmaceuticas] = useState<ddlItem[]>([])
  const [sistemas, setSistemas] = useState<ddlItem[]>([])
  // </CHANGE>
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
    tipomaterialid: number // Add tipomaterialid here
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

  const [materialEnvaseBuscar, setMaterialEnvaseBuscar] = useState("")
  const [materialesEnvaseResultados, setMaterialesEnvaseResultados] = useState<any[]>([])
  const [materialEnvaseSeleccionado, setMaterialEnvaseSeleccionado] = useState<{
    id: number
    codigo: string
    nombre: string
    unidadmedida: string
    costo: number
    tipomaterialid: number
  } | null>(null)
  const [materialEnvaseCantidad, setMaterialEnvaseCantidad] = useState("")
  const [materialEnvaseCostoUnitario, setMaterialEnvaseCostoUnitario] = useState("") // Added
  const [materialEnvaseUnidadMedida, setMaterialEnvaseUnidadMedida] = useState("") // Added
  const [showMaterialesEnvaseDropdown, setShowMaterialesEnvaseDropdown] = useState(false)
  const [showDeleteMaterialEnvaseModal, setShowDeleteMaterialEnvaseModal] = useState(false)
  const [materialEnvaseToDelete, setMaterialEnvaseToDelete] = useState<{
    materialetiquetadoid: number
    nombre: string
  } | null>(null)
  const [showAddMaterialEnvaseModal, setShowAddMaterialEnvaseModal] = useState(false)
  const materialEnvaseSearchRef = useRef<HTMLDivElement>(null)
  // </CHANGE>

  // Mostrar/Ocultar contenido
  const [isLoading, setIsLoading] = useState(true)
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [showModalSuccess, setShowModalSuccess] = useState(false) // Added state for success modal
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)

  const [showCosteoRedirectModal, setShowCosteoRedirectModal] = useState(false)
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false)
  // </CHANGE>

  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    clienteid: "",
    zonaid: "",
    producto: "",
    formafarmaceuticaid: "",
    porcion: "",
    sistemaid: "",
    codigomaestro: "",
    envase: "",
    envaseml: "",
    categoria: "",
    unidadmedidaid: "",
    // </CHANGE>
  })

  const [zonasLoaded, setZonasLoaded] = useState(false)

  useEffect(() => {
    const cargarCatalogos = async () => {
      console.log("[v0] Cargando catálogos...")
      try {
        const [unidadesResult, formasResult, sistemasResult] = await Promise.all([
          listaDesplegableUnidadesMedida(),
          listaDesplegableFormasFarmaceuticas(),
          listaDesplegableSistemas(),
        ])

        console.log("[v0] Unidades de medida:", unidadesResult)
        console.log("[v0] Formas farmacéuticas:", formasResult)
        console.log("[v0] Sistemas:", sistemasResult)

        if (unidadesResult.success && unidadesResult.data) {
          setUnidadesMedida(unidadesResult.data)
        }
        if (formasResult.success && formasResult.data) {
          setFormasFarmaceuticas(formasResult.data)
        }
        if (sistemasResult.success && sistemasResult.data) {
          setSistemas(sistemasResult.data)
        }
      } catch (error) {
        console.error("[v0] Error al cargar catálogos:", error)
        setModalError({
          Titulo: "Error al cargar catálogos",
          Mensaje: "Ocurrió un error al cargar las listas desplegables.",
        })
        setShowModalError(true)
      }
    }
    cargarCatalogos()
  }, [])

  useEffect(() => {
    const cargarZonas = async () => {
      if (producto?.clienteid) {
        setZonasLoaded(false)
        const zonasResult = await listDesplegableZonas(-1, "", Number(producto.clienteid))
        if (zonasResult.success && zonasResult.data) {
          setZonas(zonasResult.data)
        }
        setZonasLoaded(true)
      }
    }
    cargarZonas()
  }, [producto?.clienteid])

  useEffect(() => {
    if (producto && zonasLoaded) {
      setFormData({
        nombre: producto.nombre || "",
        codigo: producto.codigo || "",
        clienteid: producto.clienteid?.toString() || "",
        zonaid: producto.zonaid?.toString() || "",
        producto: producto.producto || "",
        formafarmaceuticaid: producto.formafarmaceuticaid?.toString() || "",
        porcion: producto.porcion || "",
        sistemaid: producto.sistemaid?.toString() || "",
        codigomaestro: producto.codigomaestro || "",
        envase: producto.envase || "",
        envaseml: producto.envaseml || "",
        categoria: producto.categoria || "",
        unidadmedidaid: producto.unidadmedidaid?.toString() || "",
        // </CHANGE>
      })
      setExistingImageUrl(producto.imgurl || "")
      setImagePreview(producto.imgurl || null)
    }
  }, [producto, zonasLoaded])

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
        const materialesFiltrados = resultados.filter((m) => m.tipomaterialid === 1)
        setMaterialesEtiquetadoResultados(materialesFiltrados)
        setShowMaterialesEtiquetadoDropdown(materialesFiltrados.length > 0)
        // </CHANGE>
      } else {
        setMaterialesEtiquetadoResultados([])
        setShowMaterialesEtiquetadoDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMaterialesEtiquetado, 300)
    return () => clearTimeout(timeoutId)
  }, [materialEtiquetadoBuscar])

  useEffect(() => {
    const buscarMaterialesEnvase = async () => {
      if (materialEnvaseBuscar.trim().length >= 2) {
        const resultados = await listaDesplegableMaterialesEtiquetadosBuscar(materialEnvaseBuscar)
        const materialesFiltrados = resultados.filter((m) => m.tipomaterialid === 2)
        setMaterialesEnvaseResultados(materialesFiltrados)
        setShowMaterialesEnvaseDropdown(materialesFiltrados.length > 0)
      } else {
        setMaterialesEnvaseResultados([])
        setShowMaterialesEnvaseDropdown(false)
      }
    }

    const timeoutId = setTimeout(buscarMaterialesEnvase, 300)
    return () => clearTimeout(timeoutId)
  }, [materialEnvaseBuscar])
  // </CHANGE>

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formulaSearchRef.current && !formulaSearchRef.current.contains(event.target as Node)) {
        setShowFormulasDropdown(false)
      }
      if (materialEtiquetadoSearchRef.current && !materialEtiquetadoSearchRef.current.contains(event.target as Node)) {
        setShowMaterialesEtiquetadoDropdown(false)
      }
      if (materialEnvaseSearchRef.current && !materialEnvaseSearchRef.current.contains(event.target as Node)) {
        setShowMaterialesEnvaseDropdown(false)
      }
      // </CHANGE>
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
    setShowConfirmSaveModal(true)
  }

  const confirmarActualizacion = async () => {
    setShowConfirmSaveModal(false)
    // </CHANGE>

    // Variables necesarias para el proceso
    const form = document.getElementById("formInformacion") as HTMLFormElement
    if (!form) return

    const formDataToSend = new FormData(form)
    const nombre = formDataToSend.get("nombre") as string
    const codigo = formDataToSend.get("codigo") as string
    const zonaid = formDataToSend.get("zonaid") as string
    const productoName = formDataToSend.get("producto") as string
    const codigomaestro = formDataToSend.get("codigomaestro") as string

    // Validar variables obligatorias
    if (!nombre || nombre.trim().length < 3) {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "El nombre del producto debe tener al menos 3 caracteres.",
      })
      setShowModalValidation(true)
      return
    }

    // Validar que la zona no sea 0 o nulo
    console.log("zona: " + zonaid)
    if (!zonaid || zonaid === "0") {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "Debe seleccionar una zona válida para el producto.",
      })
      setShowModalValidation(true)
      return
    }

    if (!productoName || productoName.trim().length < 3) {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "El nombre del producto debe tener al menos 3 caracteres.",
      })
      setShowModalValidation(true)
      return
    }

    if (!codigomaestro || codigomaestro.trim().length < 1) {
      setModalValidation({
        Titulo: "Datos incompletos",
        Mensaje: "El Código Maestro debe tener al menos 1 caracter.",
      })
      setShowModalValidation(true)
      return
    }
    // </CHANGE>

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await actualizarProducto(formDataToSend)

      if (result.success) {
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setShowProcessing(false)
          setModalSuccess({
            Titulo: "Éxito",
            Mensaje: "Producto actualizado y recalculado exitosamente",
          })
          setShowModalSuccess(true) // Show success modal

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
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Fórmula agregada y producto recalculado exitosamente",
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
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "La fórmula se agregó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          // Still reload data even if recalculation failed
          await cargarDatosIniciales()
        }
        // </CHANGE>
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
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Fórmula eliminada y producto recalculated exitosamente",
          })
          setShowModalAlert(true)

          // Reload product data
          await cargarDatosIniciales()
        } else {
          setModalError({
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "La fórmula se eliminó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          // Still reload data even if recalculation failed
          await cargarDatosIniciales()
        }
        // </CHANGE>
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
      tipomaterialid: material.tipomaterialid, // Set tipomaterialid here
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

  const handleAgregarMaterialEnvase = () => {
    console.log("prubeaaa11")

    if (!materialEnvaseSeleccionado) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe seleccionar un material de envase para proceder.",
      })
      setShowModalAlert(true)
      return
    }

    if (!materialEnvaseCantidad || Number(materialEnvaseCantidad) <= 0) {
      setModalAlert({
        Titulo: "Validación",
        Mensaje: "Debe agregar una cantidad válida para proceder.",
      })
      setShowModalAlert(true)
      return
    }
    console.log("prubeaaa222")
    setShowAddMaterialEnvaseModal(true)
  }
  // </CHANGE>

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
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Material de etiquetado agregado y producto recalculated exitosamente",
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
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "El material se agregó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          // Still reset form and reload data
          setMaterialEtiquetadoBuscar("")
          setMaterialEtiquetadoSeleccionado(null)
          setMaterialEtiquetadoCantidad("")
          await cargarDatosIniciales()
        }
        // </CHANGE>
      } else {
        setModalError({
          Titulo: "Error al agregar material de empaque",
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

  const confirmarAgregarMaterialEnvase = async () => {
    setShowAddMaterialEnvaseModal(false)
    setShowProcessing(true) // Added this line
    console.log("prubeaaa331")
    console.log("prubeaaa332", productoId)
    console.log("prubeaaa333", materialEnvaseCantidad)

    try {
      // Directly use the values from state for the action
      const result = await crearMaterialEtiquetadoXProducto(
        materialEnvaseSeleccionado!.id,
        productoId,
        Number(materialEnvaseCantidad),
      )

      console.log("prubeaaa")

      if (result.success) {
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Material de envase agregado y producto recalculado exitosamente",
          })
          setShowModalAlert(true)

          setMaterialEnvaseBuscar("")
          setMaterialEnvaseSeleccionado(null)
          setMaterialEnvaseCantidad("")
          setMaterialEnvaseUnidadMedida("") // Reset unit and cost
          setMaterialEnvaseCostoUnitario("") // Reset unit and cost

          await cargarDatosIniciales()
        } else {
          setModalError({
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "El material se agregó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          setMaterialEnvaseBuscar("")
          setMaterialEnvaseSeleccionado(null)
          setMaterialEnvaseCantidad("")
          setMaterialEnvaseUnidadMedida("") // Reset unit and cost
          setMaterialEnvaseCostoUnitario("") // Reset unit and cost
          await cargarDatosIniciales()
        }
      } else {
        setModalError({
          Titulo: "Error al agregar material de envase",
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
  // </CHANGE>

  // The original code had a duplicated `confirmarAgregarMaterialEtiquetado` function.
  // We will keep only one instance of it.

  const handleEliminarMaterialEtiquetado = (materialetiquetadoid: number, nombre: string) => {
    setMaterialEtiquetadoToDelete({ materialetiquetadoid, nombre })
    setShowDeleteMaterialEtiquetadoModal(true)
  }

  const handleEliminarMaterialEnvase = (materialetiquetadoid: number, nombre: string) => {
    setMaterialEnvaseToDelete({ materialetiquetadoid, nombre })
    setShowDeleteMaterialEnvaseModal(true)
  }
  // </CHANGE>

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
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Material de empaque eliminado y producto recalculated exitosamente",
          })
          setShowModalAlert(true)

          // Reload product data
          await cargarDatosIniciales()
        } else {
          setModalError({
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "El material se eliminó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          // Still reload data even if recalculation failed
          await cargarDatosIniciales()
        }
        // </CHANGE>
      } else {
        setModalError({
          Titulo: "Error al eliminar material de empaque",
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

  const confirmarEliminarMaterialEnvase = async () => {
    if (!materialEnvaseToDelete) return

    setShowDeleteMaterialEnvaseModal(false)
    setShowProcessing(true)

    try {
      const result = await eliminarMaterialEtiquetadoXProducto(materialEnvaseToDelete.materialetiquetadoid, productoId)

      if (result.success) {
        const recalcularResult = await recalcularProducto(productoId)

        if (recalcularResult.success) {
          setModalAlert({
            Titulo: "Éxito",
            Mensaje: "Material de envase eliminado y producto recalculado exitosamente",
          })
          setShowModalAlert(true)

          await cargarDatosIniciales()
        } else {
          setModalError({
            Titulo: "Error al recalcular producto",
            Mensaje: recalcularResult.error || "El material se eliminó pero hubo un error al recalcular",
          })
          setShowModalError(true)

          await cargarDatosIniciales()
        }
      } else {
        setModalError({
          Titulo: "Error al eliminar material de envase",
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
      setMaterialEnvaseToDelete(null)
    }
  }
  // </CHANGE>

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

  const handleCosteoTabClick = () => {
    setShowCosteoRedirectModal(true)
  }

  const handleCosteoRedirect = () => {
    if (producto) {
      const params = new URLSearchParams({
        productoid: producto.id.toString(),
        clienteid: producto.clienteid?.toString() || "",
        zonaid: producto.zonaid?.toString() || "",
      })
      router.push(`/costear?${params.toString()}`)
    }
  }

  const handleMaterialEnvaseSelect = (material: any) => {
    setMaterialEnvaseBuscar(`${material.codigo} - ${material.nombre}`)
    setShowMaterialesEnvaseDropdown(false)
    setMaterialEnvaseSeleccionado({
      id: material.id,
      codigo: material.codigo || "",
      nombre: material.nombre || "",
      unidadmedida: material.unidadesmedida?.descripcion || "",
      costo: material.costo || 0,
      tipomaterialid: material.tipomaterialid,
    })
    setMaterialEnvaseUnidadMedida(material.unidadesmedida?.descripcion || "") // Set unit
    setMaterialEnvaseCostoUnitario(material.costo?.toFixed(6) || "0.000000") // Set cost
  }
  // </CHANGE>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-cyan-100 rounded-full">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">{ModalAlert?.Titulo || ""}</h3>
            <p className="text-center text-gray-600 mb-6">{ModalAlert?.Mensaje || ""}</p>
            <div className="flex justify-center">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => setShowModalAlert(false)}>
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCosteoRedirectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Redirección a Página de Costeo</h3>
            <p className="mb-6">
              La actualización del costeo del producto se realiza por medio de la página de costeo.
              <br />
              <br />
              <strong>Advertencia:</strong> Si acepta, saldrá del módulo de actualización de producto y será
              redireccionado a la página de costear. Los cambios realizados no guardados se perderán.
              <br />
              <br />
              ¿Desea continuar?
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowCosteoRedirectModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCosteoRedirect}>
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Added modal for confirmation before saving */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Actualización</h3>
            <p className="mb-6">
              ¿Está seguro de que desea realizar el cálculo con la información agregada en los campos?
              <br />
              <br />
              <strong>Advertencia:</strong> Al realizar el cambio se creará un recálculo de la información, precios y
              costos del producto a actualizar. Esta información puede afectar al costeo en caso de que el producto
              presente dicha información.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmSaveModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmarActualizacion}>
                Sí, Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* </CHANGE> */}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">
              ¿Está seguro que desea eliminar la fórmula <strong>{formulaToDelete?.nombre}</strong> del producto?
              <br />
              <br />
              <strong>Advertencia:</strong> Al realizar el cambio se creará un recálculo de la información, precios y
              costos del producto a actualizar. Esta información puede afectar al costeo en caso de que el producto
              presente dicha información.
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
              <br />
              <br />
              <strong>Advertencia:</strong> Al realizar el cambio se creará un recálculo de la información, precios y
              costos del producto a actualizar. Esta información puede afectar al costeo en caso de que el producto
              presente dicha información.
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
              ¿Está seguro que desea eliminar el material de empaque{" "}
              <strong>{materialEtiquetadoToDelete?.nombre}</strong> del producto?
              <br />
              <br />
              <strong>Advertencia:</strong> Al realizar el cambio se creará un recálculo de la información, precios y
              costos del producto a actualizar. Esta información puede afectar al costeo en caso de que el producto
              presente dicha información.
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
            <h3 className="text-lg font-semibold mb-4">Confirmar Agregar Material Empaque</h3>
            <p className="mb-6">
              ¿Está seguro que desea agregar el material de empaque{" "}
              <strong>{materialEtiquetadoSeleccionado?.nombre}</strong> con cantidad{" "}
              <strong>{materialEtiquetadoCantidad}</strong> al producto?
              <br />
              <br />
              <strong>Advertencia:</strong> Al realizar el cambio se creará un recálculo de la información, precios y
              costos del producto a actualizar. Esta información puede afectar al costeo en caso de que el producto
              presente dicha información.
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

      {showModalSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100">
              <svg
                className="w-8 h-8 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-900">¡Actualización Exitosa!</h3>
            <p className="text-center text-gray-600 mb-6">El producto se ha actualizado correctamente</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowModalSuccess(false)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMaterialEnvaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Agregar Material de Envase</h3>
            <p className="mb-6">
              ¿Está seguro de agregar el material de envase <strong>{materialEnvaseSeleccionado?.nombre}</strong>?
              <br />
              <br />
              Cantidad: <strong>{materialEnvaseCantidad}</strong>
              <br />
              Costo Unitario: <strong>${materialEnvaseCostoUnitario}</strong>
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowAddMaterialEnvaseModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmarAgregarMaterialEnvase}>
                Sí, Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMaterialEnvaseModal && materialEnvaseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">
              ¿Está seguro de eliminar el material de envase <strong>{materialEnvaseToDelete.nombre}</strong>?
              <br />
              <br />
              <strong className="text-red-600">Advertencia:</strong> Esta acción no se puede deshacer y se recalcularán
              los costos del producto.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteMaterialEnvaseModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmarEliminarMaterialEnvase}>
                Sí, Eliminar
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
          onClick={handleCosteoTabClick}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "cotizacion"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Costeo
        </button>
        {/* </CHANGE> */}
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
                {/* Left column: Basic info inputs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="txtProducto">
                      <span className="text-red-500">*</span> Producto
                    </Label>
                    <Input
                      id="txtProducto"
                      name="producto"
                      type="text"
                      placeholder="Ingrese el producto"
                      value={formData.producto}
                      onChange={handleInputChange}
                    />
                  </div>

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
                    <Label htmlFor="ddlFormaFarmaceutica">Forma Farmacéutica</Label>
                    <Select
                      name="formafarmaceuticaid"
                      value={formData.formafarmaceuticaid}
                      onValueChange={(value) => handleSelectChange("formafarmaceuticaid", value)}
                    >
                      <SelectTrigger id="ddlFormaFarmaceutica">
                        <SelectValue placeholder="Selecciona una forma farmacéutica" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasFarmaceuticas.map((forma) => (
                          <SelectItem key={forma.value} value={forma.value}>
                            {forma.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtPorcion">Porción</Label>
                    <Input
                      id="txtPorcion"
                      name="porcion"
                      type="text"
                      placeholder="Ingrese la porción"
                      value={formData.porcion}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlSistema">Sistema</Label>
                    <Select
                      name="sistemaid"
                      value={formData.sistemaid}
                      onValueChange={(value) => handleSelectChange("sistemaid", value)}
                    >
                      <SelectTrigger id="ddlSistema">
                        <SelectValue placeholder="Selecciona un sistema" />
                      </SelectTrigger>
                      <SelectContent>
                        {sistemas.map((sistema) => (
                          <SelectItem key={sistema.value} value={sistema.value}>
                            {sistema.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtCodigoMaestro">
                      <span className="text-red-500">*</span> Código Maestro
                    </Label>
                    <Input
                      id="txtCodigoMaestro"
                      name="codigomaestro"
                      type="text"
                      placeholder="Ingrese el código maestro"
                      value={formData.codigomaestro}
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
                    <Label htmlFor="ddlZona">
                      <span className="text-red-500">*</span> Zona
                    </Label>
                    <Select
                      name="zonaid"
                      value={formData.zonaid}
                      onValueChange={(value) => handleSelectChange("zonaid", value)}
                    >
                      <SelectTrigger id="ddlZona">
                        <SelectValue placeholder="Selecciona una zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sin zona seleccionada</SelectItem>
                        {zonas.map((zona) => (
                          <SelectItem key={zona.value} value={zona.value}>
                            {zona.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right column: Additional inputs and image */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="txtEnvase">Envase</Label>
                    <Input
                      id="txtEnvase"
                      name="envase"
                      type="text"
                      placeholder="Ingrese el envase"
                      value={formData.envase}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtEnvaseMl">Envase ml</Label>
                    <Input
                      id="txtEnvaseMl"
                      name="envaseml"
                      type="text"
                      placeholder="Ingrese envase ml"
                      value={formData.envaseml}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtCategoria">Categoría</Label>
                    <Input
                      id="txtCategoria"
                      name="categoria"
                      type="text"
                      placeholder="Ingrese la categoría"
                      value={formData.categoria}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
                    <Select
                      name="unidadmedidaid"
                      value={formData.unidadmedidaid}
                      onValueChange={(value) => handleSelectChange("unidadmedidaid", value)}
                      // </CHANGE>
                    >
                      <SelectTrigger id="ddlUnidadMedida">
                        <SelectValue placeholder="Selecciona una unidad de medida" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map((unidad) => (
                          <SelectItem key={unidad.value} value={unidad.value}>
                            {unidad.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageImg">Imagen</Label>
                    <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>

                  <div className="space-y-2">
                    <Label>Previsualización de Imagen</Label>
                    <div className="border rounded-md flex items-center justify-center bg-muted max-h-[350px] h-[350px]">
                      {imagePreview ? (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="h-full w-auto object-contain"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin imagen seleccionada</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {producto && (
                <>
                  <Card className="rounded-xs border bg-card text-foreground shadow mt-6">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg text-sky-700 border-b pb-1">Información Básica</h3>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="font-semibold text-sky-700">ID:</span>
                              <span className="ml-2 text-gray-900">{producto.id}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Producto:</span>
                              <span className="ml-2 text-gray-900">{producto.producto || "Sin producto"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Nombre:</span>
                              <span className="ml-2 text-gray-900">{producto.nombre || "Sin nombre"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Forma Farmacéutica:</span>
                              <span className="ml-2 text-gray-900">
                                {producto.formasfarmaceuticas?.nombre || "Sin forma farmacéutica"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Porción:</span>
                              <span className="ml-2 text-gray-900">{producto.porcion || "Sin porción"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Sistema:</span>
                              <span className="ml-2 text-gray-900">{producto.sistemas?.nombre || "Sin sistema"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Código Maestro:</span>
                              <span className="ml-2 text-gray-900">
                                {producto.codigomaestro || "Sin código maestro"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Código:</span>
                              <span className="ml-2 text-gray-900">{producto.codigo || "Sin código"}</span>
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
                              <span className="font-semibold text-sky-700">Envase:</span>
                              <span className="ml-2 text-gray-900">{producto.envase || "Sin envase"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Envase ml:</span>
                              <span className="ml-2 text-gray-900">{producto.envaseml || "Sin envase ml"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-sky-700">Categoría:</span>
                              <span className="ml-2 text-gray-900">{producto.categoria || "Sin categoría"}</span>
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
                              <span className="font-semibold text-green-700">MEM:</span>
                              <span className="ml-2 text-gray-900">{producto.mem || "0"}</span>
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
                              <span className="font-semibold text-purple-700">MEM %:</span>
                              <span className="ml-2 text-gray-900">
                                {((producto.mem_porcentaje || 0) * 100).toFixed(2)}%
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
                              <span className="font-semibold text-amber-700">MEM $:</span>
                              <span className="ml-2 text-gray-900">${(producto.mem_costeado || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-700">ME $:</span>
                              <span className="ml-2 text-gray-900">${(producto.me_costeado || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-700">MS $:</span>
                              <span className="ml-2 text-gray-900">${(producto.ms_costeado || 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-blue-50 p-1 rounded">
                              <span className="font-semibold text-amber-700">Costo $:</span>
                              <span className="ml-2 text-gray-900 font-bold">
                                $
                                {(
                                  (producto.mp_costeado || 0) +
                                  (producto.mem_costeado || 0) +
                                  (producto.me_costeado || 0) +
                                  (producto.ms_costeado || 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-700">Precio Healthy Lab:</span>
                              <span className="ml-2 text-gray-900">${(producto.preciohl || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-700">Utilidad:</span>
                              <span className="ml-2 text-gray-900">${(producto.utilidadhl || 0).toFixed(6)}</span>
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
                                type="numeric"
                                step="0.01"
                                name="mp_porcentaje"
                                value={(producto.mp_porcentaje * 100).toString()}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const numValue = Number.parseFloat(value) / 100
                                  if (!isNaN(numValue)) {
                                    setProducto((prev) => (prev ? { ...prev, mp_porcentaje: numValue } : null))
                                  }
                                }}
                                className="bg-white"
                              />
                            </td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.mp_costeado?.toFixed(2) || "0"}</span>
                            </td>
                          </tr>

                          {/* MEM Row */}
                          <tr className="hover:bg-gray-50">
                            <td className="border p-3 font-medium">MEM</td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.mem?.toFixed(2) || "0.00"}</span>
                            </td>
                            <td className="border p-3">
                              <Input
                                type="text"
                                step="0.01"
                                name="mem_porcentaje"
                                value={(producto.mem_porcentaje * 100).toString()}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const numValue = Number.parseFloat(value) / 100
                                  if (!isNaN(numValue)) {
                                    setProducto((prev) => (prev ? { ...prev, mem_porcentaje: numValue } : null))
                                  }
                                }}
                                className="bg-white"
                              />
                            </td>
                            <td className="border p-3">
                              <span className="font-medium">${producto?.mem_costeado?.toFixed(2) || "0.00"}</span>
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
                                step="0.01"
                                name="me_porcentaje"
                                value={(producto.me_porcentaje * 100).toString()}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const numValue = Number.parseFloat(value) / 100
                                  if (!isNaN(numValue)) {
                                    setProducto((prev) => (prev ? { ...prev, me_porcentaje: numValue } : null))
                                  }
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
                                value={(producto.ms_porcentaje * 100).toString()}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const numValue = Number.parseFloat(value) / 100
                                  if (!isNaN(numValue)) {
                                    setProducto((prev) => (prev ? { ...prev, ms_porcentaje: numValue } : null))
                                  }
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
                          <th className="border p-2 text-left text-sm bg-[#68BAA1]">Costo Parcial</th>
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
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={6} className="p-2 text-sm text-right">
                            Total Fórmulas:
                          </td>
                          <td className="p-2 text-sm">
                            ${producto.formulasxproducto.reduce((sum, f) => sum + (f.costoparcial || 0), 0).toFixed(6)}
                          </td>
                          <td className="p-2"></td>
                        </tr>
                        {/* </CHANGE> */}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay fórmulas asignadas a este producto.</p>
                )}
              </div>
              <div className="border-t-2 border-[#6db8c9] mt-4 pt-4 flex justify-end"></div>
              {/* </CHANGE> */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agregar Material Empaque</h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2 relative" ref={materialEtiquetadoSearchRef}>
                    <Label htmlFor="txtMaterialEmpaquetado">Material de Empaque</Label>
                    <Input
                      id="txtMaterialEmpaquetado"
                      type="text"
                      placeholder="Buscar material de etiquetado..."
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

                  <div className="space-y-2">
                    <Label htmlFor="txtME2Cantidad">Cantidad</Label>
                    <Input
                      id="txtME1Cantidad"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={materialEtiquetadoCantidad}
                      onChange={(e) => setMaterialEtiquetadoCantidad(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtME2UnidadMedida">Unidad de Medida</Label>
                    <Input
                      id="txtME1UnidadMedida"
                      type="text"
                      value={materialEtiquetadoSeleccionado?.unidadmedida || ""}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtME2Costo">Costo Unitario</Label>
                    <Input
                      id="txtME1Costo"
                      type="text"
                      value={
                        materialEtiquetadoSeleccionado ? `$${materialEtiquetadoSeleccionado.costo.toFixed(6)}` : ""
                      }
                      disabled
                    />
                  </div>

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

                <h3 className="text-lg  font-semibold">Materiales de Empaque del Producto</h3>

                {producto?.materialesetiquetadoxproducto &&
                producto.materialesetiquetadoxproducto.filter((m) => m.materialesetiquetado?.tipomaterialid === 1)
                  .length > 0 ? (
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
                        {producto.materialesetiquetadoxproducto
                          .filter((m) => m.materialesetiquetado?.tipomaterialid === 1)
                          .map((materialRel, index) => (
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
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={6} className="p-2 text-sm text-right">
                            Total Materiales Empaque:
                          </td>
                          <td className="p-2 text-sm">
                            $
                            {producto.materialesetiquetadoxproducto
                              .filter((m) => m.materialesetiquetado?.tipomaterialid === 1)
                              .reduce((sum, m) => sum + (m.costoparcial || 0), 0)
                              .toFixed(6)}
                          </td>
                          <td className="p-2"></td>
                        </tr>
                        {/* </CHANGE> */}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay materiales de empaque (Tipo 1) asignados a este producto.</p>
                )}
              </div>
              {/* </CHANGE> - Changed location of Material de Envase handler to match Material de Etiquetado behavior */}

              <div className="border-t-2 border-[#6db8c9] mt-4 pt-4 flex justify-end"></div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agregar Material de Envase</h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2 relative" ref={materialEnvaseSearchRef}>
                    <Label htmlFor="txtMaterialEnvase">Material de Envase</Label>
                    <Input
                      id="txtMaterialEnvase"
                      type="text"
                      placeholder="Buscar material de envase..."
                      value={materialEnvaseBuscar}
                      onChange={(e) => setMaterialEnvaseBuscar(e.target.value)}
                      onFocus={() => materialesEnvaseResultados.length > 0 && setShowMaterialesEnvaseDropdown(true)}
                    />
                    {showMaterialesEnvaseDropdown && materialesEnvaseResultados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {materialesEnvaseResultados.map((material) => (
                          <button
                            key={material.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleMaterialEnvaseSelect(material)}
                          >
                            {material.codigo} - {material.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtMECantidad">Cantidad</Label>
                    <Input
                      id="txtMECantidad"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={materialEnvaseCantidad}
                      onChange={(e) => setMaterialEnvaseCantidad(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtMEUnidadMedida">Unidad de Medida</Label>
                    <Input
                      id="txtMEUnidadMedida"
                      type="text"
                      value={materialEnvaseUnidadMedida} // Use state variable
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtMECosto">Costo Unitario</Label>
                    <Input
                      id="txtMECosto"
                      type="text"
                      value={materialEnvaseCostoUnitario} // Use state variable
                      disabled
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAgregarMaterialEnvase}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold">Materiales de Etiquetado del Producto</h3>

                {producto?.materialesetiquetadoxproducto &&
                producto.materialesetiquetadoxproducto.filter((m) => m.materialesetiquetado?.tipomaterialid === 2)
                  .length > 0 ? (
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
                        {producto.materialesetiquetadoxproducto
                          .filter((m) => m.materialesetiquetado?.tipomaterialid === 2)
                          .map((materialRel, index) => (
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
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={6} className="p-2 text-sm text-right">
                            Total Materiales Etiquetado:
                          </td>
                          <td className="p-2 text-sm">
                            $
                            {producto.materialesetiquetadoxproducto
                              .filter((m) => m.materialesetiquetado?.tipomaterialid === 2)
                              .reduce((sum, m) => sum + (m.costoparcial || 0), 0)
                              .toFixed(6)}
                          </td>
                          <td className="p-2"></td>
                        </tr>
                        {/* </CHANGE> */}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay materiales de etiquetado (Tipo 2) asignados a este producto.</p>
                )}
              </div>
              {/* </CHANGE> */}

              <div className="border-t-2 border-black mt-4 pt-4 flex justify-end">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MP:</span>
                      <span>${(producto?.mp || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MEM:</span>
                      <span>${(producto?.mem || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">ME:</span>
                      <span>${(producto?.me || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MS:</span>
                      <span>${(producto?.ms || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-bold">Costo:</span>
                      <span className="text-green-600">${(producto?.costo || 0).toFixed(6)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MP %:</span>
                      <span>{((producto?.mp_porcentaje || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MEM %:</span>
                      <span>{((producto?.mem_porcentaje || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">ME %:</span>
                      <span>{((producto?.me_porcentaje || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MS %:</span>
                      <span>{((producto?.ms_porcentaje || 0) * 100).toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MP Costo:</span>
                      <span>${(producto?.mp_costeado || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MEM Costo:</span>
                      <span>${(producto?.mem_costeado || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">ME Costo:</span>
                      <span>${(producto?.me_costeado || 0).toFixed(6)}</span>
                    </div>
                    {/* rest of the code */}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold">MS Costo:</span>
                      <span>${(producto?.ms_costeado || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-blue-300 bg-blue-50 px-2 rounded">
                      <span className="font-bold text-blue-700">Costo Total:</span>
                      <span className="font-bold text-blue-700">
                        $
                        {(
                          (producto?.mp_costeado || 0) +
                          (producto?.mem_costeado || 0) +
                          (producto?.me_costeado || 0) +
                          (producto?.ms_costeado || 0)
                        ).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 items-center">
                      <span className="font-bold flex items-center gap-1">
                        <span className="relative group">
                          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                          <span className="absolute left-6 top-0 z-50 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                            Si el costo total es menor a $50, el precio de Healthy Lab se asignará por defecto con el
                            valor de $50.
                          </span>
                        </span>
                        Precio Healthy Lab:
                      </span>
                      <span className="text-green-600">${(producto?.preciohl || 0).toFixed(6)}</span>
                    </div>
                    {/* </CHANGE> */}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-bold">Utilidad:</span>
                      <span className="text-green-600">${(producto?.utilidadhl || 0).toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
