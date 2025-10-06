/* ==================================================
  * CRUD:
    - Permiso
    - PermisoCrear
    - PermisoActualizar
  * Especiales:
================================================== */

// CRUD
export interface Permiso {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface PermisoCrear {
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: Date | null
}

export interface PermisoActualizar {
  id: number | null
  codigo: string | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  activo: boolean | null
}
