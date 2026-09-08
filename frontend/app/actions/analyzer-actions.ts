"use server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function analyzeLabPdf(formData: FormData) {
  try {
    const pdfFile = formData.get("pdfFile") as File | null

    if (!pdfFile) {
      return { success: false, error: "Aucun PDF à analyser" }
    }

    // Create new FormData for the Express API
    const apiFormData = new FormData()
    apiFormData.append("pdf", pdfFile) // Send the File object directly - NO BASE64 CONVERSION!

    console.log("📤 Sending request to Express API:", API_URL)

    // Call the Express API
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      body: apiFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de l'analyse",
      }
    }

    return {
      success: true,
      analysis: result.analysis,
      fileBase64: result.fileBase64,
      fileName: result.fileName,
      classification: result.classification,
    }
  } catch (error: any) {
    console.error("❌ Error calling Express API:", error)

    const errorMessage = error.message?.includes("fetch")
      ? "Impossible de se connecter au serveur d'analyse. Vérifiez que le serveur Express est démarré."
      : error.message || "Une erreur est survenue lors de l'analyse"

    return {
      success: false,
      error: errorMessage,
    }
  }
}
