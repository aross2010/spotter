import { NextResponse } from 'next/server'
import { withAuth } from '../../../middleware'
import db from '@/src'
import { weightEntries } from '@/src/db/schema'
import { eq, desc, lte, and } from 'drizzle-orm'
import { toKg, toLbs } from '@/app/functions/conversions'

type PreviousWeightEntry = {
  weight: number
  date: string
  difference: number | null
  id: string
}

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() // user id
  const weightUnit = url.searchParams.get('unit') || 'lbs' // kg or lbs
  const dateParam = url.searchParams.get('date') // date param YYYY-MM-DD

  try {
    // Fetch the last two weight entries for the user before or on the given date
    const entries = await db
      .select()
      .from(weightEntries)
      .where(
        dateParam
          ? and(
              eq(weightEntries.userId, id!),
              lte(weightEntries.date, dateParam)
            )
          : eq(weightEntries.userId, id!)
      )
      .orderBy(desc(weightEntries.date))
      .limit(2)

    // No previous entries
    if (entries.length === 0) {
      return NextResponse.json(null, { status: 200 })
    }

    // Get the most recent entry (on or before the date)
    const latestEntry = entries[0]

    // Convert weight to requested unit
    let weight: number
    if (weightUnit === 'kg') {
      weight = latestEntry.weightKg
        ? parseFloat(latestEntry.weightKg)
        : toKg(parseFloat(latestEntry.weightLbs!))
    } else {
      weight = latestEntry.weightLbs
        ? parseFloat(latestEntry.weightLbs)
        : toLbs(parseFloat(latestEntry.weightKg!))
    }

    // Calculate difference if there are two entries
    let difference: number | null = null
    if (entries.length === 2) {
      const previousEntry = entries[1]

      let previousWeight: number
      if (weightUnit === 'kg') {
        previousWeight = previousEntry.weightKg
          ? parseFloat(previousEntry.weightKg)
          : toKg(parseFloat(previousEntry.weightLbs!))
      } else {
        previousWeight = previousEntry.weightLbs
          ? parseFloat(previousEntry.weightLbs)
          : toLbs(parseFloat(previousEntry.weightKg!))
      }

      difference = Math.round((weight - previousWeight) * 10) / 10
    }

    const result: PreviousWeightEntry = {
      weight: Math.round(weight * 10) / 10,
      date: latestEntry.date,
      difference,
      id: latestEntry.id,
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching previous weight entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch previous weight entry' },
      { status: 500 }
    )
  }
})
