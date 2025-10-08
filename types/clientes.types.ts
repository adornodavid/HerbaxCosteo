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
