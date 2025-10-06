/* ==================================================
  * CRUD:
    - MaterialEtiquetado
    - MaterialEtiquetadoCrear
    - MaterialEtiquetadoActualizar
  * Especiales:
================================================== */

// CRUD
export interface MaterialEtiquetado {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface MaterialEtiquetadoCrear {
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
}

export interface MaterialEtiquetadoActualizar {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  activo: boolean | null
}

// Especiales
export interface MaterialEtiquetadoXProducto {
  idrec: number | null
  materialetiquetadodid: numbre | null
  cantidad: number | null
  costoparcial: number | null
}
