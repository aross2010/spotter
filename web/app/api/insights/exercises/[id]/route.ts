// route to get user exercise comparison data for insights page
import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import { getExerciseComparisonData } from '../../[id]/route'

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()
  const weightUnit = (url.searchParams.get('weightUnit') || 'lbs') as
    | 'lbs'
    | 'kg'
  const exerciseIds = url.searchParams.get('exerciseIds')?.split(',') || []

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (userId !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (exerciseIds.length < 2 || exerciseIds.length > 5) {
    return NextResponse.json(
      { error: 'Please provide between 2 and 5 exercise IDs' },
      { status: 400 }
    )
  }

  try {
    const exerciseComparisonGraph = await getExerciseComparisonData(
      userId,
      exerciseIds,
      weightUnit
    )

    return NextResponse.json(exerciseComparisonGraph)
  } catch (error) {
    console.error('Error fetching exercise comparison data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise comparison data' },
      { status: 500 }
    )
  }
})
