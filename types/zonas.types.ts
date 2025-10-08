/* ==================================================
  * Objetos / Clases
    - oZona
  * CRUD:
    - Zona
    - ZonaCrear
    - ZonaActualizar
  * Especiales:
================================================== */

// Objetos / Clases
export interface oZona {
  id: number
  nombre: string | null
  clave: string | null
  imgurl: string | null
  // Clientes
  // Catalogos
  // Productos
  // Materiales de etiquetado
  // Formulas
  // Materias Primas
}

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
