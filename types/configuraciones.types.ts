/* ==================================================
  * CRUD
    - Configuracion
    - ConfiguracionCrear
    - ConfiguracionActualizar
  * Especiales:
================================================== */

// CRUD
export interface Configuracion{
  id: number | null
  descripcion: string | null
  tipodato: string | null
  valor: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface ConfiguracionCrear{
  descripcion: string | null
  tipodato: string | null
  valor: string | null
  fechacreacion: Date | null
}

export interface ConfiguracionActualizar{
  id: number | null
  descripcion: string | null
  tipodato: string | null
  valor: string | null
  activo: boolean | null
}
