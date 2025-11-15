import { router } from 'expo-router'
import Auth from '../components/auth'
import { useAuth } from '../context/auth-context'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export default function Index() {
  const { authUser, isLoading } = useAuth()

  useEffect(() => {
    if (authUser) {
      router.replace('/home')
    }
  }, [authUser, isLoading])

  return <Auth />
}
