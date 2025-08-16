import db from '@/src'
import { NextResponse } from 'next/server'
import { userProviders, users } from '@/src/db/schema'
import isEmail from 'validator/lib/isEmail'
import { notebooks } from '@/src/db/schema'

export async function POST(req: Request) {
  const data = await req.json()
  if (!data)
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const { firstName, lastName, email, provider, providerId } = data

  console.log('Creating user in API: ', data)

  if (!firstName || !email || !provider || !providerId) {
    console.log('Missing required fields')
    return NextResponse.json(
      { error: 'Missing required fields' },
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
      with: {
        userProviders: true,
      },
    })

    if (existingUser) {
      const providers = existingUser.userProviders.map((p) => p.provider)
      if (providers.includes('google')) {
        console.log('User w/ google already exists.')
        return NextResponse.json(
          { error: 'Google account already exists' },
          { status: 409 }
        )
      } else if (provider === 'apple') {
        console.log('User w/ apple already exists.')
        return NextResponse.json(
          { error: 'Apple account already exists' },
          { status: 409 }
        )
      } else {
        console.log('User with this email already exists.')
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    const createdUser = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
        })
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })

      await tx
        .insert(userProviders)
        .values({
          userId: newUser.id,
          provider,
          providerId,
        })
        .onConflictDoNothing({
          target: [userProviders.userId, userProviders.provider],
        })

      return newUser
    })

    // create notebook for user
    await db.insert(notebooks).values({
      userId: createdUser.id,
    })

    const completeUser = {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName ?? null,
      provider,
      providerId,
    }

    // await sendSignupEmail(newUser)
    return NextResponse.json(completeUser, {
      status: 201,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'An unexpected error occurred',
      status: 500,
    })
  }
}
