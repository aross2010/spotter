import { NextResponse } from 'next/server'
import db from '@/src'
import { Params } from 'next/dist/server/request/params'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import isEmail from 'validator/lib/isEmail'
import { withAuth } from '../../middleware'
import { SignJWT, importPKCS8 } from 'jose'
import {
  APPLE_CLIENT_ID,
  APPLE_KEY_ID,
  APPLE_PRIVATE_KEY_P8,
  APPLE_TEAM_ID,
} from '@/app/libs/auth'

export const GET = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() // Extract user ID from the URL

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

    console.log('got user')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const providers = await db.query.userProviders.findMany({
      where: (up, { eq }) => eq(up.userId, id),
      columns: {
        id: true,
        provider: true,
        providerId: true,
        providerEmail: true,
      },
    })

    const completeUser = {
      ...user,
      providers: providers.map((p) => {
        return {
          id: p.id,
          name: p.provider,
          email: p.providerEmail,
        }
      }),
    }

    return NextResponse.json(completeUser, { status: 200 })
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

    const providers = await db.query.userProviders.findMany({
      where: (up, { eq }) => eq(up.userId, id),
      columns: {
        id: true,
        provider: true,
        providerId: true,
      },
    })

    const completeUser = {
      ...updatedUser,
      providers: providers.map((p) => p.provider),
    }

    return NextResponse.json(completeUser, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export const DELETE = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() as string
  const data = await req.json()
  let { appleRefreshToken } = data

  // https://developer.apple.com/documentation/signinwithapplerestapi/revoke_tokens
  // for when a user deletes their apple account, revoke their tokens
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const userProviders = await db.query.userProviders.findMany({
      where: (up, { and, eq }) => eq(up.userId, id),
    })

    const hasAppleProvider = userProviders.some(
      (provider) => provider.provider === 'apple'
    )

    if (hasAppleProvider) {
      // revoke apple tokens
      if (!appleRefreshToken) {
        console.log('No apple refresh token provided')
        // user made the request from a google account, but has their apple account linked
        return NextResponse.json(
          { error: 'Refresh token is required' },
          { status: 400 }
        )
      }

      console.log(APPLE_PRIVATE_KEY_P8)

      const pem = APPLE_PRIVATE_KEY_P8.replace(/\\n/g, '\n')
      const privateKey = await importPKCS8(pem, 'ES256')
      const clientSecret = await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: APPLE_KEY_ID })
        .setIssuer(APPLE_TEAM_ID) // iss
        .setSubject(APPLE_CLIENT_ID) // sub = your Bundle ID (iOS) or Services ID (web)
        .setAudience('https://appleid.apple.com') // aud
        .setIssuedAt()
        .setExpirationTime('180d')
        .sign(privateKey)

      // hit revoke enpoint
      const response = await fetch(`https://appleid.apple.com/auth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: appleRefreshToken,
          client_id: APPLE_CLIENT_ID,
          client_secret: clientSecret,
          token_type_hint: 'refresh_token',
        }).toString(),
      })

      console.log('Apple revoke response: ', response)

      if (response.status !== 200) {
        return NextResponse.json(
          { error: 'Failed to revoke Apple tokens' },
          { status: 400 }
        )
      }
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning()

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ deletedUser }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
