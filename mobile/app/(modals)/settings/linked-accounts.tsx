import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { Alert, Image, View } from 'react-native'
import { useUserStore } from '../../../stores/user-store'
import Button from '../../../components/button'
import { CircleCheck } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import { useAuth } from '../../../context/auth-context'
import { Provider, Providers } from '../../../utils/types'
import { useEffect, useState } from 'react'
import tw from '../../../tw'
import googleLogo from '../../../assets/google.png'
import appleLogo from '../../../assets/apple.png'
import Spinner from '../../../components/activity-indicator'
import { BASE_URL } from '../../../constants/auth'

const providerOptions = [
  {
    title: 'Apple',
    provider: 'apple',
    logo: appleLogo,
  },
  {
    title: 'Google',
    provider: 'google',
    logo: googleLogo,
  },
] as const

const LinkedAccounts = () => {
  const { linkAppleAccount, linkGoogleAccount, fetchWithAuth, authUser } =
    useAuth()
  const [loading, setIsLoading] = useState(false)
  const [providersLinked, setProvidersLinked] = useState<Provider[]>([])

  const getProvidersLinked = async () => {
    try {
      setIsLoading(true)
      const res = await fetchWithAuth(`${BASE_URL}/api/users/${authUser?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const { providers } = await res.json()
      setProvidersLinked(providers)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getProvidersLinked()
  }, [])

  const handleLinking = async (provider: Providers) => {
    try {
      if (provider === 'apple') await linkAppleAccount()
      else if (provider === 'google') await linkGoogleAccount()
      else return
    } catch (error) {
      console.error('Error linking account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderedProviders = providerOptions.map(({ title, provider, logo }) => {
    const isLinked = providersLinked.some((p) => p.name === provider)
    const providerEmail = providersLinked.find(
      (p) => p.name === provider
    )?.email

    return (
      <View key={provider}>
        <View style={tw`flex-row items-center gap-2 mb-4`}>
          <Image
            source={logo}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
          <Txt twcn="font-medium">{title}</Txt>
        </View>
        {isLinked ? (
          <View style={tw`flex-row items-center gap-2`}>
            <CircleCheck color={Colors.green} />
            <Txt twcn="text-light-grayText dark:text-dark-grayText">
              {providerEmail}
            </Txt>
          </View>
        ) : (
          <Button
            text="Link Account"
            twcnText="font-semibold text-primary dark:text-primary"
            onPress={() => handleLinking(provider)}
          />
        )}
      </View>
    )
  })

  return loading ? (
    <Spinner />
  ) : (
    <SafeView scroll={false}>
      <Txt twcn="text-light-grayText dark:text-dark-grayText mb-4">
        Securely link multiple sign-in providers (e.g., Apple and Google) to a
        single account, so you can log in with any of them across devices.
      </Txt>
      <View style={tw`gap-8 mb-8`}>{renderedProviders}</View>
    </SafeView>
  )
}

export default LinkedAccounts
