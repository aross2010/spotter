import { Redirect } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'

export default function Index() {
  const { authUser, isLoading } = useAuth()
  console.log('Auth loading:', isLoading, 'Auth user:', authUser)
  console.log('Using BASE_URL:', BASE_URL)

  if (authUser) {
    return <Redirect href="/home" />
  }

  return <Auth />
}
