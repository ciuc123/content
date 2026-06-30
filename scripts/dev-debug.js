// Debug wrapper to run Next.js with global error handlers so we can capture
// unhandled rejections and uncaught exceptions with full stacks.
process.on('unhandledRejection', (err) => {
  // Re-throw unhandled rejections as uncaught exceptions so we get a full stack
  console.error('=== UNHANDLED REJECTION (rethrowing) ===')
  setTimeout(() => { throw err }, 0)
})
process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===')
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})

const { spawn } = require('child_process')
const cmd = process.execPath // node
const args = ['node_modules/next/dist/bin/next', 'dev', '-p', '3000']
console.log('Starting Next dev with debug wrapper:', cmd, args.join(' '))
const child = spawn(cmd, args, { stdio: 'inherit', env: process.env })
child.on('exit', (code, signal) => {
  console.log('Next process exited', { code, signal })
  process.exit(code === null ? 1 : code)
})
