import { Redirect } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import Loading from '../components/loading'

export default function Index() {
  const { authUser, isLoading } = useAuth()

  console.log('authUser:', authUser)
  console.log('Is loading:', isLoading)

  if (isLoading) {
    console.log('authUser is loading, showing loading screen...')
    return <Loading visible />
  }

  if (authUser) {
    console.log('authUser is authenticated, redirecting to their home.')
    return <Redirect href="/home" />
  }

  console.log('authUser is not authenticated, showing auth screen.')

  return <Auth />
}
