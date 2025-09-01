"use client"

import { useState, useEffect } from "react"
import { DataService } from "@/lib/dataService"
import { useAuth } from "@/lib/auth-context"
import { Building2 } from "lucide-react"
import JobTableContent from "./JobTableContent"

export default function JobTable() {
  const { isInitialized, isProviderSwitching } = useAuth()
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "connected" | "no-tables" | "failed">("checking")

  // Check database connectivity and decide between PostgreSQL or mock data
  useEffect(() => {
    const checkDataSource = async () => {
      if (!isInitialized || isProviderSwitching) {
        return
      }

      // If user has manually set to use mock data, don't check database
      const useMockData = await DataService.getUseMockData()
      if (useMockData) {
        setDatabaseStatus("connected") // Don't show error when using mock data intentionally
        return
      }

      try {
        // Try to fetch a small amount of data to test database connection
        const response = await fetch("/api/jobs?limit=1")
        if (response.ok) {
          const data = await response.json()
          if (data.jobs !== undefined) {
            // Database is working and has tables
            DataService.setUseMockData(false)
            setDatabaseStatus("connected")
            // console.log("Using PostgreSQL database")
          } else {
            // Database connected but no tables or unexpected response
            setDatabaseStatus("no-tables")
            DataService.setUseMockData(true)
          }
        } else if (response.status === 500) {
          // Check if it's a table not found error
          const errorText = await response.text()
          if (errorText.includes("does not exist") || errorText.includes("relation") || errorText.includes("table")) {
            setDatabaseStatus("no-tables")
            DataService.setUseMockData(true)
          } else {
            throw new Error("Database connection failed")
          }
        } else {
          throw new Error("Database connection failed")
        }
      } catch (error) {
        // Database failed, use mock data
        console.warn("Database connection failed, using mock data:", error)
        setDatabaseStatus("failed")
        DataService.setUseMockData(true)
      }
    }

    checkDataSource()
  }, [isInitialized, isProviderSwitching])

  // Update database status when user manually switches data source
  useEffect(() => {
    const handleDataSourceChange = async () => {
      if (isProviderSwitching) {
        return
      }

      const useMockData = await DataService.getUseMockData()
      if (useMockData) {
        // User switched to mock data manually, don't show database errors
        setDatabaseStatus("connected")
      } else {
        // User switched back to database, re-check connection
        setDatabaseStatus("checking")
        const recheckDatabase = async () => {
          try {
            const response = await fetch("/api/jobs?limit=1")
            if (response.ok) {
              const data = await response.json()
              if (data.jobs !== undefined) {
                setDatabaseStatus("connected")
              } else {
                setDatabaseStatus("no-tables")
              }
            } else {
              setDatabaseStatus("failed")
            }
          } catch (error) {
            setDatabaseStatus("failed")
          }
        }
        recheckDatabase()
      }
    }

    // Listen for data source changes
    window.addEventListener("dataSourceChanged", handleDataSourceChange)
    return () => window.removeEventListener("dataSourceChanged", handleDataSourceChange)
  }, [isProviderSwitching])

  // Show initial loading only during true initialization
  if (!isInitialized || isProviderSwitching || databaseStatus === "checking") {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <div className="ml-4 text-gray-600">{isProviderSwitching ? "Switching data source..." : "Loading..."}</div>
      </div>
    )
  }

  // Show database initialization prompt if tables don't exist
  if (databaseStatus === "no-tables") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="bg-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Database Tables Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">
              It looks like the database tables haven't been initialized yet. Please run the initialization script to
              set up your job tracker.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">To initialize your database:</h2>
            <div className="text-left space-y-3">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div># Navigate to your project directory</div>
                <div>cd /path/to/job-tracker</div>
                <div className="mt-2"># Run the database initialization script</div>
                <div>psql -d your_database_name -f scripts/init-database-updated.sql</div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Replace <code className="bg-gray-200 px-2 py-1 rounded">your_database_name</code> with your actual
                database name.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Page After Setup
            </button>
            <div>
              <button
                onClick={() => {
                  DataService.setUseMockData(true)
                  setDatabaseStatus("connected")
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Use Demo Data Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show connection error if database failed completely and user is not intentionally using mock data
  if (databaseStatus === "failed" && !DataService.getUseMockData()) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Database Connection Failed</h1>
            <p className="text-lg text-gray-600 mb-8">Unable to connect to the database. Using demo data for now.</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Once initialization is complete, render the main content
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Title Section */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 sm:mb-3">
              Job Applications Dashboard
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
              Track your job applications and interview progress with precision
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <JobTableContent />
    </div>
  )
}