#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

const nextBin = path.resolve(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
const args = ['lint']

const child = spawn(process.execPath, [nextBin, ...args], { stdio: 'inherit' })

child.on('exit', (code) => process.exit(code))
child.on('error', (err) => {
  console.error('Failed to run next lint:', err)
  process.exit(1)
})
