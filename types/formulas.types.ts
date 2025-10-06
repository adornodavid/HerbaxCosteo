/* ==================================================
  * CRUD:
    - Formula
    - FormulaCrear
    - FormulaActualizar
    - FormulasXProducto
    - FormulasXProductoCrear
    - FormulasXProductoActualizar
  * Especiales:
================================================== */

// CRUD
export interface Formula {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface FormulaCrear {
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
}

export interface FormulaActualizar {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  activo: boolean | null
}

export interface FormulasXProducto {
  idrec: number | null
  productoid: number | null
  materialetiquetadodid: numbre | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
  activo: boolean | null
}
export interface FormulasXProductoCrear {
  productoid: number | null
  materialetiquetadodid: numbre | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
}
export interface FormulasXProductoActualizar {
  productoid: number | null
  materialetiquetadodid: numbre | null
  cantidad: number | null
  costoparcial: number | null
  activo: boolean | null
}

// Especiales
