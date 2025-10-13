"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoadingScreen } from "@/components/page-loading-screen"
import { obtenerClientes } from "@/app/actions/clientes"
import type { Cliente } from "@/types/clientes"

export default function VerClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = Number(params.id)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarCliente = async () => {
      try {
        const result = await obtenerClientes(clienteId, "", "", "", "", "", "Todos")

        if (result.success && result.data && result.data.length > 0) {
          setCliente(result.data[0])
        }
      } catch (error) {
        console.error("Error al cargar cliente:", error)
      } finally {
        setLoading(false)
      }
    }

    if (clienteId) {
      cargarCliente()
    }
  }, [clienteId])

  if (loading) {
    return <PageLoadingScreen message="Cargando información del cliente..." />
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-6">
        <p>No se encontró el cliente.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Card with client information */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Image on the left - full height */}
            <div className="md:w-1/3 h-64 md:h-auto">
              <img
                src={
                  cliente.imgurl && cliente.imgurl !== "Sin imagen"
                    ? cliente.imgurl
                    : "/placeholder.svg?height=400&width=400&text=Cliente"
                }
                alt={cliente.nombre}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Client data on the right */}
            <div className="md:w-2/3 p-6 space-y-4">
              <h1 className="text-3xl font-bold mb-6">Información del Cliente</h1>

              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span className="ml-2 text-gray-900">{cliente.id}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Nombre:</span>
                  <span className="ml-2 text-gray-900">{cliente.nombre || "Sin nombre"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Clave:</span>
                  <span className="ml-2 text-gray-900">{cliente.clave || "Sin clave"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Dirección:</span>
                  <span className="ml-2 text-gray-900">{cliente.direccion || "Sin dirección"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Teléfono:</span>
                  <span className="ml-2 text-gray-900">{cliente.telefono || "Sin teléfono"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{cliente.email || "Sin email"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Estatus:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                      cliente.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {cliente.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Fecha de Creación:</span>
                  <span className="ml-2 text-gray-900">
                    {cliente.fechacreacion ? new Date(cliente.fechacreacion).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons below the card */}
      <div className="flex gap-4 justify-center">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push(`/clientes/${clienteId}/editar`)}
        >
          Actualizar
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => router.push(`/clientes/${clienteId}/eliminar`)}
        >
          Eliminar
        </Button>

        <Button variant="outline" onClick={() => router.push("/clientes")}>
          Regresar a listado
        </Button>
      </div>
    </div>
  )
}
