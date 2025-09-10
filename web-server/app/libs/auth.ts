export const JWT_EXP_TIME = '30s'
export const REFRESH_TOKEN_EXP_TIME = '90d'
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID_WEB!
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET_WEB!
export const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!
export const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME!
export const JWT_SECRET = process.env.JWT_SECRET!

export const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID!
export const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID!
export const APPLE_KEY_ID = process.env.APPLE_KEY_ID!
export const APPLE_PRIVATE_KEY_P8 = process.env.APPLE_PRIVATE_KEY_P8!
