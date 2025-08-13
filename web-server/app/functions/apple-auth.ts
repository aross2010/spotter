import * as jose from 'jose'
import crypto from 'crypto'
import { JWT_EXP_TIME, REFRESH_TOKEN_EXP_TIME, JWT_SECRET } from '../libs/auth'

interface AppleAuthResult {
  accessToken: string
  refreshToken: string
}

interface AppleUserInfo {
  identityToken: string
  rawNonce: string
  givenName?: string
  familyName?: string
  email?: string
}

export async function verifyAndCreateTokens({
  identityToken,
  rawNonce,
  givenName,
  familyName,
  email,
}: AppleUserInfo): Promise<AppleAuthResult> {
  const isFirstSignIn = givenName && email

  // Apple's public keys from their JWKS endpoint
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys')
  )

  try {
    const { payload } = await jose.jwtVerify(identityToken, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: 'com.anonymous.Lift',
    })

    const currentTimestamp = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < currentTimestamp) {
      throw new Error('Token has expired')
    }

    if (!payload.sub || !payload.iss || !payload.aud || !payload.nonce) {
      throw new Error('Missing required claims in token')
    }

    if ((payload as any).nonce_supported) {
      if (payload.nonce !== rawNonce) {
        throw new Error('Invalid nonce')
      }
    } else {
      const computedHashedNonce = crypto
        .createHash('sha256')
        .update(Buffer.from(rawNonce, 'utf8'))
        .digest('base64url')

      if (payload.nonce !== computedHashedNonce) {
        throw new Error('Invalid nonce')
      }
    }

    const { exp, ...userInfoWithoutExp } = payload

    const sub = (payload as { sub: string }).sub
    const issuedAt = Math.floor(Date.now() / 1000)
    const jti = crypto.randomUUID()

    const accessToken = await new jose.SignJWT({
      ...userInfoWithoutExp,
      ...(isFirstSignIn && {
        email,
        firstName: `${givenName}`,
        lastName: `${familyName}`,
      }),
      email_verified: (payload as any).email_verified ?? false,
      is_private_email: (payload as any).is_private_email ?? false,
      real_user_status: (payload as any).real_user_status ?? 0,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXP_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    // Create refresh token (long-lived)
    const refreshToken = await new jose.SignJWT({
      sub,
      jti,
      type: 'refresh',
      ...(isFirstSignIn && {
        email,
        firstName: `${givenName}`,
        lastName: `${familyName}`,
      }),
      email_verified: (payload as any).email_verified ?? false,
      is_private_email: (payload as any).is_private_email ?? false,
      real_user_status: (payload as any).real_user_status ?? 0,
      nonce_supported: (payload as any).nonce_supported ?? false,
      iss: 'https://appleid.apple.com',
      aud: (payload as any).aud,
      ...userInfoWithoutExp,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(REFRESH_TOKEN_EXP_TIME)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    return {
      accessToken,
      refreshToken,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw error
  }
}
