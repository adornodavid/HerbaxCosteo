"use client"

/* ==================================================
  Imports:
================================================== */
// -- Assets --
import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Package, Flag as Flask, Trash2 } from "lucide-react"
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
import type { oFormula } from "@/types/formulas.types"
import type { ddlItem } from "@/types/common.types"
import type {
  propsPageLoadingScreen,
  propsPageModalValidation,
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
import { PageProcessing } from "@/components/page-processing"
import { PageModalValidation } from "@/components/page-modal-validation"
import { PageModalError } from "@/components/page-modal-error"
// -- Backend --
import { useAuth } from "@/contexts/auth-context"
import { objetoFormula, actualizarFormula, recalcularFormula } from "@/app/actions/formulas"
import { listaDesplegableUnidadesMedida } from "@/app/actions/catalogos"
import {
  eliminarMateriaPrimaXFormula,
  listaDesplegableMateriasPrimasBuscar,
  obtenerMateriasPrimas,
  crearMateriaPrimaXFormula,
} from "@/app/actions/materia-prima"
import { eliminarFormulaXFormula, listaDesplegableFormulasBuscar, crearFormulaXFormula } from "@/app/actions/formulas"

/* ==================================================
	Componente Principal (Pagina)
================================================== */
export default function EditarFormulaPage() {
  // --- Variables especiales ---
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const esAdminDOs = useMemo(() => user && RolesAdminDOs.includes(user.RolId), [user])
  const formulaId = Number(params.id)

  // --- Estados ---
  const [formula, setFormula] = useState<oFormula | null>(null)
  const [activeTab, setActiveTab] = useState<"general" | "elaboracion">("general")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: "mp" | "formula"; id: number } | null>(null)
  const [pageLoading, setPageLoading] = useState<propsPageLoadingScreen>()
  const [ModalValidation, setModalValidation] = useState<propsPageModalValidation>()
  const [ModalAlert, setModalAlert] = useState<propsPageModalAlert>()
  const [ModalError, setModalError] = useState<propsPageModalError>()
  const [ModalTutorial, setModalTutorial] = useState<propsPageModalTutorial>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [unidadesMedida, setUnidadesMedida] = useState<ddlItem[]>([])
  const [showPageLoading, setShowPageLoading] = useState(true)
  const [showModalValidation, setShowModalValidation] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalError, setShowModalError] = useState(false)
  const [showModalTutorial, setShowModalTutorial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    codigo: "",
    nombre: "",
    unidadmedidaid: "",
    hddImgurl: "",
  })

  // States for materia prima form
  const [materiaPrimaInput, setMateriaPrimaInput] = useState("")
  const [materiaPrimaId, setMateriaPrimaId] = useState<number | null>(null)
  const [materiaPrimaSearchResults, setMateriaPrimaSearchResults] = useState<ddlItem[]>([])
  const [showMateriaPrimaDropdown, setShowMateriaPrimaDropdown] = useState(false)
  const [cantidad, setCantidad] = useState("")
  const [unidadMedidaId, setUnidadMedidaId] = useState("")
  const [costoUnitario, setCostoUnitario] = useState("")
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [addValidationMessage, setAddValidationMessage] = useState("")

  // States for formula form
  const [formulaInput, setFormulaInput] = useState("")
  const [formulaIdState, setFormulaId] = useState<number | null>(null)
  const [formulaSearchResults, setFormulaSearchResults] = useState<ddlItem[]>([])
  const [showFormulaDropdown, setShowFormulaDropdown] = useState(false)
  const [cantidadFormula, setCantidadFormula] = useState("")
  const [unidadMedidaIdFormula, setUnidadMedidaIdFormula] = useState("")
  const [costoUnitarioFormula, setCostoUnitarioFormula] = useState("")

  // -- Funciones --
  const ejecutarActualizacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formDataToSend = new FormData(e.currentTarget)
    const nombre = formDataToSend.get("nombre") as string
    const codigo = formDataToSend.get("codigo") as string

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
      const result = await actualizarFormula(formDataToSend)
      setShowProcessing(false)

      if (result.success) {
        alert("Fórmula actualizada exitosamente")
        await cargarDatosFormula()
      } else {
        setModalError({
          Titulo: "Error al actualizar fórmula",
          Mensaje: result.error,
        })
        setShowModalError(true)
      }
    } catch (error) {
      setShowProcessing(false)
      setModalError({
        Titulo: "Error inesperado al actualizar fórmula",
        Mensaje: error,
      })
      setShowModalError(true)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (type: "mp" | "formula", id: number) => {
    setDeleteItem({ type, id })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteItem) return

    setShowProcessing(true)
    setShowDeleteModal(false)

    try {
      let result
      if (deleteItem.type === "mp") {
        result = await eliminarMateriaPrimaXFormula(deleteItem.id, formulaId)
      } else {
        result = await eliminarFormulaXFormula(deleteItem.id, formulaId)
      }

      if (result.success) {
        await recalcularFormula(formulaId)
        await cargarDatosFormula()
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

  const cargarDatosFormula = async () => {
    try {
      setShowPageLoading(true)
      const result = await objetoFormula(formulaId, "", "", "Todos", -1, -1)

      if (result.success && result.data) {
        const formulaData = result.data
        setFormula(formulaData)
        setFormData({
          id: formulaData.id?.toString() || "",
          codigo: formulaData.codigo || "",
          nombre: formulaData.nombre || "",
          unidadmedidaid: formulaData.unidadmedidaid?.toString() || "",
          hddImgurl: formulaData.imgurl || "",
        })

        if (formulaData.imgurl) {
          setExistingImageUrl(formulaData.imgurl)
          setImagePreview(formulaData.imgurl)
        }
      } else {
        setModalError({
          Titulo: "Error al cargar fórmula",
          Mensaje: "No se pudo encontrar la fórmula solicitada",
        })
        setShowModalError(true)
      }

      const unidadesResult = await listaDesplegableUnidadesMedida(-1, "")
      if (unidadesResult.success && unidadesResult.data) {
        setUnidadesMedida(unidadesResult.data)
      }
    } catch (error) {
      console.error("Error cargando datos de la fórmula:", error)
      setModalError({
        Titulo: "Error al cargar fórmula",
        Mensaje: "Ocurrió un error al cargar los datos de la fórmula",
      })
      setShowModalError(true)
    } finally {
      setShowPageLoading(false)
    }
  }

  // Handle function for materia prima search
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

  // Handle function for materia prima selection
  const handleMateriaPrimaSelect = async (item: ddlItem) => {
    setMateriaPrimaInput(item.text)
    setMateriaPrimaId(Number(item.value))
    setShowMateriaPrimaDropdown(false)

    // Get materia prima details to populate unidad de medida and costo
    const result = await obtenerMateriasPrimas(Number(item.value), "", "", "Todos", -1, -1)
    if (result.success && result.data && result.data.length > 0) {
      const materiaPrima = result.data[0]
      setUnidadMedidaId(materiaPrima.unidadmedidaid?.toString() || "")
      setCostoUnitario(materiaPrima.costo?.toString() || "0")
      console.log("materia prima: " + materiaPrima.unidadmedidaid)
    }
  }

  // Handle function for agregar button
  const handleAgregarMateriaPrima = () => {
    // Validate materia prima selected
    if (!materiaPrimaId) {
      setAddValidationMessage("Debe seleccionar una materia prima para proceder")
      setShowAddConfirmModal(true)
      return
    }

    // Validate cantidad
    if (!cantidad || cantidad.trim() === "" || Number(cantidad) <= 0) {
      setAddValidationMessage("Debe agregar una cantidad válida para proceder")
      setShowAddConfirmModal(true)
      return
    }

    // Show confirmation modal
    setAddValidationMessage("¿Confirma que desea agregar esta materia prima a la fórmula?")
    setShowAddConfirmModal(true)
  }

  // Handle function for formula search
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

    // Get formula details to populate unidad de medida and costo
    const result = await objetoFormula(Number(item.value), "", "", "Todos", -1, -1)
    if (result.success && result.data) {
      const formulaData = result.data
      setUnidadMedidaIdFormula(formulaData.unidadmedidaid?.toString() || "")
      setCostoUnitarioFormula(formulaData.costo?.toString() || "0")
    }
  }

  const handleAgregarFormula = () => {
    // Validate formula selected
    if (!formulaIdState) {
      setAddValidationMessage("Debe seleccionar una fórmula para proceder")
      setShowAddConfirmModal(true)
      return
    }

    // Validate cantidad
    if (!cantidadFormula || cantidadFormula.trim() === "" || Number(cantidadFormula) <= 0) {
      setAddValidationMessage("Debe agregar una cantidad válida para proceder")
      setShowAddConfirmModal(true)
      return
    }

    // Show confirmation modal
    setAddValidationMessage("¿Confirma que desea agregar esta fórmula a la fórmula principal?")
    setShowAddConfirmModal(true)
  }

  const handleConfirmAdd = async () => {
    setShowAddConfirmModal(false)
    setShowProcessing(true)

    try {
      let result

      if (materiaPrimaId && cantidad) {
        result = await crearMateriaPrimaXFormula(materiaPrimaId, formulaId, Number(cantidad))
      } else if (formulaIdState && cantidadFormula) {
        result = await crearFormulaXFormula(formulaIdState, formulaId, Number(cantidadFormula))
      }

      if (result?.success) {
        await recalcularFormula(formulaId)
        await cargarDatosFormula()

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

  // --- Inicio (carga inicial y seguridad) ---
  useEffect(() => {
    if (!user || user.RolId === 0) {
      router.push("/login")
      return
    }

    if (formulaId) {
      cargarDatosFormula()
    }
  }, [authLoading, user, router, esAdminDOs, formulaId])

  // Manejadores (Handles)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // --- Renders ---
  if (showPageLoading) {
    return <PageLoadingScreen message="Cargando información..." />
  }

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

      {showModalError && (
        <PageModalError
          Titulo={ModalError.Titulo}
          Mensaje={ModalError.Mensaje}
          isOpen={true}
          onClose={() => setShowModalError(false)}
        />
      )}

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
            {materiaPrimaId && cantidad && Number(cantidad) > 0 && (
              <Button onClick={handleConfirmAdd}>Sí, agregar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageTitlePlusNew
        Titulo="Actualización de fórmula"
        Subtitulo="Formulario para actualizar una fórmula"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "general" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          General
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
      </div>

      {activeTab === "general" && (
        <Card>
          <CardContent className="pt-6">
            <form id="frmFormula" onSubmit={ejecutarActualizacion} className="space-y-4">
              <input type="hidden" name="id" value={formData.id} />
              <input type="hidden" name="hddImgurl" value={formData.hddImgurl} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="txtId">ID</Label>
                    <Input id="txtId" name="id" type="text" value={formData.id} disabled className="bg-gray-100" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtCodigo">
                      <span className="text-red-500">*</span> Código
                    </Label>
                    <Input
                      id="txtCodigo"
                      name="codigo"
                      type="text"
                      placeholder="Ingrese el código de la fórmula"
                      value={formData.codigo}
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
                      placeholder="Ingrese el nombre de la fórmula"
                      value={formData.nombre}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
                    <Select
                      name="unidadmedidaid"
                      value={formData.unidadmedidaid}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, unidadmedidaid: value }))}
                    >
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

                  <div className="space-y-2">
                    <Label htmlFor="imageImg">Imagen</Label>
                    <Input id="imageImg" name="imagen" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Previsualización de Imagen</Label>
                  <div className="border rounded-md flex items-center justify-center bg-muted h-[350px]">
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

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "elaboracion" && formula && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Elaboración de la Fórmula</h2>

            <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
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
                    <SelectTrigger id="ddlUnidadMedidaMP">
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
                    className="w-full bg-[#5d8f72] hover:bg-[#44785a] text-white"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Materias Primas</h3>
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
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formula.materiasprimasxformula?.map((mpRel, index) => (
                      <tr key={`mp-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
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
                        <td className="p-3">Materia Prima</td>
                        <td className="p-3">{mpRel.materiasprima?.codigo || "N/A"}</td>
                        <td className="p-3">{mpRel.materiasprima?.nombre || "N/A"}</td>
                        <td className="p-3">${mpRel.materiasprima?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3">{mpRel.materiasprima?.unidadesmedida?.descripcion || "N/A"}</td>
                        <td className="p-3">{mpRel.materiasprima?.factorimportacion || "0"}</td>
                        <td className="p-3">
                          ${mpRel.materiasprima?.costoconfactorimportacion?.toFixed(6) || "0.000000"}
                        </td>
                        <td className="p-3 border-l-2 border-gray-300 text-green-600">{mpRel.cantidad || 0}</td>
                        <td className="p-3 text-green-600">${mpRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold mb-4">Agregar Fórmula</h3>

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
                    <SelectTrigger id="ddlUnidadMedidaFormula">
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
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-8">
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
                      <th className="text-left p-3 font-semibold text-green-600">Costo Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formula.formulasxformula?.map((formulaRel, index) => (
                      <tr key={`formula-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
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
                        <td className="p-3">Fórmula</td>
                        <td className="p-3">{formulaRel.formulas?.codigo || "N/A"}</td>
                        <td className="p-3">{formulaRel.formulas?.nombre || "N/A"}</td>
                        <td className="p-2 text-sm">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3">{formulaRel.formulas?.unidadesmedida?.descripcion || "N/A"}</td>
                        <td className="p-3">No aplica</td>
                        <td className="p-2 text-sm">${formulaRel.formulas?.costo?.toFixed(6) || "0.000000"}</td>
                        <td className="p-3 border-l-2 border-gray-300 text-green-600">{formulaRel.cantidad || 0}</td>
                        <td className="p-3 text-green-600">${formulaRel.costoparcial?.toFixed(6) || "0.000000"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/formulas")}>
          Regresar
        </Button>
      </div>
    </div>
  )
}
