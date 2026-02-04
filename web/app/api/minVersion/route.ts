// simple route to return the minimum app version required
import { NextResponse } from 'next/server'

export async function GET() {
  const minVersion = {
    ios: '2.1.0',
    android: '1.0.0',
  }

  return NextResponse.json(minVersion)
}
