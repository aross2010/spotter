import { NextResponse } from 'next/server'
import { withAuth } from '../middleware'
import db from '@/src'
import { weightEntries } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'
import { toKg, toLbs } from '@/app/functions/conversions'

type WeightEntryForm = {
  weight: number
  date: string
  metric: 'lbs' | 'kgs'
}

export const POST = withAuth(async (req: Request, user: any) => {
  try {
    const data = (await req.json()) as WeightEntryForm

    // Validate date is not in the future
    const entryDate = new Date(data.date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    if (entryDate > today) {
      return NextResponse.json(
        { error: 'Date cannot be in the future' },
        { status: 400 }
      )
    }

    // Format date as YYYY-MM-DD for database
    const formattedDate = entryDate.toISOString().split('T')[0]

    // Check if entry already exists for this date
    const existingEntry = await db
      .select()
      .from(weightEntries)
      .where(
        and(
          eq(weightEntries.userId, user.id),
          eq(weightEntries.date, formattedDate)
        )
      )
      .limit(1)

    // Prepare weight values based on metric
    const weightLbs = data.metric === 'lbs' ? data.weight : null
    const weightKg = data.metric === 'kgs' ? data.weight : null

    if (existingEntry.length > 0) {
      // Update existing entry
      const updated = await db
        .update(weightEntries)
        .set({
          weightLbs: weightLbs?.toString(),
          weightKg: weightKg?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(weightEntries.id, existingEntry[0].id))
        .returning()

      return NextResponse.json(updated[0], { status: 200 })
    } else {
      // Create new entry
      const created = await db
        .insert(weightEntries)
        .values({
          userId: user.id,
          weightLbs: weightLbs?.toString(),
          weightKg: weightKg?.toString(),
          date: formattedDate,
        })
        .returning()

      return NextResponse.json(created[0], { status: 201 })
    }
  } catch (error: any) {
    console.error('Error creating/updating weight entry:', error)
    return NextResponse.json(
      { error: 'Failed to create weight entry' },
      { status: 500 }
    )
  }
})
