import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  // logic

  const workoutNames = [
    { name: 'Legs', used: 66 },
    { name: 'Push', used: 42 },
    { name: 'Pull', used: 44 },
    { name: 'Upper Body', used: 21 },
  ]

  return NextResponse.json(workoutNames, { status: 200 })
})
