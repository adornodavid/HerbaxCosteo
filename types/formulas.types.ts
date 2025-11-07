/* ==================================================
  * Objetos
    - oFormula
    - oFormulaXProducto
  * CRUD:
    - Formula
    - FormulaCrear
    - FormulaActualizar
    - FormulaXProducto
    - FormulaXProductoCrear
    - FormulaXProductoActualizar
  * Especiales:
  
================================================== */

// Objetos
export interface oFormula {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  unidadesmedida: {
    descripcion: string | null
  }
  materiasprimasxformula: Array<{
    materiaprimaid: numbre | null
    materiasprimas:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      unidadmedidaid: number | null
      unidadesmedida:{
        descripcion: string | null
      }
      costo: number | null
      factorimportacion: number | null
      costoconfactorimportacion: number | null
    }
    cantidad: number | null
    costoparcial: number | null
  }> | null
  formulasxformula: Array <{
    secundariaid: number | null
    formulas:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      unidadmedidaid: number | null
      unidadesmedida: {
        descripcion: string | null
      }
      costo: number | null
    }
    cantidad: number | null
    costoparcial: number | null
  }> | null
  costo: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface oMateriasPrimasXFormula{
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  unidadesmedida: {
    descripcion: string | null
  }
  materiasprimasxformula: Array<{
    materiaprimaid: numbre | null
    materiasprimas:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      unidadmedidaid: number | null
      unidadesmedida:{
        descripcion: string | null
      }
      costo: number | null
      factorimportacion: number | null
      costoconfactorimportacion: number | null
    }
    cantidad: number | null
    costoparcial: number | null
  }> | null
}

export interface oFormulasXFormula{
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  unidadesmedida: {
    descripcion: string | null
  }
  formulasxformula: Array <{
    secundariaid: number | null
    formulas:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      unidadmedidaid: number | null
      unidadesmedida: {
        descripcion: string | null
      }
      costo: number | null
    }
    cantidad: number | null
    costoparcial: number | null
  }> | null
}

// CRUD
export interface Formula {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  unidadesmedida: {
    descripcion: string | null
  }
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

export interface FormulaXProducto {
  idrec: number | null
  productoid: number | null
  formulaid: number | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
  activo: boolean | null
}
export interface FormulaXProductoCrear {
  productoid: number | null
  formulaid: number | null
  cantidad: number | null
  costoparcial: number | null
  fechacreacion: Date | null
}
export interface FormulaXProductoActualizar {
  productoid: number | null
  formulaid: number | null
  cantidad: number | null
  costoparcial: number | null
  activo: boolean | null
}

// Especiales
