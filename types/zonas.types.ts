/* ==================================================
  * CRUD:
    - Zona
    - ZonaCrear
    - ZonaActualizar
  * Especiales:
================================================== */

// CRUD
export interface Zona {
  id: number | null
  nombre: string | null
  clave: string | null
  imgurl: string | null
}

export interface ZonaCrear {
  nombre: string | null
  clave: string | null
  imgurl: string | null
}

export interface ZonaActualizar {
  id: number | null
  nombre: string | null
  clave: string | null
  imgurl: string | null
}

// Especiales
