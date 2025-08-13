"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DataService } from "@/lib/dataService"
import { Database, TestTube, Briefcase, TimerIcon as Timeline, Map, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const Header: React.FC = () => {
  const [databaseProvider, setDatabaseProvider] = useState<"mock" | "postgresql" | "supabase">("mock")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setDatabaseProvider(DataService.getDatabaseProvider())
  }, [])

  const handleProviderChange = (provider: "mock" | "postgresql" | "supabase") => {
    setDatabaseProvider(provider)
    DataService.setDatabaseProvider(provider)

    // Trigger custom event for other components to listen
    window.dispatchEvent(new CustomEvent("dataSourceChanged"))

    router.refresh() // This will re-fetch data for the current route
  }

  const getProviderInfo = (provider: "mock" | "postgresql" | "supabase") => {
    switch (provider) {
      case "mock":
        return { icon: TestTube, label: "Mock Data", color: "text-orange-500" }
      case "postgresql":
        return { icon: Database, label: "PostgreSQL", color: "text-green-500" }
      case "supabase":
        return { icon: Database, label: "Supabase", color: "text-blue-500" }
    }
  }

  const getActiveClass = (path: string) => {
    return pathname === path
      ? "text-blue-600 hover:text-blue-700 font-semibold border-b-2 border-blue-600 pb-1"
      : "text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
  }

  const currentProvider = getProviderInfo(databaseProvider)
  const CurrentIcon = currentProvider.icon

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Careenicle</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className={getActiveClass("/")}>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Applications</span>
              </div>
            </a>
            <a href="/timeline" className={getActiveClass("/timeline")}>
              <div className="flex items-center space-x-2">
                <Timeline className="w-4 h-4" />
                <span>Timeline</span>
              </div>
            </a>
            <a href="/map" className={getActiveClass("/map")}>
              <div className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span>Map View</span>
              </div>
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border-gray-200"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center space-x-2">
                    <CurrentIcon className={`w-4 h-4 ${currentProvider.color}`} />
                    <span className="text-sm font-medium text-gray-700">{currentProvider.label}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Database Provider</h4>
                    <p className="text-sm text-gray-600 mb-3">Choose your data source</p>
                  </div>
                  <Select value={databaseProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mock">
                        <div className="flex items-center space-x-2">
                          <TestTube className="w-4 h-4 text-orange-500" />
                          <span>Mock Data</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="postgresql">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-green-500" />
                          <span>PostgreSQL</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="supabase">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-blue-500" />
                          <span>Supabase</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    Current: <span className="font-medium">{currentProvider.label}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <select
              value={pathname}
              onChange={(e) => (window.location.href = e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
            >
              <option value="/">Applications</option>
              <option value="/timeline">Timeline</option>
              <option value="/map">Map View</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
