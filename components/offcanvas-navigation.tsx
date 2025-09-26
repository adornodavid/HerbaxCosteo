"use client"
import { AppSidebar } from "@/components/app-sidebar-final"

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
        <AppSidebar />
      </div>
    </>
  )
}
