import Image from "next/image"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="https://twoxhneqaxrljrbkehao.supabase.co/storage/v1/object/public/herbax/AnimationGif/cargando.gif"
            alt="Procesando..."
            width={300}
            height={300}
            unoptimized
            className="absolute inset-0 animate-bounce-slow"
          />
        </div>
        <p className="text-lg font-semibold text-gray-800">Cargando Ingredientes...</p>
      </div>
    </div>
  )
}
