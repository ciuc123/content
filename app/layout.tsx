import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'Ideas Content Engine',
  description: 'MVP — Ideas Content Engine'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
  
  // Skip ClerkProvider in dev mode to avoid initialization warnings
  const content = (
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

  // Only wrap with ClerkProvider in production/auth-enabled mode
  if (devAuthDisabled) {
    return content
  }

  // In production mode, use ClerkProvider with unsafe_disableDevelopmentModeConsoleWarning to silence warnings
  return (
    <ClerkProvider unsafe_disableDevelopmentModeConsoleWarning={true}>
      {content}
    </ClerkProvider>
  )
}
