import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_EXP_TIME,
  JWT_SECRET,
  REFRESH_TOKEN_EXP_TIME,
} from '@/app/libs/auth'
import { NextResponse } from 'next/server'
import * as jose from 'jose'
import db from '@/src'
import { users } from '@/src/db/schema'

export async function POST(request: Request) {
  const body = await request.json()
  const code = body.code as string

  if (!code) {
    return NextResponse.json({ error: 'Missing auth code' }, { status: 400 })
  }

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

  const data = await response.json()

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  if (!data.id_token) {
    return NextResponse.json(
      { error: 'Failed to retrieve ID token' },
      { status: 400 }
    )
  }

  const userInfo = jose.decodeJwt(data.id_token) as object

  const user = {
    id: '',
    email: (userInfo as { email: string }).email,
    firstName: (userInfo as { given_name: string }).given_name,
    lastName: (userInfo as { family_name: string }).family_name,
    provider: 'google',
    providerId: (userInfo as { sub: string }).sub,
  }

  const userInDb = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.providerId, user.providerId),
  })

  if (userInDb) {
    user.id = userInDb.id
  }

  if (!user.id) {
    // user does not exist, create account
    const [newUser] = await db
      .insert(users)
      .values({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider,
        providerId: user.providerId,
      })
      .returning({
        id: users.id,
      })

    user.id = newUser.id
  }

  // current time
  const issuedAt = Math.floor(Date.now() / 1000)
  const jti = crypto.randomUUID()

  const accessToken = await new jose.SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXP_TIME)
    .setSubject(user.providerId)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET))

  const refreshToken = await new jose.SignJWT({
    jti,
    type: 'refresh',
    sub: user.providerId,
    ...user,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXP_TIME)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET))

  return NextResponse.json({ accessToken, refreshToken })
}
