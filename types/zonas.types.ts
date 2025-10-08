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
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  fechacreacion: Date | null
  activo: boolean | null
  // Zonas
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
