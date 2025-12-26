const http = require('http')

let attempts = 0

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/inspections') {
    attempts += 1
    console.log(`Received /inspections attempt ${attempts}`)
    // Fail first two attempts, succeed afterwards
    if (attempts < 3) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, message: 'simulated transient error' }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, id: `ins_${attempts}`, attempts }))
    return
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404)
  res.end('Not found')
})

const port = process.env.PORT || 4001
server.listen(port, () => console.log(`Test server listening on http://localhost:${port}`))
