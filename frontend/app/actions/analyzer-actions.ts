"use server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://medicalapi.up.railway.app';

export async function analyzeLabPdf(formData: FormData) {
  try {
    const textInput = formData.get("text") as string;
    const pdfFile = formData.get("pdfFile") as File | null;
    const fileName = formData.get("fileName") as string | null;

    // Create new FormData for the Express API
    const apiFormData = new FormData();

    if (pdfFile) {
      // Send the File object directly - NO BASE64 CONVERSION!
      apiFormData.append('pdf', pdfFile);
    } else if (textInput) {
      apiFormData.append('text', textInput);
    } else {
      return { success: false, error: "Aucun texte ou PDF à analyser" };
    }

    console.log('📤 Sending request to Express API:', API_URL);

    // Call the Express API
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de l'analyse",
      };
    }

    return {
      success: true,
      analysis: result.analysis,
      fileBase64: result.fileBase64,
      fileName: result.fileName,
    };
  } catch (error: any) {
    console.error('❌ Error calling Express API:', error);

    const errorMessage = error.message?.includes('fetch')
      ? 'Impossible de se connecter au serveur d\'analyse. Vérifiez que le serveur Express est démarré.'
      : error.message || 'Une erreur est survenue lors de l\'analyse';

    return {
      success: false,
      error: errorMessage,
    };
  }
}