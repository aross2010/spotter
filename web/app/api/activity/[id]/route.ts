import { NextResponse } from 'next/server'
import { withAuth } from '../../middleware'
import db from '@/src'
import { workouts } from '@/src/db/schema'
import { asc, eq, desc } from 'drizzle-orm'

type YearActivityData = {
  year: number
  activityCalendar: {
    [date: string]: {
      workouts: {
        status: 'completed' | 'planned' | 'active'
        workoutId: string
      }[]
    }
  }
}

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (user.id !== userId) {
    return NextResponse.json(
      { error: 'Unauthorized access to activity data' },
      { status: 403 }
    )
  }

  try {
    // Fetch all activity data
    const activityData = await db
      .select({
        date: workouts.date,
        status: workouts.status,
        workoutId: workouts.id,
      })
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(asc(workouts.date))

    // Group activity data by year
    const yearlyData: { [year: number]: YearActivityData } = {}

    activityData.forEach(({ date, status, workoutId }) => {
      const year = parseInt(date.split('-')[0])

      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          activityCalendar: {},
        }
      }

      if (!yearlyData[year].activityCalendar[date]) {
        yearlyData[year].activityCalendar[date] = { workouts: [] }
      }

      yearlyData[year].activityCalendar[date].workouts.push({
        status: status as 'completed' | 'planned' | 'active',
        workoutId,
      })
    })

    // Convert to array and sort by year descending
    const result = Object.values(yearlyData).sort((a, b) => b.year - a.year)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching activity data:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
