/* ==================================================
  * CRUD:
    - Catalogo
    - CatalogoCrear
    - CatalogoActualizar
  * Especiales:
================================================== */

// CRUD
export interface Catalogo {
  id: number | null
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  descripcion: string | null
  imgurl: string | null
  activo: boolean | null
  fechacreacion: Date | null
}

export interface CatalogoCrear {
  nombre: string
}

export interface CatalogoActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
