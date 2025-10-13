"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { crearCliente } from "@/app/actions/clientes"
import { PageTitlePlusNew } from "@/components/page-title-plus-new"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function CrearClientePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ejecutarRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await crearCliente(formData)

      if (result.success) {
        alert("Cliente creado exitosamente")
        router.push("/clientes")
      } else {
        alert(`Error al crear cliente: ${result.error}`)
      }
    } catch (error) {
      alert("Error inesperado al crear cliente")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitlePlusNew
        Titulo="Creación de nuevo cliente"
        Subtitulo="Formulario para registrar un nuevo cliente"
        Visible={false}
        BotonTexto={null}
        Ruta={null}
      />

      <Card>
        <CardContent className="pt-6">
          <form id="frmCliente" onSubmit={ejecutarRegistro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txtNombre">Nombre</Label>
              <Input id="txtNombre" name="nombre" type="text" required placeholder="Ingrese el nombre del cliente" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtClave">Clave</Label>
              <Input id="txtClave" name="clave" type="text" required placeholder="Ingrese la clave del cliente" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtDireccion">Dirección</Label>
              <Input id="txtDireccion" name="direccion" type="text" placeholder="Ingrese la dirección" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtTelefono">Teléfono</Label>
              <Input id="txtTelefono" name="telefono" type="tel" placeholder="Ingrese el teléfono" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txtEmail">Email</Label>
              <Input id="txtEmail" name="email" type="email" placeholder="Ingrese el email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageImg">Imagen</Label>
              <Input id="imageImg" name="imagen" type="file" accept="image/*" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
                {isSubmitting ? "Guardando..." : "Guardar Cliente"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/clientes")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
