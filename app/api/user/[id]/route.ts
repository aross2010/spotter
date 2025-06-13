import { NextResponse } from 'next/server'
import db from '@/src'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
