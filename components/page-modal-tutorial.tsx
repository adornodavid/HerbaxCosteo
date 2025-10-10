"use client"

import { Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageModalTutorialProps {
  Titulo: string
  Subtitulo: string
  VideoUrl: string
  isOpen: boolean
  onClose: () => void
}

export function PageModalTutorial({ Titulo, Subtitulo, VideoUrl, isOpen, onClose }: PageModalTutorialProps) {
  if (!isOpen) return null

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop()
    return `https://www.youtube.com/embed/${videoId}?quality=hd1080`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-xl border-4 border-blue-500 w-[80%] max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header: Icon + "Video Tutorial" */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <Video className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-blue-500">Video Tutorial</h2>
        </div>

        {/* Titulo */}
        <div className="px-6 pb-2">
          <h3 className="text-xl font-semibold text-gray-800">{Titulo}</h3>
        </div>

        {/* Subtitulo */}
        <div className="px-6 pb-4">
          <p className="text-lg text-gray-600">{Subtitulo}</p>
        </div>

        {/* YouTube Video */}
        <div className="px-6 pb-6">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={getEmbedUrl(VideoUrl)}
              title={Titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Footer with close button */}
        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}
