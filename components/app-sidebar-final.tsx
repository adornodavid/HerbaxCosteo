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
      submenu: [{ name: "Gestión de Catalogos", href: "/menus", icon: Icons.FileText }],
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
        { name: "Clientes", href: "/hoteles", icon: Icons.Hotel },
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
    <div id="SideBar" className="w-64 h-screen bg-[#dfebed] text-black flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#a1cbd4]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <Icons.PillBottle className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg">Sistema de Costeo</span>
        </div>
      </div>

      {/* Nombre del usuario */}
      <div className="p-4 border-b border-[#a1cbd4]">
        <div className="flex items-center space-x-2">
          <Icons.User className="w-5 h-5 text-black" />
          <span className="text-sm font-medium">{sessionData?.NombreCompleto || "Usuario"}</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto">
      
        <div className="p-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.name}>
              {!item.hasSubmenu ? (
                // Usar un botón y el handler para interceptar la navegación
                <button
                  onClick={() => handleNavigationClick(item.href!)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                    isActive(item.href!) ? "bg-[#56706e] text-black" : "text-black hover:bg-[#56706e] hover:text-black"
                  }`}
                >
                  <item.icon className="w-5 h-5 text-black" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Collapsible open={openMenus.includes(item.name)} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start space-x-3 px-3 py-2 text-sm font-medium text-black hover:bg-[#56706e] hover:text-black"
                    >
                      <item.icon className="w-5 h-5 text-black" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {openMenus.includes(item.name) ? (
                        <Icons.ChevronDown className="w-4 h-4 text-black" />
                      ) : (
                        <Icons.ChevronRight className="w-4 h-4 text-black" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      // Usar un botón y el handler para interceptar la navegación
                      <button
                        key={subItem.name}
                        onClick={() => handleNavigationClick(subItem.href)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors w-full ${
                          isActive(subItem.href)
                            ? "bg-[#56706e] text-black"
                            : "text-black hover:bg-[#56706e] hover:text-black"
                        }`}
                      >
                        <subItem.icon className="w-4 h-4 text-black" />
                        <span>{subItem.name}</span>
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
