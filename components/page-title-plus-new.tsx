"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface PageTitlePlusNewProps {
  Titulo: string
  Subtitulo: string
  Visible: boolean
  BotonTexto: string
  Ruta: string
}

export function PageTitlePlusNew({ Titulo, Subtitulo, Visible, BotonTexto, Ruta }: PageTitlePlusNewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{Titulo}</h1>
        <p className="text-muted-foreground">{Subtitulo}</p>
      </div>
      {Visible && (
        <div className="flex justify-end">
          <Link href={Ruta} passHref>
            <Button className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              {BotonTexto}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
