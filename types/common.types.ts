/* ==================================================
  Interfaces:
    - ApiResponse
    - PaginationParams
    - PaginatedResponse
    - FilterParams
    - ddlItem
    - Componentes
      - PageLoadingScreen
      - PageProcessing
      - PageTitlePlusNew
      - PageModalValidation
      - PageModalAlert
      - PageModalError
      - PageModalTutorial
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

/* ==================================================
  Componentes
 ==================================================*/
export interface PageLoadingScreen {
  message?: string
}

export interface PageProcessing {
  isOpen: boolean
}

export interface PageTitlePlusNew {
  Titulo: string
  Subtitulo: string
  Visible: boolean
  BotonTexto: string
  Ruta: string
}

export interface ModalAlert {
  Titulo?: string
  Mensaje?: string
}

export interface ModalError {
  Titulo?: string
  Mensaje?: string
}

export interface ModalTutorial {
  Titulo?: string
  Subtitulo?: string
  VideoUrl?: string
}
