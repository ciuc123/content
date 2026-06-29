import './globals.css'

export const metadata = {
  title: 'Ideas Content Engine',
  description: 'MVP — Ideas Content Engine'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

