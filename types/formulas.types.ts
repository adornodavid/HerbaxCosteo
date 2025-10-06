/* ==================================================
  * CRUD:
    - Formula
    - FormulaCrear
    - FormulaActualizar
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

// Especiales
