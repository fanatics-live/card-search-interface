export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Card Search
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Powered by Algolia</span>
          </div>
        </div>
      </div>
    </header>
  )
}
