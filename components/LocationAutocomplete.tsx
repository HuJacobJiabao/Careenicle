"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { googlePlacesService, type PlaceAutocomplete } from '@/lib/googlePlacesService'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, placeId?: string) => void
  placeholder?: string
  className?: string
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "e.g., San Francisco, CA",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<PlaceAutocomplete[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([])
        setSelectedIndex(-1)
        return
      }

      setLoading(true)
      try {
        const predictions = await googlePlacesService.getPlacePredictions(value)
        setSuggestions(predictions)
        setIsOpen(predictions.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setSelectedIndex(-1)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    if (newValue.length < 2) {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: PlaceAutocomplete) => {
    onChange(suggestion.description, suggestion.place_id)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`form-input pr-10 ${className}`}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              ref={el => {
                suggestionRefs.current[index] = el
              }}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationAutocomplete
