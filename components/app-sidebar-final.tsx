"use client"

import { useState, useEffect, useCallback } from "react"
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
      submenu: [{ name: "Productos", href: "/productos", icon: Icons.PillBottle },
                { name: "Formulas", href: "/formulas", icon: Icons.FlaskRound }
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
      ],
    },

    {
      name: "Gestión",
      icon: Icons.Hotel,
      hasSubmenu: true,
      submenu: [{ name: "Clientes", href: "/clientes", icon: Icons.Hotel }],
    },

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
      className="w-64 h-200 bg-[#F3F6F9] backdrop-blur-2xl border-r border-white/20 text-slate-800 flex flex-col relative shadow-2xl shadow-black/10"
      style={{
        background: "linear-gradient(135deg",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-r-3xl" />

      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />

      <div className="relative p-4 border-b border-white/15">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
            /*style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.1)",
            }}*/
          >
            <img className="shrink-0 size-15 rounded-full" src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/suplementos-removebg-preview.png" alt="Avatar2" />
            {/*<Icons.PillBottle className="w-6 h-6 text-slate-700" />*/}
          </div>
          <span className="font-semibold text-lg text-slate-700">Sistema de Costeo</span>
        </div>
      </div>

      <div className="relative p-4 border-b border-white/15">
        <div
          className="flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-sm p-2 border border-white/25 shadow-lg"
          style={{
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center border border-white/30"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            <img className="shrink-0 size-5 rounded-full" src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/quimico.png" alt="Avatar" />
            {/*<Icons.User className="w-4 h-4 text-slate-600" />*/}
          </div>
          <span className="text-sm font-medium text-slate-700">{sessionData?.NombreCompleto || "Usuario"}</span>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {menuItems.map((item) => (
            <div key={item.name}>
              {!item.hasSubmenu ? (
                <button
                  onClick={() => handleNavigationClick(item.href!)}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-xs text-sm font-medium transition-all duration-300 w-full relative ${
                    isActive(item.href!)
                      ? "bg-white/25 text-slate-800 border border-white/30 shadow-lg"
                      : "text-slate-600 hover:bg-slate/40 hover:text-slate-800 border border-transparent hover:border-white/20"
                  }`}
                  style={
                    isActive(item.href!)
                      ? {
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.1)",
                        }
                      : {}
                  }
                >
                  <item.icon className="w-5 h-5 transition-colors duration-300" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Collapsible open={openMenus.includes(item.name)} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group w-full justify-start space-x-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-[#bcdef7] hover:text-slate-800 rounded-xs border border-transparent hover:border-white/20 transition-all duration-300"
                    >
                      <item.icon className="w-5 h-5 transition-colors duration-300" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {openMenus.includes(item.name) ? (
                        <Icons.ChevronDown className="w-4 h-4 transition-all duration-300" />
                      ) : (
                        <Icons.ChevronRight className="w-4 h-4 transition-all duration-300" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-2 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <button
                        key={subItem.name}
                        onClick={() => handleNavigationClick(subItem.href)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xs text-sm transition-all duration-300 w-full ${
                          isActive(subItem.href)
                            ? "bg-white/20 text-slate-800 border border-[#e1eef7] shadow-md"
                            : "text-slate-500 hover:bg-[#bcdef7] hover:text-slate-700 border border-transparent hover:border-white/15"
                        }`}
                        style={
                          isActive(subItem.href)
                            ? {
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.08)",
                              }
                            : {}
                        }
                      >
                        <subItem.icon className="w-4 h-4 transition-colors duration-300" />
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
