import { serve } from '@hono/node-server'
import app from './src/index.tsx'

const port = parseInt(process.env.PORT) || 3000

console.log(`🚀 Starting server on port ${port}`)

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`)
  console.log(`🌐 Public URL will be provided by Railway`)
  console.log(`🤖 AI 4-Layer Architecture ready for demo`)
})