"use client"

import { useEffect } from "react"

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    console.error("Unhandled error in app router:", error)
  }, [error])

  return (
    <main style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
      <h1>Something went wrong</h1>
      <pre style={{whiteSpace: 'pre-wrap'}}>{String(error?.message)}</pre>
    </main>
  )
}
