import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_EXP_TIME,
  JWT_SECRET,
} from '@/app/libs/auth'
import { NextResponse } from 'next/server'
import * as jose from 'jose'

export async function POST(request: Request) {
  const body = await request.formData()
  const code = body.get('code') as string

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

  if (!data.id_token) {
    return NextResponse.json(
      { error: 'Failed to retrieve ID token' },
      { status: 400 }
    )
  }

  const userInfo = jose.decodeJwt(data.id_token) as object

  const { exp, ...userInfoWithoutExp } = userInfo as any

  // user id
  const sub = (userInfo as { sub: string }).sub

  // curent time
  const issuedAt = Math.floor(Date.now() / 1000)

  const accessToken = await new jose.SignJWT(userInfoWithoutExp)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXP_TIME)
    .setSubject(sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET))

  return NextResponse.json({ access_token: accessToken })
}
