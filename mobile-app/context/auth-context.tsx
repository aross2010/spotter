import { createContext, useContext, useEffect, useState } from 'react'
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
import { BASE_URL, TOKEN_KEY_NAME } from '../constants/auth'
import { Platform } from 'react-native'
import * as jose from 'jose'
import { tokenCache } from '../utils/cache'
import { AppleAuthenticationButton } from 'expo-apple-authentication'

WebBrowser.maybeCompleteAuthSession()

export type AuthUser = {
  sub: string
  email: string
  name: string
  picture?: string
  given_name?: string
  family_name?: string
  email_verified?: boolean
  provider?: string
  exp?: number
}

type AuthContextType = {
  user: AuthUser | null
  signIn: () => void | Promise<void>
  signOut: () => void | Promise<void>
  signInWithApple: () => void | Promise<void>
  signInWithAppleWebBrowser: () => void | Promise<void>
  fetchWithAuth: (url: string, options: RequestInit) => Promise<Response>
  isLoading: boolean
  error: AuthError | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  signInWithApple: () => {},
  signInWithAppleWebBrowser: () => {},
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

  const [request, response, promptAsync] = useAuthRequest(config, discovery)

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true)
      try {
        const storedAccessToken = await tokenCache?.getToken(TOKEN_KEY_NAME)
        if (storedAccessToken) {
          try {
            const decoded = jose.decodeJwt(storedAccessToken) as AuthUser
            const exp = decoded.exp
            const now = Math.floor(Date.now() / 1000)

            if (exp && exp > now) {
              // access token is still valid
              console.log('Restored valid access token from cache')
              setAccessToken(storedAccessToken)
              setUser(decoded)
            } else {
              console.log('clearing token from storage')
              setUser(null)
              tokenCache?.deleteToken(TOKEN_KEY_NAME)
            }
          } catch (error) {}
        }
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    handleResponse()
  }, [response])

  const handleResponse = async () => {
    if (response?.type === 'success') {
      const { code } = response.params

      try {
        setIsLoading(true)

        const tokenResponse = await exchangeCodeAsync(
          {
            code,
            extraParams: {
              platform: Platform.OS,
            },
            clientId: 'google',
            redirectUri: makeRedirectUri(),
          },
          discovery
        )

        const accessToken = tokenResponse.accessToken
        setAccessToken(accessToken)

        if (!accessToken) {
          console.log('No access token received')
          return
        }

        // save token to local storage or secure store
        tokenCache?.saveToken(TOKEN_KEY_NAME, accessToken)

        const decoded = jose.decodeJwt(accessToken)
        setUser(decoded as AuthUser)
      } catch (error) {
        console.log('Error handling response', error)
      } finally {
        setIsLoading(false)
      }
    } else if (response?.type === 'error') {
      setError(response.error as AuthError)
      console.error('Auth error:', response.error)
    }
  }

  const signIn = async () => {
    try {
      if (!request) {
        console.log('Auth request is not available')
        return
      }
      await promptAsync()
      console.log('User signed in')
    } catch (error) {
      console.log(error)
    }
  }

  const signOut = async () => {
    await tokenCache?.deleteToken(TOKEN_KEY_NAME)
    setUser(null)
    setAccessToken(null)
  }

  const signInWithApple = async () => {
    try {
      const rawNonce = randomUUID()
      console.log('Generated raw nonce:', rawNonce)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: rawNonce,
      })

      console.log('Apple credential:', credential)

      if (credential.fullName?.givenName && credential.email) {
        // first sign in, only chance to get user's full name and email
        // store in db
      }

      const appleResponse = await fetch(
        `${BASE_URL}/api/auth/apple/apple-native`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            rawNonce,

            givenName: credential.fullName?.givenName,
            familyName: credential.fullName?.familyName,
            email: credential.email,
          }),
        }
      )

      console.log('Apple response:', appleResponse)

      const tokens = await appleResponse.json()
      await handleNativeTokens(tokens)
    } catch (error) {
      console.error('Apple sign-in error:', error)
      setError(error as AuthError)
    }
  }

  const handleNativeTokens = async (tokens: {
    access_token: string
    refresh_token?: string
  }) => {
    const { access_token: newAccessToken, refresh_token: newRefreshToken } =
      tokens

    console.log('Received initial access token:', newAccessToken)
    console.log('Received initial refresh token:', newRefreshToken)

    if (newAccessToken) {
      setAccessToken(newAccessToken)
      await tokenCache?.saveToken(TOKEN_KEY_NAME, newAccessToken)
      const decoded = jose.decodeJwt(newAccessToken) as AuthUser
      setUser(decoded)
    }

    // if (newRefreshToken) {
    //   setRefreshToken(newRefreshToken)
    //   await tokenCache?.saveToken(REFRESH_TOKEN_KEY_NAME, newRefreshToken)
    // }
  }

  const signInWithAppleWebBrowser = async () => {}

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // if response is 401, refresh

    return response
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        signInWithApple,
        signInWithAppleWebBrowser,
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
