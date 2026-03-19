"use client"

/* ==================================================
  Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Edit,
  Package,
  Package2,
  Flag as Flask,
  Box,
  PackageOpen,
  FileText,
  Save,
  Check,
  X as XIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
// -- Librerias --
import { RolesAdminDOs } from "@/lib/config"
import { PageProcessing } from "@/components/page-processing"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-client"
import { listaDesplegableClientes } from "@/app/actions/clientes"
import { listaDesplegableUnidadesMedida } from "@/app/actions/catalogos"
import { listaDesplegableMateriasPrimasBuscar, obtenerMateriasPrimas } from "@/app/actions/materia-prima"
import { listaDesplegableProductosXClientes } from "@/app/actions/productos"
import { obtenerFiltrosAvanzadosProductos, obtenerCotizacionParaEditar } from "@/app/actions/productos-cotizaciones"

/* ==================================================
  Interfaces
================================================== */
interface Cliente {
  id: number
  nombre: string
  clave: string
  direccion: string
  telefono: string
  email: string
}

interface Cotizacion {
  id: number
  titulo: string
  usuario: string
  tipoCotizacion: string
  clienteId: number
}

interface Formula {
  id: number
  codigo: string
  nombre: string
  especificaciones: string
  unidadMedidaId: number
  tipoMedida: string
  formula: string
  costo: number
  productoNombre?: string
  productoCosto?: number
  productoMP?: number
  productoCantidad?: number
  productoCostoME?: number
  productoCostoMS?: number
  estatusformula?: string
  productoIdRef?: number
  volumenUnidades?: number
}

/* ==================================================
  Componente Principal (Pagina)
================================================== */
export default function CrearCotizacionPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const searchParams = useSearchParams()
  const cotizacionIdParam = searchParams.get("id")
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])

  // --- Estados ---
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showProcessing, setShowProcessing] = useState(false)

  // Paso 2: Cliente
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("")
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    clave: "",
    direccion: "",
    telefono: "",
    email: "",
  })

  // Paso 3: Información de cotización
  const [cotizacion, setCotizacion] = useState({
    titulo: "",
    usuario: user?.Nombre || "",
    tipoCotizacion: "Nueva Formula",
    volumen: "",
  })
  const [cotizacionId, setCotizacionId] = useState<number | null>(null)
  const [cotizacionRegistrada, setCotizacionRegistrada] = useState(false)
  const [hayProductosEnCotizacion, setHayProductosEnCotizacion] = useState(false)

  // Paso 4: Fórmulas
  const [showModalFormula, setShowModalFormula] = useState(false)
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([])
  const [especificacionesOptions, setEspecificacionesOptions] = useState<any[]>([])
  const [tipoMedidaOptions, setTipoMedidaOptions] = useState<any[]>([])
  const [unidadesMedidaOptions, setUnidadesMedidaOptions] = useState<any[]>([])
  const [especificacionesFiltradas, setEspecificacionesFiltradas] = useState<any[]>([])
  const [showEspecificacionesDropdown, setShowEspecificacionesDropdown] = useState(false)
  const [codigoValidado, setCodigoValidado] = useState(false)
  const [validandoCodigo, setValidandoCodigo] = useState(false)
  const [showModalCodigoExiste, setShowModalCodigoExiste] = useState(false)
  const [codigoRecomendado, setCodigoRecomendado] = useState("")
  const [nuevaFormula, setNuevaFormula] = useState({
    codigo: "",
    nombre: "",
    especificaciones: "",
    unidadMedidaId: "",
    tipoMedida: "",
    formula: "",
  })
  const [formulas, setFormulas] = useState<Formula[]>([])

  // Modal Materias Primas
  const [showModalMateriasPrimas, setShowModalMateriasPrimas] = useState(false)
  const [formulaSeleccionada, setFormulaSeleccionada] = useState<Formula | null>(null)
  const [materiaPrimaInput, setMateriaPrimaInput] = useState("")
  const [materiaPrimaId, setMateriaPrimaId] = useState<number | null>(null)
  const [materiaPrimaSearchResults, setMateriaPrimaSearchResults] = useState<any[]>([])
  const [showMateriaPrimaDropdown, setShowMateriaPrimaDropdown] = useState(false)
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = useState<any>(null)
  const [cantidadMateriaPrima, setCantidadMateriaPrima] = useState("")
  const [unidadMedidaIdMP, setUnidadMedidaIdMP] = useState("")
  const [costoUnitarioMP, setCostoUnitarioMP] = useState("")
  const [materiasPrimasAgregadas, setMateriasPrimasAgregadas] = useState<any[]>([])
  const [mpModificadas, setMpModificadas] = useState<Set<number>>(new Set())
  const [mpValoresOriginales, setMpValoresOriginales] = useState<Map<number, number>>(new Map())
  const [formulasModificadas, setFormulasModificadas] = useState<Set<number>>(new Set())
  const [formulasValoresOriginales, setFormulasValoresOriginales] = useState<Map<number, number>>(new Map())
  const [showConfirmSalirFormula, setShowConfirmSalirFormula] = useState(false)

  // Materias primas nuevas (cotizadas)
  const [showNuevaMateriaPrimaForm, setShowNuevaMateriaPrimaForm] = useState(false)
  const [nuevaMateriaPrima, setNuevaMateriaPrima] = useState({
    codigo: "",
    proveedor: "",
    nombre: "",
    cantidad: "",
    unidadMedidaId: "",
    costoUnitario: "",
  })
  const [codigoMPValidado, setCodigoMPValidado] = useState(false)
  const [validandoCodigoMP, setValidandoCodigoMP] = useState(false)
  const [codigoMPRecomendado, setCodigoMPRecomendado] = useState("")
  const [showModalCodigoMPExiste, setShowModalCodigoMPExiste] = useState(false)

  // Estados para fórmulas en elaboración
  const [formulaElabInput, setFormulaElabInput] = useState("")
  const [formulaElabSearchResults, setFormulaElabSearchResults] = useState<any[]>([])
  const [showFormulaElabDropdown, setShowFormulaElabDropdown] = useState(false)
  const [formulaElabSeleccionada, setFormulaElabSeleccionada] = useState<any>(null)
  const [cantidadFormulaElab, setCantidadFormulaElab] = useState("")
  const [unidadMedidaIdFormulaElab, setUnidadMedidaIdFormulaElab] = useState("")
  const [costoUnitarioFormulaElab, setCostoUnitarioFormulaElab] = useState("")
  const [formulasAgregadas, setFormulasAgregadas] = useState<any[]>([])

  // Validación de materias primas por fórmula
  const [formulasConMateriasPrimas, setFormulasConMateriasPrimas] = useState<{ [key: number]: boolean }>({})
  
  // Validación de productos asignados por fórmula
  const [formulasConProductos, setFormulasConProductos] = useState<{ [key: number]: boolean }>({})
  
  // Validación de materiales de envase/empaque por fórmula
  const [formulasConMaterialesEnvase, setFormulasConMaterialesEnvase] = useState<{ [key: number]: boolean }>({})

  // Modal Productos
  const [showModalProducto, setShowModalProducto] = useState(false)
  const [productoInput, setProductoInput] = useState("")
  const [productoId, setProductoId] = useState<number | null>(null)
  const [productosCliente, setProductosCliente] = useState<any[]>([])
  const [showProductosDropdown, setShowProductosDropdown] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null)
  const [productoAsignadoActual, setProductoAsignadoActual] = useState<any>(null)

  // Modal Materiales de Envase/Empaque
  const [showModalMateriales, setShowModalMateriales] = useState(false)
  const [formulaParaMateriales, setFormulaParaMateriales] = useState<Formula | null>(null)
  const [productoDeMaterial, setProductoDeMaterial] = useState<any>(null)
  const [materialesEtiquetadoBuscar, setMaterialesEtiquetadoBuscar] = useState("")
  const [materialesEtiquetadoResultados, setMaterialesEtiquetadoResultados] = useState<any[]>([])
  const [showMaterialesEtiquetadoDropdown, setShowMaterialesEtiquetadoDropdown] = useState(false)
  const [materialEtiquetadoSeleccionado, setMaterialEtiquetadoSeleccionado] = useState<any>(null)
  const [materialEtiquetadoCantidad, setMaterialEtiquetadoCantidad] = useState("")
  const [materialesEnvaseBuscar, setMaterialesEnvaseBuscar] = useState("")
  const [materialesEnvaseResultados, setMaterialesEnvaseResultados] = useState<any[]>([])
  const [showMaterialesEnvaseDropdown, setShowMaterialesEnvaseDropdown] = useState(false)
  const [materialEnvaseSeleccionado, setMaterialEnvaseSeleccionado] = useState<any>(null)
  const [materialEnvaseCantidad, setMaterialEnvaseCantidad] = useState("")
  const [materialesAsignados, setMaterialesAsignados] = useState<any[]>([])
  const [mostrarNuevoMaterialEmpaque, setMostrarNuevoMaterialEmpaque] = useState(false)
  const [nuevoMaterialEmpaque, setNuevoMaterialEmpaque] = useState({
    tipoMaterial: "",
    codigo: "",
    proveedor: "",
    nombre: "",
    detalle: "",
    especificaciones: "",
    medida: "",
    tipomedida: "",
    color: "",
    unidadMedidaId: "",
    costoUnitario: "",
    cantidad: "",
  })
  const [codigoMaterialValidado, setCodigoMaterialValidado] = useState(false)
  const [validandoCodigoMaterial, setValidandoCodigoMaterial] = useState(false)
  const [codigoMaterialRecomendado, setCodigoMaterialRecomendado] = useState("")
  const [showModalCodigoMaterialExiste, setShowModalCodigoMaterialExiste] = useState(false)
  const [tiposMaterial, setTiposMaterial] = useState<any[]>([])
  const [tiposMedidaMaterial, setTiposMedidaMaterial] = useState<any[]>([])
  const [coloresMaterial, setColoresMaterial] = useState<any[]>([])

  // Volumen de Unidades - modal de carga
  const [savingVolumen, setSavingVolumen] = useState(false)

  // Modales de confirmación
  const [showModalConfirmacion, setShowModalConfirmacion] = useState(false)
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("")
  const [tipoConfirmacion, setTipoConfirmacion] = useState<"success" | "error">("success")

  // Modal Editar Fórmula
  const [showModalEditarFormula, setShowModalEditarFormula] = useState(false)
  const [formulaAEditar, setFormulaAEditar] = useState<Formula | null>(null)
  const [formulaEditada, setFormulaEditada] = useState({
    codigo: "",
    nombre: "",
    especificaciones: "",
    unidadMedidaId: "",
    tipoMedida: "",
    formula: "",
  })

  // Modal Registrar Nuevo Producto
  const [showModalRegistrarProducto, setShowModalRegistrarProducto] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    clave: "",
    presentacion: "",
    envase: "",
    objetivo: "",
    categoria: "",
    sistema: "",
    codigomaestro: "",
    cantidadPresentacion: "",
    imgUrl: "",
  })
  const [productoEditandoId, setProductoEditandoId] = useState<number | null>(null)
  const [categoriasProducto, setCategoriasProducto] = useState<string[]>([])
  const [envasesProducto, setEnvasesProducto] = useState<string[]>([])
  const [presentacionesProducto, setPresentacionesProducto] = useState<string[]>([])
  const [sistemasProducto, setSistemasProducto] = useState<string[]>([])
  const [guardandoProducto, setGuardandoProducto] = useState(false)

  // Estados para totales
  const [totales, setTotales] = useState({
    totalCostoFormulas: 0,
    totalCostoProducto: 0,
    totalMateriasPrimas: 0,
    totalFormulasSecundarias: 0,
    totalCantidadFormula: 0,
    totalMaterialEmpaque: 0,
    totalMaterialEnvase: 0,
  })

  // --- useEffect ---
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      
      // Si hay un id de cotización, cargar en modo edición
      if (cotizacionIdParam) {
        const cotizacionId = parseInt(cotizacionIdParam)
        if (!isNaN(cotizacionId)) {
          cargarDatosIniciales().then(() => {
            cargarCotizacionParaEditar(cotizacionId)
          })
        }
      } else {
        // Modo crear nueva cotización
        cargarDatosIniciales()
      }
      
      cargarEspecificacionesYTipoMedida()
    }
  }, [authLoading, user, router, cotizacionIdParam])

  // useEffect para filtrar especificaciones mientras se escribe
  useEffect(() => {
    if (nuevaFormula.especificaciones.trim() !== "") {
      const filtradas = especificacionesOptions.filter((esp) =>
        esp.text.toLowerCase().includes(nuevaFormula.especificaciones.toLowerCase())
      )
      setEspecificacionesFiltradas(filtradas)
      setShowEspecificacionesDropdown(true)
    } else {
      setEspecificacionesFiltradas([])
      setShowEspecificacionesDropdown(false)
    }
  }, [nuevaFormula.especificaciones, especificacionesOptions])

  // useEffect para cargar productos cuando cambia el cliente
  useEffect(() => {
    if (clienteSeleccionado) {
      cargarProductosCliente()
    }
  }, [clienteSeleccionado])

  // useEffect para verificar materias primas de todas las fórmulas
  useEffect(() => {
    const verificarTodasLasFormulas = async () => {
      const verificaciones: { [key: number]: boolean } = {}
      for (const formula of formulas) {
        verificaciones[formula.id] = await verificarMateriasPrimasPorFormula(formula.id)
      }
      setFormulasConMateriasPrimas(verificaciones)
    }

    if (formulas.length > 0) {
      verificarTodasLasFormulas()
    }
  }, [formulas])

  // useEffect para verificar productos asignados de todas las fórmulas
  useEffect(() => {
    const verificarProductosAsignados = async () => {
      const verificaciones: { [key: number]: boolean } = {}
      for (const formula of formulas) {
        verificaciones[formula.id] = await verificarProductoAsignadoPorFormula(formula.id)
      }
      setFormulasConProductos(verificaciones)
    }

    if (formulas.length > 0) {
      verificarProductosAsignados()
    }
  }, [formulas])

  // useEffect para buscar materiales de empaque
  useEffect(() => {
    if (materialesEtiquetadoBuscar) {
      buscarMaterialesEtiquetado(materialesEtiquetadoBuscar)
    } else {
      setMaterialesEtiquetadoResultados([])
    }
  }, [materialesEtiquetadoBuscar])

  // useEffect para buscar materiales de envase
  useEffect(() => {
    if (materialesEnvaseBuscar) {
      buscarMaterialesEnvase(materialesEnvaseBuscar)
    } else {
      setMaterialesEnvaseResultados([])
    }
  }, [materialesEnvaseBuscar])

  // --- Funciones ---
  const generarCodigoAleatorio = async () => {
    let codigoGenerado = ""
    let existe = true

    while (existe) {
      // Generar 5 dígitos aleatorios
      const digitos = Math.floor(10000 + Math.random() * 90000)
      const codigoConC = `c${digitos}`

      // Verificar si existe en la BD
      const { data, error } = await supabase.from("formulas").select("codigo").eq("codigo", codigoConC).single()

      if (error || !data) {
        // No existe, usar este código
        codigoGenerado = digitos.toString()
        existe = false
      }
    }

    return codigoGenerado
  }

  const validarCodigoFormula = async () => {
    if (!nuevaFormula.codigo.trim()) {
      alert("Por favor ingrese un código")
      return
    }

    setValidandoCodigo(true)

    try {
      // Concatenar 'c' al principio del código
      const codigoConC = `c${nuevaFormula.codigo}`

      // Buscar en la base de datos
      const { data, error } = await supabase.from("formulas").select("codigo").eq("codigo", codigoConC).single()

      if (error || !data) {
        // No existe, el código es válido
        setCodigoValidado(true)
      } else {
        // Ya existe, generar recomendación
        const recomendacion = await generarCodigoAleatorio()
        setCodigoRecomendado(recomendacion)
        setShowModalCodigoExiste(true)
      }
    } catch (error) {
      console.error("Error validando código:", error)
      alert("Error al validar el código")
    } finally {
      setValidandoCodigo(false)
    }
  }

  const validarCodigoMateriaPrima = async () => {
    if (!nuevaMateriaPrima.codigo.trim()) {
      alert("Por favor ingrese un código")
      return
    }

    setValidandoCodigoMP(true)

    try {
      // Concatenar 'c' al principio del código
      const codigoConC = `c${nuevaMateriaPrima.codigo}`

      // Buscar en la base de datos
      const { data, error } = await supabase.from("materiasprima").select("codigo").eq("codigo", codigoConC).single()

      if (error || !data) {
        // No existe, el código es válido
        setCodigoMPValidado(true)
        mostrarConfirmacion("Código disponible", "success")
      } else {
        // Ya existe, generar recomendación
        const numeroAleatorio = Math.floor(Math.random() * 10000)
        const recomendacion = String(numeroAleatorio).padStart(4, "0")
        setCodigoMPRecomendado(recomendacion)
        setShowModalCodigoMPExiste(true)
      }
    } catch (error) {
      console.error("Error validando código:", error)
      alert("Error al validar el código")
    } finally {
      setValidandoCodigoMP(false)
    }
  }

  const validarCodigoMaterial = async () => {
    if (!nuevoMaterialEmpaque.codigo.trim()) {
      alert("Por favor ingrese un código")
      return
    }

    setValidandoCodigoMaterial(true)

    try {
      // Concatenar 'c' al principio del código
      const codigoConC = `c${nuevoMaterialEmpaque.codigo}`

      // Buscar en la base de datos
      const { data, error } = await supabase.from("materialesetiquetado").select("codigo").eq("codigo", codigoConC).single()

      if (error || !data) {
        // No existe, el código es válido
        setCodigoMaterialValidado(true)
        mostrarConfirmacion("Código disponible", "success")
      } else {
        // Ya existe, generar recomendación
        const numeroAleatorio = Math.floor(Math.random() * 10000)
        const recomendacion = String(numeroAleatorio).padStart(4, "0")
        setCodigoMaterialRecomendado(recomendacion)
        setShowModalCodigoMaterialExiste(true)
      }
    } catch (error) {
      console.error("Error validando código:", error)
      alert("Error al validar el código")
    } finally {
      setValidandoCodigoMaterial(false)
    }
  }

  const cargarEspecificacionesYTipoMedida = async () => {
    try {
      // Cargar especificaciones
      const { data: especData, error: especError } = await supabase
        .from("formulas")
        .select("especificaciones")
        .order("especificaciones", { ascending: true })

      if (!especError && especData) {
        const especificacionesUnicos = Array.from(new Set(especData.map((f: any) => f.especificaciones).filter(Boolean)))
          .map((esp: any) => ({
            value: esp,
            text: esp,
          }))
        setEspecificacionesOptions(especificacionesUnicos)
      }

      // Cargar tipos de medida
      const { data: tipoData, error: tipoError } = await supabase
        .from("formulas")
        .select("tipomedida")
        .order("tipomedida", { ascending: true })

      if (!tipoError && tipoData) {
        const tipoMedidaUnicos = Array.from(new Set(tipoData.map((f: any) => f.tipomedida).filter(Boolean)))
          .map((tipo: any) => ({
            value: tipo,
            text: tipo,
          }))
        setTipoMedidaOptions(tipoMedidaUnicos)
      }
    } catch (error) {
      console.error("Error cargando especificaciones y tipo medida:", error)
    }
  }

  // Mostrar modal de confirmación
  const mostrarConfirmacion = (mensaje: string, tipo: "success" | "error" = "success") => {
    setMensajeConfirmacion(mensaje)
    setTipoConfirmacion(tipo)
    setShowModalConfirmacion(true)
  }

  // Cargar productos para todas las fórmulas
  const cargarProductosDeFormulas = async (formulas: Formula[]) => {
    const formulasActualizadas = await Promise.all(
      formulas.map(async (formula) => {
        try {
          const { data: formulaProducto } = await supabase
            .from("formulasxproducto")
            .select(`
              productoid,
              productos:productoid(nombre)
            `)
            .eq("formulaid", formula.id)
            .eq("activo", true)

          if (formulaProducto && formulaProducto.length > 0) {
            const prod = formulaProducto[0]
            if (prod && prod.productos) {
              return { ...formula, productoNombre: prod.productos.nombre || "" }
            }
          }
          return formula
        } catch (error) {
          return formula
        }
      })
    )
    return formulasActualizadas
  }

  // Abrir modal para editar fórmula
  const handleAbrirEditarFormula = async (formula: Formula) => {
    console.log("[v0] Abriendo modal editar para fórmula:", formula)
    setFormulaAEditar(formula)
    
    // Cargar datos de la fórmula desde la base de datos
    try {
      console.log("[v0] Consultando fórmula ID:", formula.id)
      const { data, error } = await supabase
        .from("formulas")
        .select("codigo, nombre, especificaciones,  tipomedida, formula")
        .eq("id", formula.id)
        .single()

      console.log("[v0] Datos recibidos:", data, "Error:", error)

      if (!error && data) {
        const formulaData = {
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          especificaciones: data.especificaciones || "",
          tipoMedida: data.tipomedida || "",
          formula: data.formula || "",
        }
        console.log("[v0] Estableciendo formulaEditada:", formulaData)
        setFormulaEditada(formulaData)
      } else {
        console.log("[v0] Error o no hay datos, usando datos de la fórmula actual")
        // Usar los datos del objeto formula que ya tenemos
        setFormulaEditada({
          codigo: formula.codigo || "",
          nombre: formula.nombre || "",
          especificaciones: formula.especificaciones || "",
          unidadMedidaId: formula.unidadMedidaId?.toString() || "",
          tipoMedida: formula.tipoMedida || "",
          formula: formula.formula || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error cargando fórmula:", error)
      // Usar los datos del objeto formula como fallback
      setFormulaEditada({
        codigo: formula.codigo || "",
        nombre: formula.nombre || "",
        especificaciones: formula.especificaciones || "",
        unidadMedidaId: formula.unidadMedidaId?.toString() || "",
        tipoMedida: formula.tipoMedida || "",
        formula: formula.formula || "",
      })
    }
    
    console.log("[v0] Abriendo modal")
    setShowModalEditarFormula(true)
  }

  // Actualizar fórmula editada
  const handleActualizarFormula = async () => {
    if (!formulaAEditar) return

    console.log("[v0] Actualizando fórmula ID:", formulaAEditar.id)
    console.log("[v0] Datos a actualizar:", formulaEditada)

    try {
      const { error } = await supabase
        .from("formulas")
        .update({
          codigo: formulaEditada.codigo,
          nombre: formulaEditada.nombre,
          especificaciones: formulaEditada.especificaciones,
          tipomedida: formulaEditada.tipoMedida,
          formula: formulaEditada.formula,
        })
        .eq("id", formulaAEditar.id)

      console.log("[v0] Actualización completada, error:", error)

      if (error) throw error

      mostrarConfirmacion("Fórmula actualizada exitosamente", "success")

      // Actualizar en el estado local
      setFormulas((prev) =>
        prev.map((f) =>
          f.id === formulaAEditar.id
            ? {
                ...f,
                codigo: formulaEditada.codigo,
                nombre: formulaEditada.nombre,
                especificaciones: formulaEditada.especificaciones,
                unidadMedidaId: Number.parseInt(formulaEditada.unidadMedidaId),
                tipoMedida: formulaEditada.tipoMedida,
                formula: formulaEditada.formula,
              }
            : f
        )
      )

      setShowModalEditarFormula(false)
      setFormulaAEditar(null)
    } catch (error) {
      console.error("Error actualizando fórmula:", error)
      mostrarConfirmacion("Error al actualizar la fórmula", "error")
    }
  }

  // Verificar si una fórmula tiene materias primas
  const verificarMateriasPrimasPorFormula = async (formulaId: number) => {
    try {
      const { data, error } = await supabase
        .from("materiasprimasxformula")
        .select("idrec")
        .eq("formulaid", formulaId)
        .limit(1)

      return !error && data && data.length > 0
    } catch (error) {
      console.error("Error verificando materias primas:", error)
      return false
    }
  }

  // Verificar si una fórmula tiene producto asignado
  const verificarProductoAsignadoPorFormula = async (formulaId: number) => {
    try {
      const { data, error } = await supabase
        .from("formulasxproducto")
        .select("idrec")
        .eq("formulaid", formulaId)
        .eq("activo", true)
        .limit(1)

      return !error && data && data.length > 0
    } catch (error) {
      console.error("Error verificando producto asignado:", error)
      return false
    }
  }

  // Cargar productos del cliente seleccionado
  const cargarProductosCliente = async () => {
    if (!clienteSeleccionado) return

    try {
      const resultado = await listaDesplegableProductosXClientes(Number.parseInt(clienteSeleccionado), -1)
      if (resultado.success && resultado.data) {
        setProductosCliente(resultado.data)
      } else {
        setProductosCliente([])
      }
    } catch (error) {
      console.error("Error cargando productos del cliente:", error)
      setProductosCliente([])
    }
  }

  const cargarDatosIniciales = async () => {
    try {
      // Cargar clientes
      const clientesResult = await listaDesplegableClientes(-1, "")
      if (clientesResult.data) {
        const clientesTransformados = clientesResult.data.map((c: any) => ({
          value: c.id?.toString() || String(c.id),
          text: c.nombre,
        }))
        setClientes(clientesTransformados)
      }

      // Cargar unidades de medida
      const unidadesResult = await listaDesplegableUnidadesMedida(-1, "")
      if (unidadesResult.data && Array.isArray(unidadesResult.data)) {
        setUnidadesMedida(unidadesResult.data)
        // Transformar para el select del modal de editar
        const unidadesTransformadas = unidadesResult.data
          .filter((u: any) => u && u.id) // Filtrar undefined
          .map((u: any) => ({
            value: u.id ? u.id.toString() : "",
            text: u.descripcion || u.text || "",
          }))
        setUnidadesMedidaOptions(unidadesTransformadas)
      }

      // Obtener nombre completo del usuario de la tabla usuarios
      if (user && user.RolId) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("nombrecompleto")
          .eq("id", user.RolId)
          .single()

        if (!error && data) {
          setCotizacion((prev) => ({
            ...prev,
            usuario: data.nombrecompleto || "",
          }))
        } else {
          // Si hay error, usar el nombre de la sesión como fallback
          setCotizacion((prev) => ({
            ...prev,
            usuario: user?.Nombre || "",
          }))
        }
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error)
      // Fallback si hay error
      setCotizacion((prev) => ({
        ...prev,
        usuario: user?.Nombre || "",
      }))
    } finally {
      setShowPageLoading(false)
    }
  }

  // Cargar cotización para editar
  const cargarCotizacionParaEditar = async (cotizacionId: number) => {
    try {
      setShowPageLoading(true)
      const resultado = await obtenerCotizacionParaEditar(cotizacionId)

      if (resultado.success && resultado.data) {
        const { cotizacion, formulas } = resultado.data

        // Llenar información básica de la cotización
        setClienteSeleccionado(cotizacion.clienteid.toString())
        setCotizacion({
          titulo: cotizacion.titulo,
          usuario: cotizacion.usuario,
          tipoCotizacion: cotizacion.tipo,
        })
        setCotizacionRegistrada(true)
        setCotizacionId(cotizacion.id)
        
        // Verificar si hay productos en la cotización
        await verificarProductosEnCotizacion(cotizacion.id)

        // Procesar y cargar fórmulas según la estructura del tipo Formula
        const formulasTransformadas: Formula[] = formulas.map((formula: any) => ({
          id: formula.formulaid || 0,
          codigo: formula.codigo || "",
          nombre: formula.nombreformula || "",
          especificaciones: formula.especificaciones || "",
          unidadMedidaId: formula.unidadmedidaid || 0,
          tipoMedida: formula.tipomedida || "",
          formula: formula.formula || "",
          costo: formula.costo || 0,
          productoNombre: formula.producto || undefined,
          estatusformula: formula.estatusformula || undefined,
        }))

        setFormulas(formulasTransformadas)

        // Actualizar estados de validación de materias primas y productos
        const verificacionesMateriasPrimas: { [key: number]: boolean } = {}
        const verificacionesProductos: { [key: number]: boolean } = {}
        const verificacionesMaterialesEnvase: { [key: number]: boolean } = {}
        
        // Verificar cada fórmula
        for (const formula of formulas) {
          console.log("[v0] Formula completa de vista:", formula)
          
          // Verificar materias primas en la base de datos
          const { data: materiasPrimas } = await supabase
            .from("materiasprimasxformula")
            .select("formulaid")
            .eq("formulaid", formula.formulaid)
            .limit(1)
          
          const tieneMateriasPrimas = materiasPrimas && materiasPrimas.length > 0
          verificacionesMateriasPrimas[formula.formulaid] = tieneMateriasPrimas
          console.log("[v0] MPs para fórmula", formula.formulaid, ":", tieneMateriasPrimas)
          
          // Verificar productos en la base de datos en lugar de confiar en el campo de la vista
          const { data: productoAsociadoData } = await supabase
            .from("formulasxproducto")
            .select("productoid")
            .eq("formulaid", formula.formulaid)
            .eq("activo", true)
          
          const productoAsociado = productoAsociadoData && productoAsociadoData.length > 0 ? productoAsociadoData[0] : null
          const tieneProducto = productoAsociado && productoAsociado.productoid ? true : false
          verificacionesProductos[formula.formulaid] = tieneProducto
          
          // Si tiene producto, obtener nombre, costo, cantidad y costo ME
          if (productoAsociado && productoAsociado.productoid) {
            const { data: productoData } = await supabase
              .from("productos")
              .select("nombre, costo, mp, ms")
              .eq("id", productoAsociado.productoid)
              .single()

            // Obtener costoparcial y cantidad de formulasxproducto
            const { data: fxpData } = await supabase
              .from("formulasxproducto")
              .select("costoparcial, cantidad")
              .eq("formulaid", formula.formulaid)
              .eq("productoid", productoAsociado.productoid)
              .eq("activo", true)
              .single()

            // Obtener suma de costoparcial de materialesetiquetadoxproducto
            const { data: materialesCostoData } = await supabase
              .from("materialesetiquetadoxproducto")
              .select("costoparcial")
              .eq("productoid", productoAsociado.productoid)
              .eq("activo", true)

            const costoME = materialesCostoData?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

            // Obtener volumen de unidades de elementosxcotizacion
            const { data: elementoData } = await supabase
              .from("elementosxcotizacion")
              .select("cantidad")
              .eq("cotizacionid", cotizacionId)
              .eq("elementoid", productoAsociado.productoid)
              .single()

            const formulaIndex = formulasTransformadas.findIndex(f => f.id === formula.formulaid)
            if (formulaIndex !== -1) {
              if (productoData) {
                formulasTransformadas[formulaIndex].productoNombre = productoData.nombre
                formulasTransformadas[formulaIndex].productoCosto = productoData.costo
              }
              formulasTransformadas[formulaIndex].productoMP = productoData?.mp || 0
              formulasTransformadas[formulaIndex].productoCostoMS = productoData?.ms || 0
              formulasTransformadas[formulaIndex].productoCantidad = fxpData?.cantidad || 0
              formulasTransformadas[formulaIndex].productoCostoME = costoME
              formulasTransformadas[formulaIndex].productoIdRef = productoAsociado.productoid
              formulasTransformadas[formulaIndex].volumenUnidades = elementoData?.cantidad || 0
            }

            console.log("[v0] Producto encontrado:", productoData?.nombre, "costo:", productoData?.costo, "cantidad:", fxpData?.cantidad, "costoME:", costoME, "volumen:", elementoData?.cantidad, "para fórmula:", formula.formulaid)
          }
          
          console.log("[v0] Verificando fórmula:", formula.formulaid, "productoid desde DB:", productoAsociado?.productoid, "tieneproducto:", tieneProducto)
          
          // Verificar materiales de envase/empaque si tiene producto
          if (productoAsociado && productoAsociado.productoid) {
            const { data: materialesEnvase, error: errorMateriales } = await supabase
              .from("materialesetiquetadoxproducto")
              .select("productoid")
              .eq("productoid", productoAsociado.productoid)
              .limit(1)
            
            const tieneMateriales = !errorMateriales && materialesEnvase && materialesEnvase.length > 0
            console.log("[v0] Materiales para producto", productoAsociado.productoid, ":", tieneMateriales, "count:", materialesEnvase?.length, "error:", errorMateriales)
            verificacionesMaterialesEnvase[formula.formulaid] = tieneMateriales
          } else {
            verificacionesMaterialesEnvase[formula.formulaid] = false
          }
        }

        setFormulasConMateriasPrimas(verificacionesMateriasPrimas)
        setFormulasConProductos(verificacionesProductos)
        setFormulasConMaterialesEnvase(verificacionesMaterialesEnvase)

        console.log("[v0] Cotización cargada:", cotizacion)
        console.log("[v0] Fórmulas cargadas:", formulasTransformadas)
        console.log("[v0] Verificaciones Productos:", verificacionesProductos)
        console.log("[v0] Verificaciones Materiales Envase:", verificacionesMaterialesEnvase)
      } else {
        alert(resultado.error || "Error al cargar la cotización")
      }
    } catch (error) {
      console.error("Error cargando cotización para editar:", error)
      alert("Error al cargar la cotización")
    } finally {
      setShowPageLoading(false)
    }
  }

  // Cargar catálogos para producto
  const cargarCatalogosProducto = async () => {
    try {
      const resultado = await obtenerFiltrosAvanzadosProductos()
      
      if (resultado.success && resultado.data) {
        setCategoriasProducto(resultado.data.categorias)
        setEnvasesProducto(resultado.data.envases)
        setPresentacionesProducto(resultado.data.presentaciones)
        setSistemasProducto(resultado.data.sistemas)
      } else {
        console.error("Error cargando catálogos:", resultado.error)
      }
    } catch (error) {
      console.error("Error cargando catálogos:", error)
    }
  }

  // Guardar nuevo producto
  const handleGuardarNuevoProducto = async () => {
    if (!nuevoProducto.nombre || !clienteSeleccionado) {
      alert("Por favor complete el nombre del producto y seleccione un cliente")
      return
    }

    try {
      setGuardandoProducto(true)

      // Obtener sistemaid si se seleccionó un sistema
      let sistemaid = null
      if (nuevoProducto.sistema) {
        const { data: sistemaData, error: sistemaError } = await supabase
          .from("sistemas")
          .select("id")
          .eq("nombre", nuevoProducto.sistema)
          .single()

        if (sistemaData && !sistemaError) {
          sistemaid = sistemaData.id
        }
      }

      // Generar código único automáticamente con prefijo 'c'
      let codigoUnico = null
      let intentos = 0
      const maxIntentos = 10
      
      while (!codigoUnico && intentos < maxIntentos) {
        const numeroAleatorio = Math.floor(Math.random() * 1000000)
        const codigoCandidato = `c${numeroAleatorio}`
        
        // Verificar si el código ya existe
        const { data: existente } = await supabase
          .from("productos")
          .select("codigo")
          .eq("codigo", codigoCandidato)
          .single()
        
        if (!existente) {
          codigoUnico = codigoCandidato
        }
        intentos++
      }
      
      if (!codigoUnico) {
        alert("Error al generar código único. Intente nuevamente.")
        setShowProcessing(false)
        return
      }

      console.log("[v0] Código autogenerado para Producto:", codigoUnico)
      
      const productoData = {
        nombre: nuevoProducto.nombre,
        codigo: codigoUnico,
        presentacionproducto: nuevoProducto.presentacion,
        envase: nuevoProducto.envase,
        categoria: nuevoProducto.categoria,
        sistemaid: sistemaid,
        cantidadpresentacion: nuevoProducto.cantidadPresentacion,
        clienteid: parseInt(clienteSeleccionado),
        activo: true,
      }

      let data, error

      if (productoEditandoId) {
        // Actualizar producto existente
        const result = await supabase
          .from("productos")
          .update(productoData)
          .eq("id", productoEditandoId)
          .select()
        
        data = result.data
        error = result.error
        
        // Actualizar formulasxproducto si existe una fórmula asociada
        if (result.data && result.data.length > 0 && formulaSeleccionada) {
          console.log("[v0] Actualizando formulasxproducto - formulaSeleccionada:", formulaSeleccionada)
          console.log("[v0] productoEditandoId:", productoEditandoId)
          
          const { data: formulaXProducto, error: errorFXP } = await supabase
            .from("formulasxproducto")
            .select("idrec, cantidad, costoparcial")
            .eq("formulaid", formulaSeleccionada.id)
            .eq("productoid", productoEditandoId)
            .eq("activo", true)
          
          const fxpData = formulaXProducto && formulaXProducto.length > 0 ? formulaXProducto[0] : null
          
          console.log("[v0] formulaXProducto encontrado:", fxpData, "error:", errorFXP)
          
          if (fxpData) {
            // Actualizar la cantidad en formulasxproducto con la nueva cantidadpresentacion
            const nuevaCantidad = parseFloat(nuevoProducto.cantidadPresentacion) || 0
            
            // Calcular el nuevo costo parcial: cantidad * costo de la fórmula
            const nuevoCostoParcial = nuevaCantidad * (formulaSeleccionada.costo || 0)
            
            console.log("[v0] Actualizando FXP - idrec:", fxpData.idrec, "nuevaCantidad:", nuevaCantidad, "nuevoCostoParcial:", nuevoCostoParcial)
            
            const { data: updateResult, error: updateError } = await supabase
              .from("formulasxproducto")
              .update({
                cantidad: nuevaCantidad,
                costoparcial: nuevoCostoParcial
              })
              .eq("idrec", fxpData.idrec)
              .select()
            
            console.log("[v0] Resultado actualización FXP:", updateResult, "error:", updateError)
          }
        }
      } else {
        // Insertar nuevo producto
        const result = await supabase
          .from("productos")
          .insert([productoData])
          .select()
        
        data = result.data
        error = result.error
      }

      if (error) throw error

      if (data && data.length > 0) {
        setMensajeConfirmacion(productoEditandoId ? "Producto actualizado exitosamente" : "Producto registrado exitosamente")
        setTipoConfirmacion("success")
        setShowModalConfirmacion(true)
        
        // Limpiar formulario
        setNuevoProducto({
          nombre: "",
          clave: "",
          presentacion: "",
          envase: "",
          objetivo: "",
          categoria: "",
          sistema: "",
          codigomaestro: "",
          cantidadPresentacion: "",
          imgUrl: "",
        })
        setProductoEditandoId(null)
        setShowModalRegistrarProducto(false)
        
        // Recargar productos del cliente
        const resultado = await listaDesplegableProductosXClientes(parseInt(clienteSeleccionado), -1)
        if (resultado.success && resultado.data) {
          setProductosCliente(resultado.data)
        }
        
        // Si se está editando desde el modal de asignar, recargar el producto asignado y la lista de fórmulas
        if (productoEditandoId && formulaSeleccionada) {
          console.log("[v0] Recargando producto editado ID:", productoEditandoId)
          // Recargar el producto actualizado con todos sus datos
          const { data: productoActualizado, error: errorRecarga } = await supabase
            .from("productos")
            .select("id, nombre, codigo, costo, presentacionproducto, envase, categoria, codigomaestro, cantidadpresentacion, imgurl")
            .eq("id", productoEditandoId)
            .single()
          
          console.log("[v0] Producto recargado:", productoActualizado, "Error:", errorRecarga)
          
          if (productoActualizado) {
            setProductoAsignadoActual(productoActualizado)
            
            // Recargar la lista completa de fórmulas para actualizar los costos
            if (cotizacionId) {
              console.log("[v0] Recargando cotización ID:", cotizacionId)
              await cargarCotizacionParaEditar(cotizacionId)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error guardando producto:", error)
      setMensajeConfirmacion("Error al guardar el producto")
      setTipoConfirmacion("error")
      setShowModalConfirmacion(true)
    } finally {
      setGuardandoProducto(false)
    }
  }

  // Paso 2: Agregar Cliente
  const handleAgregarCliente = async () => {
    if (!nuevoCliente.nombre) {
      alert("Por favor complete el campo Nombre")
      return
    }

    try {
      setShowProcessing(true)

      // Generar clave aleatoria con prefijo 'c'
      const claveGenerada = `c${Math.floor(Math.random() * 1000000)}`

      // Insertar cliente en la base de datos
      const { data, error } = await supabase
        .from("clientes")
        .insert([
          {
            nombre: nuevoCliente.nombre,
            clave: claveGenerada,
            direccion: nuevoCliente.direccion,
            telefono: nuevoCliente.telefono,
            email: nuevoCliente.email,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        const clienteCreado = data[0]
        // Agregar al dropdown
        const nuevoClienteOption = {
          value: clienteCreado.id.toString(),
          text: clienteCreado.nombre,
        }
        setClientes((prev) => [...prev, nuevoClienteOption])
        setClienteSeleccionado(clienteCreado.id.toString())

        // Limpiar formulario
        setNuevoCliente({
          nombre: "",
          clave: "",
          direccion: "",
          telefono: "",
          email: "",
        })
        setShowModalCliente(false)
      }
    } catch (error) {
      console.error("Error agregando cliente:", error)
      alert("Error al agregar el cliente")
    } finally {
      setShowProcessing(false)
    }
  }

  // Paso 3: Registrar Cotización
  const handleRegistrarCotizacion = async () => {
    if (!clienteSeleccionado) {
      alert("Por favor seleccione un cliente")
      return
    }

    if (!cotizacion.titulo) {
      alert("Por favor ingrese un título para la cotización")
      return
    }

    try {
      setShowProcessing(true)

      // Insertar cotización en la base de datos
      const { data, error } = await supabase
        .from("cotizaciones")
        .insert([
          {
            titulo: cotizacion.titulo,
            usuarioid: user?.RolId,
            tipo: cotizacion.tipoCotizacion,
            clienteid: Number.parseInt(clienteSeleccionado),
            volumen: cotizacion.volumen || null,
            estatus: "Para revision",
            activo: true,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        const cotizacionCreada = data[0]
        setCotizacionId(cotizacionCreada.id)
        setCotizacionRegistrada(true)
        mostrarConfirmacion("Cotización registrada exitosamente", "success")
      }
    } catch (error) {
      console.error("Error registrando cotización:", error)
      mostrarConfirmacion("Error al registrar la cotización", "error")
    } finally {
      setShowProcessing(false)
    }
  }

  // Paso 4: Registrar Fórmula
  const handleRegistrarFormula = async () => {
    if (!nuevaFormula.nombre || !nuevaFormula.formula) {
      alert("Por favor complete los campos obligatorios (Nombre y Fórmula)")
      return
    }

    try {
      setShowProcessing(true)

      // Usar código ingresado o generar uno automático con prefijo 'c'
      let codigoFinal = nuevaFormula.codigo.trim()
      if (!codigoFinal) {
        let codigoUnico = null
        let intentos = 0
        const maxIntentos = 10

        while (!codigoUnico && intentos < maxIntentos) {
          const numeroAleatorio = Math.floor(Math.random() * 1000000)
          const codigoCandidato = `c${numeroAleatorio}`
          const { data: existente } = await supabase
            .from("formulas")
            .select("codigo")
            .eq("codigo", codigoCandidato)
            .single()
          if (!existente) codigoUnico = codigoCandidato
          intentos++
        }

        if (!codigoUnico) {
          alert("Error al generar código único. Intente nuevamente.")
          setShowProcessing(false)
          return
        }
        codigoFinal = codigoUnico
      }

      // Insertar fórmula en la base de datos
      const { data, error } = await supabase
        .from("formulas")
        .insert([
          {
            codigo: codigoFinal,
            nombre: nuevaFormula.nombre,
            especificaciones: nuevaFormula.especificaciones,
            tipomedida: nuevaFormula.tipoMedida,
            formula: nuevaFormula.formula,
            clienteid: Number.parseInt(clienteSeleccionado),
            estatus: "Pendiente",
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        const formulaCreada = data[0]

        // Verificar si ya existe relación en formulasxproducto para actualizar estatus
        try {
          const { data: relacionProducto } = await supabase
            .from("formulasxproducto")
            .select("productoid")
            .eq("formulaid", formulaCreada.id)
            .eq("activo", true)
            .limit(1)

          if (relacionProducto && relacionProducto.length > 0) {
            const productoid = relacionProducto[0].productoid

            const { data: relacionMateriales } = await supabase
              .from("materialesetiquetadoxproducto")
              .select("id")
              .eq("productoid", productoid)
              .eq("activo", true)
              .limit(1)

            if (relacionMateriales && relacionMateriales.length > 0) {
              await supabase
                .from("formulas")
                .update({ estatus: "Para revision" })
                .eq("id", formulaCreada.id)
            }
          }
        } catch (errorEstatus) {
          console.log("[v0] Error verificando estatus de fórmula:", errorEstatus)
        }

        // Buscar producto relacionado desde formulasxproducto
        let productoNombre = ""
        try {
          const { data: formulaProducto, error: errorProducto } = await supabase
            .from("formulasxproducto")
            .select(`
              productoid,
              productos:productoid(nombre)
            `)
            .eq("formulaid", formulaCreada.id)
            .eq("activo", true)
          
          if (!errorProducto && formulaProducto && formulaProducto.length > 0) {
            const prod = formulaProducto[0]
            if (prod && prod.productos) {
              productoNombre = prod.productos.nombre || ""
            }
          }
        } catch (error) {
          console.log("[v0] Error buscando producto:", error)
        }

        console.log("proudcco" , productoNombre)
        
        const nuevaFormulaObj: Formula = {
          id: formulaCreada.id,
          codigo: formulaCreada.codigo,
          nombre: formulaCreada.nombre,
          especificaciones: formulaCreada.especificaciones,
          unidadMedidaId: formulaCreada.unidadmedidaid,
          tipoMedida: formulaCreada.tipomedida,
          formula: formulaCreada.formula,
          costo: 0,
          productoNombre: productoNombre,
        }

        // Insertar en tabla elementosxcotizacion
        const hoy = new Date().toISOString().split("T")[0] // Fecha en formato YYYY-MM-DD
        const { error: errorElemento } = await supabase
          .from("elementosxcotizacion")
          .insert([
            {
              cotizacionid: cotizacionId,
              tipoelemento: cotizacion.tipoCotizacion,
              elementoid: formulaCreada.id,
              fechacreacion: hoy,
              activo: true,
            },
          ])

        if (errorElemento) {
          console.error("Error registrando elemento en cotización:", errorElemento)
          // No detener el flujo si hay error en elementosxcotizacion
        }

        // Verificar si hay datos de derivación en sessionStorage
        const datosDerivacionStr = sessionStorage.getItem("formulaDerivada")
        if (datosDerivacionStr) {
          try {
            const datosDerivacion = JSON.parse(datosDerivacionStr)
            console.log("[v0] Copiando materias primas y fórmulas de derivación...")

            // Copiar materias primas
            if (datosDerivacion.materiasPrimas && datosDerivacion.materiasPrimas.length > 0) {
              const materiasPrimasInsert = datosDerivacion.materiasPrimas.map((mp: any) => ({
                formulaid: formulaCreada.id,
                materiaprimaid: mp.materiaprimaid,
                cantidad: mp.cantidad,
                costoparcial: mp.costoparcial,
                activo: true,
              }))

              const { error: errorMPs } = await supabase
                .from("materiasprimasxformula")
                .insert(materiasPrimasInsert)

              if (errorMPs) {
                console.error("[v0] Error copiando materias primas:", errorMPs)
              } else {
                console.log("[v0] Materias primas copiadas exitosamente")
              }
            }

            // Copiar fórmulas
            if (datosDerivacion.formulas && datosDerivacion.formulas.length > 0) {
            const formulasInsert = datosDerivacion.formulas.map((f: any) => ({
                formulaid: formulaCreada.id,
                secundariaid: f.secundariaid,
                cantidad: f.cantidad,
                costoparcial: f.costoparcial,
                activo: true,
              }))

              const { error: errorFormulas } = await supabase
                .from("formulasxformula")
                .insert(formulasInsert)

              if (errorFormulas) {
                console.error("[v0] Error copiando fórmulas:", errorFormulas)
              } else {
                console.log("[v0] Fórmulas copiadas exitosamente")
              }
            }

            // Actualizar el costo de la fórmula después de copiar MPs y fórmulas
            const { data: costosMPs } = await supabase
              .from("materiasprimasxformula")
              .select("costoparcial")
              .eq("formulaid", formulaCreada.id)
              .eq("activo", true)
            
            const { data: costosFormulas } = await supabase
              .from("formulasxformula")
              .select("costoparcial")
              .eq("formulaid", formulaCreada.id)
              .eq("activo", true)
            
            const costoTotalMPs = costosMPs?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
            const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
            const costoTotalFormula = costoTotalMPs + costoTotalFormulas
            
            console.log("[v0] Actualizando costo de fórmula derivada:", formulaCreada.id, "MPs:", costoTotalMPs, "Formulas:", costoTotalFormulas, "Total:", costoTotalFormula)
            
            const { error: errorUpdateCosto } = await supabase
              .from("formulas")
              .update({ costo: costoTotalFormula })
              .eq("id", formulaCreada.id)
            
            if (errorUpdateCosto) {
              console.error("[v0] Error actualizando costo de fórmula derivada:", errorUpdateCosto)
            } else {
              console.log("[v0] Costo de fórmula derivada actualizado exitosamente")
              // Actualizar el objeto de la nueva fórmula con el costo correcto
              nuevaFormulaObj.costo = costoTotalFormula
            }

            // Limpiar sessionStorage después de copiar
            sessionStorage.removeItem("formulaDerivada")
          } catch (error) {
            console.error("[v0] Error procesando datos de derivación:", error)
          }
        }

        const formulasConProductos = await cargarProductosDeFormulas([...formulas, nuevaFormulaObj])
        setFormulas(formulasConProductos)

        // Limpiar formulario
        setCodigoValidado(false)
        setNuevaFormula({
          codigo: "",
          nombre: "",
          especificaciones: "",
          unidadMedidaId: "",
          tipoMedida: "",
          formula: "",
        })
        setShowModalFormula(false)
      }
    } catch (error) {
      console.error("Error registrando fórmula:", error)
      alert("Error al registrar la fórmula")
    } finally {
      setShowProcessing(false)
    }
  }

  // Abrir modal de Materias Primas
  const handleAbrirMateriasPrimas = async (formula: Formula) => {
    setFormulaSeleccionada(formula)
    setShowModalMateriasPrimas(true)
    setMpModificadas(new Set())
    setFormulasModificadas(new Set())

    // Cargar unidades de medida para el select
    const unidadesResult = await listaDesplegableUnidadesMedida(-1, "")
    if (unidadesResult.data && Array.isArray(unidadesResult.data)) {
      setUnidadesMedidaOptions(unidadesResult.data)
    }

    // Cargar materias primas agregadas a esta fórmula
    try {
      const { data, error } = await supabase
        .from("materiasprimasxformula")
        .select(`
          idrec,
          formulaid,
          materiaprimaid,
          cantidad,
          costoparcial,
          materiasprima:materiaprimaid(
            id, 
            codigo, 
            nombre, 
            costo, 
            unidadmedidaid,
            factorimportacion,
            costoconfactorimportacion,
            unidadesmedida:unidadmedidaid(id, descripcion)
          )
        `)
        .eq("formulaid", formula.id)
      
      // Cargar fórmulas agregadas a esta fórmula
      const { data: formulasData, error: errorFormulas } = await supabase
        .from("formulasxformula")
        .select(`
          idrec,
          formulaid,
          secundariaid,
          cantidad,
          costoparcial,
          formulas:secundariaid(
            id,
            codigo,
            nombre,
            costo,
            unidadmedidaid,
            unidadesmedida:unidadmedidaid(id, descripcion)
          )
        `)
        .eq("formulaid", formula.id)
        .eq("activo", true)

      console.log("[v0] Al abrir modal - fórmulas cargadas:", formulasData, "error:", errorFormulas)

      console.log("[v0] Al abrir modal - materias primas cargadas:", data, "error:", error)
      if (!error && data) {
        console.log("[v0] Materias primas cargadas para fórmula", formula.id, ":", data.length, "registros")
        setMateriasPrimasAgregadas(data)
        // Guardar valores originales de cantidad para detectar restauraciones
        const originales = new Map<number, number>()
        data.forEach((item: any) => originales.set(item.idrec, item.cantidad))
        setMpValoresOriginales(originales)
      }
      
      if (!errorFormulas && formulasData) {
        console.log("[v0] Fórmulas cargadas para fórmula", formula.id, ":", formulasData.length, "registros")
        setFormulasAgregadas(formulasData)
        // Guardar valores originales de cantidad de fórmulas
        const originalesFormulas = new Map<number, number>()
        formulasData.forEach((item: any) => originalesFormulas.set(item.idrec, item.cantidad))
        setFormulasValoresOriginales(originalesFormulas)
      } else if (errorFormulas) {
        console.error("[v0] Error cargando fórmulas:", errorFormulas)
      }
    } catch (error) {
      console.error("Error cargando materias primas y fórmulas:", error)
    }
  }

  // Buscar materias primas mientras escribe
  const handleMateriaPrimaSearch = async (searchText: string) => {
    setMateriaPrimaInput(searchText)

    if (searchText.trim().length >= 2) {
      const results = await listaDesplegableMateriasPrimasBuscar(searchText)
      setMateriaPrimaSearchResults(results)
      setShowMateriaPrimaDropdown(true)
    } else {
      setMateriaPrimaSearchResults([])
      setShowMateriaPrimaDropdown(false)
    }
  }

  // Seleccionar materia prima del listado
  const handleSeleccionarMateriaPrima = async (item: any) => {
    setMateriaPrimaInput(item.text)
    setMateriaPrimaId(Number(item.value))
    setShowMateriaPrimaDropdown(false)

    // Obtener detalles de la materia prima (unidad de medida y costo)
    const result = await obtenerMateriasPrimas(Number(item.value), "", "", "Todos", -1, -1)
    if (result.success && result.data && result.data.length > 0) {
      const materiaPrima = result.data[0]
      setUnidadMedidaIdMP(materiaPrima.unidadmedidaid?.toString() || "")
      setCostoUnitarioMP(materiaPrima.costo?.toString() || "0")
    }
  }

  // Agregar materia prima a la fórmula
  const handleAgregarMateriaPrimaAFormula = async () => {
    // Validar solo los campos de la sección Agregar Materia Prima
    if (!materiaPrimaId || !materiaPrimaInput.trim()) {
      alert("Por favor seleccione una materia prima")
      return
    }
    if (!cantidadMateriaPrima || Number.parseFloat(cantidadMateriaPrima) <= 0) {
      alert("Por favor ingrese una cantidad válida")
      return
    }
    if (!unidadMedidaIdMP) {
      alert("Por favor seleccione una unidad de medida")
      return
    }
    if (!costoUnitarioMP || Number.parseFloat(costoUnitarioMP) <= 0) {
      alert("El costo unitario no es válido")
      return
    }

    try {
      setShowProcessing(true)

      const cantidadValue = Number.parseFloat(cantidadMateriaPrima)
      const costoValue = cantidadValue * Number.parseFloat(costoUnitarioMP)

      console.log("[v0] Insertando materia prima - formulaId:", formulaSeleccionada?.id, "materiaPrimaId:", materiaPrimaId, "cantidad:", cantidadValue, "costo:", costoValue)

      const { error } = await supabase
        .from("materiasprimasxformula")
        .insert([
          {
            formulaid: formulaSeleccionada.id,
            materiaprimaid: materiaPrimaId,
            cantidad: cantidadValue,
            costoparcial: costoValue,
            activo: true,
          },
        ])

      if (error) throw error

      // Actualizar el costo de la fórmula sumando MPs y fórmulas secundarias
      const { data: costosData } = await supabase
        .from("materiasprimasxformula")
        .select("costoparcial")
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)
      
      const { data: costosFormulas } = await supabase
        .from("formulasxformula")
        .select("costoparcial")
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)
      
      const costoTotalMPs = costosData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
      const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
      const costoTotal = costoTotalMPs + costoTotalFormulas
      
      console.log("[v0] Actualizando costo de fórmula:", formulaSeleccionada.id, "MPs:", costoTotalMPs, "Formulas:", costoTotalFormulas, "Total:", costoTotal)
      
      const { error: errorUpdateCosto } = await supabase
        .from("formulas")
        .update({ costo: costoTotal })
        .eq("id", formulaSeleccionada.id)
      
      if (errorUpdateCosto) {
        console.error("[v0] Error actualizando costo de fórmula:", errorUpdateCosto)
      }

      // Actualizar el estado de fórmulas con el nuevo costo
      setFormulas(prevFormulas =>
        prevFormulas.map(f =>
          f.id === formulaSeleccionada.id ? { ...f, costo: costoTotal } : f
        )
      )

      // Actualizar formulasxproducto si la fórmula está relacionada a un producto
      const { data: formulaXProductoData } = await supabase
        .from("formulasxproducto")
        .select("idrec, cantidad, productoid")
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)
      
      if (formulaXProductoData && formulaXProductoData.length > 0) {
        const fxp = formulaXProductoData[0]
        const nuevoCostoParcial = fxp.cantidad * costoTotal
        
        console.log("[v0] Actualizando formulasxproducto - costoparcial:", nuevoCostoParcial)
        
        // Actualizar costoparcial en formulasxproducto
        const { error: errorUpdateFXP } = await supabase
          .from("formulasxproducto")
          .update({ costoparcial: nuevoCostoParcial })
          .eq("idrec", fxp.idrec)
        
        if (errorUpdateFXP) {
          console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
        } else {
          // Actualizar el producto
          const productoid = fxp.productoid
          
          // 1. MP = costoparcial de formulasxproducto
          const mp = nuevoCostoParcial
          
          // 2. Obtener ME y MEM del producto
          const { data: materialesEtiquetado } = await supabase
            .from("materialesetiquetadoxproducto")
            .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
            .eq("productoid", productoid)
            .eq("activo", true)
          
          const me = materialesEtiquetado
            ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
            .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
          
          const mem = materialesEtiquetado
            ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
            .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
          
          // 3. Calcular MS = (MP + ME + MEM) * 0.03
          const ms = (mp + me + mem) * 0.03
          
          // 4. Calcular Costo Total = MP + ME + MEM + MS
          const costoProducto = mp + me + mem + ms
          
          console.log("[v0] Actualizando producto - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)
          
          // 5. Actualizar el producto
          const { error: errorUpdateProducto } = await supabase
            .from("productos")
            .update({
              mp: mp,
              ms: ms,
              costo: costoProducto
            })
            .eq("id", productoid)
          
          if (errorUpdateProducto) {
            console.error("Error actualizando producto:", errorUpdateProducto)
          }
        }
      }

      mostrarConfirmacion("Materia prima agregada exitosamente", "success")

      // Recargar la tabla de materias primas
      if (formulaSeleccionada) {
        console.log("[v0] Recargando materias primas después de agregar")
        const { data, error: errorLoad } = await supabase
          .from("materiasprimasxformula")
          .select(`
            idrec,
            formulaid,
            materiaprimaid,
            cantidad,
            costoparcial,
            materiasprima:materiaprimaid(
              id, 
              codigo, 
              nombre, 
              costo, 
              unidadmedidaid,
              factorimportacion,
              costoconfactorimportacion,
              unidadesmedida:unidadmedidaid(id, descripcion)
            )
          `)
          .eq("formulaid", formulaSeleccionada.id)

        console.log("[v0] Materias primas después de agregar:", data)
        console.log("[v0] Error al recargar:", errorLoad)

        if (!errorLoad && data) {
          console.log("[v0] Actualizando estado con", data.length, "materias primas")
          setMateriasPrimasAgregadas(data)
          console.log("[v0] Estado materiasPrimasAgregadas después de set:", data)
        } else {
          console.log("[v0] No se actualizó el estado - error:", errorLoad)
        }
      }

      // Limpiar campos
      setMateriaPrimaInput("")
      setMateriaPrimaId(null)
      setCantidadMateriaPrima("")
      setUnidadMedidaIdMP("")
      setCostoUnitarioMP("")
    } catch (error) {
      console.error("Error agregando materia prima:", error)
      alert("Error al agregar la materia prima")
    } finally {
      setShowProcessing(false)
    }
  }

  // Registrar y agregar materia prima nueva (cotizada)
  const handleRegistrarMateriaPrimaNueva = async () => {
    if (
      !nuevaMateriaPrima.nombre ||
      !nuevaMateriaPrima.cantidad ||
      !nuevaMateriaPrima.costoUnitario ||
      !nuevaMateriaPrima.unidadMedidaId ||
      !formulaSeleccionada
    ) {
      alert("Por favor complete todos los campos")
      return
    }

    try {
      setShowProcessing(true)

      // Generar código único automáticamente con prefijo 'c'
      let codigoUnico = null
      let intentos = 0
      const maxIntentos = 10
      
      while (!codigoUnico && intentos < maxIntentos) {
        const numeroAleatorio = Math.floor(Math.random() * 1000000)
        const codigoCandidato = `c${numeroAleatorio}`
        
        // Verificar si el código ya existe
        const { data: existente } = await supabase
          .from("materiasprima")
          .select("codigo")
          .eq("codigo", codigoCandidato)
          .single()
        
        if (!existente) {
          codigoUnico = codigoCandidato
        }
        intentos++
      }
      
      if (!codigoUnico) {
        alert("Error al generar código único. Intente nuevamente.")
        setShowProcessing(false)
        return
      }

      console.log("[v0] Código autogenerado para MP:", codigoUnico)

      // Insertar materia prima
        const { data: mpData, error: mpError } = await supabase
        .from("materiasprima")
        .insert([
          {
            codigo: codigoUnico,
            proveedor: nuevaMateriaPrima.proveedor || null,
            nombre: nuevaMateriaPrima.nombre,
            unidadmedidaid: parseInt(nuevaMateriaPrima.unidadMedidaId),
            costo: parseFloat(nuevaMateriaPrima.costoUnitario),
          },
        ])
        .select()

      if (mpError) throw mpError

      if (mpData && mpData.length > 0) {
        const mpCreada = mpData[0]

        // Agregar a materiasprimasxformula
        const cantidad = parseFloat(nuevaMateriaPrima.cantidad)
        const costo = cantidad * parseFloat(nuevaMateriaPrima.costoUnitario)

        const { error: relError } = await supabase
          .from("materiasprimasxformula")
          .insert([
            {
              formulaid: formulaSeleccionada.id,
              materiaprimaid: mpCreada.id,
              cantidad: cantidad,
              costoparcial: costo,
              activo: true,
            },
          ])

        if (relError) throw relError

        mostrarConfirmacion("Materia prima nueva agregada exitosamente", "success")

        // Recargar la tabla de materias primas
        if (formulaSeleccionada) {
          const { data: materiasActualizadas, error: errorLoad } = await supabase
            .from("materiasprimasxformula")
            .select(`
              idrec,
              formulaid,
              materiaprimaid,
              cantidad,
              costoparcial,
              materiasprima:materiaprimaid(
                id, 
                codigo, 
                nombre, 
                costo, 
                unidadmedidaid,
                factorimportacion,
                costoconfactorimportacion,
                unidadesmedida:unidadmedidaid(id, descripcion)
              )
            `)
            .eq("formulaid", formulaSeleccionada.id)

          if (!errorLoad && materiasActualizadas) {
            setMateriasPrimasAgregadas(materiasActualizadas)
          }
        }

        // Limpiar formulario
        setNuevaMateriaPrima({
          codigo: "",
          nombre: "",
          cantidad: "",
          unidadMedidaId: "",
          costoUnitario: "",
        })
        setCodigoMPValidado(false)
        setShowNuevaMateriaPrimaForm(false)
      }
    } catch (error) {
      console.error("Error registrando materia prima nueva:", error)
      alert("Error al registrar la materia prima nueva")
    } finally {
      setShowProcessing(false)
    }
  }

  // Finalizar y actualizar materias primas
  // Abrir modal de productos
  const handleAbrirProductos = async (formula: Formula) => {
    setFormulaSeleccionada(formula)
    
    // Verificar si la fórmula ya tiene un producto asignado
    try {
      const { data, error } = await supabase
        .from("formulasxproducto")
        .select(`
          idrec,
          formulaid,
          productoid,
          cantidad,
          productos:productoid(
            id,
            codigo,
            nombre,
            descripcion:producto,
            imgurl,
            envase,
            cantidadpresentacion,
            presentacionproducto
          )
        `)
        .eq("formulaid", formula.id)
        .eq("activo", true)
        .single()

      if (!error && data && data.productos) {
        setProductoAsignadoActual(data.productos)
      } else {
        setProductoAsignadoActual(null)
      }
    } catch (error) {
      console.error("Error cargando producto asignado:", error)
      setProductoAsignadoActual(null)
    }
    
    setShowModalProducto(true)
  }

  // Seleccionar producto del listado
  const handleSeleccionarProducto = (producto: any) => {
    setProductoId(Number(producto.id))
    setProductoInput(`${producto.codigo} - ${producto.nombre}`)
    setProductoSeleccionado(producto)
    setShowProductosDropdown(false)
  }

  // Desasociar producto de la fórmula
  const handleDesasociarProducto = async () => {
    if (!formulaSeleccionada) {
      alert("No hay fórmula seleccionada")
      return
    }

    if (!confirm("¿Está seguro que desea desasociar el producto de esta fórmula?")) {
      return
    }

    try {
      // Obtener el productoid del producto actualmente asignado a esta fórmula
      const { data: formulaProductoData } = await supabase
        .from("formulasxproducto")
        .select("productoid")
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)
        .single()
      
      if (!formulaProductoData) {
        alert("No hay producto asociado a esta fórmula")
        return
      }
      
      const productoIdDesasociar = formulaProductoData.productoid
      
      // Eliminar el registro en formulasxproducto
      const { error } = await supabase
        .from("formulasxproducto")
        .delete()
        .eq("formulaid", formulaSeleccionada.id)
        .eq("productoid", productoIdDesasociar)

      if (error) throw error

      // Eliminar el producto de elementosxcotizacion si existe
      if (cotizacionId) {
        const { error: errorElemento } = await supabase
          .from("elementosxcotizacion")
          .delete()
          .eq("cotizacionid", cotizacionId)
          .eq("elementoid", productoIdDesasociar)
          .eq("tipoelemento", "Producto")

        if (errorElemento) {
          console.error("Error eliminando de elementosxcotizacion:", errorElemento)
        } else {
          console.log("[v0] Producto eliminado de elementosxcotizacion")
        }
      }

      mostrarConfirmacion("Producto desasociado exitosamente", "success")

      // Actualizar verificación de producto asignado para esta fórmula
      const tieneProducto = await verificarProductoAsignadoPorFormula(formulaSeleccionada.id)
      console.log("[v0] Producto desasociado - tieneProducto:", tieneProducto, "para fórmula:", formulaSeleccionada.id)
      
      setFormulasConProductos(prev => ({
        ...prev,
        [formulaSeleccionada.id]: tieneProducto
      }))
      
      // Limpiar el nombre del producto en las fórmulas
      setFormulas(prevFormulas => 
        prevFormulas.map(f => 
          f.id === formulaSeleccionada.id 
            ? { ...f, productoNombre: undefined, productoCosto: undefined, productoMP: undefined, productoCostoMS: undefined, productoCantidad: undefined, productoCostoME: undefined, productoIdRef: undefined, volumenUnidades: undefined }
            : f
        )
      )
      
      // Limpiar materiales ya que no hay producto
      setFormulasConMaterialesEnvase(prev => ({
        ...prev,
        [formulaSeleccionada.id]: false
      }))

      // Al desasociar el producto, regresar estatus a "Pendiente"
      await supabase
        .from("formulas")
        .update({ estatus: "Pendiente" })
        .eq("id", formulaSeleccionada.id)

      // Regresar estatus de cotización a "Pendiente"
      if (cotizacionId) {
        await supabase.from("cotizaciones").update({ estatus: "Pendiente" }).eq("id", cotizacionId)
      }

      setFormulas(prevFormulas =>
        prevFormulas.map(f =>
          f.id === formulaSeleccionada.id
            ? { ...f, estatusformula: "Pendiente" }
            : f
        )
      )

      // Limpiar estado
      setProductoAsignadoActual(null)
      
      // Recargar listado de productos para mostrar el producto desasociado
      await cargarProductosCliente()
      
      setShowModalProducto(false)
    } catch (error) {
      console.error("Error desasociando producto:", error)
      alert("Error al desasociar el producto")
    }
  }

  // Asignar producto a la fórmula
  // Buscar fórmulas para elaboración
  const handleFormulaElabSearch = async (searchText: string) => {
    setFormulaElabInput(searchText)

    if (searchText.trim().length >= 2) {
      const { listaDesplegableFormulasBuscar } = await import("@/app/actions/formulas")
      const resultados = await listaDesplegableFormulasBuscar(searchText)
      if (resultados.success && resultados.data) {
        setFormulaElabSearchResults(resultados.data)
        setShowFormulaElabDropdown(true)
      }
    } else {
      setFormulaElabSearchResults([])
      setShowFormulaElabDropdown(false)
    }
  }

  // Seleccionar fórmula en elaboración
  const handleFormulaElabSelect = async (item: any) => {
    setFormulaElabInput(item.text)
    setShowFormulaElabDropdown(false)

    try {
      const { data: formulaData } = await supabase
        .from("formulas")
        .select("id, codigo, nombre, costo, unidadmedidaid, unidadesmedida:unidadmedidaid(id, descripcion)")
        .eq("id", Number(item.value))
        .single()

      if (formulaData) {
        setFormulaElabSeleccionada(formulaData)
        setUnidadMedidaIdFormulaElab(formulaData.unidadmedidaid?.toString() || "")
        setCostoUnitarioFormulaElab(formulaData.costo?.toFixed(6) || "0.000000")
      }
    } catch (error) {
      console.error("Error cargando fórmula:", error)
    }
  }

  // Agregar fórmula a la elaboración
  const handleAgregarFormulaAFormula = async () => {
    if (!formulaElabSeleccionada) {
      alert("Por favor seleccione una fórmula")
      return
    }
    if (!cantidadFormulaElab || Number.parseFloat(cantidadFormulaElab) <= 0) {
      alert("Por favor ingrese una cantidad válida")
      return
    }

    try {
      setShowProcessing(true)

      const cantidadValue = Number.parseFloat(cantidadFormulaElab)
      const costoValue = cantidadValue * Number.parseFloat(costoUnitarioFormulaElab)

      const { error } = await supabase
        .from("formulasxformula")
        .insert([
          {
            formulaid: formulaSeleccionada.id,
            secundariaid: formulaElabSeleccionada.id,
            cantidad: cantidadValue,
            costoparcial: costoValue,
            activo: true,
          },
        ])

      if (error) throw error

      // Actualizar el costo de la fórmula sumando materias primas y fórmulas
      const { data: costosMPs } = await supabase
        .from("materiasprimasxformula")
        .select("costoparcial")
        .eq("formulaid", formulaSeleccionada.id)
      
      const { data: costosFormulas } = await supabase
        .from("formulasxformula")
        .select("costoparcial")
        .eq("formulaid", formulaSeleccionada.id)
      
      const costoTotalMPs = costosMPs?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
      const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
      const costoTotal = costoTotalMPs + costoTotalFormulas
      
      const { error: errorUpdateCosto } = await supabase
        .from("formulas")
        .update({ costo: costoTotal })
        .eq("id", formulaSeleccionada.id)
      
      if (errorUpdateCosto) {
        console.error("Error actualizando costo:", errorUpdateCosto)
      }

      // Actualizar el estado de fórmulas con el nuevo costo
      setFormulas(prevFormulas =>
        prevFormulas.map(f =>
          f.id === formulaSeleccionada.id ? { ...f, costo: costoTotal } : f
        )
      )

      // Actualizar formulasxproducto si la fórmula está relacionada a un producto
      const { data: formulaXProductoData } = await supabase
        .from("formulasxproducto")
        .select("idrec, cantidad, productoid")
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)
      
      if (formulaXProductoData && formulaXProductoData.length > 0) {
        const fxp = formulaXProductoData[0]
        const nuevoCostoParcial = fxp.cantidad * costoTotal
        
        console.log("[v0] Actualizando formulasxproducto - costoparcial:", nuevoCostoParcial)
        
        // Actualizar costoparcial en formulasxproducto
        const { error: errorUpdateFXP } = await supabase
          .from("formulasxproducto")
          .update({ costoparcial: nuevoCostoParcial })
          .eq("idrec", fxp.idrec)
        
        if (errorUpdateFXP) {
          console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
        } else {
          console.log("[v0] formulasxproducto actualizado exitosamente")
          
          // Actualizar el producto
          const productoid = fxp.productoid
          
          // 1. MP = costoparcial de formulasxproducto
          const mp = nuevoCostoParcial
          
          // 2. Obtener ME y MEM del producto
          const { data: materialesEtiquetado } = await supabase
            .from("materialesetiquetadoxproducto")
            .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
            .eq("productoid", productoid)
            .eq("activo", true)
          
          const me = materialesEtiquetado
            ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
            .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
          
          const mem = materialesEtiquetado
            ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
            .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
          
          // 3. Calcular MS = (MP + ME + MEM) * 0.03
          const ms = (mp + me + mem) * 0.03
          
          // 4. Calcular Costo Total = MP + ME + MEM + MS
          const costoProducto = mp + me + mem + ms
          
          console.log("[v0] Actualizando producto - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)
          
          // 5. Actualizar el producto
          const { error: errorUpdateProducto } = await supabase
            .from("productos")
            .update({
              mp: mp,
              ms: ms,
              costo: costoProducto
            })
            .eq("id", productoid)
          
          if (errorUpdateProducto) {
            console.error("Error actualizando producto:", errorUpdateProducto)
          } else {
            console.log("[v0] Producto actualizado exitosamente")
          }
        }
      }

      mostrarConfirmacion("Fórmula agregada exitosamente", "success")

      // Recargar la tabla de fórmulas
      const { data, error: errorLoad } = await supabase
        .from("formulasxformula")
        .select(`
          idrec,
          formulaid,
          secundariaid,
          cantidad,
          costoparcial,
          formulas:secundariaid(
            id,
            codigo,
            nombre,
            costo,
            unidadmedidaid,
            unidadesmedida:unidadmedidaid(id, descripcion)
          )
        `)
        .eq("formulaid", formulaSeleccionada.id)
        .eq("activo", true)

      if (!errorLoad && data) {
        setFormulasAgregadas(data)
      }

      // Limpiar campos
      setFormulaElabInput("")
      setFormulaElabSeleccionada(null)
      setCantidadFormulaElab("")
      setUnidadMedidaIdFormulaElab("")
      setCostoUnitarioFormulaElab("")
    } catch (error) {
      console.error("Error agregando fórmula:", error)
      alert("Error al agregar la fórmula")
    } finally {
      setShowProcessing(false)
    }
  }

  const handleAsignarProducto = async () => {
    if (!productoId || !formulaSeleccionada) {
      alert("Por favor seleccione un producto")
      return
    }

    try {
      const hoy = new Date().toISOString().split("T")[0]
      
      // Obtener cantidadpresentacion del producto
      const { data: productoData } = await supabase
        .from("productos")
        .select("cantidadpresentacion")
        .eq("id", productoId)
        .single()
      
      const cantidadPresentacion = parseFloat(productoData?.cantidadpresentacion || "0")
      const costoFormula = formulaSeleccionada.costo || 0
      const costoParcial = costoFormula * cantidadPresentacion
      
      console.log("[v0] Asignando producto - Cantidad Presentación:", cantidadPresentacion, "Costo Fórmula:", costoFormula, "Costo Parcial:", costoParcial)
      
      // Insertar en formulasxproducto para relacionar fórmula con producto
      const { error: errorFormulasXProducto } = await supabase.from("formulasxproducto").insert([
        {
          formulaid: formulaSeleccionada.id,
          productoid: productoId,
          cantidad: cantidadPresentacion,
          costoparcial: costoParcial,
          fechacreacion: hoy,
          activo: true,
        },
      ])

      if (errorFormulasXProducto) throw errorFormulasXProducto

      // Actualizar costos del producto
      console.log("[v0] Actualizando costos del producto...")
      
      // 1. Obtener MP (costoparcial de formulasxproducto)
      const mp = costoParcial
      
      // 2. Obtener sumatoria de ME (Material Empaque - tipomaterialid = 1)
      const { data: materialesEmpaque } = await supabase
        .from("materialesetiquetadoxproducto")
        .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
        .eq("productoid", productoId)
        .eq("activo", true)
      
      const me = materialesEmpaque
        ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
        .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
      
      // 3. Obtener sumatoria de MEM (Material Envase - tipomaterialid = 2)
      const mem = materialesEmpaque
        ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
        .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
      
      // 4. Calcular MS = (MP + ME + MEM) * 0.03
      const ms = (mp + me + mem) * 0.03
      
      // 5. Calcular Costo Total = MP + ME + MEM + MS
      const costoTotal = mp + me + mem + ms
      
      console.log("[v0] Costos calculados - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo Total:", costoTotal)
      
      // 6. Actualizar el producto con los nuevos costos
      const { error: errorUpdateProducto } = await supabase
        .from("productos")
        .update({
          mp: mp,
          me: me,
          mem: mem,
          ms: ms,
          costo: costoTotal
        })
        .eq("id", productoId)
      
      if (errorUpdateProducto) {
        console.error("Error actualizando costos del producto:", errorUpdateProducto)
      } else {
        console.log("[v0] Costos del producto actualizados exitosamente")
      }

      // También insertar en elementosxcotizacion si hay cotización activa
      if (cotizacionId) {
        const { error: errorElementos } = await supabase.from("elementosxcotizacion").insert([
          {
            cotizacionid: cotizacionId,
            tipoelemento: "Producto",
            elementoid: productoId,
            fechacreacion: hoy,
            activo: true,
          },
        ])
        
        if (errorElementos) {
          console.error("Error insertando en elementosxcotizacion:", errorElementos)
          // No throw aquí, ya que formulasxproducto es más importante
        } else {
          // Verificar si hay productos en la cotización después de asignar uno
          await verificarProductosEnCotizacion(cotizacionId)
        }
      }

      mostrarConfirmacion("Producto asignado exitosamente", "success")

      // Actualizar verificación de producto asignado para esta fórmula
      if (formulaSeleccionada) {
        const tieneProducto = await verificarProductoAsignadoPorFormula(formulaSeleccionada.id)
        console.log("[v0] Producto asignado - tieneProducto:", tieneProducto, "para fórmula:", formulaSeleccionada.id)
        
        setFormulasConProductos(prev => ({
          ...prev,
          [formulaSeleccionada.id]: tieneProducto
        }))
        
        // Obtener nombre, costo y mp del producto
        const { data: productoData } = await supabase
          .from("productos")
          .select("nombre, costo, mp, ms")
          .eq("id", productoId)
          .single()

        // Obtener cantidad y costoparcial de formulasxproducto
        const { data: fxpData } = await supabase
          .from("formulasxproducto")
          .select("costoparcial, cantidad")
          .eq("formulaid", formulaSeleccionada.id)
          .eq("productoid", productoId)
          .eq("activo", true)
          .single()

        // Obtener costo ME
        const { data: materialesCostoData } = await supabase
          .from("materialesetiquetadoxproducto")
          .select("costoparcial")
          .eq("productoid", productoId)
          .eq("activo", true)

        const costoME = materialesCostoData?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

        // Obtener volumen de unidades de elementosxcotizacion
        let volumenUnidades = 0
        if (cotizacionId) {
          const { data: elementoData } = await supabase
            .from("elementosxcotizacion")
            .select("cantidad")
            .eq("cotizacionid", cotizacionId)
            .eq("elementoid", productoId)
            .single()
          volumenUnidades = elementoData?.cantidad || 0
        }

        // Actualizar la fórmula con todos los datos del producto
        setFormulas(prevFormulas =>
          prevFormulas.map(f =>
            f.id === formulaSeleccionada.id
              ? {
                  ...f,
                  productoNombre: productoData?.nombre || undefined,
                  productoCosto: productoData?.costo || 0,
                  productoMP: productoData?.mp || 0,
                  productoCostoMS: productoData?.ms || 0,
                  productoCantidad: fxpData?.cantidad || 0,
                  productoCostoME: costoME,
                  productoIdRef: productoId,
                  volumenUnidades: volumenUnidades,
                }
              : f
          )
        )
        
        // Verificar si el producto tiene materiales de envase/empaque
        const { data: materialesEnvase, error: errorMateriales } = await supabase
          .from("materialesetiquetadoxproducto")
          .select("productoid")
          .eq("productoid", productoId)
          .limit(1)
        
        const tieneMaterialesEnvase = !errorMateriales && materialesEnvase && materialesEnvase.length > 0
        console.log("[v0] Materiales envase - tieneMaterialesEnvase:", tieneMaterialesEnvase, "para producto:", productoId)
        
        setFormulasConMaterialesEnvase(prev => ({
          ...prev,
          [formulaSeleccionada.id]: tieneMaterialesEnvase
        }))

        // Si ya tiene producto y materiales de empaque, actualizar estatus a "Para revision"
        if (tieneProducto && tieneMaterialesEnvase) {
          await supabase
            .from("formulas")
            .update({ estatus: "Para revision" })
            .eq("id", formulaSeleccionada.id)

          setFormulas(prevFormulas =>
            prevFormulas.map(f =>
              f.id === formulaSeleccionada.id
                ? { ...f, estatusformula: "Para revision" }
                : f
            )
          )
        }
      }

      // Limpiar y cerrar modal
      setProductoInput("")
      setProductoId(null)
      setProductoSeleccionado(null)
      setShowModalProducto(false)
    } catch (error) {
      console.error("Error asignando producto:", error)
      alert("Error al asignar el producto")
    }
  }

  // Abrir modal de materiales
  const handleAbrirMateriales = async (formula: Formula) => {
    setFormulaParaMateriales(formula)
    
    // Cargar tipos de material y unidades de medida
    const { data: tiposData } = await supabase
      .from("tiposmaterial")
      .select("*")
      .order("id")
    
    const { data: unidadesData } = await supabase
      .from("unidadesmedida")
      .select("*")
      .order("descripcion")
    
    // Cargar tipos de medida distintos
    const { data: tiposMedidaData } = await supabase
      .from("materialesetiquetado")
      .select("tipomedida")
      .not("tipomedida", "in", "(-,TAMAÑO)")
      .order("tipomedida", { ascending: true })
    
    const tiposMedidaUnicos = [...new Set(tiposMedidaData?.map(item => item.tipomedida).filter(Boolean))]
    
    // Cargar colores desde la función
    const filtrosResult = await obtenerFiltrosAvanzadosProductos()
    const coloresData = filtrosResult.success && filtrosResult.data ? filtrosResult.data.colores : []
    
    setTiposMaterial(tiposData || [])
    setUnidadesMedida(unidadesData || [])
    setTiposMedidaMaterial(tiposMedidaUnicos)
    setColoresMaterial(coloresData)
    
    // Obtener el producto asignado a la fórmula
    try {
      const { data: formulaProducto } = await supabase
        .from("formulasxproducto")
        .select("productoid, productos:productoid(id, nombre)")
        .eq("formulaid", formula.id)
        .eq("activo", true)
        .single()
      
      if (formulaProducto && formulaProducto.productos) {
        setProductoDeMaterial(formulaProducto.productos)
        
        // Cargar materiales ya asignados
        const { data: materiales } = await supabase
          .from("materialesetiquetadoxproducto")
          .select(`
            *,
            materialesetiquetado:materialetiquetadoid(
              *,
              unidadesmedida:unidadmedidaid(descripcion)
            )
          `)
          .eq("productoid", formulaProducto.productoid)
        
        // Mapear para agregar la descripción de unidad de medida al nivel de materialesetiquetado
        const materialesConUnidades = (materiales || []).map(m => ({
          ...m,
          materialesetiquetado: m.materialesetiquetado ? {
            ...m.materialesetiquetado,
            unidadmedida: m.materialesetiquetado.unidadesmedida?.descripcion || m.materialesetiquetado.unidadmedida || ""
          } : null
        }))
        
        setMaterialesAsignados(materialesConUnidades)
      } else {
        alert("Esta fórmula no tiene un producto asignado")
        return
      }
    } catch (error) {
      console.error("Error cargando producto:", error)
      return
    }
    
    setShowModalMateriales(true)
  }

  // Buscar materiales de empaque
  const buscarMaterialesEtiquetado = async (texto: string) => {
    if (texto.length < 2) {
      setMaterialesEtiquetadoResultados([])
      return
    }
    
    const { data } = await supabase
      .from("materialesetiquetado")
      .select("*")
      .eq("tipomaterialid", 1) // Tipo 1 = Empaque
      .or(`codigo.ilike.%${texto}%,nombre.ilike.%${texto}%`)
      .limit(10)
    
    setMaterialesEtiquetadoResultados(data || [])
    setShowMaterialesEtiquetadoDropdown(true)
  }

  // Seleccionar material de empaque
  const handleMaterialEtiquetadoSelect = async (material: any) => {
    // Obtener descripción de unidad de medida
    let unidadMedidaDescripcion = material.unidadmedida || ""
    
    if (material.unidadmedidaid) {
      const { data: unidadData } = await supabase
        .from("unidadesmedida")
        .select("descripcion")
        .eq("id", material.unidadmedidaid)
        .single()
      
      if (unidadData) {
        unidadMedidaDescripcion = unidadData.descripcion
      }
    }
    
    // Agregar la descripción de unidad de medida al material
    const materialConUnidad = {
      ...material,
      unidadmedida: unidadMedidaDescripcion
    }
    
    setMaterialEtiquetadoSeleccionado(materialConUnidad)
    setMaterialesEtiquetadoBuscar(`${material.codigo} - ${material.nombre}`)
    setShowMaterialesEtiquetadoDropdown(false)
  }

  // Actualizar costos MEM y ME del producto
  const actualizarCostosProducto = async (productoid: number) => {
    try {
      console.log("[v0] Actualizando costos MEM, ME, MP, MS y Costo para producto:", productoid)
      
      // Obtener todos los materiales del producto con su tipo
      const { data: materiales } = await supabase
        .from("materialesetiquetadoxproducto")
        .select(`
          costoparcial,
          materialesetiquetado:materialetiquetadoid(tipomaterialid)
        `)
        .eq("productoid", productoid)
      
      if (!materiales) return
      
      // Calcular suma de costos por tipo
      let costoMEM = 0 // tipomaterialid = 1 (Empaque)
      let costoME = 0  // tipomaterialid = 2 (Envase)
      
      materiales.forEach(mat => {
        const tipoMaterial = mat.materialesetiquetado?.tipomaterialid
        const costo = mat.costoparcial || 0
        
        if (tipoMaterial === 1) {
          costoMEM += costo
        } else if (tipoMaterial === 2) {
          costoME += costo
        }
      })
      
      // Obtener MP (Materia Prima) desde formulasxproducto
      const { data: formulasData } = await supabase
        .from("formulasxproducto")
        .select("costoparcial")
        .eq("productoid", productoid)
      
      const costoMP = formulasData?.reduce((sum, formula) => sum + (formula.costoparcial || 0), 0) || 0
      
      // Calcular MS (Margen de Seguridad): (MP + MEM + ME) * 0.03
      const costoMS = (costoMP + costoMEM + costoME) * 0.03
      
      // Calcular Costo Total: MP + MEM + ME + MS
      const costoTotal = costoMP + costoMEM + costoME + costoMS
      
      console.log("[v0] Costos calculados - MEM:", costoMEM, "ME:", costoME, "MP:", costoMP, "MS:", costoMS, "Costo Total:", costoTotal)
      
      // Actualizar el producto con los nuevos costos
      const { error: errorUpdate } = await supabase
        .from("productos")
        .update({
          mem: costoMEM,
          me: costoME,
          mp: costoMP,
          ms: costoMS,
          costo: costoTotal
        })
        .eq("id", productoid)
      
      if (errorUpdate) {
        console.error("[v0] Error actualizando costos producto:", errorUpdate)
      }
      
      // Actualizar el costo del producto en el listado de fórmulas si existe
      setFormulas(prevFormulas =>
        prevFormulas.map(f => {
          // Buscar si esta fórmula está asociada a este producto
          if (f.productoNombre) {
            return { ...f, productoCosto: costoTotal }
          }
          return f
        })
      )
    } catch (error) {
      console.error("[v0] Error en actualizarCostosProducto:", error)
    }
  }

  // Agregar material de empaque
  const handleAgregarMaterialEtiquetado = async () => {
    if (!materialEtiquetadoSeleccionado || !materialEtiquetadoCantidad || !productoDeMaterial) {
      alert("Complete todos los campos")
      return
    }
    
    // Validar si el material ya está asignado al producto
    const { data: materialExistente } = await supabase
      .from("materialesetiquetadoxproducto")
      .select("productoid")
      .eq("productoid", productoDeMaterial.id)
      .eq("materialetiquetadoid", materialEtiquetadoSeleccionado.id)
      .single()
    
    if (materialExistente) {
      alert("Este material ya se encuentra agregado al producto")
      return
    }
    
    const cantidad = parseFloat(materialEtiquetadoCantidad)
    const costoParcial = cantidad * materialEtiquetadoSeleccionado.costo
    
    const { error } = await supabase
      .from("materialesetiquetadoxproducto")
      .insert({
        productoid: productoDeMaterial.id,
        materialetiquetadoid: materialEtiquetadoSeleccionado.id,
        cantidad,
        costoparcial: costoParcial,
        activo: true
      })
    
    if (error) {
      alert("Error al agregar material: " + error.message)
      return
    }
    
    // Recargar materiales
    const { data: materiales } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(`
        *,
        materialesetiquetado:materialetiquetadoid(
          *,
          unidadesmedida:unidadmedidaid(descripcion)
        )
      `)
      .eq("productoid", productoDeMaterial.id)
    
    // Mapear para agregar la descripción de unidad de medida
    const materialesConUnidades = (materiales || []).map(m => ({
      ...m,
      materialesetiquetado: m.materialesetiquetado ? {
        ...m.materialesetiquetado,
        unidadmedida: m.materialesetiquetado.unidadesmedida?.descripcion || m.materialesetiquetado.unidadmedida || ""
      } : null
    }))
    
    setMaterialesAsignados(materialesConUnidades)
    setMaterialEtiquetadoSeleccionado(null)
    setMaterialesEtiquetadoBuscar("")
    setMaterialEtiquetadoCantidad("")

    // Actualizar check de MEs y estatus de fórmula
    if (formulaParaMateriales?.id) {
      setFormulasConMaterialesEnvase(prev => ({ ...prev, [formulaParaMateriales.id]: true }))
      await supabase.from("formulas").update({ estatus: "Para revision" }).eq("id", formulaParaMateriales.id)
    }

    // Actualizar estatus de cotización a "Para revision"
    if (cotizacionId) {
      await supabase.from("cotizaciones").update({ estatus: "Para revision" }).eq("id", cotizacionId)
    }

    // Actualizar costos MEM y ME del producto
    await actualizarCostosProducto(productoDeMaterial.id)

    // Refrescar costo producto, costo ME y estatus en la tabla
    if (formulaParaMateriales?.id && productoDeMaterial?.id) {
      const { data: prodActualizado } = await supabase.from("productos").select("costo, mp, ms").eq("id", productoDeMaterial.id).single()
      const { data: matCostos } = await supabase.from("materialesetiquetadoxproducto").select("costoparcial").eq("productoid", productoDeMaterial.id).eq("activo", true)
      const costoME = matCostos?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
      setFormulas(prev => prev.map(f => f.id === formulaParaMateriales.id ? { ...f, estatusformula: "Para revision", productoCosto: prodActualizado?.costo || f.productoCosto, productoMP: prodActualizado?.mp || f.productoMP, productoCostoMS: prodActualizado?.ms || f.productoCostoMS, productoCostoME: costoME } : f))
    }
  }

  // Buscar materiales de envase
  const buscarMaterialesEnvase = async (texto: string) => {
    if (texto.length < 2) {
      setMaterialesEnvaseResultados([])
      return
    }
    
    const { data } = await supabase
      .from("materialesetiquetado")
      .select("*")
      .eq("tipomaterialid", 2) // Tipo 2 = Envase
      .or(`codigo.ilike.%${texto}%,nombre.ilike.%${texto}%`)
      .limit(10)
    
    setMaterialesEnvaseResultados(data || [])
    setShowMaterialesEnvaseDropdown(true)
  }

  // Seleccionar material de envase
  const handleMaterialEnvaseSelect = async (material: any) => {
    // Obtener descripción de unidad de medida
    let unidadMedidaDescripcion = material.unidadmedida || ""
    
    if (material.unidadmedidaid) {
      const { data: unidadData } = await supabase
        .from("unidadesmedida")
        .select("descripcion")
        .eq("id", material.unidadmedidaid)
        .single()
      
      if (unidadData) {
        unidadMedidaDescripcion = unidadData.descripcion
      }
    }
    
    // Agregar la descripción de unidad de medida al material
    const materialConUnidad = {
      ...material,
      unidadmedida: unidadMedidaDescripcion
    }
    
    setMaterialEnvaseSeleccionado(materialConUnidad)
    setMaterialesEnvaseBuscar(`${material.codigo} - ${material.nombre}`)
    setShowMaterialesEnvaseDropdown(false)
  }

  // Agregar material de envase
  const handleAgregarMaterialEnvase = async () => {
    if (!materialEnvaseSeleccionado || !materialEnvaseCantidad || !productoDeMaterial) {
      alert("Complete todos los campos")
      return
    }
    
    // Validar si el material ya está asignado al producto
    const { data: materialExistente } = await supabase
      .from("materialesetiquetadoxproducto")
      .select("productoid")
      .eq("productoid", productoDeMaterial.id)
      .eq("materialetiquetadoid", materialEnvaseSeleccionado.id)
      .single()
    
    if (materialExistente) {
      alert("Este material ya se encuentra agregado al producto")
      return
    }
    
    const cantidad = parseFloat(materialEnvaseCantidad)
    const costoParcial = cantidad * materialEnvaseSeleccionado.costo
    
    const { error } = await supabase
      .from("materialesetiquetadoxproducto")
      .insert({
        productoid: productoDeMaterial.id,
        materialetiquetadoid: materialEnvaseSeleccionado.id,
        cantidad,
        costoparcial: costoParcial,
        activo: true
      })
    
    if (error) {
      alert("Error al agregar material: " + error.message)
      return
    }
    
    // Recargar materiales
    const { data: materiales } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(`
        *,
        materialesetiquetado:materialetiquetadoid(
          *,
          unidadesmedida:unidadmedidaid(descripcion)
        )
      `)
      .eq("productoid", productoDeMaterial.id)
    
    // Mapear para agregar la descripción de unidad de medida
    const materialesConUnidades = (materiales || []).map(m => ({
      ...m,
      materialesetiquetado: m.materialesetiquetado ? {
        ...m.materialesetiquetado,
        unidadmedida: m.materialesetiquetado.unidadesmedida?.descripcion || m.materialesetiquetado.unidadmedida || ""
      } : null
    }))
    
    setMaterialesAsignados(materialesConUnidades)
    setMaterialEnvaseSeleccionado(null)
    setMaterialesEnvaseBuscar("")
    setMaterialEnvaseCantidad("")

    // Actualizar check de MEs y estatus de fórmula
    if (formulaParaMateriales?.id) {
      setFormulasConMaterialesEnvase(prev => ({ ...prev, [formulaParaMateriales.id]: true }))
      await supabase.from("formulas").update({ estatus: "Para revision" }).eq("id", formulaParaMateriales.id)
    }

    // Actualizar estatus de cotización a "Para revision"
    if (cotizacionId) {
      await supabase.from("cotizaciones").update({ estatus: "Para revision" }).eq("id", cotizacionId)
    }

    // Actualizar costos MEM y ME del producto
    await actualizarCostosProducto(productoDeMaterial.id)

    // Refrescar costo producto, costo ME y estatus en la tabla
    if (formulaParaMateriales?.id && productoDeMaterial?.id) {
      const { data: prodActualizado } = await supabase.from("productos").select("costo, mp, ms").eq("id", productoDeMaterial.id).single()
      const { data: matCostos } = await supabase.from("materialesetiquetadoxproducto").select("costoparcial").eq("productoid", productoDeMaterial.id).eq("activo", true)
      const costoME = matCostos?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
      setFormulas(prev => prev.map(f => f.id === formulaParaMateriales.id ? { ...f, estatusformula: "Para revision", productoCosto: prodActualizado?.costo || f.productoCosto, productoMP: prodActualizado?.mp || f.productoMP, productoCostoMS: prodActualizado?.ms || f.productoCostoMS, productoCostoME: costoME } : f))
    }
  }

  // Registrar y agregar nuevo material de empaque
  const handleRegistrarYAgregarNuevoMaterial = async () => {
    if (!nuevoMaterialEmpaque.tipoMaterial || !nuevoMaterialEmpaque.nombre || 
        !nuevoMaterialEmpaque.unidadMedidaId || !nuevoMaterialEmpaque.costoUnitario || 
        !nuevoMaterialEmpaque.cantidad || !productoDeMaterial) {
      alert("Complete todos los campos")
      return
    }
    
    try {
      // Generar código único automáticamente con prefijo 'c'
      let codigoUnico = null
      let intentos = 0
      const maxIntentos = 10
      
      while (!codigoUnico && intentos < maxIntentos) {
        const numeroAleatorio = Math.floor(Math.random() * 1000000)
        const codigoCandidato = `c${numeroAleatorio}`
        
        // Verificar si el código ya existe
        const { data: existente } = await supabase
          .from("materialesetiquetado")
          .select("codigo")
          .eq("codigo", codigoCandidato)
          .single()
        
        if (!existente) {
          codigoUnico = codigoCandidato
        }
        intentos++
      }
      
      if (!codigoUnico) {
        alert("Error al generar código único. Intente nuevamente.")
        return
      }

      console.log("[v0] Código autogenerado para Material:", codigoUnico)
      
      // Registrar el nuevo material en materialesetiquetado
      const { data: nuevoMaterial, error: errorMaterial } = await supabase
        .from("materialesetiquetado")
        .insert({
          codigo: codigoUnico,
          proveedor: nuevoMaterialEmpaque.proveedor || null,
          nombre: nuevoMaterialEmpaque.nombre,
          detalle: nuevoMaterialEmpaque.detalle || null,
          especificaciones: nuevoMaterialEmpaque.especificaciones || null,
          medida: nuevoMaterialEmpaque.medida || null,
          tipomedida: nuevoMaterialEmpaque.tipomedida || null,
          color: nuevoMaterialEmpaque.color || null,
          unidadmedidaid: parseInt(nuevoMaterialEmpaque.unidadMedidaId),
          costo: parseFloat(nuevoMaterialEmpaque.costoUnitario),
          tipomaterialid: parseInt(nuevoMaterialEmpaque.tipoMaterial),
          activo: true
        })
        .select()
        .single()
      
      if (errorMaterial) {
        alert("Error al registrar material: " + errorMaterial.message)
        return
      }
      
      // Agregar el material al producto
      const cantidad = parseFloat(nuevoMaterialEmpaque.cantidad)
      const costoParcial = cantidad * parseFloat(nuevoMaterialEmpaque.costoUnitario)
      
      const { error: errorAsignacion } = await supabase
        .from("materialesetiquetadoxproducto")
        .insert({
          productoid: productoDeMaterial.id,
          materialetiquetadoid: nuevoMaterial.id,
          cantidad,
          costoparcial: costoParcial,
          activo: true
        })
      
      if (errorAsignacion) {
        alert("Error al asignar material: " + errorAsignacion.message)
        return
      }
      
      // Recargar materiales
      const { data: materiales } = await supabase
        .from("materialesetiquetadoxproducto")
        .select(`
          *,
          materialesetiquetado:materialetiquetadoid(
            *,
            unidadesmedida:unidadmedidaid(descripcion)
          )
        `)
        .eq("productoid", productoDeMaterial.id)
      
      const materialesConUnidades = (materiales || []).map(m => ({
        ...m,
        materialesetiquetado: m.materialesetiquetado ? {
          ...m.materialesetiquetado,
          unidadmedida: m.materialesetiquetado.unidadesmedida?.descripcion || m.materialesetiquetado.unidadmedida || ""
        } : null
      }))
      
      setMaterialesAsignados(materialesConUnidades)
      
      // Limpiar y ocultar formulario
      setNuevoMaterialEmpaque({
        tipoMaterial: "",
        codigo: "",
        nombre: "",
        detalle: "",
        especificaciones: "",
        medida: "",
        tipomedida: "",
        color: "",
        unidadMedidaId: "",
        costoUnitario: "",
        cantidad: "",
      })
      setCodigoMaterialValidado(false)
      setMostrarNuevoMaterialEmpaque(false)

      // Actualizar check de MEs y estatus de fórmula
      if (formulaParaMateriales?.id) {
        setFormulasConMaterialesEnvase(prev => ({ ...prev, [formulaParaMateriales.id]: true }))
        await supabase.from("formulas").update({ estatus: "Para revision" }).eq("id", formulaParaMateriales.id)
      }

      // Actualizar estatus de cotización a "Para revision"
      if (cotizacionId) {
        await supabase.from("cotizaciones").update({ estatus: "Para revision" }).eq("id", cotizacionId)
      }

      // Actualizar costos MEM y ME del producto
      await actualizarCostosProducto(productoDeMaterial.id)

      // Refrescar costo producto, costo ME y estatus en la tabla
      if (formulaParaMateriales?.id && productoDeMaterial?.id) {
        const { data: prodActualizado } = await supabase.from("productos").select("costo, mp, ms").eq("id", productoDeMaterial.id).single()
        const { data: matCostos } = await supabase.from("materialesetiquetadoxproducto").select("costoparcial").eq("productoid", productoDeMaterial.id).eq("activo", true)
        const costoME = matCostos?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
        setFormulas(prev => prev.map(f => f.id === formulaParaMateriales.id ? { ...f, estatusformula: "Para revision", productoCosto: prodActualizado?.costo || f.productoCosto, productoMP: prodActualizado?.mp || f.productoMP, productoCostoMS: prodActualizado?.ms || f.productoCostoMS, productoCostoME: costoME } : f))
      }

      alert("Material registrado y agregado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la operación")
    }
  }

  // Eliminar material
  const handleEliminarMaterial = async (productoid: number, materialetiquetadoid: number) => {
    if (!confirm("¿Está seguro de eliminar este material?")) return

    console.log("[v0] Eliminando material - productoid:", productoid, "materialetiquetadoid:", materialetiquetadoid)
    
    const { error } = await supabase
      .from("materialesetiquetadoxproducto")
      .delete()
      .eq("productoid", productoid)
      .eq("materialetiquetadoid", materialetiquetadoid)
    
    if (error) {
      alert("Error al eliminar: " + error.message)
      return
    }
    
    // Recargar materiales
    const { data: materiales } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(`
        *,
        materialesetiquetado:materialetiquetadoid(
          *,
          unidadesmedida:unidadmedidaid(descripcion)
        )
      `)
      .eq("productoid", productoDeMaterial.id)
    
    // Mapear para agregar la descripción de unidad de medida
    const materialesConUnidades = (materiales || []).map(m => ({
      ...m,
      materialesetiquetado: m.materialesetiquetado ? {
        ...m.materialesetiquetado,
        unidadmedida: m.materialesetiquetado.unidadesmedida?.descripcion || m.materialesetiquetado.unidadmedida || ""
      } : null
    }))
    
    setMaterialesAsignados(materialesConUnidades)

    // Actualizar check de MEs para la fórmula (false si ya no quedan materiales)
    if (formulaParaMateriales?.id) {
      const tieneMateriales = (materialesConUnidades || []).length > 0
      setFormulasConMaterialesEnvase(prev => ({ ...prev, [formulaParaMateriales.id]: tieneMateriales }))

      // Si ya no quedan materiales, regresar estatus de fórmula y cotización a "Pendiente"
      if (!tieneMateriales) {
        await supabase.from("formulas").update({ estatus: "Pendiente" }).eq("id", formulaParaMateriales.id)
        setFormulas(prevFormulas =>
          prevFormulas.map(f =>
            f.id === formulaParaMateriales.id ? { ...f, estatusformula: "Pendiente" } : f
          )
        )
        if (cotizacionId) {
          await supabase.from("cotizaciones").update({ estatus: "Pendiente" }).eq("id", cotizacionId)
        }
      }
    }

    // Actualizar costos MEM y ME del producto
    await actualizarCostosProducto(productoDeMaterial.id)

    // Refrescar costo producto y costo ME en la tabla
    if (formulaParaMateriales?.id && productoDeMaterial?.id) {
      const { data: prodActualizado } = await supabase.from("productos").select("costo, mp, ms").eq("id", productoDeMaterial.id).single()
      const costoME = (materialesConUnidades || []).reduce((sum, m) => sum + (m.costoparcial || 0), 0)
      setFormulas(prev => prev.map(f => f.id === formulaParaMateriales.id ? { ...f, productoCosto: prodActualizado?.costo || 0, productoMP: prodActualizado?.mp || 0, productoCostoMS: prodActualizado?.ms || 0, productoCostoME: costoME } : f))
    }
  }

  // Eliminar fórmula de la cotización
  const handleEliminarFormulaCotizacion = async (formula: Formula) => {
    if (!confirm(`¿Está seguro de eliminar la fórmula "${formula.nombre}" de esta cotización?`)) return
    
    try {
      console.log("[v0] Eliminando fórmula de cotización - formulaid:", formula.id)
      
      // Verificar que tengamos el ID de la cotización
      if (!cotizacionId) {
        alert("Error: No se ha identificado la cotización")
        return
      }
      
      // Obtener el ID de elementosxcotizacion para esta fórmula
      const { data: elementoData, error: errorBusqueda } = await supabase
        .from("elementosxcotizacion")
        .select("id")
        .eq("elementoid", formula.id)
        .eq("cotizacionid", cotizacionId)
        .single()
      
      if (errorBusqueda || !elementoData) {
        console.error("[v0] Error buscando elemento:", errorBusqueda)
        alert("Error: No se encontró la asociación entre la fórmula y la cotización")
        return
      }
      
      // Eliminar de elementosxcotizacion
      const { error } = await supabase
        .from("elementosxcotizacion")
        .delete()
        .eq("id", elementoData.id)
      
      if (error) {
        console.error("[v0] Error eliminando:", error)
        alert("Error al eliminar: " + error.message)
        return
      }
      
      // Actualizar el listado de fórmulas
      setFormulas(prevFormulas => prevFormulas.filter(f => f.id !== formula.id))
      
      // Limpiar estados de verificación
      setFormulasConMateriasPrimas(prev => {
        const updated = { ...prev }
        delete updated[formula.id]
        return updated
      })
      setFormulasConProductos(prev => {
        const updated = { ...prev }
        delete updated[formula.id]
        return updated
      })
      setFormulasConMaterialesEnvase(prev => {
        const updated = { ...prev }
        delete updated[formula.id]
        return updated
      })
      
      mostrarConfirmacion("Fórmula eliminada exitosamente de la cotización", "success")
    } catch (error) {
      console.error("[v0] Error eliminando fórmula:", error)
      alert("Error al eliminar la fórmula")
    }
  }

  // Finalizar modal materiales
  const handleFinalizarMateriales = async () => {
    if (!formulaParaMateriales) return
    
    // Actualizar verificación de materiales
    const { data: materialesEnvase, error: errorMateriales } = await supabase
      .from("materialesetiquetadoxproducto")
      .select("productoid")
      .eq("productoid", productoDeMaterial.id)
      .limit(1)
    
    const tieneMaterialesEnvase = !errorMateriales && materialesEnvase && materialesEnvase.length > 0
    setFormulasConMaterialesEnvase(prev => ({
      ...prev,
      [formulaParaMateriales.id]: tieneMaterialesEnvase
    }))
    
    setShowModalMateriales(false)
    setFormulaParaMateriales(null)
    setProductoDeMaterial(null)
    setMaterialesAsignados([])
  }

  const handleFinalizarMateriasPrimas = async () => {
    if (!formulaSeleccionada) return

    try {
      setShowProcessing(true)

      // Calcular total de costos de materias primas
      const { data, error } = await supabase
        .from("materiasprimasxformula")
        .select("costoparcial")
        .eq("formulaid", formulaSeleccionada.id)

      if (error) throw error

      const totalCosto = data?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

      // Actualizar la fórmula con el costo total
      const { error: updateError } = await supabase
        .from("formulas")
        .update({ costo: totalCosto })
        .eq("id", formulaSeleccionada.id)

      if (updateError) throw updateError

      // Actualizar en el estado local
      setFormulas((prev) =>
        prev.map((f) => (f.id === formulaSeleccionada.id ? { ...f, costo: totalCosto } : f))
      )

      setShowModalMateriasPrimas(false)
      alert("Materias primas finalizadas y costo actualizado")
    } catch (error) {
      console.error("Error finalizando materias primas:", error)
      alert("Error al finalizar materias primas")
    } finally {
      setShowProcessing(false)
    }
  }

  // Función para verificar si hay productos en la cotización
  const verificarProductosEnCotizacion = async (cotizId: number) => {
    try {
      const { data, error } = await supabase
        .from("elementosxcotizacion")
        .select("id")
        .eq("cotizacionid", cotizId)
        .eq("tipoelemento", "Producto")

      if (error) {
        console.error("Error verificando productos:", error)
        setHayProductosEnCotizacion(false)
      } else {
        setHayProductosEnCotizacion(data && data.length > 0)
      }
    } catch (error) {
      console.error("Error en verificarProductosEnCotizacion:", error)
      setHayProductosEnCotizacion(false)
    }
  }

  // Función para guardar volumen de unidades en elementosxcotizacion
  const handleGuardarVolumenUnidades = async (formulaId: number, productoIdRef: number, nuevoVolumen: number) => {
    if (!cotizacionId || !productoIdRef) return

    setSavingVolumen(true)
    try {
      const { error } = await supabase
        .from("elementosxcotizacion")
        .update({ cantidad: nuevoVolumen })
        .eq("cotizacionid", cotizacionId)
        .eq("elementoid", productoIdRef)

      if (error) {
        console.error("Error actualizando volumen de unidades:", error)
        mostrarConfirmacion("Error al actualizar volumen de unidades", "error")
      } else {
        // Actualizar estado local
        setFormulas(prev =>
          prev.map(f =>
            f.id === formulaId ? { ...f, volumenUnidades: nuevoVolumen } : f
          )
        )
        mostrarConfirmacion("Volumen de unidades actualizado", "success")
      }
    } catch (error) {
      console.error("Error en handleGuardarVolumenUnidades:", error)
      mostrarConfirmacion("Error al actualizar volumen de unidades", "error")
    } finally {
      setSavingVolumen(false)
    }
  }

  // Función para calcular todos los totales
  const calcularTotales = async () => {
    if (!cotizacionId || formulas.length === 0) {
      setTotales({
        totalCostoFormulas: 0,
        totalCostoProducto: 0,
        totalMateriasPrimas: 0,
        totalFormulasSecundarias: 0,
        totalCantidadFormula: 0,
        totalMaterialEmpaque: 0,
        totalMaterialEnvase: 0,
      })
      return
    }

    // 1. Total Costo Fórmulas
    const totalCostoFormulas = formulas.reduce((sum, f) => sum + (f.costo || 0), 0)
    console.log("[v0] Total Costo Fórmulas:", totalCostoFormulas, "Desglose:", formulas.map(f => ({ id: f.id, costo: f.costo })))

    // 2. Total Costo Producto - obtener del costo de productos
    let totalCostoProducto = 0
    console.log("[v0] Calculando Total Costo Producto")
    
    for (const formula of formulas) {
      const { data: fxpData } = await supabase
        .from("formulasxproducto")
        .select("productoid")
        .eq("formulaid", formula.id)
        .eq("activo", true)
      
      const fxp = fxpData && fxpData.length > 0 ? fxpData[0] : null
      
      if (fxp && fxp.productoid) {
        const { data: producto } = await supabase
          .from("productos")
          .select("costo")
          .eq("id", fxp.productoid)
          .single()
        
        if (producto && producto.costo) {
          console.log("[v0] Costo producto para fórmula", formula.id, ":", producto.costo)
          totalCostoProducto += producto.costo
        }
      }
    }
    
    console.log("[v0] Total Costo Producto:", totalCostoProducto)

    // 3. Total Materias Primas - sumar costoparcial de materiasprimasxformula para cada formulaid
    let totalMateriasPrimas = 0
    console.log("[v0] Calculando Total Materias Primas - Fórmulas:", formulas.map(f => ({ id: f.id, nombre: f.nombre })))
    
    for (const formula of formulas) {
      const { data: mps, error: errorMps } = await supabase
        .from("materiasprimasxformula")
        .select("costoparcial")
        .eq("formulaid", formula.id)
        .eq("activo", true)
      
      console.log("[v0] Fórmula ID:", formula.id, "Materias Primas encontradas:", mps?.length || 0, "Error:", errorMps)
      
      if (mps && mps.length > 0) {
        const sumaFormula = mps.reduce((sum, mp) => sum + (mp.costoparcial || 0), 0)
        console.log("[v0] Suma de materias primas para fórmula", formula.id, ":", sumaFormula, "Desglose:", mps.map(mp => mp.costoparcial))
        totalMateriasPrimas += sumaFormula
      }
    }
    
    console.log("[v0] Total Materias Primas FINAL:", totalMateriasPrimas)

    // 4 y 5. Total Material de Empaque y Envase
    let totalMaterialEmpaque = 0
    let totalMaterialEnvase = 0
    console.log("[v0] Calculando materiales de empaque y envase")
    
    for (const formula of formulas) {
      // Primero obtener el productoid de la fórmula
      const { data: fxpData, error: errorFxp } = await supabase
        .from("formulasxproducto")
        .select("productoid")
        .eq("formulaid", formula.id)
        .eq("activo", true)
      
      const fxp = fxpData && fxpData.length > 0 ? fxpData[0] : null
      
      console.log("[v0] Fórmula", formula.id, "- ProductoID:", fxp?.productoid, "Error:", errorFxp)
      
      if (fxp && fxp.productoid) {
        // Obtener materiales de empaque y envase (tipomaterialid = 1 para empaque, 2 para envase)
        const { data: materialesEmpaque, error: errorMat } = await supabase
          .from("materialesetiquetadoxproducto")
          .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
          .eq("productoid", fxp.productoid)
          .eq("activo", true)
        
        console.log("[v0] Producto", fxp.productoid, "- Materiales encontrados:", materialesEmpaque?.length || 0, "Error:", errorMat)
        
        if (materialesEmpaque && materialesEmpaque.length > 0) {
          materialesEmpaque.forEach(mat => {
            if (mat.materialesetiquetado?.tipomaterialid === 1) {
              console.log("[v0] Material Empaque - costoparcial:", mat.costoparcial)
              totalMaterialEmpaque += mat.costoparcial || 0
            } else if (mat.materialesetiquetado?.tipomaterialid === 2) {
              console.log("[v0] Material Envase - costoparcial:", mat.costoparcial)
              totalMaterialEnvase += mat.costoparcial || 0
            }
          })
        }
      }
    }
    
    console.log("[v0] Total Material Empaque:", totalMaterialEmpaque)
    console.log("[v0] Total Material Envase:", totalMaterialEnvase)

    // 6. Total Fórmulas Secundarias - sumar costoparcial de formulasxformula
    let totalFormulasSecundarias = 0
    console.log("[v0] Calculando Total Fórmulas Secundarias")
    
    for (const formula of formulas) {
      const { data: formulasSecData } = await supabase
        .from("formulasxformula")
        .select("costoparcial")
        .eq("formulaid", formula.id)
        .eq("activo", true)
      
      if (formulasSecData && formulasSecData.length > 0) {
        const sumaFormula = formulasSecData.reduce((sum, fs) => sum + (fs.costoparcial || 0), 0)
        console.log("[v0] Fórmulas secundarias para fórmula", formula.id, ":", sumaFormula)
        totalFormulasSecundarias += sumaFormula
      }
    }
    
    console.log("[v0] Total Fórmulas Secundarias:", totalFormulasSecundarias)

    // 7. Total Cantidad de Formula - sumar costoparcial de formulasxproducto
    let totalCantidadFormula = 0
    console.log("[v0] Calculando Total Cantidad de Formula")
    
    for (const formula of formulas) {
      const { data: fxpData } = await supabase
        .from("formulasxproducto")
        .select("productoid")
        .eq("formulaid", formula.id)
        .eq("activo", true)
      
      const fxp = fxpData && fxpData.length > 0 ? fxpData[0] : null
      
      if (fxp && fxp.productoid) {
        const { data: formulasProductoData } = await supabase
          .from("formulasxproducto")
          .select("costoparcial")
          .eq("productoid", fxp.productoid)
          .eq("activo", true)
        
        if (formulasProductoData && formulasProductoData.length > 0) {
          const sumaProducto = formulasProductoData.reduce((sum, fp) => sum + (fp.costoparcial || 0), 0)
          console.log("[v0] Cantidad formula para producto", fxp.productoid, ":", sumaProducto)
          totalCantidadFormula += sumaProducto
        }
      }
    }
    
    console.log("[v0] Total Cantidad de Formula:", totalCantidadFormula)

    setTotales({
      totalCostoFormulas,
      totalCostoProducto,
      totalMateriasPrimas,
      totalFormulasSecundarias,
      totalCantidadFormula,
      totalMaterialEmpaque,
      totalMaterialEnvase,
    })
  }

  // useEffect para calcular totales cuando cambien las fórmulas
  useEffect(() => {
    if (formulas.length > 0 && cotizacionId) {
      calcularTotales()
    }
  }, [formulas, cotizacionId])

  // --- Render ---
  if (showPageLoading || authLoading) {
    return <PageProcessing message="Cargando..." />
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-[95vw]">
      {showProcessing && <PageProcessing message="Procesando..." />}

      {/* Modal pequeño de carga para Volumen de Unidades */}
      {savingVolumen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg flex items-center gap-3 px-6 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#5d8f72]" />
            <span className="text-sm text-gray-700">Actualizando volumen...</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Crear Nueva Cotización</h1>
        <p className="text-gray-600">Complete los siguientes pasos para crear una cotización</p>
      </div>

      {/* Información Básica de la Cotización */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información Básica de la Cotización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Primera fila: Cliente y botón Agregar Cliente */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="cliente" className="mb-1">Cliente</Label>
                <Select 
                  value={clienteSeleccionado} 
                  onValueChange={setClienteSeleccionado}
                  disabled={cotizacionRegistrada || !!cotizacionIdParam}
                >
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setShowModalCliente(true)}
                variant="outline"
                disabled={!!cotizacionIdParam}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Cliente
              </Button>
            </div>

            {/* Segunda fila: Título, Usuario, Tipo de Cotización y Volumen */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="titulo" className="mb-1">Título</Label>
                <Input
                  id="titulo"
                  value={cotizacion.titulo}
                  onChange={(e) => setCotizacion({ ...cotizacion, titulo: e.target.value })}
                  placeholder="Ingrese el título de la cotización"
                />
              </div>

              <div>
                <Label htmlFor="usuario" className="mb-1">Usuario</Label>
                <Input id="usuario" value={cotizacion.usuario} disabled />
              </div>

              <div>
                <Label htmlFor="tipoCotizacion" className="mb-1">Tipo de Cotización</Label>
                <Input id="tipoCotizacion" value={cotizacion.tipoCotizacion} disabled />
              </div>

              <div>
                <Label htmlFor="volumen" className="mb-1">Volumen de Unidades</Label>
                <Input
                  id="volumen"
                  value={cotizacion.volumen}
                  onChange={(e) => setCotizacion({ ...cotizacion, volumen: e.target.value })}
                  placeholder="Ingrese el volumen"
                />
              </div>
            </div>

            {/* Botón registrar cotización alineado a la derecha */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleRegistrarCotizacion}
                className="bg-black hover:bg-gray-800 text-white"
                disabled={cotizacionRegistrada || !!cotizacionIdParam}
              >
                <Save className="mr-2 h-4 w-4" />
                {cotizacionRegistrada ? "Cotización Registrada" : "Registrar Cotización"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paso 4: Listado de Fórmulas */}
      {cotizacionRegistrada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flask className="h-5 w-5" />
                Fórmulas de la Cotización
              </div>
              <Button onClick={() => setShowModalFormula(true)} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Fórmula
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formulas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay fórmulas agregadas. Haga clic en "Registrar Fórmula" para comenzar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead className="w-64">Nombre</TableHead>
                    <TableHead>Fórmula</TableHead>
                    <TableHead>Costo Fórmula</TableHead>
                    <TableHead className="w-64">Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo MP</TableHead>
                    <TableHead>Costo ME</TableHead>
                    <TableHead>Costo MS</TableHead>
                    <TableHead>Total Costo</TableHead>
                    <TableHead className="w-36">Volumen Unidades</TableHead>
                    <TableHead className="text-center">MPs</TableHead>
                    <TableHead className="text-center">MEs</TableHead>
                    <TableHead className="text-center">Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    <TableHead className="text-center">Eliminar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulas.map((formula) => (
                    <TableRow key={formula.id}>
                      <TableCell>{formula.codigo}</TableCell>
                      <TableCell className="w-64">{formula.nombre}</TableCell>
                      <TableCell>{formula.formula}</TableCell>
                      <TableCell>${formula.costo.toFixed(2)}</TableCell>
                      <TableCell className="w-64">
                        {formula.productoNombre ? (
                          formula.productoNombre
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 inline" />
                        )}
                      </TableCell>
                      <TableCell>
                        {formula.productoCantidad != null ? formula.productoCantidad : '-'}
                      </TableCell>
                      <TableCell>
                        {formula.productoMP != null ? `$${formula.productoMP.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {formula.productoCostoME != null ? `$${formula.productoCostoME.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {formula.productoCostoMS != null ? `$${formula.productoCostoMS.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {formula.productoCosto ? `$${formula.productoCosto.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="w-36">
                        {formula.productoIdRef ? (
                          <Input
                            key={`vol-${formula.id}-${formula.volumenUnidades}`}
                            type="number"
                            className="w-32 text-right"
                            defaultValue={formula.volumenUnidades || 0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                ;(e.target as HTMLInputElement).blur()
                              }
                            }}
                            onBlur={(e) => {
                              const valor = parseFloat(e.target.value) || 0
                              if (valor !== (formula.volumenUnidades || 0)) {
                                handleGuardarVolumenUnidades(formula.id, formula.productoIdRef!, valor)
                              }
                            }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formulasConMateriasPrimas[formula.id] ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 inline" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formulasConMaterialesEnvase[formula.id] ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 inline" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            formula.estatusformula?.toLowerCase() === "aprovado"
                              ? "bg-green-100 text-green-700"
                              : formula.estatusformula?.toLowerCase() === "para revision"
                              ? "bg-orange-100 text-orange-700"
                              : formula.estatusformula?.toLowerCase() === "pendiente"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {formula.estatusformula || "Sin estatus"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAbrirMateriasPrimas(formula)}
                              title="Materias Primas"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-600">Materias Primas</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAbrirProductos(formula)} 
                              title="Producto"
                            >
                              <Box className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-600">Productos</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAbrirMateriales(formula)} 
                              title="Materiales de Envase/Empaque"
                              disabled={!formulasConProductos[formula.id]}
                            >
                              <Package2 className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-600">Materiales</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleAbrirEditarFormula(formula)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-600">Editar</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          title="Eliminar"
                          onClick={() => handleEliminarFormulaCotizacion(formula)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sección: Resumen de Totales + Botón Resumen */}
      {cotizacionRegistrada && formulas.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Resumen de Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Primera fila */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Materias Primas:</span>
                  <span className="text-sm font-semibold">${totales.totalMateriasPrimas.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Material Empaque y Envase:</span>
                  <span className="text-sm font-semibold">${(totales.totalMaterialEmpaque + totales.totalMaterialEnvase).toFixed(4)}</span>
                </div>
              </div>
              
              {/* Segunda fila */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Fórmulas Secundarias:</span>
                  <span className="text-sm font-semibold">${totales.totalFormulasSecundarias.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Cantidad de Formula:</span>
                  <span className="text-sm font-semibold">${totales.totalCantidadFormula.toFixed(4)}</span>
                </div>
              </div>

              {/* Tercera fila */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Costo Fórmulas:</span>
                  <span className="text-sm font-semibold">${totales.totalCostoFormulas.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Costo Producto:</span>
                  <span className="text-sm font-semibold">${totales.totalCostoProducto.toFixed(4)}</span>
                </div>
              </div>

              {/* Botón Resumen centrado al final */}
              {cotizacionId && hayProductosEnCotizacion && (
                <div className="flex justify-center pt-4 border-t mt-4">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push(`/cotizaciones/ver-resumen?id=${cotizacionId}`)}
                  >
                    Ver Resumen
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Agregar Cliente */}
      <Dialog open={showModalCliente} onOpenChange={setShowModalCliente}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
            <DialogDescription>Complete la información del cliente</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="clienteNombre">Nombre *</Label>
              <Input
                id="clienteNombre"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="clienteDireccion">Dirección</Label>
              <Input
                id="clienteDireccion"
                value={nuevoCliente.direccion}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="clienteEmail">Email</Label>
              <Input
                id="clienteEmail"
                type="email"
                value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalCliente(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarCliente} className="bg-black hover:bg-gray-800 text-white">
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Código Ya Existe */}
      <Dialog open={showModalCodigoExiste} onOpenChange={setShowModalCodigoExiste}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Ya Existe</DialogTitle>
            <DialogDescription>
              El código que ingresó ya está registrado en la base de datos. Se recomienda cambiarlo por otro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-gray-700 mb-2">Código recomendado:</p>
              <p className="text-lg font-bold text-gray-900">{codigoRecomendado}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalCodigoExiste(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setNuevaFormula({ ...nuevaFormula, codigo: codigoRecomendado })
                setShowModalCodigoExiste(false)
              }}
            >
              Usar Código Recomendado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Código MP Ya Existe */}
      <Dialog open={showModalCodigoMPExiste} onOpenChange={setShowModalCodigoMPExiste}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Ya Existe</DialogTitle>
            <DialogDescription>
              El código que ingresó ya está registrado en la base de datos de materias primas. Se recomienda cambiarlo por otro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-gray-700 mb-2">Código recomendado:</p>
              <p className="text-lg font-bold text-gray-900">c{codigoMPRecomendado}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalCodigoMPExiste(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setNuevaMateriaPrima({ ...nuevaMateriaPrima, codigo: codigoMPRecomendado })
                setShowModalCodigoMPExiste(false)
              }}
            >
              Usar Código Recomendado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Código Material Ya Existe */}
      <Dialog open={showModalCodigoMaterialExiste} onOpenChange={setShowModalCodigoMaterialExiste}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Ya Existe</DialogTitle>
            <DialogDescription>
              El código que ingresó ya está registrado en la base de datos de materiales de etiquetado. Se recomienda cambiarlo por otro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-gray-700 mb-2">Código recomendado:</p>
              <p className="text-lg font-bold text-gray-900">c{codigoMaterialRecomendado}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalCodigoMaterialExiste(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, codigo: codigoMaterialRecomendado })
                setShowModalCodigoMaterialExiste(false)
              }}
            >
              Usar Código Recomendado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Fórmula */}
      <Dialog
        open={showModalFormula}
        onOpenChange={(open) => {
          setShowModalFormula(open)
          // Resetear validación tanto al abrir como al cerrar
          setCodigoValidado(false)
          setNuevaFormula({
            codigo: "",
            nombre: "",
            especificaciones: "",
            unidadMedidaId: "",
            tipoMedida: "",
            formula: "",
          })
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Fórmula</DialogTitle>
            <DialogDescription>Complete la información de la fórmula</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="formulaCodigo">Código</Label>
              <Input
                id="formulaCodigo"
                value={nuevaFormula.codigo}
                onChange={(e) => setNuevaFormula({ ...nuevaFormula, codigo: e.target.value })}
                placeholder="Ingrese el código de la fórmula"
              />
            </div>

            <div>
              <Label htmlFor="formulaNombre">Nombre *</Label>
              <Input
                id="formulaNombre"
                value={nuevaFormula.nombre}
                onChange={(e) => setNuevaFormula({ ...nuevaFormula, nombre: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="formulaEspecificaciones">
                Especificaciones
                <span className="text-xs text-gray-500 ml-2">(Complemento del nombre)</span>
              </Label>
              <div className="relative">
                <Input
                  id="formulaEspecificaciones"
                  value={nuevaFormula.especificaciones}
                  onChange={(e) => setNuevaFormula({ ...nuevaFormula, especificaciones: e.target.value })}
                  onFocus={() => {
                    if (nuevaFormula.especificaciones.trim() !== "") {
                      setShowEspecificacionesDropdown(true)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowEspecificacionesDropdown(false), 200)}
                />
                {showEspecificacionesDropdown && especificacionesFiltradas.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    {especificacionesFiltradas.map((esp) => (
                      <div
                        key={esp.value}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setNuevaFormula({ ...nuevaFormula, especificaciones: esp.value })
                          setShowEspecificacionesDropdown(false)
                        }}
                      >
                        {esp.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="formulaTipoMedida">Tipo de Medida</Label>
              <Select
                value={nuevaFormula.tipoMedida}
                onValueChange={(value) => setNuevaFormula({ ...nuevaFormula, tipoMedida: value })}
              >
                <SelectTrigger id="formulaTipoMedida">
                  <SelectValue placeholder="Seleccione tipo de medida" />
                </SelectTrigger>
                <SelectContent>
                  {tipoMedidaOptions.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="formulaFormula">
                Fórmula *
                <span className="text-xs text-gray-500 ml-2">(Ejemplo: Formula 1, Fórmula 2A, etc.)</span>
              </Label>
              <Input
                id="formulaFormula"
                value={nuevaFormula.formula}
                onChange={(e) => setNuevaFormula({ ...nuevaFormula, formula: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModalFormula(false)
                setCodigoValidado(false)
                setNuevaFormula({
                  codigo: "",
                  nombre: "",
                  especificaciones: "",
                  unidadMedidaId: "",
                  tipoMedida: "",
                  formula: "",
                })
              }}
            >
              Regresar
            </Button>
            <Button
              onClick={() => {
                handleRegistrarFormula()
                setCodigoValidado(false)
                setNuevaFormula({
                  codigo: "",
                  nombre: "",
                  especificaciones: "",
                  unidadMedidaId: "",
                  tipoMedida: "",
                  formula: "",
                })
              }}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Registrar y Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Materias Primas */}
      <Dialog open={showModalMateriasPrimas} onOpenChange={(open) => {
        if (!open && (mpModificadas.size > 0 || formulasModificadas.size > 0)) {
          setShowConfirmSalirFormula(true)
        } else {
          setShowModalMateriasPrimas(open)
        }
      }}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Elaboración de la Fórmula - {formulaSeleccionada?.nombre}
            </DialogTitle>
            <DialogDescription>
              Agregue materias primas existentes o nuevas (cotizadas) a la fórmula
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sección: Agregar Materia Prima */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Agregar Materia Prima</h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Label htmlFor="txtMateriaPrima">Materia Prima</Label>
                  <Input
                    id="txtMateriaPrima"
                    type="text"
                    placeholder="Buscar materia prima..."
                    value={materiaPrimaInput}
                    onChange={(e) => handleMateriaPrimaSearch(e.target.value)}
                    onFocus={() => {
                      if (materiaPrimaSearchResults.length > 0) {
                        setShowMateriaPrimaDropdown(true)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowMateriaPrimaDropdown(false), 200)}
                  />
                  {showMateriaPrimaDropdown && materiaPrimaSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {materiaPrimaSearchResults.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                          onClick={() => handleSeleccionarMateriaPrima(item)}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="txtCantidad">Cantidad</Label>
                  <Input
                    id="txtCantidad"
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={cantidadMateriaPrima}
                    onChange={(e) => setCantidadMateriaPrima(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ddlUnidadMedidaMP">Unidad de Medida</Label>
                  <Select value={unidadMedidaIdMP} onValueChange={setUnidadMedidaIdMP} disabled={true}>
                    <SelectTrigger id="ddlUnidadMedidaMP">
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedidaOptions.map((unidad) => (
                        <SelectItem key={unidad.value} value={unidad.value}>
                          {unidad.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="txtCostoUnitario">Costo Unitario</Label>
                  <Input id="txtCostoUnitario" type="text" value={costoUnitarioMP} disabled className="bg-gray-100" />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarMateriaPrimaAFormula}
                    className="w-full bg-[#5d8f72] hover:bg-[#44785a] text-white"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Sección: Materias Primas Nuevas (Cotizadas) - Mostrado/Oculto */}
            {showNuevaMateriaPrimaForm && (
              <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold mb-4">
                  Materias primas que están siendo cotizadas y no están en base de datos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label htmlFor="mpNuevaProveedor">Proveedor</Label>
                    <Input
                      id="mpNuevaProveedor"
                      value={nuevaMateriaPrima.proveedor}
                      onChange={(e) => setNuevaMateriaPrima({ ...nuevaMateriaPrima, proveedor: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mpNuevaNombre">Materia Prima Nueva *</Label>
                    <Input
                      id="mpNuevaNombre"
                      value={nuevaMateriaPrima.nombre}
                      onChange={(e) => setNuevaMateriaPrima({ ...nuevaMateriaPrima, nombre: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mpNuevaUnidad">Unidad Medida *</Label>
                    <Select
                      value={nuevaMateriaPrima.unidadMedidaId}
                      onValueChange={(value) => setNuevaMateriaPrima({ ...nuevaMateriaPrima, unidadMedidaId: value })}
                      
                    >
                      <SelectTrigger id="mpNuevaUnidad" className="disabled:bg-gray-100 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map((um) => (
                          <SelectItem key={um.value} value={um.value}>
                            {um.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mpNuevaCosto">Costo Unitario *</Label>
                    <Input
                      id="mpNuevaCosto"
                      type="number"
                      step="0.01"
                      value={nuevaMateriaPrima.costoUnitario}
                      onChange={(e) => setNuevaMateriaPrima({ ...nuevaMateriaPrima, costoUnitario: e.target.value })}
                      
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-3">
                  <div className="md:col-span-2 flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="mpNuevaCantidad">Cantidad a Utilizar *</Label>
                      <Input
                        id="mpNuevaCantidad"
                        type="number"
                        step="0.01"
                        value={nuevaMateriaPrima.cantidad}
                        onChange={(e) => setNuevaMateriaPrima({ ...nuevaMateriaPrima, cantidad: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-gray-500 pb-2">
                      Indica la cantidad de esta materia prima que se usará en la fórmula.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNuevaMateriaPrimaForm(false)
                      setNuevaMateriaPrima({
                        codigo: "",
                        proveedor: "",
                        nombre: "",
                        cantidad: "",
                        unidadMedidaId: "",
                        costoUnitario: "",
                      })
                      setCodigoMPValidado(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRegistrarMateriaPrimaNueva}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Registrar y Agregar
                  </Button>
                </div>
              </div>
            )}

            {/* Botón para mostrar formulario de nuevas materias primas */}
            <div className="flex justify-start">
              {!showNuevaMateriaPrimaForm && (
                <Button
                  type="button"
                  onClick={() => setShowNuevaMateriaPrimaForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nueva Materia Prima
                </Button>
              )}
            </div>

            {/* Sección: Tabla de Materias Primas */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Materias Primas</h3>
              {console.log("[v0] Renderizando tabla con materiasPrimasAgregadas:", materiasPrimasAgregadas)}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">Acciones</th>
                      <th className="text-left p-3 font-semibold"></th>
                      <th className="text-left p-3 font-semibold">Tipo</th>
                      <th className="text-left p-3 font-semibold">Código</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Costo</th>
                      <th className="text-left p-3 font-semibold">Unidad de Medida</th>
                      <th className="text-left p-3 font-semibold">Factor Importación</th>
                      <th className="text-left p-3 font-semibold">Costo con FI</th>
                      <th className="text-left p-3 font-semibold border-l-2 border-gray-300 text-green-600">
                        Cantidad
                      </th>
                      <th className="text-left p-3 font-semibold text-green-600">Unidad Medida</th>
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasPrimasAgregadas.length > 0 ? (
                      materiasPrimasAgregadas.map((item) => (
                        <tr key={item.idrec} className={`border-b ${mpModificadas.has(item.idrec) ? 'bg-orange-100 hover:bg-orange-200' : 'hover:bg-gray-50'}`}>
                          <td className="text-left p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (!confirm("¿Está seguro de eliminar esta materia prima?")) return
                                
                                try {
                                  console.log("[v0] Eliminando materia prima - idrec:", item.idrec)
                                  
                                  // Eliminar el registro
                                  const { error: errorDelete } = await supabase
                                    .from("materiasprimasxformula")
                                    .delete()
                                    .eq("idrec", item.idrec)
                                  
                                  if (errorDelete) {
                                    console.error("[v0] Error eliminando:", errorDelete)
                                    alert("Error al eliminar: " + errorDelete.message)
                                    return
                                  }
                                  
                                  // Actualizar el costo de la fórmula sumando MPs y fórmulas secundarias
                                  const { data: costosData } = await supabase
                                    .from("materiasprimasxformula")
                                    .select("costoparcial")
                                    .eq("formulaid", formulaSeleccionada?.id)
                                    .eq("activo", true)
                                  
                                  const { data: costosFormulas } = await supabase
                                    .from("formulasxformula")
                                    .select("costoparcial")
                                    .eq("formulaid", formulaSeleccionada?.id)
                                    .eq("activo", true)
                                  
                                  const costoTotalMPs = costosData?.reduce((sum, mp) => sum + (mp.costoparcial || 0), 0) || 0
                                  const costoTotalFormulas = costosFormulas?.reduce((sum, f) => sum + (f.costoparcial || 0), 0) || 0
                                  const costoTotal = costoTotalMPs + costoTotalFormulas
                                  
                                  console.log("[v0] Actualizando costo de fórmula después de eliminar MP - MPs:", costoTotalMPs, "Formulas:", costoTotalFormulas, "Total:", costoTotal)
                                  
                                  const { error: errorUpdateCosto } = await supabase
                                    .from("formulas")
                                    .update({ costo: costoTotal })
                                    .eq("id", formulaSeleccionada?.id)
                                  
                                  if (errorUpdateCosto) {
                                    console.error("[v0] Error actualizando costo:", errorUpdateCosto)
                                  }

                                  // Actualizar formulasxproducto y producto si están relacionados
                                  const { data: formulaXProductoData } = await supabase
                                    .from("formulasxproducto")
                                    .select("idrec, cantidad, productoid")
                                    .eq("formulaid", formulaSeleccionada?.id)
                                    .eq("activo", true)
                                  
                                  if (formulaXProductoData && formulaXProductoData.length > 0) {
                                    const fxp = formulaXProductoData[0]
                                    const nuevoCostoParcial = fxp.cantidad * costoTotal
                                    
                                    // Actualizar costoparcial en formulasxproducto
                                    const { error: errorUpdateFXP } = await supabase
                                      .from("formulasxproducto")
                                      .update({ costoparcial: nuevoCostoParcial })
                                      .eq("idrec", fxp.idrec)
                                    
                                    if (errorUpdateFXP) {
                                      console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
                                    } else {
                                      // Actualizar el producto
                                      const productoid = fxp.productoid
                                      
                                      // 1. MP = costoparcial de formulasxproducto
                                      const mp = nuevoCostoParcial
                                      
                                      // 2. Obtener ME y MEM del producto
                                      const { data: materialesEtiquetado } = await supabase
                                        .from("materialesetiquetadoxproducto")
                                        .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
                                        .eq("productoid", productoid)
                                        .eq("activo", true)
                                      
                                      const me = materialesEtiquetado
                                        ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
                                        .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
                                      
                                      const mem = materialesEtiquetado
                                        ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
                                        .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
                                      
                                      // 3. Calcular MS = (MP + ME + MEM) * 0.03
                                      const ms = (mp + me + mem) * 0.03
                                      
                                      // 4. Calcular Costo Total = MP + ME + MEM + MS
                                      const costoProducto = mp + me + mem + ms
                                      
                                      console.log("[v0] Actualizando producto después de eliminar MP - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)
                                      
                                      // 5. Actualizar el producto
                                      const { error: errorUpdateProducto } = await supabase
                                        .from("productos")
                                        .update({
                                          mp: mp,
                                          ms: ms,
                                          costo: costoProducto
                                        })
                                        .eq("id", productoid)
                                      
                                      if (errorUpdateProducto) {
                                        console.error("Error actualizando producto:", errorUpdateProducto)
                                      }
                                    }
                                  }
                                  
                                  // Recargar el listado
                                  const { data: materiasActualizadas } = await supabase
                                    .from("materiasprimasxformula")
                                    .select(`
                                      idrec,
                                      formulaid,
                                      materiaprimaid,
                                      cantidad,
                                      costoparcial,
                                      materiasprima:materiaprimaid(
                                        id, 
                                        codigo, 
                                        nombre, 
                                        costo, 
                                        unidadmedidaid,
                                        factorimportacion,
                                        costoconfactorimportacion,
                                        unidadesmedida:unidadmedidaid(id, descripcion)
                                      )
                                    `)
                                    .eq("formulaid", formulaSeleccionada?.id)
                                  
                                  setMateriasPrimasAgregadas(materiasActualizadas || [])
                                  
                                  // Actualizar el estado de fórmulas con el nuevo costo
                                  setFormulas(prevFormulas =>
                                    prevFormulas.map(f =>
                                      f.id === formulaSeleccionada?.id ? { ...f, costo: costoTotal } : f
                                    )
                                  )
                                  
                                  alert("Materia prima eliminada exitosamente")
                                } catch (error) {
                                  console.error("[v0] Error:", error)
                                  alert("Error al eliminar la materia prima")
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </Button>
                          </td>
                          <td className="text-left p-3"></td>
                          <td className="text-left p-3">Materia Prima</td>
                          <td className="text-left p-3">{String(item.materiasprima?.codigo || "-")}</td>
                          <td className="text-left p-3">{String(item.materiasprima?.nombre || "-")}</td>
                          <td className="text-left p-3">${String(item.materiasprima?.costo || "0")}</td>
                          <td className="text-left p-3">{String(item.materiasprima?.unidadesmedida?.descripcion || item.materiasprima?.unidadesmedida || "-")}</td>
                          <td className="text-left p-3">{String(item.materiasprima?.factorimportacion || "0.00")}</td>
                          <td className="text-left p-3">${String(item.materiasprima?.costoconfactorimportacion || "0.00")}</td>
                          <td className="text-right p-3 border-l-2 border-gray-300 text-green-600 font-semibold">
                            <input
                              type="number"
                              step="any"
                              value={item.cantidad ?? 0}
                              onChange={(e) => {
                                const nuevaCantidad = parseFloat(e.target.value) || 0
                                const costoConFI = parseFloat(item.materiasprima?.costoconfactorimportacion) || 0
                                const nuevoCostoParcial = costoConFI * nuevaCantidad

                                setMateriasPrimasAgregadas(prev =>
                                  prev.map(mp =>
                                    mp.idrec === item.idrec
                                      ? { ...mp, cantidad: nuevaCantidad, costoparcial: nuevoCostoParcial }
                                      : mp
                                  )
                                )

                                const valorOriginal = mpValoresOriginales.get(item.idrec)
                                if (nuevaCantidad === valorOriginal) {
                                  // Restauró el valor original: quitar de modificados
                                  setMpModificadas(prev => {
                                    const next = new Set(prev)
                                    next.delete(item.idrec)
                                    return next
                                  })
                                } else {
                                  setMpModificadas(prev => new Set(prev).add(item.idrec))
                                }
                              }}
                              className={`w-36 px-2 py-1 border rounded text-right text-green-600 font-semibold ${mpModificadas.has(item.idrec) ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                            />
                          </td>
                          <td className="text-left p-3 text-green-600 font-semibold">
                            {String(item.materiasprima?.unidadesmedida?.descripcion || item.materiasprima?.unidadesmedida || "-")}
                          </td>
                          <td className="text-left p-3 text-green-600 font-semibold">${(item.costoparcial || 0).toFixed(4)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="text-center p-4 text-gray-500">
                          No hay materias primas agregadas
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan={9} className="text-right p-3 font-semibold">
                        T Cantidad:
                      </td>
                      <td className="text-left p-3 font-bold text-green-600">
                        {materiasPrimasAgregadas.reduce((sum, mp) => sum + (parseFloat(mp.cantidad) || 0), 0).toFixed(4)}
                      </td>
                      <td colSpan={1} className="text-right p-3 font-semibold">
                        Total MP:
                      </td>
                      <td className="text-right p-3 font-bold text-green-600">
                        ${materiasPrimasAgregadas.reduce((sum, mp) => sum + (mp.costoparcial || 0), 0).toFixed(4)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {mpModificadas.size > 0 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2"
                      onClick={async () => {
                        const registrosModificados = materiasPrimasAgregadas.filter(mp => mpModificadas.has(mp.idrec))

                        if (!confirm(`¿Desea modificar y actualizar los valores de ${registrosModificados.length} registro(s) alterado(s)?`)) return

                        try {
                          // 1. Update cada registro modificado en materiasprimasxformula
                          for (const reg of registrosModificados) {
                            const { error } = await supabase
                              .from("materiasprimasxformula")
                              .update({
                                cantidad: reg.cantidad,
                                costoparcial: reg.costoparcial,
                              })
                              .eq("idrec", reg.idrec)
                              .eq("formulaid", formulaSeleccionada?.id)

                            if (error) {
                              console.error("[v0] Error actualizando idrec:", reg.idrec, error)
                              alert(`Error al actualizar registro ${reg.materiasprima?.nombre}: ${error.message}`)
                              return
                            }
                          }

                          // 2. Recalcular costo de la fórmula (suma de MPs + fórmulas secundarias)
                          const { data: costosData } = await supabase
                            .from("materiasprimasxformula")
                            .select("costoparcial")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          const { data: costosFormulas } = await supabase
                            .from("formulasxformula")
                            .select("costoparcial")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          const costoTotalMPs = costosData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
                          const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
                          const costoTotal = costoTotalMPs + costoTotalFormulas

                          console.log("[v0] Actualizando costo fórmula después de edición - MPs:", costoTotalMPs, "Formulas:", costoTotalFormulas, "Total:", costoTotal)

                          const { error: errorUpdateCosto } = await supabase
                            .from("formulas")
                            .update({ costo: costoTotal })
                            .eq("id", formulaSeleccionada?.id)

                          if (errorUpdateCosto) {
                            console.error("[v0] Error actualizando costo fórmula:", errorUpdateCosto)
                          }

                          // 3. Actualizar estado local de fórmulas
                          setFormulas(prevFormulas =>
                            prevFormulas.map(f =>
                              f.id === formulaSeleccionada?.id ? { ...f, costo: costoTotal } : f
                            )
                          )

                          // 4. Actualizar formulasxproducto y producto si están relacionados
                          const { data: formulaXProductoData } = await supabase
                            .from("formulasxproducto")
                            .select("idrec, cantidad, productoid")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          if (formulaXProductoData && formulaXProductoData.length > 0) {
                            const fxp = formulaXProductoData[0]
                            const nuevoCostoParcial = fxp.cantidad * costoTotal

                            const { error: errorUpdateFXP } = await supabase
                              .from("formulasxproducto")
                              .update({ costoparcial: nuevoCostoParcial })
                              .eq("idrec", fxp.idrec)

                            if (errorUpdateFXP) {
                              console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
                            } else {
                              const productoid = fxp.productoid
                              const mp = nuevoCostoParcial

                              const { data: materialesEtiquetado } = await supabase
                                .from("materialesetiquetadoxproducto")
                                .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
                                .eq("productoid", productoid)
                                .eq("activo", true)

                              const me = materialesEtiquetado
                                ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
                                .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              const mem = materialesEtiquetado
                                ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
                                .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              const ms = (mp + me + mem) * 0.03
                              const costoProducto = mp + me + mem + ms

                              console.log("[v0] Actualizando producto - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)

                              const { error: errorUpdateProducto } = await supabase
                                .from("productos")
                                .update({ mp: mp, ms: ms, costo: costoProducto })
                                .eq("id", productoid)

                              if (errorUpdateProducto) {
                                console.error("Error actualizando producto:", errorUpdateProducto)
                              }
                            }
                          }

                          // 5. Limpiar estado de modificados y actualizar valores originales
                          setMpModificadas(new Set())
                          const nuevosOriginales = new Map<number, number>()
                          materiasPrimasAgregadas.forEach(mp => nuevosOriginales.set(mp.idrec, mp.cantidad))
                          setMpValoresOriginales(nuevosOriginales)

                          // 6. Refrescar tabla principal con nuevos costos
                          if (formulaSeleccionada?.id) {
                            // Obtener producto asociado
                            const { data: fxpRefresh } = await supabase
                              .from("formulasxproducto")
                              .select("productoid, cantidad")
                              .eq("formulaid", formulaSeleccionada.id)
                              .eq("activo", true)
                              .single()

                            if (fxpRefresh?.productoid) {
                              const { data: prodRefresh } = await supabase.from("productos").select("costo, mp, ms").eq("id", fxpRefresh.productoid).single()
                              const { data: matRefresh } = await supabase.from("materialesetiquetadoxproducto").select("costoparcial").eq("productoid", fxpRefresh.productoid).eq("activo", true)
                              const costoMERefresh = matRefresh?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              setFormulas(prev => prev.map(f => f.id === formulaSeleccionada.id
                                ? { ...f, costo: costoTotal, productoCosto: prodRefresh?.costo || 0, productoMP: prodRefresh?.mp || 0, productoCostoMS: prodRefresh?.ms || 0, productoCantidad: fxpRefresh.cantidad, productoCostoME: costoMERefresh }
                                : f
                              ))
                            } else {
                              setFormulas(prev => prev.map(f => f.id === formulaSeleccionada.id ? { ...f, costo: costoTotal } : f))
                            }
                          }

                          alert("Fórmula actualizada exitosamente")

                        } catch (error) {
                          console.error("[v0] Error en actualización:", error)
                          alert("Error al actualizar la fórmula")
                        }
                      }}
                    >
                      Actualizar Formula
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Agregar Fórmula */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Agregar Fórmula</h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Label htmlFor="txtFormulaElab">Fórmula</Label>
                  <Input
                    id="txtFormulaElab"
                    type="text"
                    placeholder="Buscar fórmula..."
                    value={formulaElabInput}
                    onChange={(e) => handleFormulaElabSearch(e.target.value)}
                    onFocus={() => {
                      if (formulaElabSearchResults.length > 0) {
                        setShowFormulaElabDropdown(true)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowFormulaElabDropdown(false), 200)}
                  />
                  {showFormulaElabDropdown && formulaElabSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {formulaElabSearchResults.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                          onClick={() => handleFormulaElabSelect(item)}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="txtCantidadFormulaElab">Cantidad</Label>
                  <Input
                    id="txtCantidadFormulaElab"
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={cantidadFormulaElab}
                    onChange={(e) => setCantidadFormulaElab(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ddlUnidadMedidaFormulaElab">Unidad de Medida</Label>
                  <Select value={unidadMedidaIdFormulaElab} onValueChange={setUnidadMedidaIdFormulaElab} disabled={true}>
                    <SelectTrigger id="ddlUnidadMedidaFormulaElab">
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedidaOptions.map((unidad) => (
                        <SelectItem key={unidad.value} value={unidad.value}>
                          {unidad.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="txtCostoUnitarioFormulaElab">Costo Unitario</Label>
                  <Input
                    id="txtCostoUnitarioFormulaElab"
                    type="text"
                    value={costoUnitarioFormulaElab}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarFormulaAFormula}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Sección: Tabla de Fórmulas */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Fórmulas</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">Acciones</th>
                      <th className="text-left p-3 font-semibold"></th>
                      <th className="text-left p-3 font-semibold">Tipo</th>
                      <th className="text-left p-3 font-semibold">Código</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Costo</th>
                      <th className="text-left p-3 font-semibold">Unidad de Medida</th>
                      <th className="text-left p-3 font-semibold">Factor Importación</th>
                      <th className="text-left p-3 font-semibold">Costo con FI</th>
                      <th className="text-left p-3 font-semibold border-l-2 border-gray-300 text-green-600">
                        Cantidad
                      </th>
                      <th className="text-left p-3 font-semibold text-green-600">Unidad Medida</th>
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulasAgregadas.length > 0 ? (
                      formulasAgregadas.map((item) => (
                        <tr key={item.idrec} className={`border-b border-gray-200 ${formulasModificadas.has(item.idrec) ? 'bg-orange-100 hover:bg-orange-200' : 'hover:bg-gray-50'}`}>
                          <td className="text-left p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("¿Está seguro de eliminar esta fórmula?")) {
                                  try {
                                    // Eliminar la relación de formulasxformula con DELETE
                                    const { error: errorDelete } = await supabase
                                      .from("formulasxformula")
                                      .delete()
                                      .eq("formulaid", formulaSeleccionada?.id)
                                      .eq("secundariaid", item.formulas?.id)
                                    
                                    if (errorDelete) throw errorDelete
                                    
                                    // Recalcular costo de la fórmula sumando MPs y fórmulas secundarias
                                    const { data: costosMPs } = await supabase
                                      .from("materiasprimasxformula")
                                      .select("costoparcial")
                                      .eq("formulaid", formulaSeleccionada?.id)
                                      .eq("activo", true)
                                    
                                    const { data: costosFormulas } = await supabase
                                      .from("formulasxformula")
                                      .select("costoparcial")
                                      .eq("formulaid", formulaSeleccionada?.id)
                                      .eq("activo", true)
                                    
                                    const costoTotalMPs = costosMPs?.reduce((sum, i) => sum + (i.costoparcial || 0), 0) || 0
                                    const costoTotalFormulas = costosFormulas?.reduce((sum, i) => sum + (i.costoparcial || 0), 0) || 0
                                    const nuevoCostoFormula = costoTotalMPs + costoTotalFormulas
                                    
                                    // Actualizar costo de la fórmula
                                    const { error: errorUpdateFormula } = await supabase
                                      .from("formulas")
                                      .update({ costo: nuevoCostoFormula })
                                      .eq("id", formulaSeleccionada?.id)
                                    
                                    if (errorUpdateFormula) throw errorUpdateFormula
                                    
                                    // Actualizar costoparcial en formulasxproducto si está relacionado
                                    const { data: formulaXProducto } = await supabase
                                      .from("formulasxproducto")
                                      .select("idrec, cantidad, productoid")
                                      .eq("formulaid", formulaSeleccionada?.id)
                                      .eq("activo", true)
                                    
                                    if (formulaXProducto && formulaXProducto.length > 0) {
                                      const fxp = formulaXProducto[0]
                                      const nuevoCostoParcialProducto = fxp.cantidad * nuevoCostoFormula
                                      
                                      const { error: errorUpdateFXP } = await supabase
                                        .from("formulasxproducto")
                                        .update({ costoparcial: nuevoCostoParcialProducto })
                                        .eq("idrec", fxp.idrec)
                                      
                                      if (errorUpdateFXP) {
                                        console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
                                      } else {
                                        // Actualizar el producto
                                        const productoid = fxp.productoid
                                        
                                        // 1. MP = costoparcial de formulasxproducto
                                        const mp = nuevoCostoParcialProducto
                                        
                                        // 2. Obtener ME y MEM del producto
                                        const { data: materialesEtiquetado } = await supabase
                                          .from("materialesetiquetadoxproducto")
                                          .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
                                          .eq("productoid", productoid)
                                          .eq("activo", true)
                                        
                                        const me = materialesEtiquetado
                                          ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
                                          .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
                                        
                                        const mem = materialesEtiquetado
                                          ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
                                          .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0
                                        
                                        // 3. Calcular MS = (MP + ME + MEM) * 0.03
                                        const ms = (mp + me + mem) * 0.03
                                        
                                        // 4. Calcular Costo Total = MP + ME + MEM + MS
                                        const costoProducto = mp + me + mem + ms
                                        
                                        console.log("[v0] Actualizando producto después de eliminar - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)
                                        
                                        // 5. Actualizar el producto
                                        const { error: errorUpdateProducto } = await supabase
                                          .from("productos")
                                          .update({
                                            mp: mp,
                                            ms: ms,
                                            costo: costoProducto
                                          })
                                          .eq("id", productoid)
                                        
                                        if (errorUpdateProducto) {
                                          console.error("Error actualizando producto:", errorUpdateProducto)
                                        }
                                      }
                                    }
                                    
                                    // Recargar listado de fórmulas
                                    const { data: formulasActualizadas } = await supabase
                                      .from("formulasxformula")
                                      .select(`
                                        idrec,
                                        formulaid,
                                        secundariaid,
                                        cantidad,
                                        costoparcial,
                                        formulas:secundariaid(
                                          id,
                                          codigo,
                                          nombre,
                                          costo,
                                          unidadmedidaid,
                                          unidadesmedida:unidadmedidaid(id, descripcion)
                                        )
                                      `)
                                      .eq("formulaid", formulaSeleccionada?.id)
                                      .eq("activo", true)
                                    
                                    setFormulasAgregadas(formulasActualizadas || [])
                                    
                                    // Actualizar el estado de fórmulas en la página
                                    setFormulas(prevFormulas =>
                                      prevFormulas.map(f =>
                                        f.id === formulaSeleccionada?.id ? { ...f, costo: nuevoCostoFormula } : f
                                      )
                                    )
                                    
                                    mostrarConfirmacion("Fórmula eliminada exitosamente", "success")
                                  } catch (error) {
                                    console.error("Error:", error)
                                    mostrarConfirmacion("Error al eliminar la fórmula", "error")
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </Button>
                          </td>
                          <td className="text-left p-3">
                            <Flask className="h-5 w-5 text-blue-600" />
                          </td>
                          <td className="text-left p-3">Fórmula</td>
                          <td className="text-left p-3">{String(item.formulas?.codigo || "-")}</td>
                          <td className="text-left p-3">{String(item.formulas?.nombre || "-")}</td>
                          <td className="text-left p-3">${String(item.formulas?.costo?.toFixed(6) || "0.000000")}</td>
                          <td className="text-left p-3">{String(item.formulas?.unidadesmedida?.descripcion || "-")}</td>
                          <td className="text-left p-3">No aplica</td>
                          <td className="text-left p-3">${String(item.formulas?.costo?.toFixed(6) || "0.000000")}</td>
                          <td className="text-right p-3 border-l-2 border-gray-300 text-green-600 font-semibold">
                            <input
                              type="number"
                              step="any"
                              value={item.cantidad ?? 0}
                              onChange={(e) => {
                                const nuevaCantidad = parseFloat(e.target.value) || 0
                                const costoFormula = parseFloat(item.formulas?.costo) || 0
                                const nuevoCostoParcial = costoFormula * nuevaCantidad

                                setFormulasAgregadas(prev =>
                                  prev.map(f =>
                                    f.idrec === item.idrec
                                      ? { ...f, cantidad: nuevaCantidad, costoparcial: nuevoCostoParcial }
                                      : f
                                  )
                                )

                                const valorOriginal = formulasValoresOriginales.get(item.idrec)
                                if (nuevaCantidad === valorOriginal) {
                                  setFormulasModificadas(prev => {
                                    const next = new Set(prev)
                                    next.delete(item.idrec)
                                    return next
                                  })
                                } else {
                                  setFormulasModificadas(prev => new Set(prev).add(item.idrec))
                                }
                              }}
                              className={`w-36 px-2 py-1 border rounded text-right text-green-600 font-semibold ${formulasModificadas.has(item.idrec) ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                            />
                          </td>
                          <td className="text-left p-3 text-green-600 font-semibold">{String(item.formulas?.unidadesmedida?.descripcion || "-")}</td>
                          <td className="text-left p-3 text-green-600 font-semibold">${(item.costoparcial || 0).toFixed(4)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="text-center p-4 text-gray-500">
                          No hay fórmulas agregadas
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan={9} className="text-right p-3 font-semibold">
                        T Cantidad:
                      </td>
                      <td className="text-left p-3 font-bold text-green-600">
                        {formulasAgregadas.reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0).toFixed(4)}
                      </td>
                      <td colSpan={1} className="text-right p-3 font-semibold">
                        Total:
                      </td>
                      <td className="text-right p-3 font-bold text-green-600">
                        ${formulasAgregadas.reduce((sum, item) => sum + (item.costoparcial || 0), 0).toFixed(4)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {formulasModificadas.size > 0 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2"
                      onClick={async () => {
                        const registrosModificados = formulasAgregadas.filter(f => formulasModificadas.has(f.idrec))

                        if (!confirm(`¿Desea modificar y actualizar los valores de ${registrosModificados.length} registro(s) alterado(s)?`)) return

                        try {
                          // 1. Update cada registro modificado en formulasxformula
                          for (const reg of registrosModificados) {
                            const { error } = await supabase
                              .from("formulasxformula")
                              .update({
                                cantidad: reg.cantidad,
                                costoparcial: reg.costoparcial,
                              })
                              .eq("idrec", reg.idrec)
                              .eq("formulaid", formulaSeleccionada?.id)

                            if (error) {
                              console.error("[v0] Error actualizando formulasxformula idrec:", reg.idrec, error)
                              alert(`Error al actualizar registro ${reg.formulas?.nombre}: ${error.message}`)
                              return
                            }
                          }

                          // 2. Recalcular costo de la fórmula (suma de MPs + fórmulas secundarias)
                          const { data: costosData } = await supabase
                            .from("materiasprimasxformula")
                            .select("costoparcial")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          const { data: costosFormulas } = await supabase
                            .from("formulasxformula")
                            .select("costoparcial")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          const costoTotalMPs = costosData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
                          const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0
                          const costoTotal = costoTotalMPs + costoTotalFormulas

                          console.log("[v0] Actualizando costo fórmula después de edición fórmulas - MPs:", costoTotalMPs, "Formulas:", costoTotalFormulas, "Total:", costoTotal)

                          const { error: errorUpdateCosto } = await supabase
                            .from("formulas")
                            .update({ costo: costoTotal })
                            .eq("id", formulaSeleccionada?.id)

                          if (errorUpdateCosto) {
                            console.error("[v0] Error actualizando costo fórmula:", errorUpdateCosto)
                          }

                          // 3. Actualizar estado local de fórmulas
                          setFormulas(prevFormulas =>
                            prevFormulas.map(f =>
                              f.id === formulaSeleccionada?.id ? { ...f, costo: costoTotal } : f
                            )
                          )

                          // 4. Actualizar formulasxproducto y producto si están relacionados
                          const { data: formulaXProductoData } = await supabase
                            .from("formulasxproducto")
                            .select("idrec, cantidad, productoid")
                            .eq("formulaid", formulaSeleccionada?.id)
                            .eq("activo", true)

                          if (formulaXProductoData && formulaXProductoData.length > 0) {
                            const fxp = formulaXProductoData[0]
                            const nuevoCostoParcial = fxp.cantidad * costoTotal

                            const { error: errorUpdateFXP } = await supabase
                              .from("formulasxproducto")
                              .update({ costoparcial: nuevoCostoParcial })
                              .eq("idrec", fxp.idrec)

                            if (errorUpdateFXP) {
                              console.error("Error actualizando formulasxproducto:", errorUpdateFXP)
                            } else {
                              const productoid = fxp.productoid
                              const mp = nuevoCostoParcial

                              const { data: materialesEtiquetado } = await supabase
                                .from("materialesetiquetadoxproducto")
                                .select("costoparcial, materialesetiquetado:materialetiquetadoid(tipomaterialid)")
                                .eq("productoid", productoid)
                                .eq("activo", true)

                              const me = materialesEtiquetado
                                ?.filter(m => m.materialesetiquetado?.tipomaterialid === 1)
                                .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              const mem = materialesEtiquetado
                                ?.filter(m => m.materialesetiquetado?.tipomaterialid === 2)
                                .reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              const ms = (mp + me + mem) * 0.03
                              const costoProducto = mp + me + mem + ms

                              console.log("[v0] Actualizando producto desde fórmulas - MP:", mp, "ME:", me, "MEM:", mem, "MS:", ms, "Costo:", costoProducto)

                              const { error: errorUpdateProducto } = await supabase
                                .from("productos")
                                .update({ mp: mp, ms: ms, costo: costoProducto })
                                .eq("id", productoid)

                              if (errorUpdateProducto) {
                                console.error("Error actualizando producto:", errorUpdateProducto)
                              }
                            }
                          }

                          // 5. Limpiar estado de modificados y actualizar valores originales
                          setFormulasModificadas(new Set())
                          const nuevosOriginales = new Map<number, number>()
                          formulasAgregadas.forEach(f => nuevosOriginales.set(f.idrec, f.cantidad))
                          setFormulasValoresOriginales(nuevosOriginales)

                          // 6. Refrescar tabla principal con nuevos costos
                          if (formulaSeleccionada?.id) {
                            const { data: fxpRefresh } = await supabase
                              .from("formulasxproducto")
                              .select("productoid, cantidad")
                              .eq("formulaid", formulaSeleccionada.id)
                              .eq("activo", true)
                              .single()

                            if (fxpRefresh?.productoid) {
                              const { data: prodRefresh } = await supabase.from("productos").select("costo, mp, ms").eq("id", fxpRefresh.productoid).single()
                              const { data: matRefresh } = await supabase.from("materialesetiquetadoxproducto").select("costoparcial").eq("productoid", fxpRefresh.productoid).eq("activo", true)
                              const costoMERefresh = matRefresh?.reduce((sum, m) => sum + (m.costoparcial || 0), 0) || 0

                              setFormulas(prev => prev.map(f => f.id === formulaSeleccionada.id
                                ? { ...f, costo: costoTotal, productoCosto: prodRefresh?.costo || 0, productoMP: prodRefresh?.mp || 0, productoCostoMS: prodRefresh?.ms || 0, productoCantidad: fxpRefresh.cantidad, productoCostoME: costoMERefresh }
                                : f
                              ))
                            } else {
                              setFormulas(prev => prev.map(f => f.id === formulaSeleccionada.id ? { ...f, costo: costoTotal } : f))
                            }
                          }

                          alert("Fórmula actualizada exitosamente")

                        } catch (error) {
                          console.error("[v0] Error en actualización de fórmulas:", error)
                          alert("Error al actualizar la fórmula")
                        }
                      }}
                    >
                      Actualizar Formula
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Costo Total */}
            <div className="border-t-2 border-blue-500 mt-4 pt-4">
              <div className="flex justify-end">
                <div className="w-2/5">
                  <div className="flex justify-between py-2">
                    <span className="font-bold">Costo total:</span>
                    <span className="font-bold">
                      ${(
                        materiasPrimasAgregadas.reduce((sum, mp) => sum + (mp.costoparcial || 0), 0) +
                        formulasAgregadas.reduce((sum, f) => sum + (f.costoparcial || 0), 0)
                      ).toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNuevaMateriaPrimaForm(false)
                setShowModalMateriasPrimas(false)
              }}
            >
              Regresar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmación de salida con cambios pendientes */}
      <AlertDialog open={showConfirmSalirFormula} onOpenChange={setShowConfirmSalirFormula}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Existen <span className="font-semibold text-orange-600">{mpModificadas.size + formulasModificadas.size} registro(s)</span> con
              modificaciones pendientes{mpModificadas.size > 0 && formulasModificadas.size > 0
                ? ` (${mpModificadas.size} materias primas y ${formulasModificadas.size} fórmulas)`
                : mpModificadas.size > 0 ? ' en materias primas' : ' en fórmulas'
              }. Si sales ahora, los cambios realizados se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                // Restaurar valores originales de materias primas
                setMateriasPrimasAgregadas(prev =>
                  prev.map(mp => {
                    const cantidadOriginal = mpValoresOriginales.get(mp.idrec)
                    if (cantidadOriginal !== undefined && mpModificadas.has(mp.idrec)) {
                      const costoConFI = parseFloat(mp.materiasprima?.costoconfactorimportacion) || 0
                      return { ...mp, cantidad: cantidadOriginal, costoparcial: costoConFI * cantidadOriginal }
                    }
                    return mp
                  })
                )
                // Restaurar valores originales de fórmulas
                setFormulasAgregadas(prev =>
                  prev.map(f => {
                    const cantidadOriginal = formulasValoresOriginales.get(f.idrec)
                    if (cantidadOriginal !== undefined && formulasModificadas.has(f.idrec)) {
                      const costoFormula = parseFloat(f.formulas?.costo) || 0
                      return { ...f, cantidad: cantidadOriginal, costoparcial: costoFormula * cantidadOriginal }
                    }
                    return f
                  })
                )
                setMpModificadas(new Set())
                setFormulasModificadas(new Set())
                setShowModalMateriasPrimas(false)
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Productos */}
      <Dialog open={showModalProducto} onOpenChange={setShowModalProducto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Asignar Producto</DialogTitle>
                <DialogDescription>Seleccione un producto para asignar a esta fórmula</DialogDescription>
              </div>
              {!productoAsignadoActual && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    cargarCatalogosProducto()
                    setShowModalRegistrarProducto(true)
                  }}
                >
                  Registrar nuevo Producto
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {productoAsignadoActual ? (
              /* Mostrar producto actual asignado */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 rounded-t-lg">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Producto Asignado
                  </h3>
                </div>
                
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={productoAsignadoActual.imgurl || "/placeholder.svg?height=80&width=80&text=P"}
                        alt={productoAsignadoActual.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-semibold text-gray-600 w-36">Código:</span>
                        <span className="text-gray-900">{productoAsignadoActual.codigo}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-600 w-36">Nombre:</span>
                        <span className="text-gray-900">{productoAsignadoActual.nombre}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-600 w-36">Envase:</span>
                        <span className="text-gray-900">{productoAsignadoActual.envase || "N/A"}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-600 w-36">Cantidad Presentación:</span>
                        <span className="text-gray-900">{productoAsignadoActual.cantidadpresentacion || "N/A"}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-600 w-36">Presentación:</span>
                        <span className="text-gray-900">{productoAsignadoActual.presentacionproducto || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button 
                      onClick={async () => {
                        // Cargar datos del producto para edición
                        if (productoAsignadoActual) {
                          console.log("[v0] Cargando datos para editar producto:", productoAsignadoActual.id)
                          
                          // Cargar catálogos primero
                          await cargarCatalogosProducto()
                          
                          const { data: productoData } = await supabase
                            .from("productos")
                            .select(`
                              nombre,
                              codigo,
                              presentacionproducto,
                              envase,
                              categoria,
                              sistemaid,
                              cantidadpresentacion,
                              sistemas:sistemaid(nombre)
                            `)
                            .eq("id", productoAsignadoActual.id)
                            .single()
                          
                          if (productoData) {
                            console.log("[v0] Producto a editar:", productoData)
                            setProductoEditandoId(productoAsignadoActual.id)
                            
                            // Quitar la "c" inicial del código para mostrar en el input
                            const codigoSinC = productoData.codigo?.startsWith('c') 
                              ? productoData.codigo.substring(1) 
                              : productoData.codigo || ""
                            
                          setNuevoProducto({
                            ...nuevoProducto,
                            nombre: productoData.nombre || "",
                            presentacion: productoData.presentacionproducto || "",
                            envase: productoData.envase || "",
                            categoria: productoData.categoria || "",
                              cantidadPresentacion: productoData.cantidadpresentacion || "",
                              objetivo: "",
                              imgUrl: "",
                            })
                            await cargarCatalogosProducto()
                            setShowModalRegistrarProducto(true)
                          }
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Editar Producto
                    </Button>
                    <Button 
                      onClick={handleDesasociarProducto} 
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      Desasociar Producto
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Formulario para asignar nuevo producto */
              <>
                <div className="relative">
                  <Label htmlFor="txtProducto">Productos</Label>
                  <input
                    type="text"
                    id="txtProducto"
                    placeholder="Buscar producto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={productoInput}
                    onChange={(e) => {
                      setProductoInput(e.target.value)
                      setShowProductosDropdown(true)
                    }}
                    onFocus={() => setShowProductosDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductosDropdown(false), 200)}
                  />

                  {showProductosDropdown && Array.isArray(productosCliente) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-[300px] overflow-y-auto">
                      {productosCliente
                        .filter(
                          (p) =>
                            p.codigo?.toLowerCase().includes(productoInput.toLowerCase()) ||
                            p.nombre?.toLowerCase().includes(productoInput.toLowerCase())
                        )
                        .map((producto) => (
                          <div
                            key={producto.id}
                            onClick={() => handleSeleccionarProducto(producto)}
                            className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                          >
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                              <img
                                src={producto.imgurl || "/placeholder.svg?height=48&width=48&text=P"}
                                alt={producto.nombre || "Producto"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{producto.codigo}</div>
                              <div className="text-sm text-gray-600">{producto.nombre}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {productoSeleccionado && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex gap-4">
                  {/* Imagen del Producto */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={productoSeleccionado.imgurl || "/placeholder.svg?height=96&width=96&text=P"}
                        alt={productoSeleccionado.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Información del Producto */}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                      Información del Producto
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex">
                        <span className="text-gray-600 w-32 flex-shrink-0">Código:</span>
                        <span className="font-medium text-gray-900">{productoSeleccionado.codigo}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32 flex-shrink-0">Nombre:</span>
                        <span className="font-medium text-gray-900">{productoSeleccionado.nombre}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32 flex-shrink-0">Envase:</span>
                        <span className="font-medium text-gray-900">{productoSeleccionado.envase || "N/A"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32 flex-shrink-0">Presentación:</span>
                        <span className="font-medium text-gray-900">{productoSeleccionado.presentacionproducto || "N/A"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32 flex-shrink-0">Cantidad:</span>
                        <span className="font-medium text-gray-900">{productoSeleccionado.cantidadpresentacion || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botón de Asignar */}
                <div className="mt-4">
                  <Button 
                    onClick={handleAsignarProducto} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Asignar Producto a Fórmula
                  </Button>
                </div>
              </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModalProducto(false)
                setProductoInput("")
                setProductoId(null)
                setProductoSeleccionado(null)
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Fórmula */}
      <Dialog open={showModalEditarFormula} onOpenChange={setShowModalEditarFormula}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Fórmula</DialogTitle>
            <DialogDescription>Modifique la información de la fórmula</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCodigo">Código</Label>
                <Input
                  id="editCodigo"
                  value={formulaEditada.codigo}
                  onChange={(e) => setFormulaEditada({ ...formulaEditada, codigo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editNombre">Nombre</Label>
                <Input
                  id="editNombre"
                  value={formulaEditada.nombre}
                  onChange={(e) => setFormulaEditada({ ...formulaEditada, nombre: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editEspecificaciones">Especificaciones</Label>
              <Input
                id="editEspecificaciones"
                value={formulaEditada.especificaciones}
                onChange={(e) => setFormulaEditada({ ...formulaEditada, especificaciones: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editTipoMedida">Tipo de Medida</Label>
              <select
                id="editTipoMedida"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formulaEditada.tipoMedida}
                onChange={(e) => setFormulaEditada({ ...formulaEditada, tipoMedida: e.target.value })}
              >
                <option value="">Seleccione...</option>
                {tipoMedidaOptions.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.text}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="editFormula">Fórmula</Label>
              <Input
                id="editFormula"
                value={formulaEditada.formula}
                onChange={(e) => setFormulaEditada({ ...formulaEditada, formula: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalEditarFormula(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActualizarFormula}>Actualizar Información</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={showModalConfirmacion} onOpenChange={setShowModalConfirmacion}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoConfirmacion === "success" ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              {tipoConfirmacion === "success" ? "Operación Exitosa" : "Error"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{mensajeConfirmacion}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowModalConfirmacion(false)} className="w-full">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Materiales de Envase/Empaque */}
      <Dialog open={showModalMateriales} onOpenChange={setShowModalMateriales}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Materiales de Envase y Empaque</DialogTitle>
            <DialogDescription>
              Producto: {productoDeMaterial?.nombre || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Botón Nuevo Material Empaque */}
            {!mostrarNuevoMaterialEmpaque && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarNuevoMaterialEmpaque(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nuevo Material Empaque
                </Button>
              </div>
            )}

            {/* Formulario Nuevo Material (condicional) */}
            {mostrarNuevoMaterialEmpaque && (
              <div className="border-2 border-blue-500 rounded-lg p-4 space-y-3 bg-blue-50">
                <h3 className="text-base font-semibold text-blue-800">Registrar Nuevo Material</h3>
                
                {/* Primera fila */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="nuevoProveedorMaterial" className="text-xs">Proveedor</Label>
                    <Input
                      id="nuevoProveedorMaterial"
                      type="text"
                      placeholder="Nombre del proveedor"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.proveedor}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, proveedor: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoTipoMaterial" className="text-xs">Tipo Material *</Label>
                    <select
                      id="nuevoTipoMaterial"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={nuevoMaterialEmpaque.tipoMaterial}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, tipoMaterial: e.target.value })}
                      
                    >
                      <option value="">Seleccione...</option>
                      <option value="1">Material de Empaquetado</option>
                      <option value="2">Material de Envase</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoNombreMaterial" className="text-xs">Nuevo Material de Empaque *</Label>
                    <Input
                      id="nuevoNombreMaterial"
                      type="text"
                      placeholder="Nombre"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.nombre}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, nombre: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoDetalle" className="text-xs">Detalle</Label>
                    <Input
                      id="nuevoDetalle"
                      type="text"
                      placeholder="Detalle"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.detalle}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, detalle: e.target.value })}
                      
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevasEspecificaciones" className="text-xs">Especificaciones</Label>
                    <Input
                      id="nuevasEspecificaciones"
                      type="text"
                      placeholder="Especificaciones"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.especificaciones}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, especificaciones: e.target.value })}
                      
                    />
                  </div>
                </div>

                {/* Segunda fila */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="nuevaMedida" className="text-xs">Medida</Label>
                    <Input
                      id="nuevaMedida"
                      type="text"
                      placeholder="Medida"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.medida}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, medida: e.target.value })}
                      
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoTipoMedida" className="text-xs">Tipo Medida</Label>
                    <select
                      id="nuevoTipoMedida"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={nuevoMaterialEmpaque.tipomedida}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, tipomedida: e.target.value })}
                      
                    >
                      <option value="">Seleccione...</option>
                      {tiposMedidaMaterial.map((tipo, index) => (
                        <option key={index} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoColor" className="text-xs">Color</Label>
                    <select
                      id="nuevoColor"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={nuevoMaterialEmpaque.color}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, color: e.target.value })}
                      
                    >
                      <option value="">Seleccione...</option>
                      {coloresMaterial.map((color, index) => (
                        <option key={index} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevaUnidadMedida" className="text-xs">Unidad de Medida *</Label>
                    <select
                      id="nuevaUnidadMedida"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={nuevoMaterialEmpaque.unidadMedidaId}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, unidadMedidaId: e.target.value })}
                      
                    >
                      <option value="">Seleccione...</option>
                      {unidadesMedida.map((unidad) => (
                        <option key={unidad.id} value={unidad.id}>
                          {unidad.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nuevoCostoUnitario" className="text-xs">Costo Unitario *</Label>
                    <Input
                      id="nuevoCostoUnitario"
                      type="number"
                      step="0.000001"
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.costoUnitario}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, costoUnitario: e.target.value })}
                      
                    />
                  </div>
                </div>

                {/* Tercera fila con Cantidad y Botones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="nuevaCantidad" className="text-xs">Cantidad a Utilizar *</Label>
                    <Input
                      id="nuevaCantidad"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={nuevoMaterialEmpaque.cantidad}
                      onChange={(e) => setNuevoMaterialEmpaque({ ...nuevoMaterialEmpaque, cantidad: e.target.value })}
                      
                    />
                  </div>

                  <div className="flex items-center text-xs text-gray-600">
                    Este dato hace referencia a la cantidad que va a utilizar en la fórmula
                  </div>

                  <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMostrarNuevoMaterialEmpaque(false)
                      setNuevoMaterialEmpaque({
                        tipoMaterial: "",
                        codigo: "",
                        nombre: "",
                        detalle: "",
                        especificaciones: "",
                        medida: "",
                        tipomedida: "",
                        color: "",
                        unidadMedidaId: "",
                        costoUnitario: "",
                        cantidad: "",
                      })
                      setCodigoMaterialValidado(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleRegistrarYAgregarNuevoMaterial}
                    
                  >
                    Registrar y Agregar
                  </Button>
                </div>
                </div>
              </div>
            )}

            {/* Sección Material Empaque */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Agregar Material Empaque</h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="txtMaterialEmpaquetado">Material de Empaque</Label>
                  <Input
                    id="txtMaterialEmpaquetado"
                    type="text"
                    placeholder="Buscar material de etiquetado..."
                    value={materialesEtiquetadoBuscar}
                    onChange={(e) => setMaterialesEtiquetadoBuscar(e.target.value)}
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
                  <Label htmlFor="txtME1Cantidad">Cantidad</Label>
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
                  <Label htmlFor="txtME1UnidadMedida">Unidad de Medida</Label>
                  <Input
                    id="txtME1UnidadMedida"
                    type="text"
                    value={materialEtiquetadoSeleccionado?.unidadmedida || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtME1Costo">Costo Unitario</Label>
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

              <h3 className="text-lg font-semibold">Materiales de Empaque del Producto</h3>

              {materialesAsignados.filter((m) => m.materialesetiquetado?.tipomaterialid === 1).length > 0 ? (
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
                      {materialesAsignados
                        .filter((m) => m.materialesetiquetado?.tipomaterialid === 1)
                        .map((materialRel, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.codigo || "N/A"}</td>
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.nombre || "N/A"}</td>
                            <td className="p-2 text-sm">
                              ${materialRel.materialesetiquetado?.costo?.toFixed(6) || "0.000000"}
                            </td>
                            <td className="p-2 text-sm">
                              {materialRel.materialesetiquetado?.unidadmedida || "N/A"}
                            </td>
                            <td className="border-l-2 p-2 text-sm">{materialRel?.cantidad || "0"}</td>
                            <td className="text-sm">${materialRel?.costoparcial?.toFixed(6) || "0.000000"}</td>
                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleEliminarMaterial(materialRel.productoid, materialRel.materialetiquetadoid)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td colSpan={6} className="text-right p-3 font-semibold">
                          Total Materiales de Empaque:
                        </td>
                        <td colSpan={2} className="text-right p-3 font-bold text-[#68BAA1]">
                          ${materialesAsignados
                            .filter((m) => m.materialesetiquetado?.tipomaterialid === 1)
                            .reduce((sum, m) => sum + (m.costoparcial || 0), 0)
                            .toFixed(6)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay materiales de empaque asignados.</p>
              )}
            </div>

            <div className="border-t-2 border-[#6db8c9] mt-4 pt-4"></div>

            {/* Sección Material Envase */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Agregar Material de Envase</h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="txtMaterialEnvase">Material de Envase</Label>
                  <Input
                    id="txtMaterialEnvase"
                    type="text"
                    placeholder="Buscar material de envase..."
                    value={materialesEnvaseBuscar}
                    onChange={(e) => setMaterialesEnvaseBuscar(e.target.value)}
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
                    value={materialEnvaseSeleccionado?.unidadmedida || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtMECosto">Costo Unitario</Label>
                  <Input
                    id="txtMECosto"
                    type="text"
                    value={materialEnvaseSeleccionado ? `$${materialEnvaseSeleccionado.costo.toFixed(6)}` : ""}
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

              {materialesAsignados.filter((m) => m.materialesetiquetado?.tipomaterialid === 2).length > 0 ? (
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
                      {materialesAsignados
                        .filter((m) => m.materialesetiquetado?.tipomaterialid === 2)
                        .map((materialRel, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.codigo || "N/A"}</td>
                            <td className="p-2 text-sm">{materialRel.materialesetiquetado?.nombre || "N/A"}</td>
                            <td className="p-2 text-sm">
                              ${materialRel.materialesetiquetado?.costo?.toFixed(6) || "0.000000"}
                            </td>
                            <td className="p-2 text-sm">
                              {materialRel.materialesetiquetado?.unidadmedida || "N/A"}
                            </td>
                            <td className="border-l-2 p-2 text-sm">{materialRel?.cantidad || "0"}</td>
                            <td className="text-sm">${materialRel?.costoparcial?.toFixed(6) || "0.000000"}</td>
                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleEliminarMaterial(materialRel.productoid, materialRel.materialetiquetadoid)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td colSpan={6} className="text-right p-3 font-semibold">
                          Total Materiales de Envase:
                        </td>
                        <td colSpan={2} className="text-right p-3 font-bold text-[#68BAA1]">
                          ${materialesAsignados
                            .filter((m) => m.materialesetiquetado?.tipomaterialid === 2)
                            .reduce((sum, m) => sum + (m.costoparcial || 0), 0)
                            .toFixed(6)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay materiales de etiquetado asignados.</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowModalMateriales(false)
                setFormulaParaMateriales(null)
                setProductoDeMaterial(null)
                setMaterialesAsignados([])
              }}
            >
              Regresar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Nuevo Producto */}
      <Dialog open={showModalRegistrarProducto} onOpenChange={setShowModalRegistrarProducto}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Producto</DialogTitle>
            <DialogDescription>Complete la información del producto</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Información del Producto */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Información del Producto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombreProducto">Nombre *</Label>
                  <Input
                    id="nombreProducto"
                    value={String(nuevoProducto.nombre || "")}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                    placeholder="Ingrese el nombre del producto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presentacionProducto">Presentación</Label>
                  <select
                    id="presentacionProducto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(nuevoProducto.presentacion || "")}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, presentacion: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {presentacionesProducto.map((presentacion, index) => (
                      <option key={index} value={String(presentacion)}>
                        {String(presentacion)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="envaseProducto">Envase</Label>
                  <select
                    id="envaseProducto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(nuevoProducto.envase || "")}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, envase: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {envasesProducto.map((envase, index) => (
                      <option key={index} value={String(envase)}>
                        {String(envase)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoriaProducto">Categoría</Label>
                  <select
                    id="categoriaProducto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(nuevoProducto.categoria || "")}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {categoriasProducto.map((categoria, index) => (
                      <option key={index} value={String(categoria)}>
                        {String(categoria)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="sistemaProducto">Sistema</Label>
                  <select
                    id="sistemaProducto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(nuevoProducto.sistema || "")}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, sistema: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {sistemasProducto.map((sistema, index) => (
                      <option key={index} value={String(sistema)}>
                        {String(sistema)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="cantidadPresentacionProducto">Cantidad Presentacion</Label>
                <Input
                  id="cantidadPresentacionProducto"
                  type="text"
                  value={String(nuevoProducto.cantidadPresentacion || "")}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadPresentacion: e.target.value })}
                  placeholder="Ingrese la cantidad de presentación"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModalRegistrarProducto(false)
                setProductoEditandoId(null)
                setNuevoProducto({
                  nombre: "",
                  clave: "",
                  presentacion: "",
                  envase: "",
                  objetivo: "",
                  categoria: "",
                  sistema: "",
                  codigomaestro: "",
                  cantidadPresentacion: "",
                  imgUrl: "",
                })
              }}
              disabled={guardandoProducto}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarNuevoProducto}
              disabled={guardandoProducto}
            >
              {guardandoProducto ? "Guardando..." : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
