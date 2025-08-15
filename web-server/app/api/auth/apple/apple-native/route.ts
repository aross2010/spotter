import { NextResponse } from 'next/server'
import { verifyAndCreateTokens } from '@/app/functions/apple-auth'
export async function POST(req: Request) {
  const { identityToken, rawNonce, givenName, familyName, email, providerId } =
    await req.json()

  try {
    const { accessToken, refreshToken } = await verifyAndCreateTokens({
      identityToken,
      rawNonce,
      providerId,
    })

    return NextResponse.json({ accessToken, refreshToken }, { status: 200 })
  } catch (error) {
    console.error('Error verifying Apple token:', error)
    return NextResponse.json(
      { error: 'Failed to verify Apple token' },
      { status: 500 }
    )
  }
}
