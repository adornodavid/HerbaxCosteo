"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link" // Importar Link de next/link
import { getSession } from "@/app/actions/session-actions"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"

// Declarar HSStaticMethods globalmente para TypeScript
declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}

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

  // Inicialización de Preline UI en el montaje y después de cada cambio de ruta
  useEffect(() => {
    const initPreline = () => {
      if (typeof window !== 'undefined' && window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
        console.log("Preline UI initialized/re-initialized.");
      } else {
        console.log("HSStaticMethods no disponible, esperando...");
      }
    };

    // Inicializar al montar el componente
    initPreline();

    // Re-inicializar después de cada cambio de ruta (navegación del lado del cliente)
    router.events.on('routeChangeComplete', initPreline);

    // Limpiar el listener al desmontar el componente
    return () => {
      router.events.off('routeChangeComplete', initPreline);
    };
  }, [router.events]); // Depende de router.events para asegurar que el listener se gestione correctamente

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

  return (
    <div id="hs-sidebar-header" className="hs-overlay [--auto-close:lg] lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 w-64 hs-overlay-open:translate-x-0-translate-x-full transition-all duration-300 transform h-full hidden fixed top-0 start-0 bottom-0 z-60 bg-white border-e border-gray-200" role="dialog" tabIndex="-1" aria-label="Sidebar" >
      <div className="relative flex flex-col h-full max-h-full ">
        {/* Header */}
        <header className=" p-4 flex justify-between items-center gap-x-2">

          <a className="flex-none font-semibold text-xl text-black focus:outline-hidden focus:opacity-80 " href="#" aria-label="Brand">Brand</a>

          <div className="lg:hidden -me-2">
            {/* Close Button */}
            <button type="button" className="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" data-hs-overlay="#hs-sidebar-header">
              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </button>
            {/* End Close Button */}
          </div>
          <div className="@@sidebar.header.minifyToggle.class">
            {/* Toggle Button */}
            <button type="button" className="flex justify-center items-center flex-none gap-x-3 size-9 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-sidebar-header" aria-label="Minify navigation" data-hs-overlay-minifier="#hs-sidebar-header">
              <svg className="hidden hs-overlay-minified:block shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m8 9 3 3-3 3"/></svg>
              <svg className="hs-overlay-minified:hidden shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m10 15-3-3 3-3"/></svg>
              <span className="sr-only">Navigation Toggle</span>
            </button>
            {/* End Toggle Button */}
          </div>
        </header>
        {/* End Header */}

        {/* Header */}
        <div className="mt-auto p-2 border-y border-gray-200">
          {/* Account Dropdown */}
          <div className="hs-dropdown [--strategy:absolute] [--auto-close:inside] relative w-full inline-flex">
            <button id="hs-sidebar-header-example-with-dropdown" type="button" className="w-full inline-flex shrink-0 items-center gap-x-2 p-2 text-start text-sm text-gray-800 rounded-md hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
              <img className="shrink-0 size-5 rounded-full" src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/quimico.png" alt="Avatar" />
              Herbax
              <svg className="shrink-0 size-3.5 ms-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
            </button>

            {/* Account Dropdown */}
            <div className="hs-dropdown-menu hs-dropdown-open:opacity-100 w-60 transition-[opacity,margin] duration opacity-0 hidden z-20 bg-white border border-gray-200 rounded-lg shadow-lg" role="menu" aria-orientation="vertical" aria-labelledby="hs-sidebar-header-example-with-dropdown">
              <div className="p-1">
                <a className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" href="#">
                  My account
                </a>
                <a className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" href="#">
                  Settings
                </a>
                <a className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" href="#">
                  Billing
                </a>
                <a className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100" href="#">
                  Sign out
                </a>
              </div>
            </div>
            {/* End Account Dropdown */}
          </div>
          {/* End Account Dropdown */}
        </div>
        {/* End Header */}

        {/* Body */}
        <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="hs-accordion-group pb-0 px-2 pt-2 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/dashboard') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault(); // Prevenir la navegación por defecto del <a>
                      handleNavigationClick('/dashboard');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Dashboard
                  </a>
                </Link>
              </li>

              <li className="hs-accordion" id="insumos-accordion">
                <button type="button" className=" hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" aria-expanded="true" aria-controls="insumos-accordion-collapse-1">
                  <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Insumos

                  <svg className="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>

                  <svg className="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div id="insumos-accordion-collapse-1" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden" role="region" aria-labelledby="insumos-accordion">
                  <ul className="hs-accordion-group pt-1 ps-7 space-y-1" data-hs-accordion-always-open>
                    <li className="hs-accordion" id="ingredientes-accordion-sub">
                      <button type="button" className="hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" aria-expanded="true" aria-controls="ingredientes-accordion-sub-collapse">
                        Ingredientes

                        <svg className="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>

                        <svg className="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>

                      <div id="ingredientes-accordion-sub-collapse" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden" role="region" aria-labelledby="ingredientes-accordion-sub">
                        <ul className="pt-1 ps-2 space-y-1">
                          <li>
                            <Link href="/ingredientes" passHref legacyBehavior>
                              <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/ingredientes') ? 'bg-gray-100' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNavigationClick('/ingredientes');
                                }}
                              >
                                Listado
                              </a>
                            </Link>
                          </li>
                          <li>
                            <Link href="/ingredientes/nuevo" passHref legacyBehavior>
                              <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/ingredientes/nuevo') ? 'bg-gray-100' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNavigationClick('/ingredientes/nuevo');
                                }}
                              >
                                Nuevo
                              </a>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </li>

              <li className="hs-accordion" id="productos-accordion">
                <button type="button" className=" hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" aria-expanded="true" aria-controls="productos-accordion-collapse-1">
                  <svg className="size-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>
                  Productos

                  <svg className="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500 " width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>

                  <svg className="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500 " width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>

                </button>

                <div id="productos-accordion-collapse-1" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden" role="region" aria-labelledby="productos-accordion">
                  <ul className="pt-1 ps-7 space-y-1">
                    <li>
                      <Link href="/productos" passHref legacyBehavior>
                        <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/productos') ? 'bg-gray-100' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigationClick('/productos');
                          }}
                        >
                          Listado de Productos
                        </a>
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>

              <li className="hs-accordion" id="catalogos-accordion">
                <button type="button" className=" hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" aria-expanded="true" aria-controls="catalogos-accordion-collapse-1">
                  <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z"/><path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8"/><path d="M15 2v5h5"/></svg>
                  Catalogos

                  <svg className="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>

                  <svg className="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div id="catalogos-accordion-collapse-1" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden" role="region" aria-labelledby="catalogos-accordion">
                  <ul className="pt-1 ps-7 space-y-1">
                    <li>
                      <Link href="/categorias" passHref legacyBehavior>
                        <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/categorias') ? 'bg-gray-100' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigationClick('/categorias');
                          }}
                        >
                          Categorías
                        </a>
                      </Link>
                    </li>
                    <li>
                      <Link href="/menus" passHref legacyBehavior>
                        <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/menus') ? 'bg-gray-100' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigationClick('/menus');
                          }}
                        >
                          Menús
                        </a>
                      </Link>
                    </li>
                    <li>
                      <Link href="/restaurantes" passHref legacyBehavior>
                        <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/restaurantes') ? 'bg-gray-100' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigationClick('/restaurantes');
                          }}
                        >
                          Restaurantes
                        </a>
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>

              <li>
                <Link href="/analisiscostos" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/analisiscostos') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick('/analisiscostos');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    Análisis de Costos
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/margenesutilidad" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/margenesutilidad') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick('/margenesutilidad');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Márgenes de Utilidad
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/importar" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/importar') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick('/importar');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Importar Datos
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/perfil" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/perfil') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick('/perfil');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Perfil
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/logout" passHref legacyBehavior>
                  <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${isActive('/logout') ? 'bg-gray-100' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick('/logout');
                    }}
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Cerrar Sesión
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        {/* End Body */}
      </div>
    </div>
  )
}
