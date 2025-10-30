"use client"
import Link from "next/link"
import { Icons } from "@/components/icons"

interface IconSidebarProps {
  onToggleNavigation: () => void
}

export function IconSidebar({ onToggleNavigation }: IconSidebarProps) {
  return (
    <div className="fixed left-0 top-0 w-[100px] h-screen bg-white border-r border-gray-200 flex flex-col items-center py-4 z-40">
      {/* Hamburger Menu Icon */}
      <button
        onClick={onToggleNavigation}
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6"
        title="Menú"
      >
        <Icons.Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Profile Icon */}
      <Link
        href="/perfil"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Perfil"
      >
        <Icons.User className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Perfil</span>
      </Link>

      {/* Dashboard Icon */}
      <Link
        href="/dashboard"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Dashboard"
      >
        <Icons.BarChart className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Dashboard</span>
      </Link>

      {/* Products Icon */}
      <Link
        href="/productos"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Productos"
      >
        <Icons.Package className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Productos</span>
      </Link>

      {/* Mis productos Icon */}
      <Link
        href="/mis-productos"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Mis productos"
      >
        <Icons.Package className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Mis productos</span>
      </Link>

      {/* Costear Icon */}
      <Link
        href="/costear"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Costear"
      >
        <Icons.NotebookPen className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Costear</span>
      </Link>

      {/* Reports Icon */}
      <Link
        href="/reportecosteo"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-6 p-2"
        title="Reportes"
      >
        <Icons.FileBarChart className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Reportes</span>
      </Link>

      {/* Logout Icon */}
      <Link
        href="/api/auth/logout"
        className="flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors p-2 mt-auto"
        title="Cerrar Sesión"
      >
        <Icons.LogOut className="w-6 h-6 text-gray-700 mb-1" />
        <span className="text-xs text-gray-600">Salir</span>
      </Link>
    </div>
  )
}
