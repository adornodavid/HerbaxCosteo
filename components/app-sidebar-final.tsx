"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/app/actions/session-actions"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"
import { cn } from "@/lib/utils"

interface SessionData {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType // Componente de icono de Lucide
  submenu?: NavItem[]
}

// Definición de los elementos de navegación
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Icons.home,
  },
  {
    title: "Insumos",
    icon: Icons.users,
    submenu: [
      { title: "Ingredientes", href: "/ingredientes" },
      { title: "Categorías", href: "/categorias" },
    ],
  },
  {
    title: "Productos",
    icon: Icons.package,
    submenu: [
      { title: "Platillos", href: "/platillos" },
      { title: "Recetas", href: "/recetas" },
      { title: "Menús", href: "/menus" },
      { title: "Márgenes de Utilidad", href: "/margenesutilidad" },
    ],
  },
  {
    title: "Catálogos",
    icon: Icons.fileText,
    submenu: [
      { title: "Hoteles", href: "/hoteles" },
      { title: "Restaurantes", href: "/restaurantes" },
      { title: "Usuarios", href: "/usuarios" },
      { title: "Clientes", href: "/clientes" },
    ],
  },
  {
    title: "Análisis de Costos",
    href: "/analisiscostos",
    icon: Icons.barChart,
  },
  {
    title: "Importar Datos",
    href: "/importar",
    icon: Icons.fileUp,
  },
];

// Elementos para el menú desplegable del usuario
const userMenuItems: NavItem[] = [
  {
    title: "Mi Perfil",
    href: "/perfil",
    icon: Icons.user,
  },
  {
    title: "Cerrar Sesión",
    href: "/logout",
    icon: Icons.logOut,
  },
];

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

  const toggleCollapsible = useCallback((title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((name) => name !== title) : [...prev, title]
    )
  }, [])

  const handleNavigationClick = useCallback(
    async (href: string) => {
      const canProceed = await attemptNavigation(href)
      if (canProceed) {
        router.push(href)
      }
    },
    [attemptNavigation, router],
  )

  useEffect(() => {
    const currentPath = pathname;
    const menusToOpen: string[] = [];
    navItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubitem = item.submenu.some(subItem => subItem.href && currentPath.startsWith(subItem.href));
        if (hasActiveSubitem && !openMenus.includes(item.title)) {
          menusToOpen.push(item.title);
        }
      }
    });
    if (menusToOpen.length > 0) {
      setOpenMenus(prev => [...new Set([...prev, ...menusToOpen])]);
    }
  }, [pathname]);

  return (
    <div className="hidden md:flex flex-col h-full border-r bg-[#82bdcf] dark:bg-[#82bdcf] w-64">
      <div className="flex h-16 items-center border-b px-6">
        <Link className="flex items-center gap-2 font-semibold" href="/dashboard" onClick={(e) => {
          e.preventDefault();
          handleNavigationClick("/dashboard");
        }}>
          <Icons.layoutDashboard className="h-6 w-6" />
          <span className="">AYBCosteo</span>
        </Link>
      </div>
      <div className="mt-auto p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <img className="h-6 w-6 rounded-full" src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/quimico.png" alt="Avatar" />
              <span>{sessionData?.NombreCompleto || "Usuario"}</span>
              <Icons.chevronUp className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[200px]">
            {userMenuItems.map((item) => (
              <DropdownMenuItem key={item.title} onClick={() => handleNavigationClick(item.href || "#")}>
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            item.submenu ? (
              <Collapsible
                key={item.title}
                open={openMenus.includes(item.title)}
                onOpenChange={() => toggleCollapsible(item.title)}
                className="grid gap-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all",
                      openMenus.includes(item.title) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                    <Icons.chevronDown className={cn("ml-auto h-4 w-4 transition-transform", openMenus.includes(item.title) && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="grid gap-1 pl-8">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.title}
                      href={subItem.href || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(subItem.href || "#");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        pathname.startsWith(subItem.href || "") && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                      )}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                key={item.title}
                href={item.href || "#"}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigationClick(item.href || "#");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  pathname === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          ))}
        </nav>
      </div>

      
    </div>
  )
}
