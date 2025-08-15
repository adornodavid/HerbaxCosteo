"use client"

/* ==================================================
  Imports
================================================== */
import { useState } from "react"
import { procesarInicioSesion } from "@/app/actions/login-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Icons } from "@/components/icons"
import { UserCheck } from "lucide-react"

/* ==================================================
  Principal, Pagina
================================================== */
export default function LoginPage() {
  // Gestion elementos auxiliares
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const router = useRouter()

  // Gestion  Modal
  const showModalMessage = (message: string, redirect = false) => {
    setModalMessage(message)
    setShowModal(true)
    setShouldRedirect(redirect)
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (shouldRedirect) {
      router.push("/dashboard")
    }
  }

  // Validacion de campos en form
  const validateLogin = async () => {
    const txtCorreo = document.getElementById("txtCorreo") as HTMLInputElement
    const txtPassword = document.getElementById("txtPassword") as HTMLInputElement

    // Validar correo
    if (!txtCorreo.value.trim()) {
      showModalMessage("Por favor introduce tu Correo de acceso")
      txtCorreo.focus()
      return
    }

    // Validar contraseña
    if (!txtPassword.value || txtPassword.value.length < 4) {
      showModalMessage("Por favor introduce tu password correctamente.")
      return
    }

    // Procesar en backend
    setLoading(true)
    try {
      const result = await procesarInicioSesion(txtCorreo.value, txtPassword.value)

      if (result.success) {
        showModalMessage(result.message, true)
        setTimeout(() => {
          setShowModal(false)
          router.push("/dashboard")
        }, 2000)
      } else {
        showModalMessage(result.message)
      }
    } catch (error) {
      showModalMessage("Error inesperado. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  // Render, HTML
  return (
    <div className="min-h-screen relative overflow-hidden bg-[url('https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/1034899_6498.svg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 backdrop-blur-[1px]"></div>

      {/* Contenido principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="flex items-center justify-center w-full max-w-6xl">
          {/* Left side - Decorative image */}
         

          {/* Right side - Login form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Glass-liquid background layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-50/30 to-slate-100/40 rounded-3xl backdrop-blur-2xl border border-white/30 shadow-2xl transform rotate-1"></div>
              <div className="absolute inset-1 bg-gradient-to-tr from-white/50 via-slate-50/40 to-blue-50/30 rounded-3xl backdrop-blur-xl border border-white/40 shadow-xl transform -rotate-1"></div>

              {/* Main content container */}
              <div className="relative bg-white/60 backdrop-blur-3xl rounded-xs border border-white/50 shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-64 h-32 bg-gradient-to-br mb-4">
                      {/*<Icons.Utensils className="w-8 h-8 text-slate-700" />*/}
                      <img className="shrink-0 size-15 rounded-full" src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/healthylab.png" alt="Avatar" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 leading-tight">
                      Sistema de Costeo
                      <br />
                      Healthylab
                    </h1>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
                </div>

                {/* Form */}
                <form id="frmLogin" name="frmLogin" className="space-y-6">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      id="txtCorreo"
                      name="txtCorreo"
                      maxLength={50}
                      placeholder="Usuario / Correo electrónico"
                      className="bg-white/70 backdrop-blur-sm border-white/50 focus:border-blue-400/60 focus:ring-blue-400/20 rounded-xl h-12 text-slate-700 placeholder:text-slate-500"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="password"
                      id="txtPassword"
                      name="txtPassword"
                      maxLength={150}
                      placeholder="Contraseña de acceso"
                      className="bg-white/70 backdrop-blur-sm border-white/50 focus:border-blue-400/60 focus:ring-blue-400/20 rounded-xl h-12 text-slate-700 placeholder:text-slate-500"
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="button"
                    id="btnValidar"
                    name="btnValidar"
                    onClick={validateLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4" />
                        <span>Validar</span>
                      </div>
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-600">
                    {new Date().toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs mt-1 text-slate-500">Sistema de Gestión de Productos Healthylab</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Sistema de Costeo</AlertDialogTitle>
            <AlertDialogDescription>{modalMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleModalClose}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
