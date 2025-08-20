import { withAuth } from '@/app/api/middleware'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} from '@/app/libs/auth'
import { NextResponse } from 'next/server'
import * as jose from 'jose'
import db from '@/src'
import { userProviders } from '@/src/db/schema'

export const POST = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() as string
  const data = await req.json()
  const { code } = data

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code,
      }),
    })

    console.log('Response from Google token endpoint:', response)

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    const userInfo = jose.decodeJwt(data.id_token) as object
    const providerId = (userInfo as { sub: string }).sub

    console.log('Decoded user info from Google:', userInfo)

    if (!providerId) {
      return NextResponse.json(
        { error: 'Failed to link Google account' },
        { status: 400 }
      )
    }

    const linkedAccount = await db.query.userProviders.findFirst({
      where: (up, { and, eq }) =>
        and(
          eq(up.provider, 'google'),
          eq(up.providerId, providerId),
          eq(up.userId, id)
        ),
    })

    if (linkedAccount) {
      console.log('User with this Google account already exists.')
      return NextResponse.json(
        { error: 'This Google account is already linked' },
        { status: 400 }
      )
    }

    const updatedLinkedAccount = await db.insert(userProviders).values({
      userId: id,
      provider: 'google',
      providerId,
    })

    if (!updatedLinkedAccount) {
      return NextResponse.json(
        { error: 'Failed to link Google account' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Google account linked successfully', providerId },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching Google token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google token' },
      { status: 500 }
    )
  }
})
