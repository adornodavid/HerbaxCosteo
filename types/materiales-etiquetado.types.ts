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
  nombre: string
}

export interface MaterialEtiquetadoActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
