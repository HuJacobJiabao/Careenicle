"use client"

import { useState, useEffect } from 'react'

/**
 * Safe client-side state management hook to avoid hydration errors.
 * @param initialValue The initial value.
 * @param clientValue The client-side value (possibly from localStorage, etc).
 * @returns [value, setValue, isClient]
 */
export function useClientSafeState<T>(
  initialValue: T,
  clientValue?: T
): [T, (value: T) => void, boolean] {
  const [isClient, setIsClient] = useState(false)
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    setIsClient(true)
    if (clientValue !== undefined) {
      setValue(clientValue)
    }
  }, [clientValue])

  return [value, setValue, isClient]
}

/**
 * Safely get value from localStorage to avoid hydration errors.
 * @param key Storage key
 * @param defaultValue Default value
 * @returns [value, setValue, isLoaded]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, boolean] {
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const [value, setValue, isClient] = useClientSafeState(defaultValue, getStoredValue())

  const setStoredValue = (newValue: T) => {
    setValue(newValue)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.warn(`Failed to save to localStorage: ${error}`)
      }
    }
  }

  return [value, setStoredValue, isClient]
}
