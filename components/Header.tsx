"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { DataService } from "@/lib/dataService"
import { useAuth } from "@/lib/auth-context"
import {
  Database,
  TestTube,
  Briefcase,
  TimerIcon as Timeline,
  Map,
  ChevronDown,
  Unlock,
  LogOut,
  User,
  LogIn,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const Header: React.FC = () => {
  const [databaseProvider, setDatabaseProvider] = useState<"mock" | "postgresql" | "supabase">("mock")
  const [isClientInitialized, setIsClientInitialized] = useState(false)
  const { user, signOut, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Set the database provider during initialization
    const initializeProvider = async () => {
      const provider = await DataService.getDatabaseProvider()
      setDatabaseProvider(provider)
      setIsClientInitialized(true)
    }
    
    initializeProvider()

    // Listen for data source changes
    const handleDataSourceChange = async () => {
      const provider = await DataService.getDatabaseProvider()
      setDatabaseProvider(provider)
    }

    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [])

  const handleProviderChange = (provider: "mock" | "postgresql" | "supabase") => {
    // Ignore if switching to supabase but the user is not logged in
    if (provider === "supabase" && !user) return
    // Ignore if there is no change
    if (provider === databaseProvider) return

    setDatabaseProvider(provider)
    DataService.setDatabaseProvider(provider)
    window.dispatchEvent(new CustomEvent("dataSourceChanged"))
  }

  const handleResetPassword = () => {
    router.push("/reset-password?type=recovery")
  }

  const handleSignOut = async () => {
    // The signOut method has already handled state switching, no additional operations are needed here
    await signOut()
  }

  const handleSignIn = () => {
    window.location.href = "/login"
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
  const configuredProviders = DataService.getAvailableProviders()

  // Determine available database providers
  const getAvailableProviders = () => {
    // If currently using supabase but the user is not logged in, only show mock
    if (databaseProvider === "supabase" && !user) {
      return ["mock"]
    }
    return configuredProviders
  }

  const availableProviders = getAvailableProviders()

  // Show a simplified version before the client is initialized to avoid hydration errors
  if (!isClientInitialized) {
    return (
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">Careenicle</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <span>Loading...</span>
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 hover:text-blue-700">
                Careenicle
              </Link>
            </div>
          </div>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8">
            <Link href="/" className={getActiveClass("/")}>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Applications</span>
              </div>
            </Link>
            <Link href="/timeline" className={getActiveClass("/timeline")}>
              <div className="flex items-center space-x-2">
                <Timeline className="w-4 h-4" />
                <span>Timeline</span>
              </div>
            </Link>
            <Link href="/map" className={getActiveClass("/map")}>
              <div className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span>Map View</span>
              </div>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Authenticated user interface */}
            {user ? (
              // Menu for logged-in users
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm hidden lg:inline">{user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-800 hover:bg-gray-50"
                    onClick={handleResetPassword}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              // Login button for unauthenticated users
              <Button variant="outline" onClick={handleSignIn} className="flex items-center space-x-2 bg-transparent">
                <LogIn className="w-4 h-4" />
                <span className="hidden lg:inline">Sign In</span>
              </Button>
            )}

            {/* Database provider selector (only shown when the user is not logged in to Supabase) */}
            {!user && availableProviders.length > 0 && (
              <Select value={databaseProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-32 lg:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.includes("mock") && (
                    <SelectItem value="mock">
                      <div className="flex items-center space-x-2">
                        <TestTube className="w-4 h-4 text-orange-500" />
                        <span className="hidden lg:inline">Mock Data</span>
                        <span className="lg:hidden">Mock</span>
                      </div>
                    </SelectItem>
                  )}
                  {availableProviders.includes("postgresql") && (
                    <SelectItem value="postgresql">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-green-500" />
                        <span className="hidden lg:inline">PostgreSQL</span>
                        <span className="lg:hidden">PostgreSQL</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            
            {/* Display current data source status (when the user is logged in) */}
            {user && (
              <div className="flex items-center space-x-2 px-2 lg:px-3 py-1 lg:py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <Database className="w-4 h-4" />
                <span className="text-xs lg:text-sm font-medium hidden lg:inline">Supabase</span>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile menu for authenticated users */}
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-800 hover:bg-gray-50 text-sm"
                    onClick={handleResetPassword}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button variant="outline" onClick={handleSignIn} size="sm" className="bg-transparent">
                <LogIn className="w-4 h-4" />
              </Button>
            )}
            
            {/* Mobile page navigation */}
            <select
              value={pathname}
              onChange={(e) => (window.location.href = e.target.value)}
              className="block px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="/">Apps</option>
              <option value="/timeline">Timeline</option>
              <option value="/map">Map</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
