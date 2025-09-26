"use client"
import { AppSidebar } from "@/components/app-sidebar-final"
import { Icons } from "@/components/icons"

interface OffcanvasNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function OffcanvasNavigation({ isOpen, onClose }: OffcanvasNavigationProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />}

      {/* Offcanvas Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Icons.Plus className="w-5 h-5 text-white rotate-45" />
        </button>
        <AppSidebar />
      </div>
    </>
  )
}
