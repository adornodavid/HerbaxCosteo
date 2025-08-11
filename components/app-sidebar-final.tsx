"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation" // Importar useRouter
import { getSession } from "@/app/actions/session-actions"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useNavigationGuard } from "@/contexts/navigation-guard-context" // Importar el hook del contexto

interface SessionData {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter() // Inicializar useRouter
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const { attemptNavigation } = useNavigationGuard() // Obtener attemptNavigation del contexto

  useEffect(() => {
    const loadSession = async () => {
      const session = await getSession()
      setSessionData(session)
    }
    loadSession()
  }, [])

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => (prev.includes(menuName) ? prev.filter((name) => name !== menuName) : [...prev, menuName]))
  }

  const isActive = (href: string) => pathname === href

  // Nueva función para manejar los clics de navegación
  const handleNavigationClick = useCallback(
    async (href: string) => {
      const canProceed = await attemptNavigation(href)
      if (canProceed) {
        router.push(href)
      }
    },
    [attemptNavigation, router],
  )

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Icons.LayoutDashboard,
      hasSubmenu: false,
    },

    {
      name: "Insumos",
      icon: Icons.Pill,
      hasSubmenu: true,
      submenu: [
        { name: "Ingredientes", href: "/ingredientes", icon: Icons.Pill },
        { name: "Categorías", href: "/categorias", icon: Icons.Package },
      ],
    },
    {
      name: "Productos",
      icon: Icons.PillBottle,
      hasSubmenu: true,
      submenu: [
        { name: "Productos", href: "/productos", icon: Icons.PillBottle },
        //{ name: "Sub-Recetas", href: "/recetas", icon: Icons.FileText },
      ],
    },
    {
      name: "Catalogos",
      icon: Icons.FileText,
      hasSubmenu: true,
      submenu: [{ name: "Gestión de Catalogos", href: "/catalogos", icon: Icons.FileText }],
    },
    {
      name: "Reporte y Análisis",
      icon: Icons.BarChart,
      hasSubmenu: true,
      submenu: [
        { name: "Análisis de Costos", href: "/analisiscostos", icon: Icons.TrendingUp },
        { name: "Márgenes de Utilidad", href: "/margenesutilidad", icon: Icons.PieChart },
        //{ name: "Reporte Comparativo", href: "/reportecomparativo", icon: Icons.FileBarChart },
      ],
    },

    {
      name: "Gestión",
      icon: Icons.Hotel,
      hasSubmenu: true,
      submenu: [
        { name: "Clientes", href: "/clientes", icon: Icons.Hotel },
        //{ name: "Catalogo", href: "/restaurantes", icon: Icons.Building },
      ],
    },

    /*
    {
      name: "Administración",
      icon: Icons.Settings,
      hasSubmenu: true,
      submenu: [{ name: "Usuarios", href: "/usuarios", icon: Icons.Users }],
    },
    */
    {
      name: "Perfil",
      icon: Icons.User,
      hasSubmenu: true,
      submenu: [
        { name: "Perfil", href: "/perfil", icon: Icons.User },
        { name: "Cerrar Sesión", href: "/logout", icon: Icons.LogOut },
      ],
    },
  ]

  return (
    <div
      id="SideBar"
      className="w-64 h-screen bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/90 backdrop-blur-xl border-r border-white/10 text-white flex flex-col relative overflow-hidden"
    >
      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl animate-pulse delay-1000" />
      </div>

      {/* Logo */}
      <div className="relative p-6 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Icons.PillBottle className="w-6 h-6 text-blue-300" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Sistema de Costeo
          </span>
        </div>
      </div>

      {/* Nombre del usuario */}
      <div className="relative p-4 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full flex items-center justify-center">
            <Icons.User className="w-4 h-4 text-blue-200" />
          </div>
          <span className="text-sm font-medium text-blue-100">{sessionData?.NombreCompleto || "Usuario"}</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="relative flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {menuItems.map((item) => (
            <div key={item.name}>
              {!item.hasSubmenu ? (
                <button
                  onClick={() => handleNavigationClick(item.href!)}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 w-full relative overflow-hidden ${
                    isActive(item.href!)
                      ? "bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-white border border-blue-400/30 shadow-lg shadow-blue-500/20"
                      : "text-blue-100 hover:bg-white/10 hover:border-white/20 border border-transparent backdrop-blur-sm"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <item.icon
                    className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
                      isActive(item.href!) ? "text-blue-300" : "text-blue-200 group-hover:text-white"
                    }`}
                  />
                  <span className="relative z-10">{item.name}</span>
                </button>
              ) : (
                <Collapsible open={openMenus.includes(item.name)} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group w-full justify-start space-x-3 px-4 py-3 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl border border-transparent hover:border-white/20 backdrop-blur-sm transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <item.icon className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors duration-300 relative z-10" />
                      <span className="flex-1 text-left relative z-10">{item.name}</span>
                      {openMenus.includes(item.name) ? (
                        <Icons.ChevronDown className="w-4 h-4 text-blue-200 group-hover:text-white transition-all duration-300 relative z-10" />
                      ) : (
                        <Icons.ChevronRight className="w-4 h-4 text-blue-200 group-hover:text-white transition-all duration-300 relative z-10" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-2 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <button
                        key={subItem.name}
                        onClick={() => handleNavigationClick(subItem.href)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 w-full relative overflow-hidden ${
                          isActive(subItem.href)
                            ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border border-blue-400/20 shadow-md"
                            : "text-blue-200 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <subItem.icon
                          className={`w-4 h-4 relative z-10 transition-colors duration-300 ${
                            isActive(subItem.href) ? "text-blue-300" : "text-blue-300 group-hover:text-white"
                          }`}
                        />
                        <span className="relative z-10">{subItem.name}</span>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}
