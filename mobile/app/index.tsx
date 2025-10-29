import { Redirect } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import Loading from '../components/loading'

export default function Index() {
  const { authUser, isLoading } = useAuth()

  if (authUser) {
    return <Redirect href="/home" />
  }

  return <Auth />
}
