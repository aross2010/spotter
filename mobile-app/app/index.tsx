import { Redirect } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import Loading from '../components/loading'

export default function Index() {
  const { user, isLoading } = useAuth()

  console.log('User:', user)
  console.log('Is loading:', isLoading)

  if (isLoading) {
    console.log('User is loading, showing loading screen...')
    return <Loading />
  }

  if (user) {
    console.log('User is authenticated, redirecting to their home.')
    return <Redirect href="/home" />
  }

  console.log('User is not authenticated, showing auth screen.')

  return <Auth />
}
