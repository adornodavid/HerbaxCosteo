"use client"

import { Video, X, PlayCircle } from "lucide-react"
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

/*
  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    // Handle different YouTube URL formats
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?quality=hd1080`
    }
    return url
  }

  const embedUrl = getEmbedUrl(VideoUrl)
  */

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
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl border-4 border-esq-secondary-red">
              <iframe
                width="100%"
                height="100%"
                //src={VideoUrl} // Reemplazar VIDEO_ID_AQUI
                src={VideoTutorial}
                title="Video Documental Fundación Esquipulas"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="bg-slate-200 flex items-center justify-center"
              >
                <div className="text-slate-500 text-center">
                  <PlayCircle className="h-16 w-16 mx-auto mb-2" />
                  Video Próximamente
                </div>
              </iframe>
            </div>
          </div>
        </div>

        {/* Footer with close button */}
        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={onClose} variant="default">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
