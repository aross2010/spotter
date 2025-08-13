export const COOKIE_NAME = 'auth_token'
export const REFRESH_COOKIE_NAME = 'refresh_token'
export const COOKIE_MAX_AGE = 20

export const TOKEN_KEY_NAME = 'access_token'
export const JWT_EXP_TIME = '30m'
export const REFRESH_TOKEN_EXP_TIME = '90d'
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID_WEB!
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET_WEB!
export const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL!
export const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME!
export const JWT_SECRET = process.env.JWT_SECRET!

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
  path: '/',
  maxAge: COOKIE_MAX_AGE,
}

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
  path: '/api/auth/refresh',
  maxAge: REFRESH_TOKEN_MAX_AGE,
}
