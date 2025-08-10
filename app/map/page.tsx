import JobMap from "@/components/JobMap"

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  JobTracker Pro
                </h1>
              </div>
            </div>
            <div className="flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-700 font-medium">
                Applications
              </a>
              <a href="/timeline" className="text-gray-600 hover:text-gray-700 font-medium">
                Timeline
              </a>
              <a href="/map" className="text-blue-600 hover:text-blue-700 font-medium border-b-2 border-blue-600 pb-1">
                Map View
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <JobMap />
      </main>
    </div>
  )
}
