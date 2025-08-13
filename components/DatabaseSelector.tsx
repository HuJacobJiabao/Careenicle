"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Cloud, HardDrive, TestTube } from "lucide-react"
import { DataService, type DatabaseProvider } from "@/lib/dataService"
import { isSupabaseConfigured } from "@/lib/supabase/client"

export default function DatabaseSelector() {
  const [currentProvider, setCurrentProvider] = useState<DatabaseProvider>("mock")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCurrentProvider(DataService.getDatabaseProvider())
  }, [])

  const handleProviderChange = async (provider: DatabaseProvider) => {
    setIsLoading(true)
    try {
      DataService.setDatabaseProvider(provider)
      setCurrentProvider(provider)

      // Trigger a page refresh to reload data with new provider
      window.location.reload()
    } catch (error) {
      console.error("Error switching database provider:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderIcon = (provider: DatabaseProvider) => {
    switch (provider) {
      case "mock":
        return <TestTube className="h-4 w-4" />
      case "postgresql":
        return <HardDrive className="h-4 w-4" />
      case "supabase":
        return <Cloud className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getProviderDescription = (provider: DatabaseProvider) => {
    switch (provider) {
      case "mock":
        return "Use sample data for testing and demonstration"
      case "postgresql":
        return "Connect to your local PostgreSQL database"
      case "supabase":
        return "Use Supabase cloud database (requires setup)"
      default:
        return ""
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Provider
        </CardTitle>
        <CardDescription>Choose your preferred data storage option</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={currentProvider} onValueChange={handleProviderChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                {getProviderIcon(currentProvider)}
                <span className="capitalize">{currentProvider}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mock">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                <span>Mock Data</span>
              </div>
            </SelectItem>
            <SelectItem value="postgresql">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span>PostgreSQL</span>
              </div>
            </SelectItem>
            <SelectItem value="supabase" disabled={!isSupabaseConfigured}>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span>Supabase</span>
                {!isSupabaseConfigured && <span className="text-xs text-gray-500">(Not configured)</span>}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-600">{getProviderDescription(currentProvider)}</div>

        {currentProvider === "supabase" && !isSupabaseConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Supabase is not configured. Please set up your Supabase project in the integration settings.
            </p>
          </div>
        )}

        {isLoading && <div className="text-sm text-gray-500">Switching database provider...</div>}
      </CardContent>
    </Card>
  )
}
