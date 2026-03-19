import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Convierte una imagen de una URL a base64 para usarla en jsPDF
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject("No canvas context")
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = url
  })
}

function formatFecha(): string {
  const ahora = new Date()
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  return `${ahora.getDate()} de ${meses[ahora.getMonth()]} del ${ahora.getFullYear()}`
}

export async function generarPDFPropuestaEconomica(
  cotizacion: any,
  productosData: any[],
  cotizacionId: string | null,
  incluyeTexto?: string,
  noIncluyeTexto?: string,
  clientePropuesta?: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  const totalW = pageW - margin * 2
  const bottomMargin = 15
  const contentStartY = 43

  // Cargar logo
  let logoBase64: string | null = null
  try {
    logoBase64 = await loadImageAsBase64("/images/bioxilab-logo.png")
  } catch {
    logoBase64 = null
  }

  // ─── FUNCIÓN: Dibujar encabezado en la página actual ─────────────────────
  const drawHeader = () => {
    const headerH = 22
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(31, 73, 125)
    doc.text("Bioxilab", margin, 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(60, 60, 60)
    doc.text("RFC: BIO110613HZ0", margin, 16.5)
    doc.text("Av. Morelos No 177 Pte Col Centro de Monterrey,", margin, 20.5)
    doc.text("Monterrey NL CP 64,000", margin, 24.5)

    if (logoBase64) {
      const logoW = 31
      const logoH = 18
      doc.addImage(logoBase64, "PNG", pageW - margin - logoW, 7, logoW, logoH)
    }

    const centerX = pageW / 2
    doc.setDrawColor(180, 180, 180)
    doc.line(centerX, 7, centerX, headerH + 4)

    doc.setDrawColor(180, 180, 180)
    doc.line(margin, headerH + 5, pageW - margin, headerH + 5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text("Formato de Propuesta económica de producto", margin, headerH + 10)
    doc.setFont("helvetica", "bold")
    doc.text("F-ID-005", pageW - margin, headerH + 10, { align: "right" })

    doc.setDrawColor(180, 180, 180)
    doc.line(margin, headerH + 12, pageW - margin, headerH + 12)
  }

  // ─── FUNCIÓN: Verificar espacio y agregar página si es necesario ─────────
  let y = 0
  const checkSpace = (needed: number) => {
    if (y + needed > pageH - bottomMargin) {
      doc.addPage()
      drawHeader()
      y = contentStartY
    }
  }

  // ─── PÁGINA 1 ─────────────────────────────────────────────────────────────
  drawHeader()
  y = contentStartY

  // Número de folio
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Número de folio: ID${cotizacionId || ""}`, pageW - margin, y, { align: "right" })
  y += 10

  // Fecha
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text(`Fecha: ${formatFecha()}`, margin, y)
  y += 7

  // Atención
  const atencionNombre = clientePropuesta || cotizacion?.cliente || cotizacion?.usuario || ""
  doc.text(`Atención: ${atencionNombre}`, margin, y)
  y += 14

  // Texto introductorio
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text(
    "A continuación, se presenta la siguiente oferta económica esperando sea de su agrado:",
    margin,
    y
  )
  y += 10

  // Tabla de productos
  const rows = productosData.map(({ producto, volumenUnidades }, idx) => [
    String(idx + 1),
    producto?.nombre || "",
    producto?.envase || "",
    producto?.presentacionproducto || "",
    producto?.cantidadpresentacion ? String(producto.cantidadpresentacion) : "",
    "",
    volumenUnidades ? String(volumenUnidades) : "",
  ])

  autoTable(doc, {
    startY: y,
    head: [[
      "#",
      "Producto",
      "Envase",
      "Presentación",
      "Cantidad\nPresentación",
      "Precio Unitario\nBioxilab",
      "MOQ",
    ]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, valign: "middle", halign: "center" },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 30, 30],
      fontStyle: "bold",
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 30, halign: "left" },
      2: { cellWidth: 28, halign: "left" },
      3: { cellWidth: 40, halign: "left" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 26, halign: "center", fontStyle: "bold", textColor: [200, 80, 30] },
      6: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        data.cell.styles.textColor = [200, 80, 30]
        data.cell.styles.fontStyle = "bold"
      }
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      // Si autoTable agrega páginas, dibujar header en cada nueva
      const currentPage = doc.getNumberOfPages()
      if (currentPage > 1) {
        drawHeader()
      }
    },
  })

  y = (doc as any).lastAutoTable.finalY + 12

  // ─── SECCIÓN: FORMULAS CC ─────────────────────────────────────────────────
  const formulasUnicas: { nombre: string; especificaciones: string }[] = []
  productosData.forEach(({ formulasProducto }) => {
    formulasProducto?.forEach((fp: any) => {
      const formula = fp.formulaDetalle
      if (formula && !formulasUnicas.find(f => f.nombre === formula.nombre)) {
        formulasUnicas.push({
          nombre: formula.nombre || "",
          especificaciones: formula.especificaciones || "",
        })
      }
    })
  })

  const formulasText = formulasUnicas.length > 0
    ? formulasUnicas.map(f => `${f.nombre}${f.especificaciones ? " - " + f.especificaciones : ""}`).join("; ")
    : "Formulas referenciadas por el cliente."

  doc.setFontSize(8.5)
  const formulasLines = doc.splitTextToSize(formulasText, totalW - 6)
  const formulasBoxH = Math.max(10, formulasLines.length * 4 + 4)

  checkSpace(7 + formulasBoxH + 4)

  y += 4
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, totalW, 7)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Formulas CC", margin + 3, y + 5)
  y += 7

  doc.rect(margin, y, totalW, formulasBoxH)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8.5)
  doc.setTextColor(31, 73, 125)
  doc.text(formulasLines, margin + 3, y + 4)
  y += formulasBoxH + 1

  // ─── SECCIÓN: MATERIAL DE EMPAQUE ─────────────────────────────────────────
  const productosConMateriales: Array<{ numProducto: number; nombre: string; materiales: string[] }> = []

  productosData.forEach(({ producto, materialesEmpaque }, idx) => {
    if (materialesEmpaque && materialesEmpaque.length > 0) {
      const materiales = materialesEmpaque.map((mat: any) => mat.materialesetiquetado?.nombre || "")
      productosConMateriales.push({
        numProducto: idx + 1,
        nombre: producto?.nombre || "",
        materiales: materiales.filter((m: string) => m),
      })
    }
  })

  checkSpace(7 + 15)

  y += 6
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, totalW, 7)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Material de empaque", margin + 3, y + 5)
  y += 7

  const materialesStartY = y

  productosConMateriales.forEach((prod) => {
    const alturaFila = 6 + prod.materiales.length * 4 + 2

    checkSpace(alturaFila)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(31, 73, 125)
    doc.text(`Producto ${prod.numProducto}`, margin + 3, y + 3)
    let yMat = y + 6

    prod.materiales.forEach((material) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(31, 73, 125)
      doc.circle(margin + 6, yMat - 1, 0.8, "F")
      doc.text(material, margin + 10, yMat)
      yMat += 4
    })

    y = yMat + 2
  })

  // Caja envolvente (solo si todo quedó en la misma página)
  if (productosConMateriales.length > 0) {
    const currentPage = doc.getNumberOfPages()
    // Dibujar borde solo si hay contenido
    if (y > materialesStartY) {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.rect(margin, materialesStartY, totalW, y - materialesStartY)
    }
  }

  // ─── SECCIÓN: INCLUYE ─────────────────────────────────────────────────────
  y += 10

  const incluyeItems = (incluyeTexto || "Suministro de materias primas.\nFabricación.\nAcondicionado.\nEmpacado.")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)

  checkSpace(12 + incluyeItems.length * 5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Incluye:", margin, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(31, 73, 125)
  incluyeItems.forEach(item => {
    const lines = doc.splitTextToSize(item, totalW - 6)
    checkSpace(lines.length * 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(31, 73, 125)
    doc.text(lines, margin + 3, y)
    y += lines.length * 5
  })

  y += 6

  // ─── SECCIÓN: NO INCLUYE ──────────────────────────────────────────────────
  const noIncluyeItems = (noIncluyeTexto || "Bobina impresa, será proporcionada por el cliente.")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)

  checkSpace(12 + noIncluyeItems.length * 5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("No incluye:", margin, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(31, 73, 125)
  noIncluyeItems.forEach(item => {
    const lines = doc.splitTextToSize(item, totalW - 6)
    checkSpace(lines.length * 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(31, 73, 125)
    doc.text(lines, margin + 3, y)
    y += lines.length * 5
  })
  y += 6

  // ─── SECCIÓN: CONSIDERACIONES ─────────────────────────────────────────────
  const consideraciones = [
    "Precios más I.V.A.",
    "Moneda MXN.",
    "Precios puestos en planta Healthylab, Ramos Arizpe. El envío corre por cuenta del cliente.",
    "Se solicita un anticipo del 50% en su orden de compra y el resto contra entrega de la mercancía.",
    "Tiempo de entrega de su primer pedido: 60 días, una vez depositado el anticipo y autorizados los print card de impresión de las etiquetas.",
    "Vigencia de cotización: 30 días.",
    "Cualquier modificación, requiere revaloracion.",
    "En caso de aceptar las condiciones de esta propuesta, los acuerdos deberán formalizarse a través del contrato de maquila entre el cliente y Healthylab/Bioxilab."
  ]

  checkSpace(12)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Consideraciones:", margin, y)
  y += 6

  consideraciones.forEach((item, idx) => {
    const isLast = idx === consideraciones.length - 1
    if (isLast) {
      doc.setFont("helvetica", "bold")
    } else {
      doc.setFont("helvetica", "normal")
    }
    doc.setFontSize(8)
    doc.setTextColor(31, 73, 125)
    const lines = doc.splitTextToSize(item, totalW - 6)
    checkSpace(lines.length * 5 + 1)
    if (isLast) {
      doc.setFont("helvetica", "bold")
    } else {
      doc.setFont("helvetica", "normal")
    }
    doc.setFontSize(8)
    doc.setTextColor(31, 73, 125)
    doc.text(lines, margin + 3, y)
    y += lines.length * 5 + 1
  })

  y += 8

  // ─── ATENTAMENTE ──────────────────────────────────────────────────────────
  checkSpace(25)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Atentamente", margin, y)
  y += 12

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Rubén Munguía", margin, y)
  y += 5
  doc.text("Bioxilab SA de CV", margin, y)

  // Guardar PDF
  doc.save(`propuesta-economica-${cotizacionId}.pdf`)
}
