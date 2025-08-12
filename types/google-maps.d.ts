// Google Maps JavaScript API type declarations

declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
      fitBounds(bounds: LatLngBounds): void
      getZoom(): number
      setZoom(zoom: number): void
      setCenter(latlng: LatLng | LatLngLiteral): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      addListener(eventName: string, handler: () => void): void
      getPosition(): LatLng
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      setContent(content: string | Element): void
      open(map?: Map, anchor?: Marker): void
      close(): void
    }

    class LatLngBounds {
      constructor()
      extend(point: LatLng | LatLngLiteral): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapOptions {
      zoom?: number
      center?: LatLng | LatLngLiteral
      styles?: MapTypeStyle[]
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map
      icon?: Icon | Symbol | string
      title?: string
    }

    interface InfoWindowOptions {
      content?: string | Element
    }

    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: Array<{ [key: string]: any }>
    }

    interface Icon {
      url: string
      size?: Size
      scaledSize?: Size
      origin?: Point
      anchor?: Point
    }

    interface Symbol {
      path: SymbolPath | string
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeWeight?: number
      scale?: number
    }

    interface Size {
      width: number
      height: number
    }

    interface Point {
      x: number
      y: number
    }

    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4
    }

    namespace event {
      function addListenerOnce(
        instance: object,
        eventName: string,
        handler: () => void
      ): void
    }
  }
}

export {}
