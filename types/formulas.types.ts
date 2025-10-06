/* ==================================================
  * CRUD:
    - Formula
    - FormulaCrear
    - FormulaActualizar
  * Especiales:
================================================== */

// CRUD
export interface Formula {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface FormulaCrear {
  nombre: string
}

export interface FormulaActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
