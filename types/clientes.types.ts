/* ==================================================
  * Objetos / Clases
    - oCliente
  * CRUD:
    - Cliente
    - ClienteCrear
    - ClienteActualizar
  * Especiales:
================================================== */

// Objetos / Clases
export interface oCliente {
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
export interface Cliente {
  id: number
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface ClienteCrear {
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  fechacreacion: Date | null
}

export interface ClienteActualizar {
  id: number
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  activo: boolean | null
}

// Especiales
