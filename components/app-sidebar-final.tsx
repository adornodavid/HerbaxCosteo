"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link" // Importar Link de next/link
import { usePathname, useRouter } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"

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
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const { attemptNavigation } = useNavigationGuard()

  useEffect(() => {
    const loadSession = async () => {
      const session = await getSession()
      setSessionData(session)
    }
    loadSession()
  }, [])

  // No necesitamos inicializar Preline aquí si usamos componentes de React para la navegación
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.HSStaticMethods) {
  //     window.HSStaticMethods.autoInit();
  //     console.log("Preline UI initialized.");
  //   } else {
  //     console.log("HSStaticMethods no disponible, esperando...");
  //   }
  // }, []);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => (prev.includes(menuName) ? prev.filter((name) => name !== menuName) : [...prev, menuName]))
  }

  const isActive = (href: string) => pathname === href

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
        // { name: "Sub-Recetas", href: "/recetas", icon: Icons.FileText },
      ],
    },
    {
      name: "Catálogos",
      icon: Icons.FileText,
      hasSubmenu: true,
      submenu: [{ name: "Gestión de Catálogos", href: "/menus", icon: Icons.FileText }],
    },
    {
      name: "Reporte y Análisis",
      icon: Icons.BarChart,
      hasSubmenu: true,
      submenu: [
        { name: "Análisis de Costos", href: "/analisiscostos", icon: Icons.TrendingUp },
        { name: "Márgenes de Utilidad", href: "/margenesutilidad", icon: Icons.PieChart },
        // { name: "Reporte Comparativo", href: "/reportecomparativo", icon: Icons.FileBarChart },
      ],
    },
    {
      name: "Gestión",
      icon: Icons.Hotel,
      hasSubmenu: true,
      submenu: [
        { name: "Clientes", href: "/hoteles", icon: Icons.Hotel },
        // { name: "Catálogo", href: "/restaurantes", icon: Icons.Building },
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
        { name: "Mi Perfil", href: "/perfil", icon: Icons.User },
        { name: "Cerrar Sesión", href: "/logout", icon: Icons.LogOut },
      ],
    },
  ]

  return (
    <div className="w-64 h-screen bg-[#528A94] text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-4 border-b border-[#a6d1cc] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
            <Icons.PillBottle className="w-6 h-6 text-[#528A94]" />
          </div>
          <span className="font-extrabold text-xl tracking-wide">HERBAX</span>
        </div>
      </div>

      {/* Nombre del usuario */}
      <div className="p-4 border-b border-[#a6d1cc] flex items-center space-x-2">
        <Icons.User className="w-5 h-5 text-white" />
        <span className="text-sm font-medium">{sessionData?.NombreCompleto || "Usuario"}</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.name}>
              {!item.hasSubmenu ? (
                <Link href={item.href!} passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full justify-start
                      ${isActive(item.href!) ? "bg-[#56706e] text-white shadow-inner" : "text-white hover:bg-[#56706e] hover:text-white"}
                    `}
                  >
                    <item.icon className="w-5 h-5 text-white" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ) : (
                <Collapsible open={openMenus.includes(item.name)} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start space-x-3 px-3 py-2 text-sm font-medium transition-all duration-200
                        ${openMenus.includes(item.name) ? "bg-[#56706e] text-white shadow-inner" : "text-white hover:bg-[#56706e] hover:text-white"}
                      `}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {openMenus.includes(item.name) ? (
                        <Icons.ChevronDown className="w-4 h-4 text-white transition-transform duration-200 rotate-180" />
                      ) : (
                        <Icons.ChevronRight className="w-4 h-4 text-white transition-transform duration-200" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <Link key={subItem.name} href={subItem.href} passHref legacyBehavior>
                        <Button
                          variant="ghost"
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full justify-start
                            ${isActive(subItem.href) ? "bg-[#56706e] text-white shadow-inner" : "text-white hover:bg-[#56706e] hover:text-white"}
                          `}
                        >
                          <subItem.icon className="w-4 h-4 text-white" />
                          <span>{subItem.name}</span>
                        </Button>
                      </Link>
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
