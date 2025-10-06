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
  fechacreacion: Date | null
  activo: boolean | null
}

export interface CatalogoCrear {
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  descripcion: string | null
  imgurl: string | null
  fechacreacion: Date | null
}

export interface CatalogoActualizar {
  id: number | null
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  descripcion: string | null
  imgurl: string | null
  activo: boolean | null
}

// Especiales
