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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-gradient-to-br from-blue-900 to-gray-300 rounded-lg shadow-xl w-[60%] max-w-6xl mx-4 max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-white/80 z-10"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 p-6 pb-4">
          <Video className="h-8 w-8 text-white" />
          <h2 className="text-2xl font-bold text-white">Video Tutorial</h2>
        </div>

        <div className="px-6 pb-2">
          <h3 className="text-xl font-semibold text-white">{Titulo}</h3>
        </div>

        <div className="px-6 pb-4">
          <p className="text-lg text-white">{Subtitulo}</p>
        </div>

        {/* YouTube Video */}
        <div className="px-6 pb-6">
          <div className="relative w-full">
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl border-4 border-esq-secondary-red">
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
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
