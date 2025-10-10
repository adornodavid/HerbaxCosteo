/* ==================================================
  Interfaces:
    - ApiResponse
    - PaginationParams
    - PaginatedResponse
    - FilterParams
    - ddlItem
    - ModalAlert
================================================== */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FilterParams {
  search?: string
  activo?: boolean
  fechaInicio?: Date
  fechaFin?: Date
}

export interface ddlItem {
  value: string
  text: string
}

export interface ModalAlert {
  Titulo: string
  Mensaje: string
}
