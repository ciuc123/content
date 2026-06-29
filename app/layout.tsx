import './globals.css'

export const metadata = {
  title: 'Ideas Content Engine',
  description: 'MVP — Ideas Content Engine'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-900 text-white p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-lg font-bold hover:text-gray-300">💡 Ideas Engine</a>
            <div className="flex gap-4 text-sm">
              <a href="/ideas" className="hover:text-gray-300">Ideas</a>
              <a href="/ideas/research" className="hover:text-gray-300">Research</a>
              <a href="/ideas/generate" className="hover:text-gray-300">Generate</a>
              <a href="/publish" className="hover:text-gray-300">Publish</a>
              <a href="/settings/knowledge" className="hover:text-gray-300">Settings</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
