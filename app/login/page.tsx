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
import { UserCheck, Globe, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react"

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo animado con efectos líquidos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>

        {/* Efectos líquidos animados */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl animate-bounce"></div>
      </div>

      {/* Contenido principal - Layout de dos columnas */}
      <div className="relative z-10 min-h-screen flex">
        {/* Columna izquierda - Información de la empresa */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          {/* Glass container para información */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full">
            {/* Logo/Imagen de la empresa */}
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                <img
                  src="/placeholder.svg?height=128&width=128"
                  alt="Healthylab Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Healthylab</h2>
              <p className="text-blue-100 text-lg">Sistema de Costeo Inteligente</p>
            </div>

            {/* Información de la empresa */}
            <div className="space-y-4 text-white/90">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-300" />
                <span className="text-sm">Ciudad de México, México</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-300" />
                <span className="text-sm">+52 55 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-300" />
                <span className="text-sm">contacto@healthylab.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-blue-300" />
                <span className="text-sm">www.healthylab.com</span>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-white/80 text-sm mb-4 text-center">Síguenos en:</p>
              <div className="flex justify-center space-x-4">
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <Facebook className="w-5 h-5 text-blue-300" />
                </button>
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <Instagram className="w-5 h-5 text-pink-300" />
                </button>
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <Linkedin className="w-5 h-5 text-blue-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Imagen decorativa */}
          <div className="absolute bottom-8 right-8 w-64 h-64 opacity-20">
            <img
              src="/placeholder.svg?height=256&width=256"
              alt="Laboratory"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Columna derecha - Formulario de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Contenedor principal del login con glass-liquid effect */}
            <div className="backdrop-blur-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header con efectos líquidos */}
              <div className="relative p-8 pb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                <div className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
                  <p className="text-blue-100 text-sm">Sistema de Costeo Healthylab</p>
                </div>
              </div>

              {/* Formulario */}
              <div className="px-8 pb-8">
                <form id="frmLogin" name="frmLogin" className="space-y-6">
                  {/* Input de correo con glass effect */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium">Correo electrónico</label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="txtCorreo"
                        name="txtCorreo"
                        maxLength={50}
                        placeholder="usuario@healthylab.com"
                        className="backdrop-blur-sm bg-white/10 border border-white/30 text-white placeholder:text-white/60 rounded-xl h-12 focus:bg-white/20 focus:border-blue-400 transition-all duration-300"
                        autoComplete="email"
                      />
                      <Mail className="absolute right-3 top-3 w-5 h-5 text-white/60" />
                    </div>
                  </div>

                  {/* Input de contraseña con glass effect */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium">Contraseña</label>
                    <div className="relative">
                      <Input
                        type="password"
                        id="txtPassword"
                        name="txtPassword"
                        maxLength={150}
                        placeholder="••••••••"
                        className="backdrop-blur-sm bg-white/10 border border-white/30 text-white placeholder:text-white/60 rounded-xl h-12 focus:bg-white/20 focus:border-blue-400 transition-all duration-300"
                        autoComplete="current-password"
                      />
                      <Icons.Lock className="absolute right-3 top-3 w-5 h-5 text-white/60" />
                    </div>
                  </div>

                  {/* Botón de login con efectos líquidos */}
                  <Button
                    type="button"
                    id="btnValidar"
                    name="btnValidar"
                    onClick={validateLogin}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <UserCheck className="w-5 h-5" />
                        <span>Iniciar Sesión</span>
                      </div>
                    )}
                  </Button>
                </form>

                {/* Footer del formulario */}
                <div className="mt-6 text-center">
                  <p className="text-white/70 text-sm">
                    {new Date().toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-white/50 text-xs mt-2">© 2024 Healthylab. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>

            {/* Información adicional para móviles */}
            <div className="lg:hidden mt-8 text-center">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Healthylab</h3>
                <div className="flex justify-center space-x-6 text-white/70 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>+52 55 1234 5678</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>contacto@healthylab.com</span>
                  </div>
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
