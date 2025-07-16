import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Next.js API Route OK',
    timestamp: new Date().toISOString()
  })
}