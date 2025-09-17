import { withAuth } from '@/app/api/middleware'
import { is } from 'drizzle-orm'
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
    { name: 'Squat', used: 66, isUnilateral: false },
    { name: 'Bench Press', used: 42, isUnilateral: false },
    { name: 'Deadlift', used: 44, isUnilateral: false },
    { name: 'Overhead Press', used: 21, isUnilateral: false },
    { name: 'Lunges', used: 30, isUnilateral: true },
    { name: 'Leg Press', used: 25, isUnilateral: false },
    { name: 'Chest Fly', used: 20, isUnilateral: false },
    { name: 'Bent Over Row', used: 18, isUnilateral: false },
    { name: 'Tricep Dips', used: 15, isUnilateral: false },
    { name: 'Bicep Curls', used: 12, isUnilateral: false },
    { name: 'Plank', used: 10, isUnilateral: false },
    { name: 'Russian Twists', used: 8, isUnilateral: false },
    { name: 'Mountain Climbers', used: 6, isUnilateral: false },
    { name: 'Burpees', used: 5, isUnilateral: false },
    { name: 'Jumping Jacks', used: 4, isUnilateral: false },
    { name: 'High Knees', used: 3, isUnilateral: false },
    { name: 'Butt Kicks', used: 2, isUnilateral: false },
    { name: 'Side Lunges', used: 1, isUnilateral: true },
  ]

  // sort each by used

  return NextResponse.json({ workoutNames, exerciseNames }, { status: 200 })
})
