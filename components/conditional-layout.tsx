"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { IconSidebar } from "@/components/icon-sidebar"
import { OffcanvasNavigation } from "@/components/offcanvas-navigation"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  const toggleNavigation = () => {
    setIsNavigationOpen(!isNavigationOpen)
  }

  const closeNavigation = () => {
    setIsNavigationOpen(false)
  }

  // Páginas que no deben mostrar la navegación
  const noSidebarPages = ["/login", "/logout"]

  const shouldShowSidebar = !noSidebarPages.includes(pathname)

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-row items-stretch">
      <IconSidebar onToggleNavigation={toggleNavigation} />

      <OffcanvasNavigation isOpen={isNavigationOpen} onClose={closeNavigation} />

      <main className="flex-1 overflow-auto bg-gray-50 ml-[100px]">{children}</main>
    </div>
  )
}
