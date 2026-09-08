const JSONBIN_API_URL = "https://api.jsonbin.io/v3/b"
const API_KEY = process.env.JSONBIN_API_KEY

// Store bin ID in memory (will be created on first save)
let binId = process.env.JSONBIN_BIN_ID || null

async function getPromptFromBin() {
  if (!binId) {
    return "Welcome! This is your default prompt. Edit it above and save."
  }

  try {
    const response = await fetch(`${JSONBIN_API_URL}/${binId}/latest`, {
      headers: {
        "X-Master-Key": API_KEY,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.record?.prompt || "Welcome! This is your default prompt. Edit it above and save."
    }
    return "Welcome! This is your default prompt. Edit it above and save."
  } catch (error) {
    return "Welcome! This is your default prompt. Edit it above and save."
  }
}

async function savePromptToBin(prompt) {
  console.log("[v0] savePromptToBin called with prompt length:", prompt?.length)

  const payload = {
    prompt: prompt,
    updatedAt: new Date().toISOString(),
  }

  // If no bin exists yet, create one
  if (!binId) {
    console.log("[v0] Creating new bin...")
    console.log("[v0] API_KEY first 5 chars:", API_KEY?.substring(0, 5))

    try {
      const response = await fetch(JSONBIN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY,
          "X-Bin-Name": "prompt-storage",
        },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Create bin response status:", response.status)
      const responseText = await response.text()
      console.log("[v0] Create bin response body:", responseText)

      if (response.ok) {
        const data = JSON.parse(responseText)
        binId = data.metadata.id
        console.log("[v0] New bin created with ID:", binId)
        return true
      }
      console.log("[v0] Failed to create bin")
      return false
    } catch (err) {
      console.log("[v0] Exception creating bin:", err.message)
      return false
    }
  }

  // Update existing bin
  console.log("[v0] Updating existing bin:", binId)
  try {
    const response = await fetch(`${JSONBIN_API_URL}/${binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY,
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] Update bin response status:", response.status)
    const responseText = await response.text()
    console.log("[v0] Update bin response body:", responseText)

    return response.ok
  } catch (err) {
    console.log("[v0] Exception updating bin:", err.message)
    return false
  }
}

export async function GET() {
  const prompt = await getPromptFromBin()
  return Response.json({
    success: true,
    prompt: prompt,
    updatedAt: new Date().toISOString(),
  })
}

export async function POST(request) {
  console.log("[v0] POST /api/prompt called")
  console.log("[v0] API_KEY exists:", !!API_KEY)
  console.log("[v0] binId:", binId)

  if (!API_KEY) {
    console.log("[v0] ERROR: JSONBIN_API_KEY is not set")
    return Response.json(
      {
        success: false,
        error: "JSONBIN_API_KEY environment variable is not configured",
      },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    console.log("[v0] Request body:", body)

    if (body.prompt !== undefined) {
      const saved = await savePromptToBin(body.prompt)
      console.log("[v0] Save result:", saved)

      if (saved) {
        return Response.json({
          success: true,
          prompt: body.prompt,
          updatedAt: new Date().toISOString(),
        })
      }

      return Response.json({ success: false, error: "Failed to save to JSONBin" }, { status: 500 })
    }

    return Response.json({ success: false, error: "Prompt field required" }, { status: 400 })
  } catch (error) {
    console.log("[v0] Error:", error.message)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
