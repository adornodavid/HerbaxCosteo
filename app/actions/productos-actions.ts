'use server'

import { createClient } from '@/lib/supabase-server'

interface Producto {
  id: number
  nombre: string
  costo: number
  imagen_url: string
}

interface EstadisticasProductos {
  totalProductos: number
  costoPromedio: number
  productosActivos: number
}

export async function buscarProductos(formData: FormData): Promise<Producto[]> {
  const supabase = createClient()
  const nombre = formData.get('nombre') as string
  const clienteId = formData.get('ddlClientes') as string
  const catalogoId = formData.get('ddlCatalogo') as string

  // Simulación de retardo de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Datos de productos de ejemplo
  const mockProductos: Producto[] = [
    { id: 1, nombre: 'Producto A', costo: 15.50, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 2, nombre: 'Producto B', costo: 22.75, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 3, nombre: 'Producto C', costo: 8.99, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 4, nombre: 'Producto D', costo: 30.00, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 5, nombre: 'Producto E', costo: 12.20, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 6, nombre: 'Producto F', costo: 5.00, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 7, nombre: 'Producto G', costo: 45.10, imagen_url: '/placeholder.svg?height=100&width=100' },
    { id: 8, nombre: 'Producto H', costo: 18.30, imagen_url: '/placeholder.svg?height=100&width=100' },
  ]

  let filteredProductos = mockProductos

  if (nombre) {
    filteredProductos = filteredProductos.filter(p => p.nombre.toLowerCase().includes(nombre.toLowerCase()))
  }

  // Aquí iría la lógica real de filtrado por cliente y catálogo con Supabase
  // Por ahora, solo simulamos un filtro básico
  if (clienteId && clienteId !== 'all') {
    // Simular que solo algunos productos pertenecen a ciertos clientes/catálogos
    // En un caso real, harías una consulta JOIN o un filtro más complejo en Supabase
    filteredProductos = filteredProductos.filter(p => p.id % 2 === (parseInt(clienteId) % 2))
  }

  if (catalogoId && catalogoId !== 'all') {
    filteredProductos = filteredProductos.filter(p => p.id % 3 === (parseInt(catalogoId) % 3))
  }

  return filteredProductos
}

export async function getEstadisticasProductos(): Promise<EstadisticasProductos> {
  const supabase = createClient()
  // Simulación de retardo de red
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Datos de estadísticas de ejemplo
  return {
    totalProductos: 150,
    costoPromedio: 25.30,
    productosActivos: 120,
  }
}
