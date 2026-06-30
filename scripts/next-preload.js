  // Preload script to surface unhandled rejections and uncaught exceptions
// when running the Next.js dev server. Use with:
//   node -r ./scripts/next-preload.js node_modules/next/dist/bin/next dev -p 3000

Error.stackTraceLimit = Infinity

process.on('unhandledRejection', (reason) => {
  try {
    console.error('\n=== PRELOAD: UNHANDLED REJECTION ===')
    if (reason && reason.stack) {
      console.error(reason.stack)
    } else {
      console.error(reason)
    }
  } catch (e) {
    console.error('Error while printing unhandledRejection', e)
  }
  // Re-throw to allow the process to terminate and produce an uncaughtException
  // which will include a full stack trace.
  setTimeout(() => { throw reason }, 0)
})

process.on('uncaughtException', (err) => {
  try {
    console.error('\n=== PRELOAD: UNCAUGHT EXCEPTION ===')
    if (err && err.stack) console.error(err.stack)
    else console.error(err)
  } catch (e) {
    console.error('Error while printing uncaughtException', e)
  }
  // Exit after printing so Docker logs capture the output
  process.exit(1)
})

// Helpful for better stack traces when source maps are available
try {
  require('source-map-support').install()
} catch (e) {
  // ignore if not installed
}

