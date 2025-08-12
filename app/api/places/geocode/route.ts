import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')
  const address = searchParams.get('address')
  const company = searchParams.get('company')
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    )
  }

  try {
    let data

    // If placeId is provided, get place details
    if (placeId) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&` +
        `fields=place_id,formatted_address,geometry,name,types&` +
        `language=en&` +
        `key=${apiKey}`
      )
      data = await response.json()
      return NextResponse.json(data)
    }

    // If company and address are provided, try to find company location
    if (company && address) {
      const companyQuery = `${company} ${address}`
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(companyQuery)}&` +
        `type=establishment&` +
        `language=en&` +
        `key=${apiKey}`
      )
      data = await response.json()
      
      if (data.results && data.results.length > 0) {
        return NextResponse.json({ result: data.results[0] })
      }
    }

    // Fallback to geocoding with address only
    if (address) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&` +
        `language=en&` +
        `key=${apiKey}`
      )
      data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return NextResponse.json({
          result: {
            place_id: result.place_id,
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            types: result.types
          }
        })
      }
    }

    return NextResponse.json({ result: null })
  } catch (error) {
    console.error('Error with geocoding:', error)
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    )
  }
}
