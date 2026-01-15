import { NextResponse } from 'next/server'
import { withAuth } from '../../middleware'
import db from '@/src'
import { weightEntries } from '@/src/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { toKg, toLbs } from '@/app/functions/conversions'
import { BodyWeightData } from '../../home/[userid]/route'

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()
  const weightUnit = (url.searchParams.get('unit') || 'lbs') as 'lbs' | 'kg'

  try {
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const bodyWeightData = await db
      .select({
        date: weightEntries.date,
        weightLbs: weightEntries.weightLbs,
        weightKg: weightEntries.weightKg,
      })
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(asc(weightEntries.date))

    const bodyWeightProgression = bodyWeightData.map((entry) => {
      let weight: number
      if (weightUnit === 'kg') {
        weight = entry.weightKg
          ? parseFloat(entry.weightKg)
          : toKg(parseFloat(entry.weightLbs!))
      } else {
        weight = entry.weightLbs
          ? parseFloat(entry.weightLbs)
          : toLbs(parseFloat(entry.weightKg!))
      }
      return {
        date: entry.date,
        bodyWeight: weight,
      }
    })

    let lowestBodyWeight: number | null = null
    let highestBodyWeight: number | null = null
    let overallDifference: number | null = null

    if (bodyWeightProgression.length > 1) {
      const weights = bodyWeightProgression.map((entry) => entry.bodyWeight)
      lowestBodyWeight = Math.min(...weights)
      highestBodyWeight = Math.max(...weights)
      overallDifference = highestBodyWeight - lowestBodyWeight
    }

    const processedBodyWeightData: BodyWeightData = {
      bodyWeightProgression,
      lowestBodyWeight,
      highestBodyWeight,
      overallDifference,
    }
    return NextResponse.json(processedBodyWeightData, { status: 200 })
  } catch (error) {
    console.error('Error fetching body weight data:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
})

// delete weight entry by id
export const DELETE = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Weight entry ID is required' },
        { status: 400 }
      )
    }

    // Verify the entry belongs to the user
    const entry = await db
      .select()
      .from(weightEntries)
      .where(and(eq(weightEntries.id, id), eq(weightEntries.userId, user.id)))
      .limit(1)

    if (entry.length === 0) {
      return NextResponse.json(
        { error: 'Weight entry not found or unauthorized' },
        { status: 404 }
      )
    }

    await db.delete(weightEntries).where(eq(weightEntries.id, id))

    return NextResponse.json(
      { message: 'Weight entry deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting weight entry:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
})
