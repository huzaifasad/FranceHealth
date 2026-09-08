import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export interface LabResult {
  name: string
  value: number
  unit: string
  rangeMin?: number
  rangeMax?: number
  status: "NORMAL" | "ABOVE" | "BELOW"
}

export async function appendResultsToPdf(originalPdfBuffer: Buffer, resultsText: string): Promise<Buffer> {
  console.log(" appendResultsToPdf called, resultsText length:", resultsText.length)

  try {
    console.log(" Loading PDF document...")
    const pdfDoc = await PDFDocument.load(originalPdfBuffer)
    console.log(" PDF loaded, pages:", pdfDoc.getPageCount())

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    console.log(" Fonts embedded")

    // Add a new page for results
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    console.log(" New page added, size:", width, "x", height)

    const margin = 50
    const maxWidth = width - margin * 2

    // Medical Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: rgb(0.02, 0.08, 0.16),
    })

    page.drawText("FRANCEHEALTH", {
      x: margin,
      y: height - 55,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    })

    page.drawText("Synthèse Pédagogique des Résultats Biologiques", {
      x: margin,
      y: height - 80,
      size: 11,
      font: font,
      color: rgb(0.6, 0.8, 1),
    })

    let currentY = height - 140

    page.drawText("Note Explicative Personnalisée", {
      x: margin,
      y: currentY,
      size: 18,
      font: boldFont,
      color: rgb(0.02, 0.08, 0.16),
    })
    currentY -= 35

    page.drawRectangle({
      x: margin,
      y: currentY - 5,
      width: maxWidth,
      height: 25,
      color: rgb(0.95, 0.97, 1),
      borderColor: rgb(0.8, 0.85, 1),
      borderWidth: 0.5,
    })
    page.drawText("Document confidentiel chiffré - Généré pour usage informatif uniquement", {
      x: margin + 10,
      y: currentY + 5,
      size: 8,
      font: font,
      color: rgb(0.3, 0.4, 0.6),
    })
    currentY -= 45

    // Analysis Content
    const paragraphs = resultsText.split("\n")
    console.log(" Processing", paragraphs.length, "paragraphs")

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        currentY -= 12
        continue
      }

      const text = paragraph.trim()
      const fontSize = 10
      const lineHeight = 15

      if (currentY < margin + 60) {
        console.log(" Adding new page for overflow")
        const newPage = pdfDoc.addPage()
        currentY = height - margin
      }

      page.drawText(text, {
        x: margin,
        y: currentY,
        size: fontSize,
        font: text.startsWith("•") || text.includes(":") ? boldFont : font,
        color: rgb(0.1, 0.1, 0.15),
        maxWidth: maxWidth,
        lineHeight: lineHeight,
      })

      const textWidth = font.widthOfTextAtSize(text, fontSize)
      const lines = Math.ceil(textWidth / maxWidth) || 1
      currentY -= lines * lineHeight + 12
    }

    // Disclaimer
    currentY -= 20
    if (currentY < 120) {
      console.log(" Adding final page for disclaimer")
      pdfDoc.addPage()
      currentY = height - margin
    }

    page.drawRectangle({
      x: margin,
      y: currentY - 50,
      width: maxWidth,
      height: 60,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    })

    const disclaimer = [
      "Un bilan biologique doit toujours être interprété dans son ensemble.",
      "Votre médecin traitant est la seule personne habilitée à poser un diagnostic",
      "en fonction de votre historique clinique et de vos symptômes.",
    ]

    disclaimer.forEach((line, idx) => {
      page.drawText(line, {
        x: margin + 15,
        y: currentY - 15 - idx * 14,
        size: 8.5,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      })
    })

    const footerY = 30
    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })

    page.drawText("Propulsé par FranceHealth Analysis Service", {
      x: margin,
      y: footerY,
      size: 7,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    page.drawText(`Page ${pdfDoc.getPageCount()}`, {
      x: width - margin - 30,
      y: footerY,
      size: 7,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    console.log(" Saving PDF...")
    const pdfBytes = await pdfDoc.save()
    console.log(" PDF saved, size:", pdfBytes.length)

    return Buffer.from(pdfBytes)
  } catch (error: any) {
    console.error(" Error in appendResultsToPdf:", error)
    console.error(" Error details:", error.message, error.stack)
    throw error
  }
}