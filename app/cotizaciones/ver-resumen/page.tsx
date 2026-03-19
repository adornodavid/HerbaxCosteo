"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { generarPDFPropuestaEconomica } from "@/lib/pdf-propuesta-economica"

export default function VerResumenCotizacion() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get("id")

  const [cotizacion, setCotizacion] = useState<any>(null)
  const [productosData, setProductosData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acordeonAbierto, setAcordeonAbierto] = useState<{ [key: number]: boolean }>({})
  const [propuestaAcordeonAbierto, setPropuestaAcordeonAbierto] = useState(false)
  const [clientePropuesta, setClientePropuesta] = useState("")
  const [incluyeTexto, setIncluyeTexto] = useState(
    "Suministro de materias primas.\nFabricación.\nAcondicionado.\nEmpacado."
  )
  const [noIncluyeTexto, setNoIncluyeTexto] = useState(
    "Bobina impresa, será proporcionada por el cliente."
  )

  useEffect(() => {
    if (cotizacionId) {
      cargarResumen()
    }
  }, [cotizacionId])

  const toggleAcordeon = (productoId: number) => {
    setAcordeonAbierto(prev => ({ ...prev, [productoId]: !prev[productoId] }))
  }

  const generarPDFResumen = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 12
    let y = 12

    // Anchos de columnas: izquierda 1/3, derecha 2/3
    const totalW = pageW - margin * 2
    const colLeft = totalW * 0.33
    const colRight = totalW * 0.67
    const xLeft = margin
    const xRight = margin + colLeft + 4

    const addPageIfNeeded = (h: number) => {
      if (y + h > pageH - 10) { doc.addPage(); y = 12 }
    }

    const sectionHeader = (title: string, r: number, g: number, b: number, tr = 255, tg = 255, tb = 255) => {
      addPageIfNeeded(8)
      doc.setFillColor(r, g, b)
      doc.rect(margin, y, totalW, 7, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(tr, tg, tb)
      doc.text(title, margin + 2, y + 5)
      y += 9
    }

    const infoRow = (label: string, value: string, xBase: number, yPos: number, colW: number) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(label, xBase, yPos)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      const lines = doc.splitTextToSize(value, colW - 2)
      doc.text(lines, xBase, yPos + 4)
      return yPos + 4 + (lines.length * 4)
    }

    // ─── TÍTULO ───────────────────────────────────────────────
    doc.setFontSize(15)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 30, 30)
    doc.text("Resumen de Cotización", pageW / 2, y, { align: "center" })
    y += 10

    // ─── INFO GENERAL COTIZACIÓN ──────────────────────────────
    sectionHeader("Información General de la Cotización", 71, 85, 105)
    autoTable(doc, {
      startY: y,
      head: [["Título", "Cliente", "Usuario", "Tipo", "Estatus"]],
      body: [[
        cotizacion?.titulo || "N/A",
        cotizacion?.cliente || "N/A",
        cotizacion?.usuario || "N/A",
        cotizacion?.tipo || "N/A",
        cotizacion?.estatus || "N/A",
      ]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 8

    // ─── POR CADA PRODUCTO ────────────────────────────────────
    productosData.forEach(({ producto, formulasProducto, materialesEmpaque }, idx) => {
      if (!producto) return

      // Cabecera del producto (tipo acordeón)
      addPageIfNeeded(10)
      doc.setFillColor(67, 56, 202)
      doc.rect(margin, y, totalW, 9, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(`Producto ${idx + 1}:  ${producto.nombre}`, margin + 3, y + 6)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(`(${producto.codigo})`, margin + 3 + doc.getTextWidth(`Producto ${idx + 1}:  ${producto.nombre}`) + 2, y + 6)
      y += 13

      // ── Por cada fórmula del producto ──
      formulasProducto.forEach((fp: any) => {
        const formula = fp.formulaDetalle
        const materiasPrimas = fp.materiasPrimas
        const formulasSecundarias = fp.formulasSecundarias
        if (!formula) return

        // Cabecera FÓRMULA
        sectionHeader("FÓRMULA", 17, 94, 89, 255, 255, 255)

        // Layout 2 columnas: izquierda = Info General, derecha = Composición
        const yStartFormula = y
        let yColLeft = y
        let yColRight = y

        // Columna izquierda: Información General
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        doc.text("Información General", xLeft, yColLeft)
        doc.setDrawColor(200, 200, 200)
        doc.line(xLeft, yColLeft + 1.5, xLeft + colLeft - 4, yColLeft + 1.5)
        yColLeft += 5

        yColLeft = infoRow("Código:", formula.codigo || "N/A", xLeft, yColLeft, colLeft)
        yColLeft += 2
        yColLeft = infoRow("Nombre:", formula.nombre || "N/A", xLeft, yColLeft, colLeft)
        yColLeft += 2
        yColLeft = infoRow("Especificaciones:", formula.especificaciones || "N/A", xLeft, yColLeft, colLeft)
        yColLeft += 2
        yColLeft = infoRow("Unidad de Medida:", formula.unidadesmedida?.descripcion || "N/A", xLeft, yColLeft, colLeft)
        yColLeft += 4
        doc.setDrawColor(200, 200, 200)
        doc.line(xLeft, yColLeft, xLeft + colLeft - 4, yColLeft)
        yColLeft += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text("Costo Total:", xLeft, yColLeft)
        yColLeft += 4
        doc.setFont("helvetica", "bold")
        doc.setFontSize(13)
        doc.setTextColor(22, 163, 74)
        doc.text(`$${formula.costo?.toFixed(6) || "0.00"}`, xLeft, yColLeft)
        yColLeft += 8

        // Columna derecha: Composición
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        doc.text("Composición", xRight, yColRight)
        doc.setDrawColor(200, 200, 200)
        doc.line(xRight, yColRight + 1.5, xRight + colRight - 2, yColRight + 1.5)
        yColRight += 5

        if (materiasPrimas.length > 0) {
          doc.setFont("helvetica", "bold")
          doc.setFontSize(8)
          doc.setTextColor(55, 65, 81)
          doc.text("Materias Primas", xRight, yColRight)
          yColRight += 3
          autoTable(doc, {
            startY: yColRight,
            head: [["Código", "Nombre", "Cant.", "UM", "Costo U.", "Parcial"]],
            body: materiasPrimas.map((mp: any) => [
              mp.materiasprima?.codigo || "",
              mp.materiasprima?.nombre || "",
              mp.cantidad?.toFixed(4) || "0",
              mp.materiasprima?.unidadesmedida?.descripcion || "",
              `$${mp.materiasprima?.costo?.toFixed(6) || "0.00"}`,
              `$${mp.costoparcial?.toFixed(6) || "0.00"}`,
            ]),
            foot: [["", "", "", "", "Subtotal:", `$${materiasPrimas.reduce((s: number, mp: any) => s + (mp.costoparcial || 0), 0).toFixed(6)}`]],
            theme: "striped",
            styles: { fontSize: 6.5, cellPadding: 1.2 },
            headStyles: { fillColor: [243, 244, 246], textColor: [30, 30, 30], fontStyle: "bold" },
            footStyles: { fillColor: [243, 244, 246], fontStyle: "bold" },
            margin: { left: xRight, right: margin },
            tableWidth: colRight - 2,
          })
          yColRight = (doc as any).lastAutoTable.finalY + 4
        }

        if (formulasSecundarias.length > 0) {
          doc.setFont("helvetica", "bold")
          doc.setFontSize(8)
          doc.setTextColor(55, 65, 81)
          doc.text("Fórmulas Secundarias", xRight, yColRight)
          yColRight += 3
          autoTable(doc, {
            startY: yColRight,
            head: [["Código", "Nombre", "Cant.", "UM", "Costo U.", "Parcial"]],
            body: formulasSecundarias.map((fs: any) => [
              fs.formulas?.codigo || "",
              fs.formulas?.nombre || "",
              fs.cantidad?.toFixed(4) || "0",
              fs.formulas?.unidadesmedida?.descripcion || "",
              `$${fs.formulas?.costo?.toFixed(6) || "0.00"}`,
              `$${fs.costoparcial?.toFixed(6) || "0.00"}`,
            ]),
            foot: [["", "", "", "", "Subtotal:", `$${formulasSecundarias.reduce((s: number, fs: any) => s + (fs.costoparcial || 0), 0).toFixed(6)}`]],
            theme: "striped",
            styles: { fontSize: 6.5, cellPadding: 1.2 },
            headStyles: { fillColor: [243, 244, 246], textColor: [30, 30, 30], fontStyle: "bold" },
            footStyles: { fillColor: [243, 244, 246], fontStyle: "bold" },
            margin: { left: xRight, right: margin },
            tableWidth: colRight - 2,
          })
          yColRight = (doc as any).lastAutoTable.finalY + 4
        }

        // Línea divisoria vertical entre columnas
        const yEnd = Math.max(yColLeft, yColRight)
        doc.setDrawColor(220, 220, 220)
        doc.line(xRight - 2, yStartFormula, xRight - 2, yEnd)

        y = yEnd + 6

        // ── Sección PRODUCTO ──────────────────────────────────
        addPageIfNeeded(10)
        sectionHeader("PRODUCTO", 224, 231, 255, 49, 46, 129)

        const yStartProducto = y
        let yPLeft = y
        let yPRight = y

        // Columna izquierda: Info producto
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        doc.text("Información General", xLeft, yPLeft)
        doc.setDrawColor(200, 200, 200)
        doc.line(xLeft, yPLeft + 1.5, xLeft + colLeft - 4, yPLeft + 1.5)
        yPLeft += 5

        yPLeft = infoRow("Código:", producto.codigo || "N/A", xLeft, yPLeft, colLeft)
        yPLeft += 2
        yPLeft = infoRow("Nombre:", producto.nombre || "N/A", xLeft, yPLeft, colLeft)
        yPLeft += 2
        yPLeft = infoRow("Envase:", producto.envase || "N/A", xLeft, yPLeft, colLeft)
        yPLeft += 2
        yPLeft = infoRow("Presentación:", producto.presentacionproducto || "N/A", xLeft, yPLeft, colLeft)
        yPLeft += 2
        yPLeft = infoRow("Cantidad:", String(producto.cantidadpresentacion || "N/A"), xLeft, yPLeft, colLeft)
        yPLeft += 4

        // Columna derecha: Cantidad Fórmula
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        doc.text("Cantidad Fórmula", xRight, yPRight)
        doc.setDrawColor(200, 200, 200)
        doc.line(xRight, yPRight + 1.5, xRight + colRight - 2, yPRight + 1.5)
        yPRight += 5

        autoTable(doc, {
          startY: yPRight,
          head: [["Nombre Fórmula", "Costo Fórmula", "Cantidad", "Costo Parcial"]],
          body: [[
            fp.formulas?.nombre || formula.nombre || "",
            `$${fp.formulas?.costo?.toFixed(6) || "0.00"}`,
            fp.cantidad?.toFixed(4) || "0",
            `$${fp.costoparcial?.toFixed(6) || "0.00"}`,
          ]],
          foot: [["", "", "Total:", `$${fp.costoparcial?.toFixed(6) || "0.00"}`]],
          theme: "striped",
          styles: { fontSize: 6.5, cellPadding: 1.2 },
          headStyles: { fillColor: [243, 244, 246], textColor: [30, 30, 30], fontStyle: "bold" },
          footStyles: { fillColor: [243, 244, 246], fontStyle: "bold" },
          margin: { left: xRight, right: margin },
          tableWidth: colRight - 2,
        })
        yPRight = (doc as any).lastAutoTable.finalY + 4

        const yEndProducto = Math.max(yPLeft, yPRight)
        doc.setDrawColor(220, 220, 220)
        doc.line(xRight - 2, yStartProducto, xRight - 2, yEndProducto)
        y = yEndProducto + 4
      })

      // Materiales de empaque (ancho completo)
      if (materialesEmpaque.length > 0) {
        addPageIfNeeded(15)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.setTextColor(55, 65, 81)
        doc.text("Composición - Materiales de Empaque", margin, y)
        y += 3
        autoTable(doc, {
          startY: y,
          head: [["Tipo", "Código", "Nombre", "Cant.", "UM", "Costo U.", "Parcial"]],
          body: materialesEmpaque.map((mat: any) => [
            mat.materialesetiquetado?.tipomaterialid === 1 ? "Empaque" : "Envase",
            mat.materialesetiquetado?.codigo || "",
            mat.materialesetiquetado?.nombre || "",
            mat.cantidad?.toFixed(4) || "0",
            mat.materialesetiquetado?.unidadesmedida?.descripcion || "",
            `$${mat.materialesetiquetado?.costo?.toFixed(6) || "0.00"}`,
            `$${mat.costoparcial?.toFixed(6) || "0.00"}`,
          ]),
          foot: [["", "", "", "", "", "Total:", `$${materialesEmpaque.reduce((s: number, mat: any) => s + (mat.costoparcial || 0), 0).toFixed(6)}`]],
          theme: "striped",
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [243, 244, 246], textColor: [30, 30, 30], fontStyle: "bold" },
          footStyles: { fillColor: [243, 244, 246], fontStyle: "bold" },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 4
      }

      // Resumen de costos del producto (ancho completo)
      addPageIfNeeded(20)
      doc.setFillColor(51, 65, 85)
      doc.rect(margin, y, totalW, 7, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text("Resumen de Costos del Producto", margin + 2, y + 5)
      y += 10
      autoTable(doc, {
        startY: y,
        head: [["MP (Materia Prima)", "ME (Mat. Empaque)", "MEM (Mat. Envase)", "MS (Mano de Obra)", "Costo Total"]],
        body: [[
          `$${producto.mp?.toFixed(6) || "0.00"}`,
          `$${producto.me?.toFixed(6) || "0.00"}`,
          `$${producto.mem?.toFixed(6) || "0.00"}`,
          `$${producto.ms?.toFixed(6) || "0.00"}`,
          `$${producto.costo?.toFixed(6) || "0.00"}`,
        ]],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, halign: "center" },
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 4: { fontStyle: "bold", textColor: [67, 56, 202] } },
        margin: { left: margin, right: margin },
      })
      y = (doc as any).lastAutoTable.finalY + 10
    })

    doc.save(`resumen-cotizacion-${cotizacionId}.pdf`)
  }

  const cargarResumen = async () => {
    try {
      // Cargar cotización
      const { data: cotizacionData, error: errorCotizacion } = await supabase
        .from("vw_listadocotizaciones")
        .select("id, titulo, cliente, usuario, tipo, estatus")
        .eq("id", cotizacionId)
        .single()

      if (errorCotizacion) {
        console.error("Error cargando cotización:", errorCotizacion)
      }

      setCotizacion(cotizacionData)
      if (cotizacionData?.cliente) {
        setClientePropuesta(cotizacionData.cliente)
      }

      // Cargar todos los elementos de la cotización
      const { data: elementosData } = await supabase
        .from("elementosxcotizacion")
        .select("elementoid, tipoelemento, cantidad")
        .eq("cotizacionid", cotizacionId)

      if (!elementosData || elementosData.length === 0) {
        setLoading(false)
        return
      }

      // Obtener todos los productos de la cotización
      const productosElementos = elementosData.filter(e => e.tipoelemento === "Producto")

      // Para cada producto, cargar su información completa
      const productosCompletos = await Promise.all(
        productosElementos.map(async (pe) => {
          const productoId = pe.elementoid

          // Cargar producto
          const { data: productoData } = await supabase
            .from("productos")
            .select("*")
            .eq("id", productoId)
            .single()

          // Cargar fórmulas del producto
          const { data: formulasProductoData } = await supabase
            .from("formulasxproducto")
            .select(`
              *,
              formulas:formulaid(
                id,
                nombre,
                costo
              )
            `)
            .eq("productoid", productoId)
            .eq("activo", true)

          // Para cada fórmula del producto, cargar composición
          const formulasConComposicion = await Promise.all(
            (formulasProductoData || []).map(async (fp) => {
              const formulaId = fp.formulaid

              const { data: formulaDetalle } = await supabase
                .from("formulas")
                .select(`*, unidadesmedida:unidadmedidaid(id, descripcion)`)
                .eq("id", formulaId)
                .single()

              const { data: mpsData } = await supabase
                .from("materiasprimasxformula")
                .select(`
                  *,
                  materiasprima:materiaprimaid(
                    id, codigo, nombre, costo,
                    unidadesmedida:unidadmedidaid(id, descripcion)
                  )
                `)
                .eq("formulaid", formulaId)
                .eq("activo", true)

              const { data: formulasSecData } = await supabase
                .from("formulasxformula")
                .select(`
                  *,
                  formulas:secundariaid(
                    id, codigo, nombre, costo,
                    unidadesmedida:unidadmedidaid(id, descripcion)
                  )
                `)
                .eq("formulaid", formulaId)
                .eq("activo", true)

              return {
                ...fp,
                formulaDetalle,
                materiasPrimas: mpsData || [],
                formulasSecundarias: formulasSecData || [],
              }
            })
          )

          // Cargar materiales de empaque del producto
          const { data: materialesData } = await supabase
            .from("materialesetiquetadoxproducto")
            .select(`
              *,
              materialesetiquetado:materialetiquetadoid(
                id, codigo, nombre, tipomaterialid, costo,
                unidadesmedida:unidadmedidaid(id, descripcion)
              )
            `)
            .eq("productoid", productoId)
            .eq("activo", true)

          return {
            producto: productoData,
            formulasProducto: formulasConComposicion,
            materialesEmpaque: materialesData || [],
            volumenUnidades: pe.cantidad || 0,
          }
        })
      )

      setProductosData(productosCompletos)

      // Abrir el primer acordeón por defecto
      if (productosCompletos.length > 0 && productosCompletos[0].producto) {
        setAcordeonAbierto({ [productosCompletos[0].producto.id]: true })
      }

      setLoading(false)
    } catch (error) {
      console.error("Error cargando resumen:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">Cargando resumen...</p>
      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">No se encontró la cotización</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/cotizaciones/crear?id=${cotizacionId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Resumen de Cotización</h1>
          <div className="w-24"></div>
        </div>

        {/* Información General de la Cotización */}
        <Card className="mb-6">
          <CardHeader className="bg-slate-600 text-white">
            <CardTitle className="text-base">Información General de la Cotización</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-1">Título</p>
                <p className="font-semibold">{cotizacion.titulo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold">{cotizacion.cliente || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Usuario</p>
                <p className="font-semibold">{cotizacion.usuario || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Tipo</p>
                <p className="font-semibold">{cotizacion.tipo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Estatus</p>
                <p className="font-semibold">{cotizacion.estatus || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acordeón por Producto */}
        {productosData.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No hay productos asociados a esta cotización.</p>
            </CardContent>
          </Card>
        )}

        {productosData.map(({ producto, formulasProducto, materialesEmpaque }, idx) => {
          if (!producto) return null
          const abierto = !!acordeonAbierto[producto.id]

          return (
            <div key={producto.id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Cabecera del acordeón */}
              <button
                className="w-full flex items-center justify-between px-6 py-4 bg-indigo-700 text-white hover:bg-indigo-800 transition-colors"
                onClick={() => toggleAcordeon(producto.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs bg-white text-indigo-700 font-bold px-2 py-0.5 rounded">
                    Producto {idx + 1}
                  </span>
                  <span className="text-lg font-semibold">{producto.nombre}</span>
                  <span className="text-xs text-indigo-200">{producto.codigo}</span>
                </div>
                {abierto ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {/* Contenido desplegable */}
              {abierto && (
                <div className="bg-white">

                  {/* Fórmulas relacionadas al producto */}
                  {formulasProducto.map((fp, fpIdx) => {
                    const formula = fp.formulaDetalle
                    const materiasPrimas = fp.materiasPrimas
                    const formulasSecundarias = fp.formulasSecundarias

                    return formula ? (
                      <div key={fpIdx} className="border-b border-gray-100 last:border-0">
                        {/* Sección Fórmula */}
                        <div className="bg-teal-50 px-6 py-3 border-b border-teal-100">
                          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wide">Fórmula</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Información de la Fórmula */}
                            <div className="col-span-1 space-y-4">
                              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                Información General
                              </h3>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-gray-600">Código:</p>
                                  <p className="font-semibold">{formula.codigo}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Nombre:</p>
                                  <p className="font-semibold">{formula.nombre}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Especificaciones:</p>
                                  <p className="font-medium">{formula.especificaciones || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Unidad de Medida:</p>
                                  <p className="font-medium">{formula.unidadesmedida?.descripcion || "N/A"}</p>
                                </div>
                                <div className="pt-4 border-t">
                                  <p className="text-gray-600">Costo Total:</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    ${formula.costo?.toFixed(6) || "0.00"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Composición de la Fórmula */}
                            <div className="col-span-2">
                              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                                Composición
                              </h3>

                              {/* Materias Primas */}
                              {materiasPrimas.length > 0 && (
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-700 mb-2">Materias Primas</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="text-left p-2 font-semibold">Código</th>
                                          <th className="text-left p-2 font-semibold">Nombre</th>
                                          <th className="text-right p-2 font-semibold">Cant.</th>
                                          <th className="text-center p-2 font-semibold">UM</th>
                                          <th className="text-right p-2 font-semibold">Costo U.</th>
                                          <th className="text-right p-2 font-semibold">Parcial</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {materiasPrimas.map((mp: any, index: number) => (
                                          <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{mp.materiasprima?.codigo}</td>
                                            <td className="p-2">{mp.materiasprima?.nombre}</td>
                                            <td className="p-2 text-right">{mp.cantidad?.toFixed(4)}</td>
                                            <td className="p-2 text-center">
                                              {mp.materiasprima?.unidadesmedida?.descripcion}
                                            </td>
                                            <td className="p-2 text-right">
                                              ${mp.materiasprima?.costo?.toFixed(6)}
                                            </td>
                                            <td className="p-2 text-right font-semibold">
                                              ${mp.costoparcial?.toFixed(6)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-gray-100">
                                        <tr>
                                          <td colSpan={5} className="p-2 text-right font-semibold">Subtotal:</td>
                                          <td className="p-2 text-right font-bold">
                                            ${materiasPrimas.reduce((sum: number, mp: any) => sum + (mp.costoparcial || 0), 0).toFixed(6)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Fórmulas Secundarias */}
                              {formulasSecundarias.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">Fórmulas Secundarias</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="text-left p-2 font-semibold">Código</th>
                                          <th className="text-left p-2 font-semibold">Nombre</th>
                                          <th className="text-right p-2 font-semibold">Cant.</th>
                                          <th className="text-center p-2 font-semibold">UM</th>
                                          <th className="text-right p-2 font-semibold">Costo U.</th>
                                          <th className="text-right p-2 font-semibold">Parcial</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {formulasSecundarias.map((fs: any, index: number) => (
                                          <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{fs.formulas?.codigo}</td>
                                            <td className="p-2">{fs.formulas?.nombre}</td>
                                            <td className="p-2 text-right">{fs.cantidad?.toFixed(4)}</td>
                                            <td className="p-2 text-center">
                                              {fs.formulas?.unidadesmedida?.descripcion}
                                            </td>
                                            <td className="p-2 text-right">${fs.formulas?.costo?.toFixed(6)}</td>
                                            <td className="p-2 text-right font-semibold">
                                              ${fs.costoparcial?.toFixed(6)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-gray-100">
                                        <tr>
                                          <td colSpan={5} className="p-2 text-right font-semibold">Subtotal:</td>
                                          <td className="p-2 text-right font-bold">
                                            ${formulasSecundarias.reduce((sum: number, fs: any) => sum + (fs.costoparcial || 0), 0).toFixed(6)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cantidad Formula */}
                        <div className="bg-indigo-50 px-6 py-3 border-t border-indigo-100">
                          <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Producto</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Información del Producto */}
                            <div className="col-span-1 space-y-4">
                              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                Información General
                              </h3>
                              {producto.imgurl && (
                                <div className="flex justify-center">
                                  <img
                                    src={producto.imgurl}
                                    alt={producto.nombre}
                                    className="w-32 h-32 object-cover rounded-lg border"
                                  />
                                </div>
                              )}
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-gray-600">Código:</p>
                                  <p className="font-semibold">{producto.codigo}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Nombre:</p>
                                  <p className="font-semibold">{producto.nombre}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Envase:</p>
                                  <p className="font-medium">{producto.envase || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Presentación:</p>
                                  <p className="font-medium">{producto.presentacionproducto || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Cantidad:</p>
                                  <p className="font-medium">{producto.cantidadpresentacion || "N/A"}</p>
                                </div>
                              </div>
                            </div>

                            {/* Cantidad Formula + Composición Materiales */}
                            <div className="col-span-2 space-y-6">
                              {/* Tabla: Cantidad Formula */}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                                  Cantidad Formula
                                </h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="text-left p-2 font-semibold">Nombre Formula</th>
                                        <th className="text-right p-2 font-semibold">Costo Formula</th>
                                        <th className="text-right p-2 font-semibold">Cantidad</th>
                                        <th className="text-right p-2 font-semibold">Costo Parcial</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="border-b hover:bg-gray-50">
                                        <td className="p-2">{fp.formulas?.nombre}</td>
                                        <td className="p-2 text-right">${fp.formulas?.costo?.toFixed(6)}</td>
                                        <td className="p-2 text-right">{fp.cantidad?.toFixed(4)}</td>
                                        <td className="p-2 text-right font-semibold">
                                          ${fp.costoparcial?.toFixed(6)}
                                        </td>
                                      </tr>
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                      <tr>
                                        <td colSpan={3} className="p-2 text-right font-semibold">Total:</td>
                                        <td className="p-2 text-right font-bold">
                                          ${fp.costoparcial?.toFixed(6)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null
                  })}

                  {/* Composición Materiales de Empaque (fuera del loop de fórmulas, una sola vez por producto) */}
                  {materialesEmpaque.length > 0 && (
                    <div className="px-6 pb-6">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        Composición - Materiales
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left p-2 font-semibold">Tipo</th>
                              <th className="text-left p-2 font-semibold">Código</th>
                              <th className="text-left p-2 font-semibold">Nombre</th>
                              <th className="text-right p-2 font-semibold">Cant.</th>
                              <th className="text-center p-2 font-semibold">UM</th>
                              <th className="text-right p-2 font-semibold">Costo U.</th>
                              <th className="text-right p-2 font-semibold">Parcial</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materialesEmpaque.map((mat: any, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      mat.materialesetiquetado?.tipomaterialid === 1
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {mat.materialesetiquetado?.tipomaterialid === 1 ? "Empaque" : "Envase"}
                                  </span>
                                </td>
                                <td className="p-2">{mat.materialesetiquetado?.codigo}</td>
                                <td className="p-2">{mat.materialesetiquetado?.nombre}</td>
                                <td className="p-2 text-right">{mat.cantidad?.toFixed(4)}</td>
                                <td className="p-2 text-center">
                                  {mat.materialesetiquetado?.unidadesmedida?.descripcion}
                                </td>
                                <td className="p-2 text-right">
                                  ${mat.materialesetiquetado?.costo?.toFixed(6)}
                                </td>
                                <td className="p-2 text-right font-semibold">
                                  ${mat.costoparcial?.toFixed(6)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                            <tr>
                              <td colSpan={6} className="p-2 text-right font-semibold">Total:</td>
                              <td className="p-2 text-right font-bold">
                                ${materialesEmpaque.reduce((sum: number, mat: any) => sum + (mat.costoparcial || 0), 0).toFixed(6)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Costos del Producto */}
                  <div className="bg-slate-700 px-6 py-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
                      Resumen de Costos del Producto
                    </h3>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div className="text-center bg-slate-600 rounded-lg p-3">
                        <p className="text-slate-300 mb-1 text-xs">MP (Materia Prima)</p>
                        <p className="text-lg font-bold text-teal-300">${producto.mp?.toFixed(6) || "0.00"}</p>
                      </div>
                      <div className="text-center bg-slate-600 rounded-lg p-3">
                        <p className="text-slate-300 mb-1 text-xs">ME (Material Empaque)</p>
                        <p className="text-lg font-bold text-teal-300">${producto.me?.toFixed(6) || "0.00"}</p>
                      </div>
                      <div className="text-center bg-slate-600 rounded-lg p-3">
                        <p className="text-slate-300 mb-1 text-xs">MEM (Material Envase)</p>
                        <p className="text-lg font-bold text-teal-300">${producto.mem?.toFixed(6) || "0.00"}</p>
                      </div>
                      <div className="text-center bg-slate-600 rounded-lg p-3">
                        <p className="text-slate-300 mb-1 text-xs">MS (Mano de Obra)</p>
                        <p className="text-lg font-bold text-teal-300">${producto.ms?.toFixed(6) || "0.00"}</p>
                      </div>
                      <div className="text-center bg-white rounded-lg p-3">
                        <p className="text-gray-800 font-semibold mb-1 text-xs">Costo Total</p>
                        <p className="text-2xl font-bold text-indigo-700">
                          ${producto.costo?.toFixed(6) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}

      </div>

      {/* Sección Generar Archivos */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Generar Archivos</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Resumen */}
            <div className="flex items-center px-6 py-4">
              <div className="flex-1" style={{ width: "80%" }}>
                <p className="text-sm font-semibold text-gray-800">Resumen</p>
                <p className="text-xs text-gray-500 mt-0.5">Resumen de la cotización realizada para el cliente.</p>
              </div>
              <div className="flex items-center justify-end" style={{ width: "20%" }}>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  onClick={generarPDFResumen}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                  </svg>
                  PDF
                </button>
              </div>
            </div>

            {/* Propuesta Económica */}
            <div>
              {/* Cabecera tipo acordeón */}
              <div
                className="flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setPropuestaAcordeonAbierto(prev => !prev)}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Propuesta Económica</p>
                  <p className="text-xs text-gray-500 mt-0.5">Genera la propuesta económica para ser enviada al cliente.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      generarPDFPropuestaEconomica(cotizacion, productosData, cotizacionId, incluyeTexto, noIncluyeTexto, clientePropuesta)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                    </svg>
                    PDF
                  </button>
                  <span className="text-gray-400">
                    {propuestaAcordeonAbierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </div>

              {/* Panel desplegable con inputs */}
              {propuestaAcordeonAbierto && (
                <div className="px-6 pb-5 pt-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
                  {/* Cliente Propuesta */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cliente Propuesta</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Nombre del cliente para la propuesta..."
                      value={clientePropuesta}
                      onChange={(e) => setClientePropuesta(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">Se mostrará en el PDF en el campo "Atención".</p>
                  </div>
                  {/* Incluye / No Incluye */}
                  <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Incluye</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Escribe los elementos que incluye la propuesta..."
                      value={incluyeTexto}
                      onChange={(e) => setIncluyeTexto(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">Cada línea se mostrará como un ítem separado en el PDF.</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">No Incluye</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Escribe los elementos que NO incluye la propuesta..."
                      value={noIncluyeTexto}
                      onChange={(e) => setNoIncluyeTexto(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">Cada línea se mostrará como un ítem separado en el PDF.</p>
                  </div>
                  </div>{/* cierre grid cols-2 */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
