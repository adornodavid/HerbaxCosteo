/* ==================================================
  * CRUD:
    - MateriaPrima
    - MateriaPrimaCrear
    - MateriaPrimaActualizar
    - MateriaPrimaXFormula
    - MateriaPrimaXFormulaCrear
    - MateriaPrimaXFormulaActualizar
  * Especiales:
================================================== */

// CRUD
export interface MateriaPrima {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface MateriaPrimaCrear {
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
}

export interface MateriaPrimaActualizar {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  activo: boolean | null
}

export interface MateriaPrimaXFormula {
  idrec: number | null
  formulaid: number | null
  materiaprimaid: number | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
  activo: boolean | null
}
export interface MateriaPrimaXFormulaCrear {
  formulaid: number | null
  materiaprimaid: number | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
}
export interface MateriaPrimaXFormulaActualizar {
  formulaid: number | null
  materiaprimaid: number | null
  cantidad: number | null
  costoparcial: number | null
  activo: boolean | null
}
// Especiales
