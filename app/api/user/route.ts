import isValidPassword from '@/app/functions/validatePassword'
import db from '@/src'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { users } from '@/src/db/schema'
import { sendSignupEmail } from '@/app/functions/sendEmails'
import isEmail from 'validator/lib/isEmail'

export async function POST(req: Request) {
  const data = await req.json()
  if (!data)
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const { firstName, lastName, email, password } = data

  if (!firstName || !email || !password) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      {
        error:
          'Password must be at least 8 characters long, contain one uppercase letter, and one special character or number',
      },
      { status: 400 }
    )
  }

  if (firstName.length > 75 || (lastName?.length ?? 0) > 75) {
    return NextResponse.json(
      { error: 'First or last name exceeds maximum length' },
      { status: 400 }
    )
  }

  if (email.length > 150) {
    return NextResponse.json(
      { error: 'Email exceeds maximum length' },
      { status: 400 }
    )
  }

  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      const { provider } = existingUser
      if (provider === 'google') {
        return NextResponse.json(
          { error: 'Google account already exists' },
          { status: 400 }
        )
      } else if (provider === 'apple') {
        return NextResponse.json(
          { error: 'Apple account already exists' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName: lastName || null,
        email,
        passwordHash,
        provider: 'credentials',
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
      })

    await sendSignupEmail(newUser)
    return NextResponse.json(newUser, {
      status: 201,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json({
      error: 'An unexpected error occurred',
      status: 500,
    })
  }
}
