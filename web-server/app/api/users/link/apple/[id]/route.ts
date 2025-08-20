import { NextResponse } from 'next/server'
import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { eq } from 'drizzle-orm'
import { userProviders } from '@/src/db/schema'

export const POST = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() as string
  const data = await req.json()
  const { providerId } = data

  console.log(providerId, id)

  if (!providerId) {
    return NextResponse.json(
      { error: 'Provider ID is required' },
      { status: 400 }
    )
  }

  try {
    const linkedAccount = await db.query.userProviders.findFirst({
      where: (up, { and, eq }) =>
        and(
          eq(up.provider, 'apple'),
          eq(up.providerId, providerId),
          eq(up.userId, id)
        ),
    })

    console.log(linkedAccount)

    if (linkedAccount) {
      console.log('User with this Apple account already exists.')
      return NextResponse.json(
        { error: 'This Apple account is already linked' },
        { status: 400 }
      )
    }

    const updatedLinkedAccount = await db.insert(userProviders).values({
      userId: id,
      provider: 'apple',
      providerId,
    })

    if (!updatedLinkedAccount) {
      return NextResponse.json(
        { error: 'Failed to link Apple account' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Apple account linked successfully', providerId },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
