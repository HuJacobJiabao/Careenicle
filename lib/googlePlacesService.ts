// Google Places API service for location autocomplete and geocoding

export interface PlaceAutocomplete {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface PlaceDetails {
  place_id: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  name?: string
  types: string[]
}

export interface LocationResult {
  lat: number
  lng: number
  formattedAddress: string
  placeId?: string
}

export class GooglePlacesService {
  async getPlacePredictions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    try {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data = await response.json()
      
      if (data.predictions && Array.isArray(data.predictions)) {
        return data.predictions
      } else {
        return []
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error)
      return []
    }
  }

  async geocodeCompanyLocation(company: string, city: string): Promise<LocationResult | null> {
    try {
      const response = await fetch(
        `/api/places/geocode?company=${encodeURIComponent(company)}&address=${encodeURIComponent(city)}`
      )
      const data = await response.json()
      
      if (data.result) {
        const result = data.result
        if (result.geometry?.location) {
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address || '',
            placeId: result.place_id
          }
        }
      }

      // Fallback to geocoding just the city
      return this.geocodeLocation(city)
    } catch (error) {
      console.error('Error geocoding company location:', error)
      return this.geocodeLocation(city)
    }
  }

  async geocodeLocation(address: string): Promise<LocationResult | null> {
    try {
      const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`)
      const data = await response.json()
      
      if (data.result) {
        const result = data.result
        if (result.geometry?.location) {
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address || '',
            placeId: result.place_id
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error geocoding location:', error)
      return null
    }
  }
}

export const googlePlacesService = new GooglePlacesService()
