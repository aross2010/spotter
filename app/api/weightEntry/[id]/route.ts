import { NextResponse } from 'next/server'
import { isISO8601 } from 'validator'
import db from '@/src'
import { weightEntries } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { Params } from 'next/dist/server/request/params'

export async function PUT(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string
  const data = await req.json()
  const { date, weight } = data

  if (!id) {
    return NextResponse.json(
      { error: 'Weight entry ID is required' },
      { status: 400 }
    )
  }

  if (!date && !weight) {
    return NextResponse.json(
      { error: 'At least one field (date or weight) must be provided' },
      { status: 400 }
    )
  }

  if (date && !isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (weight && (typeof weight !== 'number' || weight <= 0)) {
    return NextResponse.json(
      { error: 'Weight must be a positive number' },
      { status: 400 }
    )
  }

  try {
    const [updatedEntry] = await db
      .update(weightEntries)
      .set({
        ...(date && { date }),
        ...(weight && { weight: weight.toString() }),
        updatedAt: new Date(),
      })
      .where(eq(weightEntries.id, id))
      .returning()

    return NextResponse.json(updatedEntry, { status: 200 })
  } catch (error: any) {
    console.error(error.cause)
    if (error.cause.code === '23505') {
      return NextResponse.json(
        { error: 'Weight entry for this date already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Weight entry ID is required' },
      { status: 400 }
    )
  }

  try {
    const deletedEntry = await db
      .delete(weightEntries)
      .where(eq(weightEntries.id, id))
      .returning()

    if (deletedEntry.length === 0) {
      return NextResponse.json(
        { error: 'Weight entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(deletedEntry, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Weight entry ID is required' },
      { status: 400 }
    )
  }

  try {
    const weightEntry = await db.query.weightEntries.findFirst({
      where: (weightEntries, { eq }) => eq(weightEntries.id, id),
    })

    if (!weightEntry) {
      return NextResponse.json(
        { error: 'Weight entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(weightEntry, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
