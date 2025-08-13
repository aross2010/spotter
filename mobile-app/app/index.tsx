import { Redirect } from 'expo-router'
import { useContext } from 'react'
import { useAuth } from '../context/auth-context'
import Loading from '../components/loading'

export default function Index() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return <Loading />
  }

  if (!user) {
    console.log('User is not logged in, redirecting to authenticate')
    return <Redirect href="/auth" />
  }

  return <Redirect href="/dashboard" />
}
