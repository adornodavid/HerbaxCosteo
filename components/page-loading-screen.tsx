import Image from "next/image"

interface PageLoadingScreenProps {
  message?: string
}

export function PageLoadingScreen({ message = "Cargando Pagina..." }: PageLoadingScreenProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/images/design-mode/cargando.gif"
              alt="Cargando..."
              width={300}
              height={300}
              unoptimized
              className="absolute inset-0 animate-bounce-slow"
            />
          </div>
          <p className="text-lg font-semibold text-gray-800">{message}</p>
        </div>
      </div>
    </div>
  )
}
