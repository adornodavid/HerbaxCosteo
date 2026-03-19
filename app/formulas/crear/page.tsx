"use client"

/* ==================================================
	Imports
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Flag as Flask, Trash2, ChevronLeft, ChevronRight, FileText, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// -- Tipados (interfaces, clases, objetos) --
import type React from "react"
import type {
  propsPageModalValidation,
  propsPageModalAlert,
  propsPageModalError,
  propsPageModalTutorial,
} from "@/types/common"
import type { oFormula } from "@/types/formulas.types"
import type { ddlItem } from "@/types/common.types"
// -- Librerias --
// Configuraciones
import { RolesAdminDOs } from "@/lib/config"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalError } from "@/components/page-modal-error"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { crearFormula, objetoFormula, recalcularFormula, copiarComposicionFormula } from "@/app/actions/formulas"
import { listaDesplegableUnidadesMedida } from "@/app/actions/catalogos"
import {
  eliminarMateriaPrimaXFormula,
  listaDesplegableMateriasPrimasBuscar,
  obtenerMateriasPrimas,
  crearMateriaPrimaXFormula,
} from "@/app/actions/materia-prima"
import {
  eliminarFormulaXFormula,
  listaDesplegableFormulasBuscar,
  crearFormulaXFormula,
  obtenerFormulas,
} from "@/app/actions/formulas"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function CrearFormulaPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const searchParams = useSearchParams()
  const baseFormulaId = searchParams.get("baseId")
  
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])

  // --- Estados ---
  // Cargar contenido en variables
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([])
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  // Mostrar/Ocultar contenido
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  // Estados para multi-stage formula creation
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1)
  const [createdFormulaId, setCreatedFormulaId] = useState<number | null>(null)
  const [formula, setFormula] = useState<oFormula | null>(null)
  const [showCodeExistsModal, setShowCodeExistsModal] = useState(false)
  // Estados para materia prima form
  const [materiaPrimaInput, setMateriaPrimaInput] = useState("")
  const [materiaPrimaId, setMateriaPrimaId] = useState<number | null>(null)
  const [materiaPrimaSearchResults, setMateriaPrimaSearchResults] = useState<ddlItem[]>([])
  const [showMateriaPrimaDropdown, setShowMateriaPrimaDropdown] = useState(false)
  const [cantidad, setCantidad] = useState("")
  const [unidadMedidaId, setUnidadMedidaId] = useState("")
  const [costoUnitario, setCostoUnitario] = useState("")
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [addValidationMessage, setAddValidationMessage] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: "mp" | "formula"; id: number } | null>(null)
  // Estados para formula form
  const [formulaInput, setFormulaInput] = useState("")
  const [formulaIdState, setFormulaId] = useState<number | null>(null)
  const [formulaSearchResults, setFormulaSearchResults] = useState<ddlItem[]>([])
  const [showFormulaDropdown, setShowFormulaDropdown] = useState(false)
  const [cantidadFormula, setCantidadFormula] = useState("")
  const [unidadMedidaIdFormula, setUnidadMedidaIdFormula] = useState("")
  const [costoUnitarioFormula, setCostoUnitarioFormula] = useState("")

  // -- Funciones --
  const ejecutarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const codigo = formData.get("codigo") as string
    const unidadmedidaid = formData.get("unidadmedidaid") as string

    if (!nombre || nombre.trim().length < 3 || !codigo || codigo.trim().length === 0 || !unidadmedidaid || unidadmedidaid === "") {
      setModalValidation({
        Titulo: "Información necesaria incompleta.",
        Mensaje: "Favor de completar los campos obligatorios (Nombre, Código, Unidad de Medida).",
      })
      setShowModalValidation(true)
      return
    }

    if (codigo && codigo.trim().length > 0) {
      try {
        const result = await obtenerFormulas(-1, codigo, "", "Todos", -1, -1)
        if (result.success && result.data && result.data.length > 0) {
          setShowCodeExistsModal(true)
          return
        }
      } catch (error) {
        console.error("Error validating codigo:", error)
      }
    }

    setShowProcessing(true)
    setIsSubmitting(true)

    try {
      const result = await crearFormula(formData)
      setShowProcessing(false)

      if (result.success) {
        const newId = result.data
        
        // Si hay una fórmula base, copiamos su composición
        if (baseFormulaId) {
          setShowProcessing(true) // Volver a mostrar loading
          const copyResult = await copiarComposicionFormula(newId, Number(baseFormulaId))
          setShowProcessing(false)
          
          if (!copyResult.success) {
            console.error("Error copiando composición:", copyResult.error)
            // No detenemos el flujo, pero podríamos mostrar una alerta
          }
        }

        setCreatedFormulaId(newId)
        setCurrentStage(2)
        await cargarDatosFormula(newId)
      } else {
        setModalError({
          Titulo: "Error al crear fórmula",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      alert("Error inesperado al crear fórmula")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cargarDatosFormula = async (formulaId: number) => {
    try {
      setShowPageLoading(true)
      const result = await objetoFormula(formulaId, "", "", "Todos", -1, -1)

      if (result.success && result.data) {
        setFormula(result.data)
      }
    } catch (error) {
      console.error("Error cargando datos de la fórmula:", error)
    } finally {
      setShowPageLoading(false)
    }
  }

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

  const handleMateriaPrimaSelect = async (item: ddlItem) => {
    setMateriaPrimaInput(item.text)
    setMateriaPrimaId(Number(item.value))
    setShowMateriaPrimaDropdown(false)

    const result = await obtenerMateriasPrimas(Number(item.value), "", "", "Todos", -1, -1)
    if (result.success && result.data && result.data.length > 0) {
      const materiaPrima = result.data[0]
      setUnidadMedidaId(materiaPrima.unidadmedidaid?.toString() || "")
      setCostoUnitario(materiaPrima.costo?.toString() || "0")
    }
  }

  const handleAgregarMateriaPrima = () => {
    if (!materiaPrimaId) {
      setAddValidationMessage("Debe seleccionar una materia prima para proceder")
      setShowAddConfirmModal(true)
      return
    }

    if (!cantidad || cantidad.trim() === "" || Number(cantidad) <= 0) {
      setAddValidationMessage("Debe agregar una cantidad válida para proceder")
      setShowAddConfirmModal(true)
      return
    }

    setAddValidationMessage("¿Confirma que desea agregar esta materia prima a la fórmula?")
    setShowAddConfirmModal(true)
  }

  const handleFormulaSearch = async (searchText: string) => {
    setFormulaInput(searchText)

    if (searchText.trim().length >= 2) {
      const results = await listaDesplegableFormulasBuscar(searchText)
      setFormulaSearchResults(results)
      setShowFormulaDropdown(true)
    } else {
      setFormulaSearchResults([])
      setShowFormulaDropdown(false)
    }
  }

  const handleFormulaSelect = async (item: ddlItem) => {
    setFormulaInput(item.text)
    setFormulaId(Number(item.value))
    setShowFormulaDropdown(false)

    const result = await objetoFormula(Number(item.value), "", "", "Todos", -1, -1)
    if (result.success && result.data) {
      const formulaData = result.data
      setUnidadMedidaIdFormula(formulaData.unidadmedidaid?.toString() || "")
      setCostoUnitarioFormula(formulaData.costo?.toString() || "0")
    }
  }

  const handleAgregarFormula = () => {
    if (!formulaIdState) {
      setAddValidationMessage("Debe seleccionar una fórmula para proceder")
      setShowAddConfirmModal(true)
      return
    }

    if (!cantidadFormula || cantidadFormula.trim() === "" || Number(cantidadFormula) <= 0) {
      setAddValidationMessage("Debe agregar una cantidad válida para proceder")
      setShowAddConfirmModal(true)
      return
    }

    setAddValidationMessage("¿Confirma que desea agregar esta fórmula a la fórmula principal?")
    setShowAddConfirmModal(true)
  }

  const handleConfirmAdd = async () => {
    setShowAddConfirmModal(false)
    setShowProcessing(true)

    try {
      let result

      if (materiaPrimaId && cantidad && createdFormulaId) {
        result = await crearMateriaPrimaXFormula(materiaPrimaId, createdFormulaId, Number(cantidad))
      } else if (formulaIdState && cantidadFormula && createdFormulaId) {
        result = await crearFormulaXFormula(formulaIdState, createdFormulaId, Number(cantidadFormula))
      }

      if (result?.success) {
        await recalcularFormula(createdFormulaId!)
        await cargarDatosFormula(createdFormulaId!)

        // Reset forms
        setMateriaPrimaInput("")
        setMateriaPrimaId(null)
        setCantidad("")
        setUnidadMedidaId("")
        setCostoUnitario("")

        setFormulaInput("")
        setFormulaId(null)
        setCantidadFormula("")
        setUnidadMedidaIdFormula("")
        setCostoUnitarioFormula("")

        alert("Elemento agregado exitosamente")
      } else {
        setModalError({
          Titulo: "Error al agregar",
          Mensaje: result?.error || "Error desconocido",
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: error,
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
    }
  }

  const handleDeleteClick = (type: "mp" | "formula", id: number) => {
    setDeleteItem({ type, id })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteItem || !createdFormulaId) return

    setShowProcessing(true)
    setShowDeleteModal(false)

    try {
      let result
      if (deleteItem.type === "mp") {
        result = await eliminarMateriaPrimaXFormula(deleteItem.id, createdFormulaId)
      } else {
        result = await eliminarFormulaXFormula(deleteItem.id, createdFormulaId)
      }

      if (result.success) {
        await recalcularFormula(createdFormulaId)
        await cargarDatosFormula(createdFormulaId)
        alert("Elemento eliminado exitosamente")
      } else {
        setModalError({
          Titulo: "Error al eliminar",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: error,
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
      setDeleteItem(null)
    }
  }

  const handleFinalizarCreacion = () => {
    setCurrentStage(3)
  }

  // Added function to confirm finalization and redirect
  const handleConfirmarFinalizar = async () => {
    if (!createdFormulaId) return

    setShowProcessing(true)
    try {
      // Recalcular costo final antes de terminar
      const result = await recalcularFormula(createdFormulaId)
      
      if (result.success) {
        router.push("/formulas")
      } else {
        setModalError({
          Titulo: "Error al finalizar",
          Mensaje: result.error || "Error desconocido al actualizar el costo final",
        })
        setShowModalError(true)
      }
    } catch (error) {
      console.error("Error finalizing formula:", error)
      setModalError({
        Titulo: "Error inesperado",
        Mensaje: "Ocurrió un error al finalizar el proceso.",
      })
      setShowModalError(true)
    } finally {
      setShowProcessing(false)
    }
  }


  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    // Validar
    if (!user || user.RolId === 0) {
      router.push("/login")
      return
    }

    // Cargar unidades de medida
    const cargarUnidadesMedida = async () => {
      try {
        const result = await listaDesplegableUnidadesMedida(-1,"")
        if (result.success && result.data) {
          setUnidadesMedida(result.data)
        }
      } catch (error) {
        console.error("Error cargando unidades de medida:", error)
      }
    }

    cargarUnidadesMedida()
    console.log("unidad",unidadesMedida)
  }, [authLoading, user, router, esAdminDOs])

  // -- Manejadores (Handles) --
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageProcessing isOpen={showProcessing} />

      {showModalValidation && (
        <PageModalValidation
          Titulo={ModalValidation.Titulo}
          Mensaje={ModalValidation.Mensaje}
          isOpen={true}
          onClose={() => setShowModalValidation(false)}
        />
      )}

      {showModalAlert && (
        <PageModalValidation
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

      <Dialog open={showCodeExistsModal} onOpenChange={setShowCodeExistsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código ya existe</DialogTitle>
            <DialogDescription>
              El código ingresado ya está siendo usado por otra fórmula. Por favor ingrese un código diferente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowCodeExistsModal(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddConfirmModal} onOpenChange={setShowAddConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {materiaPrimaId && cantidad && Number(cantidad) > 0 ? "Confirmar acción" : "Validación"}
            </DialogTitle>
            <DialogDescription>{addValidationMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddConfirmModal(false)}>
              {materiaPrimaId && cantidad && Number(cantidad) > 0 ? "Cancelar" : "Cerrar"}
            </Button>
            {(materiaPrimaId && cantidad && Number(cantidad) > 0) || (formulaIdState && cantidadFormula && Number(cantidadFormula) > 0) ? (
              <Button onClick={handleConfirmAdd}>Sí, agregar</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta {deleteItem?.type === "mp" ? "materia prima" : "fórmula"} de la
              fórmula? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageTitlePlusNew
        Titulo="Creación de nueva fórmula"
        Subtitulo="Formulario para registrar una nueva fórmula"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className={`flex items-center gap-2 ${currentStage === 1 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStage === 1 ? "bg-blue-600 text-white" : "bg-gray-300"}`}>
            1
          </div>
          <span>Información General</span>
        </div>
        <ChevronRight className="text-gray-400" />
        <div className={`flex items-center gap-2 ${currentStage === 2 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStage === 2 ? "bg-blue-600 text-white" : "bg-gray-300"}`}>
            2
          </div>
          <span>Composición</span>
        </div>
        <ChevronRight className="text-gray-400" />
        <div className={`flex items-center gap-2 ${currentStage === 3 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStage === 3 ? "bg-blue-600 text-white" : "bg-gray-300"}`}>
            3
          </div>
          <span>Resumen y Finalizar</span>
        </div>
      </div>

      {currentStage === 1 && (
        <Card>
          <CardContent className="pt-6">
            <form id="frmFormula" onSubmit={ejecutarRegistro} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="txtCodigo">
                    <span className="text-red-500">*</span> Código
                  </Label>
                  <Input id="txtCodigo" name="codigo" type="text" placeholder="Ingrese el código de la fórmula" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtNombre">
                    <span className="text-red-500">*</span> Nombre
                  </Label>
                  <Input id="txtNombre" name="nombre" type="text" placeholder="Ingrese el nombre de la fórmula" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
                  <Select name="unidadmedidaid">
                    <SelectTrigger id="ddlUnidadMedida">
                      <SelectValue placeholder="Selecciona una unidad" />
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

                {/*<div className="space-y-2">
                  <Label htmlFor="txtCosto">Costo</Label>
                  <Input id="txtCosto" name="costo" type="number" step="0.01" placeholder="0.00" />
                </div>*/}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageImg">Imagen</Label>
                  <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="space-y-2">
                  <Label>Previsualización</Label>
                  <div className="border rounded-md h-[300px] flex items-center justify-center bg-muted">
                    {imagePreview ? (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-full w-auto object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin imagen seleccionada</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                  {isSubmitting ? "Guardando..." : "Guardar y Siguiente"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/formulas")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStage === 2 && formula && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Elaboración de la Fórmula
            </h2>

            {/* Agregar Materia Prima section */}
            <div className="mb-8 p-6 border-2 border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
                <Package className="h-5 w-5" />
                Agregar Materia Prima
              </h3>

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
                  />
                  {showMateriaPrimaDropdown && materiaPrimaSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {materiaPrimaSearchResults.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                          onClick={() => handleMateriaPrimaSelect(item)}
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
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ddlUnidadMedidaMP">Unidad de Medida</Label>
                  <Select value={unidadMedidaId} onValueChange={setUnidadMedidaId}>
                    <SelectTrigger id="ddlUnidadMedidaMP" disabled>
                      <SelectValue placeholder="Selecciona unidad" />
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

                <div>
                  <Label htmlFor="txtCostoUnitario">Costo Unitario</Label>
                  <Input id="txtCostoUnitario" type="text" value={costoUnitario} disabled className="bg-gray-100" />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarMateriaPrima}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Materias Primas table */}
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3">
                <h3 className="text-xl font-semibold text-white">Materias Primas de la Fórmula</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">Acciones</th>
                      <th className="text-left p-3 font-semibold"></th>
                      <th className="text-left p-3 font-semibold">Código</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Costo</th>
                      <th className="text-left p-3 font-semibold">Unidad de Medida</th>
                      <th className="text-left p-3 font-semibold">Factor Importación</th>
                      <th className="text-left p-3 font-semibold">Costo con FI</th>
                      <th className="text-left p-3 font-semibold border-l-2 border-gray-300 text-green-600">
                        Cantidad
                      </th>
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formula.materiasprimasxformula && formula.materiasprimasxformula.length > 0 ? (
                      formula.materiasprimasxformula.map((mpRel, index) => (
                        <tr key={`mp-${index}`} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick("mp", mpRel.materiaprimaid)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="p-3">
                            <Package className="h-5 w-5 text-green-600" />
                          </td>
                          <td className="p-3">{mpRel.materiasprima?.codigo || "N/A"}</td>
                          <td className="p-3 font-medium">{mpRel.materiasprima?.nombre || "N/A"}</td>
                          <td className="p-3">${mpRel.materiasprima?.costo?.toFixed(6) || "0.000000"}</td>
                          <td className="p-3">{mpRel.materiasprima?.unidadesmedida?.descripcion || "N/A"}</td>
                          <td className="p-3">{mpRel.materiasprima?.factorimportacion || "0"}</td>
                          <td className="p-3">
                            ${mpRel.materiasprima?.costoconfactorimportacion?.toFixed(6) || "0.000000"}
                          </td>
                          <td className="p-3 border-l-2 border-gray-300 text-green-600 font-semibold">{mpRel.cantidad || 0}</td>
                          <td className="p-3 text-green-600 font-semibold">${mpRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="text-center p-6 text-gray-500">
                          No hay materias primas agregadas aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agregar Fórmula section */}
            <div className="mb-8 p-6 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                <Flask className="h-5 w-5" />
                Agregar Fórmula
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Label htmlFor="txtFormula">Fórmula</Label>
                  <Input
                    id="txtFormula"
                    type="text"
                    placeholder="Buscar fórmula..."
                    value={formulaInput}
                    onChange={(e) => handleFormulaSearch(e.target.value)}
                    onFocus={() => {
                      if (formulaSearchResults.length > 0) {
                        setShowFormulaDropdown(true)
                      }
                    }}
                  />
                  {showFormulaDropdown && formulaSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {formulaSearchResults.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                          onClick={() => handleFormulaSelect(item)}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="txtCantidadFormula">Cantidad</Label>
                  <Input
                    id="txtCantidadFormula"
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={cantidadFormula}
                    onChange={(e) => setCantidadFormula(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ddlUnidadMedidaFormula">Unidad de Medida</Label>
                  <Select value={unidadMedidaIdFormula} onValueChange={setUnidadMedidaIdFormula}>
                    <SelectTrigger id="ddlUnidadMedidaFormula" disabled>
                      <SelectValue placeholder="Selecciona unidad" />
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

                <div>
                  <Label htmlFor="txtCostoUnitarioFormula">Costo Unitario</Label>
                  <Input
                    id="txtCostoUnitarioFormula"
                    type="text"
                    value={costoUnitarioFormula}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarFormula}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Flask className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Fórmulas table */}
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3">
                <h3 className="text-xl font-semibold text-white">Fórmulas Anidadas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">Acciones</th>
                      <th className="text-left p-3 font-semibold"></th>
                      <th className="text-left p-3 font-semibold">Código</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Costo</th>
                      <th className="text-left p-3 font-semibold">Unidad de Medida</th>
                      <th className="text-left p-3 font-semibold border-l-2 border-gray-300 text-blue-600">
                        Cantidad
                      </th>
                      <th className="text-left p-3 font-semibold text-blue-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formula.formulasxformula && formula.formulasxformula.length > 0 ? (
                      formula.formulasxformula.map((formulaRel, index) => (
                        <tr key={`formula-${index}`} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick("formula", formulaRel.secundariaid)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="p-3">
                            <Flask className="h-5 w-5 text-blue-600" />
                          </td>
                          <td className="p-3">{formulaRel.formulas?.codigo || "N/A"}</td>
                          <td className="p-3 font-medium">{formulaRel.formulas?.nombre || "N/A"}</td>
                          <td className="p-2 text-sm">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                          <td className="p-3">{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</td>
                          <td className="p-3 border-l-2 border-gray-300 text-blue-600 font-semibold">{formulaRel.cantidad || 0}</td>
                          <td className="p-3 text-blue-600 font-semibold">${formulaRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center p-6 text-gray-500">
                          No hay fórmulas agregadas aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost summary */}
            <div className="border-t-2 border-purple-500 mt-6 pt-4 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="flex justify-end">
                <div className="w-2/5">
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="font-bold text-lg">Costo total de la fórmula:</span>
                    <span className="font-bold text-lg text-purple-600">${formula.costo?.toFixed(6) || "0.000000"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-6 justify-end">
              <Button type="button" variant="outline" onClick={() => setCurrentStage(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Regresar
              </Button>
              <Button
                type="button"
                onClick={handleFinalizarCreacion}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Continuar al Resumen
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStage === 3 && formula && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Resumen de Fórmula</h2>
              <p className="text-gray-500 mt-2">Verifique la información antes de finalizar</p>
            </div>

            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Información General
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Código</label>
                  <p className="font-medium text-lg">{formula.codigo}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Nombre</label>
                  <p className="font-medium text-lg">{formula.nombre}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Unidad de Medida</label>
                  <p className="font-medium text-lg">{formula.unidadesmedida?.descripcion || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Resumen de Composición */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Materias Primas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Materias Primas ({formula.materiasprimasxformula?.length || 0})
                  </h3>
                </div>
                <div className="p-0 flex-grow">
                  {formula.materiasprimasxformula && formula.materiasprimasxformula.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Cant.</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formula.materiasprimasxformula.map((mp, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{mp.materiasprima?.nombre}</td>
                            <td className="px-4 py-2 text-right">{mp.cantidad}</td>
                            <td className="px-4 py-2 text-right">${mp.costoparcial?.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-gray-400 italic">No hay materias primas</div>
                  )}
                </div>
              </div>

              {/* Fórmulas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                  <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                    <Flask className="h-5 w-5" />
                    Fórmulas Anidadas ({formula.formulasxformula?.length || 0})
                  </h3>
                </div>
                <div className="p-0 flex-grow">
                  {formula.formulasxformula && formula.formulasxformula.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Cant.</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formula.formulasxformula.map((f, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{f.formulas?.nombre}</td>
                            <td className="px-4 py-2 text-right">{f.cantidad}</td>
                            <td className="px-4 py-2 text-right">${f.costoparcial?.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-gray-400 italic">No hay fórmulas anidadas</div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Cost Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Costo Total Calculado</p>
                  <p className="text-xs text-gray-400 mt-1">Suma de materias primas y fórmulas</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold tracking-tight">
                    ${formula.costo?.toFixed(6) || "0.000000"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setCurrentStage(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Regresar a Edición
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarFinalizar}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
