"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DataService } from "@/lib/dataService"
import { Database, TestTube, Briefcase, TimerIcon as Timeline, Map } from "lucide-react"

const Header: React.FC = () => {
  const [useMockData, setUseMockData] = useState(false)
  const pathname = usePathname()
  const router = useRouter() // Add this line

  useEffect(() => {
    setUseMockData(DataService.getUseMockData())
  }, [])

  const toggleDataSource = () => {
    const newValue = !useMockData
    setUseMockData(newValue)
    DataService.setUseMockData(newValue)
    
    // Trigger custom event for other components to listen
    window.dispatchEvent(new CustomEvent('dataSourceChanged'))
    
    router.refresh() // This will re-fetch data for the current route
  }

  const getActiveClass = (path: string) => {
    return pathname === path
      ? "text-blue-600 hover:text-blue-700 font-semibold border-b-2 border-blue-600 pb-1"
      : "text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Careenicle
              </h1>
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

          {/* Data Source Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
              <div className="flex items-center space-x-2">
                {useMockData ? (
                  <TestTube className="w-4 h-4 text-orange-500" />
                ) : (
                  <Database className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-700">{useMockData ? "Mock Data" : "PostgreSQL"}</span>
              </div>
              <button
                onClick={toggleDataSource}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  useMockData ? "bg-orange-500" : "bg-green-500"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useMockData ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
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
