import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
  }

  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text input" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `You are a job application data extractor. Parse the following job posting text and extract structured information.

Return ONLY a valid JSON object with these fields (use empty strings if information is not found):
{
  "company": "Company name",
  "position": "Job title/position",
  "location": "City, State or City, Country",
  "salary": "Salary range if mentioned",
  "description": "Brief job description or key requirements"
}

Job posting text:
${text}

Return only the JSON object, no additional text or explanation.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    // Extract JSON from the response (remove markdown code blocks if present)
    let jsonText = generatedText.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    const parsedData = JSON.parse(jsonText)

    return NextResponse.json({
      success: true,
      data: parsedData,
    })
  } catch (error) {
    console.error("Error parsing job text with Gemini:", error)
    return NextResponse.json(
      {
        error: "Failed to parse job text",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
