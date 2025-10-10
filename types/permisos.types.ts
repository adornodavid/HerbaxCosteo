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
  funcion: string | null
  descripcion: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface PermisoCrear {
  funcion: string | null
  descripcion: string | null
  fechacreacion: Date | null
}

export interface PermisoActualizar {
  id: number | null
  funcion: string | null
  descripcion: string | null
  activo: boolean | null
}
