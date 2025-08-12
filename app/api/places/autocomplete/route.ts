import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    
    if (!input) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(input)}&` +
      `types=(cities)&` +
      `language=en&` +
      `key=${apiKey}`
    )

    const data = await response.json()
    
    if (data.predictions) {
      // Filter and format predictions to remove "USA" for US locations
      const formattedPredictions = data.predictions.map((prediction: any) => {
        let description = prediction.description
        
        // For US locations, remove ", USA" suffix
        if (description.endsWith(', USA')) {
          description = description.replace(', USA', '')
        }
        
        // Also handle "United States" variations
        if (description.endsWith(', United States')) {
          description = description.replace(', United States', '')
        }
        
        return {
          ...prediction,
          description,
          structured_formatting: {
            main_text: prediction.structured_formatting.main_text,
            secondary_text: prediction.structured_formatting.secondary_text?.replace(', USA', '').replace(', United States', '') || ''
          }
        }
      })
      
      return NextResponse.json({ predictions: formattedPredictions })
    }

    return NextResponse.json({ predictions: [] })
  } catch (error) {
    console.error('Error fetching place predictions:', error)
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 })
  }
}
