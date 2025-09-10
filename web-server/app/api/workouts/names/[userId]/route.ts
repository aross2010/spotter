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

  const exerciseNames = [
    { name: 'Squat', used: 66 },
    { name: 'Bench Press', used: 42 },
    { name: 'Deadlift', used: 44 },
    { name: 'Overhead Press', used: 21 },
    { name: 'Lunges', used: 30 },
    { name: 'Leg Press', used: 25 },
    { name: 'Chest Fly', used: 20 },
    { name: 'Bent Over Row', used: 18 },
    { name: 'Tricep Dips', used: 15 },
    { name: 'Bicep Curls', used: 12 },
    { name: 'Plank', used: 10 },
    { name: 'Russian Twists', used: 8 },
    { name: 'Mountain Climbers', used: 6 },
    { name: 'Burpees', used: 5 },
    { name: 'Jumping Jacks', used: 4 },
    { name: 'High Knees', used: 3 },
    { name: 'Butt Kicks', used: 2 },
    { name: 'Side Lunges', used: 1 },
  ]

  return NextResponse.json({ workoutNames, exerciseNames }, { status: 200 })
})
