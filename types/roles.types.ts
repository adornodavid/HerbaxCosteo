/* ==================================================
  * CRUD:
    - Rol
    - RolCrear
    - RolActualizar
  * Especiales:
================================================== */

// CRUD
export interface Permiso {
  id: number | null
  nombre: string | null
  descripcion: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface PermisoCrear {
  nombre: string | null
  descripcion: string | null
  fechacreacion: Date | null
}

export interface PermisoActualizar {
  id: number | null
  nombre: string | null
  descripcion: string | null
  activo: boolean | null
}
