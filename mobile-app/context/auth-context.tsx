import { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { randomUUID } from 'expo-crypto'
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session'
import {
  BASE_URL,
  REFRESH_TOKEN_KEY_NAME,
  TOKEN_KEY_NAME,
} from '../constants/auth'
import { Platform } from 'react-native'
import * as jose from 'jose'
import { tokenCache } from '../utils/cache'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { toast } from '../utils/toast'

WebBrowser.maybeCompleteAuthSession()

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName?: string
  provider: 'google' | 'apple'
  providerId: string // provider id
  exp?: number
}

type AuthContextType = {
  user: AuthUser | null
  signIn: () => void | Promise<void>
  signOut: () => void | Promise<void>
  signInWithApple: () => void | Promise<void>
  fetchWithAuth: (url: string, options: RequestInit) => Promise<Response>
  isLoading: boolean
  error: AuthError | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  signInWithApple: () => {},
  fetchWithAuth: (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null,
})

const config: AuthRequestConfig = {
  clientId: 'google',
  scopes: ['openid', 'profile', 'email'],
  redirectUri: makeRedirectUri(),
}

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  const [request, response, promptAsync] = useAuthRequest(config, discovery)
  const refreshInProgressRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true)
      console.log('Restoring session...')
      try {
        const storedAccessToken = await tokenCache?.getToken(TOKEN_KEY_NAME)
        const storedRefreshToken = await tokenCache?.getToken(
          REFRESH_TOKEN_KEY_NAME
        )
        if (storedAccessToken) {
          try {
            const decoded = jose.decodeJwt(storedAccessToken) as AuthUser
            const exp = decoded.exp
            const now = Math.floor(Date.now() / 1000)

            if (exp && exp > now) {
              // access token is still valid
              setAccessToken(storedAccessToken)

              if (storedRefreshToken) {
                setRefreshToken(storedRefreshToken)
              }

              setUser(decoded)
            } else if (storedRefreshToken) {
              // access token expired, but we have a refresh token
              setRefreshToken(storedRefreshToken)
              await refreshAccessToken(storedRefreshToken)
            }
          } catch (error) {
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken)
              await refreshAccessToken(storedRefreshToken)
            }
          }
        } else if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken)
          await refreshAccessToken(storedRefreshToken)
        } else {
          console.log(
            'User is not authenticated, no access or refresh token found.'
          )
        }
      } catch (error) {
        console.log('Error restoring session: ', error)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    handleResponse()
  }, [response])

  // Function to refresh the access token
  const refreshAccessToken = async (tokenToUse?: string) => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshInProgressRef.current) {
      console.log('Token refresh already in progress, skipping')
      return null
    }

    refreshInProgressRef.current = true

    try {
      console.log('Refreshing access token...')

      // use the provided token or fall back to the state
      const currentRefreshToken = tokenToUse || refreshToken
      if (!currentRefreshToken) {
        console.log('No refresh token available')
        signOut()
        return null
      }
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: currentRefreshToken,
        }),
      })

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json()
        console.log('Token refresh failed:', errorData)

        // refresh fails due to expired token, sign out
        if (refreshResponse.status === 401) {
          signOut()
        }
        return null
      }
      const tokens = await refreshResponse.json()
      const newAccessToken = tokens.accessToken
      const newRefreshToken = tokens.refreshToken

      console.log(
        'Received new access token:',
        newAccessToken ? 'exists' : 'missing'
      )
      console.log(
        'Received new refresh token:',
        newRefreshToken ? 'exists' : 'missing'
      )

      if (newAccessToken) setAccessToken(newAccessToken)
      if (newRefreshToken) setRefreshToken(newRefreshToken)

      if (newAccessToken)
        await tokenCache?.saveToken('accessToken', newAccessToken)
      if (newRefreshToken)
        await tokenCache?.saveToken('refreshToken', newRefreshToken)

      // Update user data from the new access token
      if (newAccessToken) {
        const decoded = jose.decodeJwt(newAccessToken)
        // Check if we have all required user fields
        setUser(decoded as AuthUser)
      }

      return newAccessToken // Return the new access token
    } catch (error) {
      console.log('Error refreshing token:', error)
      // If there's an error refreshing, we should sign out
      signOut()
      return null
    } finally {
      refreshInProgressRef.current = false
    }
  }

  const handleResponse = async () => {
    if (response?.type === 'success') {
      try {
        setIsLoading(true)
        const { code } = response.params

        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        })

        if (tokenResponse.status == 409) {
          toast(
            'myError',
            'Unsuccessful Sign In',
            'Email linked to Apple account, proceed with Apple. You may connect your Google account in the app.'
          )
          return
        }

        console.log('Token response:', tokenResponse)

        const tokens = await tokenResponse.json()
        console.log('Received tokens:', tokens)
        await handleNativeTokens(tokens)
      } catch (error) {
        console.log(error)
        console.log('Error handling response: ', error)
      } finally {
        setIsLoading(false)
      }
    } else if (response?.type === 'error') {
      setError(response.error as AuthError)
      console.log('Auth error:', response.error)
    }
  }

  const signIn = async () => {
    try {
      if (!request) {
        return
      }
      await promptAsync()
    } catch (error) {
      console.log('Sign in error: ', error)
    }
  }

  const signOut = async () => {
    console.log('Signing out in context...')
    await tokenCache?.deleteToken(TOKEN_KEY_NAME)
    await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME)
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    router.replace('/')
  }

  // helper function for apple sign in
  const signUp = async (
    email: string,
    firstName: string,
    lastName: string | null,
    provider: string,
    providerId: string
  ) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          provider,
          providerId,
        }),
      })

      if (res.status === 409) {
        toast(
          'myError',
          'Unsuccessful Sign Up',
          'Email linked to Google account, proceed with Google. You may connect your Apple account in the app.'
        )
        return {
          status: 409,
        }
      }

      const data = await res.json()
      return data
    } catch (error) {
      toast(
        'myError',
        'Unsuccessful Sign Up',
        'An error occurred during sign up. Please try again.'
      )
    }
  }

  const signInWithApple = async () => {
    try {
      const rawNonce = randomUUID()
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: rawNonce,
      })
      setIsLoading(true)

      if (credential.fullName?.givenName && credential.email) {
        // first time signing in w/ Apple, store key credentials to db

        // save to cache in case sign up fails
        tokenCache?.saveAppleDetails({
          email: credential.email,
          givenName: credential.fullName?.givenName,
          familyName: credential.fullName?.familyName ?? null,
        })

        await signUp(
          credential.email,
          credential.fullName.givenName,
          credential.fullName.familyName ?? null,
          'apple',
          credential.user
        )
      }
      let appleResponse
      appleResponse = await fetch(`${BASE_URL}/api/auth/apple/apple-native`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          rawNonce,
          providerId: credential.user,
        }),
      })

      if (appleResponse.status === 404) {
        // user could not be found, sign up with cache details and try again
        const appleUserDetails = await tokenCache?.getAppleDetails()
        if (!appleUserDetails) return
        const res = await signUp(
          appleUserDetails?.email,
          appleUserDetails?.givenName ?? '',
          appleUserDetails?.familyName ?? null,
          'apple',
          credential.user
        )

        if (res.status === 409) {
          return
        }

        appleResponse = await fetch(`${BASE_URL}/api/auth/apple/apple-native`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            rawNonce,
            providerId: credential.user,
          }),
        })
      }

      if (appleResponse.status !== 200) {
        console.log('Apple sign-in error: ', appleResponse.statusText)
      }

      const tokens = await appleResponse.json()
      await handleNativeTokens(tokens)
    } catch (error) {
      console.log('Apple sign-in error: ', error)
      setError(error as AuthError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNativeTokens = async (tokens: {
    accessToken: string
    refreshToken?: string
  }) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      tokens

    if (newAccessToken) setAccessToken(newAccessToken)
    if (newRefreshToken) setRefreshToken(newRefreshToken)

    if (newAccessToken)
      await tokenCache?.saveToken('accessToken', newAccessToken)
    if (newRefreshToken)
      await tokenCache?.saveToken('refreshToken', newRefreshToken)
    if (newAccessToken) {
      const decoded = jose.decodeJwt(newAccessToken)
      setUser(decoded as AuthUser)
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      const newToken = await refreshAccessToken()

      if (newToken) {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        })
      }
    }

    return response
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        signInWithApple,
        fetchWithAuth,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
