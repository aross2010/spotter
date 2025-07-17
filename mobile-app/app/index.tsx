import { Redirect } from 'expo-router'
import { useContext } from 'react'
import { AuthContext } from '../utils/auth-context'

export default function Index() {
  const authState = useContext(AuthContext)

  if (!authState.isLoggedIn) {
    console.log('User is not logged in, redirecting to authenticate')
    return <Redirect href="/auth" />
  }

  return <Redirect href="/dashboard" />
}
