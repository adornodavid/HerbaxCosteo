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
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Menú"
      >
        <Icons.Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Profile Icon */}
      <Link
        href="/perfil"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Perfil"
      >
        <Icons.User className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Dashboard Icon */}
      <Link
        href="/dashboard"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Dashboard"
      >
        <Icons.BarChart className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Products Icon */}
      <Link
        href="/productos"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Productos"
      >
        <Icons.Package className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Materials Icon */}
      <Link
        href="/materiaprima"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Materiales"
      >
        <Icons.Salad className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Catalogs Icon */}
      <Link
        href="/catalogos"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Catálogos"
      >
        <Icons.FileText className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Reports Icon */}
      <Link
        href="/reportes"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Reportes"
      >
        <Icons.FileBarChart className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Settings Icon */}
      <Link
        href="/configuraciones"
        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mb-4"
        title="Configuraciones"
      >
        <Icons.Settings className="w-6 h-6 text-gray-700" />
      </Link>
    </div>
  )
}
