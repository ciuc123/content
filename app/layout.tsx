import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { UserMenu } from './components/UserMenu'
import { AuthBanner } from './components/AuthBanner'

export const metadata = {
  title: 'Ideas Content Engine',
  description: 'MVP — Ideas Content Engine'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AuthBanner />
          <nav className="bg-gray-900 text-white p-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <a href="/" className="text-lg font-bold hover:text-gray-300">💡 Ideas Engine</a>
              <div className="flex gap-4 text-sm items-center">
                <a href="/ideas" className="hover:text-gray-300">Ideas</a>
                <a href="/ideas/research" className="hover:text-gray-300">Research</a>
                <a href="/ideas/generate" className="hover:text-gray-300">Generate</a>
                <a href="/publish" className="hover:text-gray-300">Publish</a>
                <a href="/settings/knowledge" className="hover:text-gray-300">Settings</a>
                <div className="border-l border-gray-600 pl-4 ml-2">
                  <UserMenu />
                </div>
              </div>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}