import { NextResponse } from 'next/server'
import db from '@/src'
import { Params } from 'next/dist/server/request/params'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import isEmail from 'validator/lib/isEmail'
import { withAuth } from '../../middleware'

export const GET = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() // Extract user ID from the URL

  console.log('Fetching user data for user: ', user)

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
})

export async function PUT(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string
  const data = await req.json()
  const { firstName, lastName, email } = data

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (!firstName && !lastName && !email) {
    return NextResponse.json(
      { error: 'At least one field must be provided for update' },
      { status: 400 }
    )
  }

  const updatedData: any = {}

  if (firstName) {
    if (firstName.length > 75) {
      return NextResponse.json(
        { error: 'First name exceeds maximum length' },
        { status: 400 }
      )
    }
    updatedData['firstName'] = firstName
  }

  if (lastName) {
    if (lastName.length > 75) {
      return NextResponse.json(
        { error: 'Last name exceeds maximum length' },
        { status: 400 }
      )
    }
    updatedData['lastName'] = lastName
  }

  if (email) {
    if (email.length > 150) {
      return NextResponse.json(
        { error: 'Email exceeds maximum length' },
        { status: 400 }
      )
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    updatedData['email'] = email
  }

  if (Object.keys(updatedData).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields provided for update' },
      { status: 400 }
    )
  }

  updatedData['updatedAt'] = new Date()

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updatedData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: updatedUser.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  // https://developer.apple.com/documentation/signinwithapplerestapi/revoke_tokens
  // for when a user deletes their apple account, revoke their tokens
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning()

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        userId: deletedUser.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
