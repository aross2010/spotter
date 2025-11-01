import { Redirect } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'

export default function Index() {
  const { authUser, isLoading } = useAuth()

  if (authUser) {
    return <Redirect href="/home" />
  }

  return <Auth />
}
