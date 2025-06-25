import db from '@/src'
import { weightEntries } from '@/src/db/schema'
import { NextResponse } from 'next/server'
import { isISO8601 } from 'validator'

// create a new weight entry, assigned to a user
export async function POST(req: Request) {
  const data = await req.json()

  const { date, weight, userId } = data

  if (!date || !weight || !userId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (typeof weight !== 'number' || weight <= 0) {
    return NextResponse.json(
      { error: 'Weight must be a positive number' },
      { status: 400 }
    )
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [newWeightEntry] = await db
      .insert(weightEntries)
      .values({
        userId,
        weight: weight.toString(),
        date,
      })
      .returning()
    return NextResponse.json(
      {
        message: 'Weight entry created successfully',
        id: newWeightEntry.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.log(error.cause)
    if (error.cause.code === '23505') {
      return NextResponse.json(
        { error: 'Weight entry for this date already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({
      error: 'An unexpected error occurred',
    })
  }
}
